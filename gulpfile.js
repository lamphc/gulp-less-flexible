'use strict';
//引入gulp
const gulp = require('gulp'),

    //引入gulp-plugs
    //系统提示
    notify = require('gulp-notify'),
    //less编译
    less = require('gulp-less'),
    //html压缩及模板预编译
    htmlmin = require('gulp-htmlmin'),
    //图片压缩
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    //css压缩
    cssmin = require('gulp-minify-css'),
    //js压缩
    jsmin = require('gulp-uglify'),
    //html内引入文件添加版本号,清除页面缓存
    rev = require('gulp-rev-append'),
    //css2rem for flexible.js 单位转换
    postcss = require('gulp-postcss'),
    px2rem = require('postcss-px2rem'),

    //文件重命名
    rename = require('gulp-rename'),
    //合并引入html文件
    contentincluder = require('gulp-content-includer'),
    //arttemplate 模板路径文件处理
    tmod = require('gulp-tmod');

//引入构建配置文件
const options = require('./config/config.json');
const queentask = [];

//入口页
if (options.app) {
    let taskName = 'appTask';
    gulp.task(taskName, function () {
        gulp.src(options.app.src)
            .pipe(rev())
            .pipe(rename({basename: 'index'})) //生产环境重命名入口页
            .pipe(gulp.dest(options.app.dest))
    })
    queentask.push(taskName);
}
//css
if (options.buildcss) {
    let taskName = 'cssminTask';
    let option = {
        advanced: false, //类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
        compatibility: 'ie7', //保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
        keepBreaks: false, //类型：Boolean 默认：false [是否保留换行]
        keepSpecialComments: '*'
        //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
    }
    gulp.task(taskName, function () {
        gulp.src(options.buildcss.src)
            .pipe(cssmin(option))
            .pipe(gulp.dest(options.buildcss.dest))
    })
    queentask.push(taskName);
}
//image
if (options.buildimage) {
    let option = {
        progressive: true,
        svgoPlugins: [{
            removeViewBox: false
        }], //不要移除svg的viewbox属性
        use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
    };
    options.buildimage.forEach(function (item, index) {
        let taskName = `imageminTask-[${index}]`;
        gulp.task(taskName, function () {
            gulp.src(item.src)
                .pipe(imagemin(option))
                .pipe(gulp.dest(item.dest));
        });
        queentask.push(taskName);
    });

}
//html
if (options.buildhtml) {
    let taskName = 'htmlTask';
    gulp.task(taskName, function () {
        gulp.src(options.buildhtml.src)
            .pipe(gulp.dest(options.buildhtml.dest));
    });
    queentask.push(taskName);
}
//js
if (options.buildjs) {
    let option = {
        mangle: {except: ['require', 'exports', 'module', '$']},//排除混淆关键字 | mangle: true,//类型：Boolean 默认：true 是否修改变量名
        compress: true, //类型：Boolean 默认：true 是否完全压缩
        preserveComments: 'license' //保留指定注释 | directives such as @license or /*! words */
    };
    options.buildjs.forEach(function (item, index) {
        let taskName = `buildjs-[${index}]`;
        queentask.push(taskName);
        gulp.task(taskName, function () {
            if (item.dev) {//dev 暂不压缩JS文件
                gulp.src(item.src)
                    .pipe(gulp.dest(item.dest));
            } else {
                gulp.src(item.src)
                    .pipe(jsmin(option))
                    .pipe(gulp.dest(item.dest));
            }
        });
    });
}
//others
if (options.others) {
    options.others.forEach(function (item, index) {
        let taskName = `buildothers-[${index}]`;
        queentask.push(taskName);
        gulp.task(taskName, function () {
            gulp.src(item.src)
                .pipe(gulp.dest(item.dest));
        });
    });
}


