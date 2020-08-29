## quick start

链接指令到全局

```bash
npm link
```

在测试项目跟目录新建 xpack.config.js 配置文件

```javascript
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'xpack_bundle.js',
  },
};
```

package.json

```json
"scripts": {
    "build": "xpack",
  },
```

开始打包

```bash
npm run build
```

jj.xie@aliyun.com
