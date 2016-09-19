// seajs 的简单配置
seajs.config({
    base: "./",//基础路径
    paths: {//设置路径,不影响base
        'libs':'js/libs'
    },
    alias: {//别名调用
        "template": "libs/arttemplate"
    }

});

// 加载入口模块
seajs.use("js/app");