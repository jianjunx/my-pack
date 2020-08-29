(function (modules) {
  let installModules = {};

  function __xpack_require__(moduleId) {
    if (installModules[moduleId]) {
      return installModules[moduleId].exports;
    }
    const module = (installModules[moduleId] = {
      exports: {},
    });

    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __xpack_require__,
    );

    return module.exports;
  }

  return __xpack_require__(
    '__entry__' /** 被替换成this.entry 配置项中的入口文件地址 */,
  );
})(
  __modules_content__ /** 被替换成每个模块的内容，格式为一个对象key为路径，值为匿名函数里面使用eval包裹的文件代码 */,
);
