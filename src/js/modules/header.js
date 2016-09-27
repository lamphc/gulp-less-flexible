define(function (require, exports, module) {

    var header = {
        init: function () {
            var vm = this;
            vm.nav();
            //back to top
            var totop = MC.mscroll('.mc-totop',0);
        },
        nav: function () {
            var nav = $('#navTest');
            if (nav.length > 0) {
                nav.on('click', 'a', function () {
                    var data = $(this).data('nav');
                    window.location.hash = data;
                })
            }
        }
    }
    module.exports = header;
});