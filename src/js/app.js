define(function(require, exports, module) {

	var app = $('#app'),
		hash = window.location.hash;

	//引入子模块	
	var header = require('./modules/header'),
		index = require('./modules/index'),
		detail = require('./modules/detail');

	//includes	
	header.init($('header'));

	//路由
	var router = {
		config: {
			index: "#index", //首页
			detail: "#detail", //详情页
		},
		init: function(hash) {
			var vm = this,
				flag = vm.config;
			switch (hash) {
				case flag.index:
					// statements_1
					index.init(app);
					break;
				case flag.detail:
					// statements_1
					detail.init(app);
					break
				default:
					// statements_def
					index.init(app);
					break;
			}
			//bind event
			return function() {
				$(window).on('hashchange', function(e) {
					var nhash = window.location.hash;
					vm.init(nhash);
				})
			}
		}

	};
	//初始化
	router.init(hash)();
});