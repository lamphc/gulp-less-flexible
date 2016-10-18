/**
 * Created by lamph on 2016/9/21.
 */
;!function (window, $, undefined) {
    var devicew = document.documentElement.clientWidth || document.body.clientWidth,
        deviceh = document.documentElement.clientHeight || document.body.clientHeight;
    util = {
        //判断终端设备类型
        ispc: function () {
            var userAgentInfo = window.navigator.userAgent;
            var Agents = ["Android", "iPhone",
                "SymbianOS", "Windows Phone",
                "iPad", "iPod"];
            var flag = true;
            for (var v = 0; v < Agents.length; v++) {
                if (userAgentInfo.indexOf(Agents[v]) > 0) {
                    flag = false;
                    break;
                }
            }
            return flag;
        },
        //路由
        route: function (configs) {
            function router(options) {
                this.option = {
                    el: '',//入口页模块入口Object-app
                    key: ['index', 'nopage'],//默认首页及404页配置
                    config: {}//路由配置
                }
                var isEmptyObj = function (obj) {
                    for (var ikey in obj) {
                        return !1;
                    }
                    return !0;
                };
                if (!options.el || isEmptyObj(options.config)) {
                    throw new Error('[route]:paramter miss!')
                } else {
                    $.extend(true, this.option, options);
                }
                console.log(this.option)
                //初始化路由及事件
                var hash = window.location.hash;
                this.init(hash, this.events);
            }

            router.prototype = {
                constructor: router,
                init: function (hash, cb) {
                    var vm = this,
                        opt = vm.option,
                        isdef = false,
                        el = opt.el,
                        flag = opt.config;
                    if (hash) {
                        for (var key in flag) {
                            var cur = flag[key];
                            if (cur.name === hash) {
                                cur.fn.init(el);
                                isdef = true;
                                break;
                            }
                        }
                        if (!isdef) {
                            flag[opt.key[0]].fn.init(el);//配置中未匹配到路由回跳到404
                        }
                    } else {
                        flag[opt.key[0]].fn.init(el);//无hash参数回跳首页
                    }

                    //bind event
                    //return vm.events;
                    if (cb) {
                        cb(vm);
                    }
                },
                events: function (_this) {
                    var vm = _this;
                    $(window).on('hashchange', function (e) {
                        $('html').css('overflow','auto');
                        var nhash = window.location.hash;
                        vm.init(nhash);
                    })
                }
            };


            return new router(configs);
        },
        //轮播
        slider: function (configs) {
            function slider(options) {
                this.opt = {
                    el: '',//初始化元素
                    time: 600,//播放时间间隔
                    cb: function () {
                        return true;
                    }
                }
                this.timer = null;//迭代器
                this.index = 0;//轮播索引
                this.direction = 'left';//运动方向
                this.devicew = 0;//设备宽度
                if ($.type(options) === 'object') {
                    $.extend(this.opt, options);
                }

                if (!this.opt.el) {
                    throw new Error('[slider]:no el!')
                }
                //初始化轮播
                this.init();
            }

            slider.prototype = {
                constructor: slider,
                compute: function () {
                    var vm = this;
                    var el = $(vm.opt.el),
                        sul = el.find('ul'),
                        sli = sul.find('li');
                    var len = sli.length;
                    //计算容器轮播宽度
                    if (!util.ispc()) {
                        vm.devicew = devicew;
                    } else {
                        vm.devicew = $('.container').width();//PC端兼容
                    }
                    sli.css({width: vm.devicew + 'px'});
                    sul.css({width: (vm.devicew * len) + 'px'});

                    //执行轮播
                    vm.timer = setInterval(
                        function () {
                            vm.animate(sul, len, vm.devicew);
                        }, vm.opt.time
                    )

                },
                animate: function (ul, len, distance) {
                    var vm = this;
                    var flag = vm.index + 1;//获取当前轮播索引
                    ul.animate({marginLeft: (0 - vm.index * distance) + 'px'}, 600, function () {
                        if (vm.direction == "left") {
                            if (vm.index < len - 1) {
                                vm.index++;
                            }
                            else {
                                vm.direction = "right";
                                vm.index--;
                            }
                        }
                        else {
                            if (vm.index > 0) {
                                vm.index--;
                            }
                            else {
                                vm.direction = "left";
                                vm.index++;
                            }
                        }
                        //callback传递当前索引
                        vm.opt.cb.call(this, {index: flag, len: len});
                    })
                },
                init: function () {
                    this.compute();
                }
            };

            return new slider(configs);
        },
        //购物车计数器
        counts: function (configs) {
            function counter(el) {
                this.option = {
                    el: '',
                    num: 1,
                    max: 100
                }
                if ($.type(el) === 'object') {
                    $.extend(this.option, el)
                }

                if (!this.option.el) {
                    throw new Error('[counts]:no el!')
                }
                //init
                this.events();
            }

            counter.prototype = {
                constructor: counter,
                events: function () {
                    var vm = this, opt = vm.option;
                    if (!opt.el) {
                        throw new Error('[counter]:No el!');
                    }
                    var par = $(opt.el), inp = par.find('input');
                    //递增 | 递减
                    par.on('click', 'a', function (e) {
                        var cur = e.target;
                        var val = parseInt(inp.val());
                        if (cur.hasAttribute('data-reduce')) {
                            if (val > 1) {
                                val--;
                                inp.val(val);
                                opt.num = val;
                            }
                        } else if (cur.hasAttribute('data-raise')) {
                            if (val >= 1 && val < opt.max) {
                                val++;
                                inp.val(val);
                                opt.num = val;
                            }
                        }
                        e.stopPropagation();
                    })
                    //输入限制
                    inp.on('keyup', function () {
                        var reg_num = /^[0-9]*$/;
                        var val = inp.val();
                        if (parseInt(val) < 1 || parseInt(val) > opt.max || !reg_num.test(val)) {
                            inp.val(1);
                        }
                    })
                }
            }
            return new counter(configs);
        },
        //弹出层
        modal: function (configs) {
            function modal(options) {
                this.option = {
                    el: '',
                    direction: 'top',
                    openfn: 'name',
                    html: {
                        close: '.mc-modal-close',
                        content: '.mc-modal-content',
                        shadow: '.mc-modal-shadow'
                    },
                    closefn: function () {
                        return true;
                    }

                }
                this.step = -1000;
                this.bstep = '20%';
                this.box = null;
                this.content = null;
                this.shadow = null;
                if ($.type(options) === 'object') {
                    $.extend(this.option, options)
                }
                if (!this.option.el) {
                    throw new Error('[modal]:No el!');
                }
                this.init();
            }

            modal.prototype = {
                constructor: modal,
                init: function () {
                    var vm = this;
                    var opt = vm.option;
                    var mpar = $(opt.el), content = mpar.find(opt.html.content),
                        close = mpar.find(opt.html.close),
                        shadow = mpar.find(opt.html.shadow),
                        direction = opt.direction;
                    vm.box = mpar, vm.content = content, vm.shadow = shadow;

                    switch (direction) {
                        case 'top':
                            content.css('top', vm.step + 'px');
                            break;
                        case 'bottom':
                            content.css('bottom', vm.step + 'px');
                            break;
                    }
                    close.on('click', function () {
                        vm.close();
                    })

                },
                animates: function (flag, forward, distance) {
                    var vm = this;
                    if (flag === 'open') {
                        vm.box.show(200, function () {
                            $(this).toggleClass('in');
                            vm.shadow.toggleClass('in');
                            vm.content.css(forward, distance);

                            $('html').css('overflow', 'hidden');
                        })
                    } else if (flag === 'close') {
                        vm.shadow.removeClass('in');
                        vm.content.css(forward, distance);
                        setTimeout(function () {
                            vm.box.removeClass('in').delay(200).hide();
                        }, 200);

                        $('html').css('overflow', 'auto');
                    }

                },
                open: function () {
                    var vm = this;
                    var opt = vm.option;

                    if (opt.direction === 'top') {
                        vm.animates('open', 'top', vm.bstep);
                    } else if (opt.direction === 'bottom') {
                        var bnav = $('[data-bnav]'), bdir = 0;
                        if (bnav.length > 0) {
                            bdir = bnav.outerHeight() + 'px';
                        } else {
                            bdir = vm.bstep;
                        }
                        vm.animates('open', 'bottom', bdir);


                    }
                },
                close: function () {
                    var vm = this;
                    var opt = vm.option;
                    if (opt.direction === 'top') {
                        vm.animates('close', 'top', vm.step);
                    } else if (opt.direction === 'bottom') {
                        vm.animates('close', 'bottom', vm.step);
                    }
                    opt.closefn.call(vm, this.content);
                }
            }

            return new modal(configs);
        },
        //首页菜单浮动 @paramer type=1 fcalss浮动类 | 返回顶部 @paramer type=0
        mscroll: function (el, type, fclass) {
            if (!el) {
                throw new Error('[mscroll]:No el!');
            }

            var ot = $(el), flag = deviceh / 2, sf = true;
            //初始化
            if (type === 0) {
                ot.hide();
                ot.on('click', function (e) {
                    $(window).scrollTop(0);
                    e.stopPropagation();    
                })
            }
            //bind event
            $(window).off('scroll').scroll(function () {
                //fix repeat
                if (document.body.scrollTop === 0) {
                    if (type === 0) {
                        ot.hide();
                    } else if (type === 1) {
                        ot.removeClass(fclass);
                    }

                    return;
                }
                //run init
                if (sf) {
                    var timer = setTimeout(function () {
                        if (document.body.scrollTop > flag) {
                            if (type === 0) {
                                ot.show(300);
                            } else if (type === 1) {
                                ot.addClass(fclass)
                            }

                        } else {
                            if (type === 0) {
                                ot.hide();
                            } else if (type === 1) {
                                ot.removeClass(fclass)
                            }
                        }
                        //@恢复执行
                        sf = true;
                    }, 600);
                    //@600ms只执行一次handle fn
                    sf = false;
                }
            })

        },
        //首页分类切换
        cateswitch: function (el) {
            if (!el) {
                throw new Error('[cateswitch]:No el!');
            }

            var cate = $(el), a = cate.find('a'), h = cate.outerHeight();
            cate.on('click', 'a', function () {
                var cur = $(this), fla = cur.data('cate');
                a.removeClass('active');
                cur.addClass('active');
                var st = $(fla).offset().top;
                //fix cover
                if (!cate.hasClass('menufixed')) {
                    st -= h * 2;
                } else {
                    st -= h;
                }

                $('html,body').animate({scrollTop: st}, 600);
            })
        }
    }
    window.MC = util || {};
}(window, $)