//##定义任务
//less编译
if (options.encodeless && options.buildtmod) {

    //编译less文件
    gulp.task('lessTask', function () {
        //##processors rem单位计算配置
        //@remUnit = html根元素的大小
        //##设备像素比(dpr | device pixel ratio) = 物理像素(physical pixel) / 设备独立像素(density-independent pixel)
        //##众所周知，iPhone6的设备宽度和高度为 375pt * 667pt ,可以理解为设备的独立像素
        //##而其dpr为 2 ,根据上面公式，我们可以很轻松得知其物理像素为 750pt * 1334pt

        //##Flexible.js会将设计稿分成 100份 (主要为了以后能更好的兼容 vh 和 vw ) ,而每一份被称为一个单位 a
        //同时 1rem 单位被认定为 10a
        //@不希望文本在Retina(视网膜)屏幕下变小,故字号不使用 rem
        //@less 中需要计算rem照常书写,需要根据dpr计算px样式后跟 /*px*/ ,不需要计算样式后跟 /*no*/
        //@less 示例(640px设计稿)：
        // .selector {
        // 	width: 128px;
        // 	height: 64px; /*px*/
        // 	font-size: 28px; /*px*/
        // 	border: 1px solid #ddd; /*no*/
        // 	background:@color-red;
        // 	color:#fff;
        // }
        //px2rem 处理之后将会变成：
        // .selector {
        // 	width: 2rem;
        // 	border: 1px solid #ddd;
        // }
        // [data-dpr="1"] .selector {
        // 	height: 32px;
        // 	font-size: 14px;
        // }
        // [data-dpr="2"] .selector {
        // 	height: 64px;
        // 	font-size: 28px;
        // }
        // [data-dpr="3"] .selector {
        // 	height: 96px;
        // 	font-size: 42px;
        // }
        //@计算逻辑：根据设计稿宽度确定,本项目设计稿640px,即 1a = 6.4px, 1rem = 64px,则px2rem计算配置remUnit = 64px
        let processors = [px2rem({remUnit: 64})];
        gulp.src(options.encodeless.src)
            .pipe(less()) //编译less文件
            .pipe(postcss(processors)) //编译完成对rem单位进行计算
            .pipe(gulp.dest(options.encodeless.dest)) //将会在指定目录下生成main.css
            .pipe(reload({
                stream: true
            }))
    });

    //编译js模板
    gulp.task('build:js-tpl', function () {
        gulp.src(options.buildtmod.src)
            .pipe(htmlmin({
                collapseWhitespace: true,
                minifyJS: true,
                preventAttributesEscaping: true
            }, 'test'))
            .pipe(rename({extname: ".js"}))
            .pipe(gulp.dest(options.buildtmod.dest))
            .pipe(reload({
                stream: true
            }))
    });

    //编译include页
    gulp.task('build:includes', function () {
        gulp.src(options.buildtmod.devsrc)
            .pipe(contentincluder({
                deepConcat: true,
                includerReg: /<!\-\-include\s+"([^"]+)"\-\->/g
            }))
            .pipe(rename({basename: 'app'}))
            .pipe(gulp.dest(options.buildtmod.devdest))
            .pipe(reload({
                stream: true
            }))
    });

    //##监测代码变更,实时刷新页面
    const browsersync = require('browser-sync').create();
    const reload = browsersync.reload;

    //@静态服务器 + 监听 less&html 文件(更改实时刷新浏览器)
    gulp.task('watch', ['lessTask', 'build:includes', 'build:js-tpl'], function () {
        //初始化静态服务器
        browsersync.init({
            server: {
                baseDir: options.encodeless.serversrc, //服务器根目录配置
                index: 'app.html',
                //directory: true,
                middleware: function (req, res, next) {
                    //console.log(req, res);
                    next()
                }
            },
            port: 3600
        });
        //实时监听,编译并刷新浏览器
        //监听编译less
        gulp.watch(options.encodeless.src, ['lessTask']);
        //监听编译入口页
        gulp.watch(options.buildtmod.includesrc, ['build:includes']);
        gulp.watch(options.buildtmod.devsrc, ['build:includes']);
        //监听编译js模板页
        gulp.watch(options.buildtmod.src, ['build:js-tpl']);
        //监听页面及样式变化,实时刷新
        gulp.watch(options.encodeless.htmlsrc).on('change', reload);
        gulp.watch(options.encodeless.jssrc).on('change', reload);
    });
}


//##html压缩
// gulp.task('htmlminTask', function() {
// 	let option = {
// 		removeComments: true, //清除HTML注释
// 		collapseWhitespace: true, //压缩HTML
// 		collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
// 		removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
// 		removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
// 		removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
// 		minifyJS: true, //压缩页面JS
// 		minifyCSS: true //压缩页面CSS
// 	};
// 	gulp.src('src/*.html')
// 		.pipe(htmlmin(option))
// 		.pipe(gulp.dest('build'));
// });


//##任务队列
//@gulp 默认任务(追加处理队列)
gulp.task('default', function () {
    gulp.start(queentask, function () {
        gulp.src('./config/config.json', {
            read: false
        })
            .pipe(notify({
                message: 'All build work is complete.'
            }));
    })
})