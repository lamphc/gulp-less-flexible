define(function(require, exports, module) {

	var detail = {
		init: function(app) {
			app.load(this.get());
		},
		get: function() {
			return '/html/detail.html';
		}
	}
	module.exports = detail;
});