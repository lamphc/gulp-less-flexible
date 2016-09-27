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

	//路由
	var route = MC.route({
		el: app,
		config: {
			index: {name: "#index", fn: index}, //首页
			detail: {name: "#detail", fn: detail}, //详情页

		}
	});

});