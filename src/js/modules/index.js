define(function(require, exports, module) {

  var index = {
    init: function(app) {
      app.load(this.get());
    },
    get: function() {
      return '/html/index.html';
    }
  }

  // 通过 exports 对外提供接口
  //exports.test = test;

  // 或者通过 module.exports 提供整个接口
  module.exports = index;

});