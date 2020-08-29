#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

// 默认配置
const defuaultConf = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
  },
};
// 合并配置文件
const config = Object.assign(
  defuaultConf,
  require(path.resolve('./xpack.config.js')),
);

class Xpack {
  constructor(config) {
    this.config = config; // 保存配置项
    this.entry = config.entry; // 保存配置项中的入口文件地址
    this.root = process.cwd(); // 获取命令执行的目录
    this.modules = {};
  }
  /**
   * 代码解析和依赖分析
   * @param {*} code 模块代码
   * @param {*} parent 模块路径
   */
  parse(code, parent) {
    const deps = []; // 依赖模块的路径
    const r = /require\('(.*)'\)/g; // 正则匹配依赖模块
    code = code.replace(r, function (match, arg) {
      const retpath = path.join(parent, arg.replace(/'|"/g), '');
      deps.push(retpath);
      return `__xpack__require__('./${retpath}')`;
    });

    return { deps, code };
  }
  generateMoudle() {
    const temp = [];
    // 将modules转成字符串
    for (const [key, val] of Object.entries(this.modules)) {
      temp.push(`'${key}' : ${val}`);
    }
    return `{${temp.join(',')}}`;
  }
  generateFile() {
    // 读取模板文件
    const template = fs.readFileSync(
      path.resolve(__dirname, './template.js'),
      'utf-8',
    );
    // 替换__modules_content__和__entry__
    this.template = template
      .replace('__entry__', this.entry)
      .replace('__modules_content__', this.generateMoudle());

    // 生成打包后的文件
    fs.writeFileSync(
      path.join('./dist', this.config.output.filename),
      this.template,
    );
  }
  /**
   * 递归解析模块并按引入路径保存到modules
   * @param {*} modulePath 模块的真实路径
   * @param {*} name 模块地址
   */
  createModule(modulePath, name) {
    // 读取模块文件内容，入口文件和require的文件
    const moduleContent = fs.readFileSync(modulePath, 'utf-8');
    // 解析读取的模块内容
    const { code, deps } = this.parse(moduleContent, path.dirname(name));
    /**
     * 将模块代码存放到modules中，模块引入路径为key，模块中的代码用eval包裹
     * eval可以将字符串当成js来执行，外面包裹的函数中传入了定义好的module, exports, __webpack_require__
     * 当遇到commonjs模块导出时就换调用对应的参数
     */
    this.modules[name] = `function (module, exports, __webpack_require__) {
      eval("${code.replace(/\n/g, '\\n')}")
    }`;
    // 循环依赖项，并调用this.createModule继续解析
    deps.forEach((dep) => {
      this.createModule(path.join(this.root, dep), `./${dep}`);
    });
  }
  // 开始函数
  start() {
    const entryPath = path.resolve(this.root, this.entry);
    this.createModule(entryPath, this.entry);
    // console.log(this.modules);
    this.generateFile();
  }
}

// 初始化，并传入配置项
const xpack = new Xpack(config);

xpack.start();
