#gulp-seajs-jquery-flexible 静态资源项目构建
> 本项目可以帮你快速搭建手机端静态资源开发


##目录结构
<pre>
│  .gitignore          # 忽略文件,比如 node_modules
│  package.json        # 项目配置
│  README.md           # 项目说明
│
│
├─ config/config.json   # gulp 基础配置
├─ gulpfile.js          # gulp 开发配置
│
│
├─ node_modules
│
├─ build                 # 打包目录
├─ src                   # 开发目录
│
└─src/js
    ├─ run.js          # 启动配置
    ├─ app.js          # 入口模块
    │
    ├─ libs            # 依赖库
    ├─ modules         # 业务模块
│       
├─less             # less文件
│
├─css              # 样式文件
│
├─fonts            # 放置iconfont字体
│ 
├─html             # 放置静态页面片段
│
│
└─img              # 放置图片
     │
     │
     └─ app.html # 启动页面

</pre>


##说明
css使用less进行预编译,依赖统一引入main.less中,经gulp编译统一构建到main.css中.

#如何使用

##安装
```
// 安装前请先确保已安装node和npm
// 需要提前在全局安装gulp,如果已安装请忽略
npm install gulp -g


// 安装成功后,再安装依赖
npm install
```

##运行
####开发环境
// 创建开发服务,实时监测代码刷新浏览器(less及html目录监测,可在gulpfile.js中修改监测范围)
```
gulp watch

```

####生产环境(打包)
预览可直接复制build目录下所有文件到服务器根目录即可
```
gulp

```

####访问
http://127.0.0.1:3600
