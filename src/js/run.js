// seajs 的简单配置
seajs.config({
  base: "./",//基础路径
  alias: {//路径别名
   "template": "lib/arttemplate.js"
  }
});

// 加载入口模块
seajs.use("js/app");