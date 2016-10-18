define(function(require, exports, module) {

	var app = $('#app'),
		hash = window.location.hash;

	//设备类型判断
	var device = !function (M,$) {
		if(M.ispc()) {
			console.log('Device:[PC]');
		}
	}(MC,$);

	//引入模板引擎
	window.template = require('template');
	//引入子模块
	var header = require('./modules/header'),
		index = require('./modules/index'),
		detail = require('./modules/detail');

	//includes
	header.init();
  //@TODO兼容jq-animate{scrollTop}
  $.fn.scrollTo =function(options){
        var defaults = {
            toT : 0,    //滚动目标位置
            durTime : 500,  //过渡动画时间
            delay : 30,     //定时器时间
            callback:null   //回调函数
        };

        var opts = $.extend(defaults,options),
            timer = null,
            _this = $(window),
            curTop = _this.scrollTop(),//滚动条当前的位置
            subTop = opts.toT - curTop,    //滚动条目标位置和当前位置的差值
            index = 0,
            dur = Math.round(opts.durTime / opts.delay),
            smoothScroll = function(t){
                index++;
                var per = Math.round(subTop/dur);
                if(index >= dur){
                    _this.scrollTop(t);
                    window.clearInterval(timer);
                    if(opts.callback && typeof opts.callback == 'function'){
                        opts.callback();
                    }
                    return;
                }else{
                    _this.scrollTop(curTop + index*per);
                }
            };
        timer = window.setInterval(function(){
            smoothScroll(opts.toT);
        }, opts.delay);
        return _this;
    };
  $('header').on('click',function(e){
      $.fn.scrollTo({toT:$('#totp').offset().top,durTime:600})
  })
	//路由
	var route = MC.route({
		el: app,
		config: {
			index: {name: "#index", fn: index}, //首页
			detail: {name: "#detail", fn: detail}, //详情页

		}
	});

});
