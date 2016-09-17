define(function(require, exports, module) {

	var header = {
		init: function(app) {
			var vm = this;
			app.load(vm.get(), function() {
				vm.nav();
			});
		},
		get: function() {
			return '/html/header.html';
		},
		nav: function() {
			var nav = $('#navTest');
			if (nav.length > 0) {
				nav.on('click', 'a', function() {
					var data = $(this).data('nav');
					window.location.hash = data;
				})
			}
		}
	}
	module.exports = header;
});