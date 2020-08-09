#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

const defuaultConf = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
  },
};
const config = Object.assign(
  defuaultConf,
  require(path.resolve('./xpack.config.js')),
);

class Xpack {
  constructor(config) {
    this.config = config;
    this.entry = config.entry;
    this.root = process.cwd();
    this.modules = {};
  }
  parse(code, parent) {
    const deps = [];
    const r = /require\('(.*)'\)/g;
    code = code.replace(r, function (match, arg) {
      const retpath = path.join(parent, arg.replace(/'|"/g), '');
      deps.push(retpath);
      return `__xpack__require__('./${retpath}')`;
    });

    return { deps, code };
  }
  generateMoudle() {
    const temp = [];
    for (const [key, val] of Object.entries(this.modules)) {
      temp.push(`'${key}' : ${val}`);
    }
    return `{${temp.join(',')}}`;
  }
  generateFile() {
    const template = fs.readFileSync(
      path.resolve(__dirname, './template.js'),
      'utf-8',
    );
    this.template = template
      .replace('__entry__', this.entry)
      .replace('__modules_content__', this.generateMoudle());

    fs.writeFileSync(
      path.join('./dist', this.config.output.filename),
      this.template,
    );
  }
  createModule(modulePath, name) {
    const moduleContent = fs.readFileSync(modulePath, 'utf-8');
    const { code, deps } = this.parse(moduleContent, path.dirname(name));
    this.modules[name] = `function (module, exports, __webpack_require__) {
      eval("${code.replace(/\n/g, '\\n')}")
    }`;

    deps.forEach((dep) => {
      this.createModule(path.join(this.root, dep), `./${dep}`);
    });
  }
  start() {
    const entryPath = path.resolve(this.root, this.entry);
    this.createModule(entryPath, this.entry);
    // console.log(this.modules);
    this.generateFile();
  }
}

const xpack = new Xpack(config);

xpack.start();
