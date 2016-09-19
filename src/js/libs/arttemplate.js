//
// Generated on Tue Dec 16 2014 12:13:47 GMT+0100 (CET) by Charlie Robbins, Paolo Fragomeni & the Contributors (Using Codesurgeon).
// Version 1.2.6
//

;;(function (exports) {

    /*
     * browser.js: Browser specific functionality for director.
     *
     * (C) 2011, Charlie Robbins, Paolo Fragomeni, & the Contributors.
     * MIT LICENSE
     *
     */

    var dloc = document.location;

    function dlocHashEmpty() {
        // Non-IE browsers return '' when the address bar shows '#'; Director's logic
        // assumes both mean empty.
        return dloc.hash === '' || dloc.hash === '#';
    }

    var listener = {
        mode: 'modern',
        hash: dloc.hash,
        history: false,

        check: function () {
            var h = dloc.hash;
            if (h != this.hash) {
                this.hash = h;
                this.onHashChanged();
            }
        },

        fire: function () {
            if (this.mode === 'modern') {
                this.history === true ? window.onpopstate() : window.onhashchange();
            }
            else {
                this.onHashChanged();
            }
        },

        init: function (fn, history) {
            var self = this;
            this.history = history;

            if (!Router.listeners) {
                Router.listeners = [];
            }

            function onchange(onChangeEvent) {
                for (var i = 0, l = Router.listeners.length; i < l; i++) {
                    Router.listeners[i](onChangeEvent);
                }
            }

            //note IE8 is being counted as 'modern' because it has the hashchange event
            if ('onhashchange' in window && (document.documentMode === undefined
                || document.documentMode > 7)) {
                // At least for now HTML5 history is available for 'modern' browsers only
                if (this.history === true) {
                    // There is an old bug in Chrome that causes onpopstate to fire even
                    // upon initial page load. Since the handler is run manually in init(),
                    // this would cause Chrome to run it twise. Currently the only
                    // workaround seems to be to set the handler after the initial page load
                    // http://code.google.com/p/chromium/issues/detail?id=63040
                    setTimeout(function() {
                        window.onpopstate = onchange;
                    }, 500);
                }
                else {
                    window.onhashchange = onchange;
                }
                this.mode = 'modern';
            }
            else {
                //
                // IE support, based on a concept by Erik Arvidson ...
                //
                var frame = document.createElement('iframe');
                frame.id = 'state-frame';
                frame.style.display = 'none';
                document.body.appendChild(frame);
                this.writeFrame('');

                if ('onpropertychange' in document && 'attachEvent' in document) {
                    document.attachEvent('onpropertychange', function () {
                        if (event.propertyName === 'location') {
                            self.check();
                        }
                    });
                }

                window.setInterval(function () { self.check(); }, 50);

                this.onHashChanged = onchange;
                this.mode = 'legacy';
            }

            Router.listeners.push(fn);

            return this.mode;
        },

        destroy: function (fn) {
            if (!Router || !Router.listeners) {
                return;
            }

            var listeners = Router.listeners;

            for (var i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                }
            }
        },

        setHash: function (s) {
            // Mozilla always adds an entry to the history
            if (this.mode === 'legacy') {
                this.writeFrame(s);
            }

            if (this.history === true) {
                window.history.pushState({}, document.title, s);
                // Fire an onpopstate event manually since pushing does not obviously
                // trigger the pop event.
                this.fire();
            } else {
                dloc.hash = (s[0] === '/') ? s : '/' + s;
            }
            return this;
        },

        writeFrame: function (s) {
            // IE support...
            var f = document.getElementById('state-frame');
            var d = f.contentDocument || f.contentWindow.document;
            d.open();
            d.write("<script>_hash = '" + s + "'; onload = parent.listener.syncHash;<script>");
            d.close();
        },

        syncHash: function () {
            // IE support...
            var s = this._hash;
            if (s != dloc.hash) {
                dloc.hash = s;
            }
            return this;
        },

        onHashChanged: function () {}
    };

    window.Router = exports.Router = function (routes) {
        if (!(this instanceof Router)) return new Router(routes);

        this.params   = {};
        this.routes   = {};
        this.methods  = ['on', 'once', 'after', 'before'];
        this.scope    = [];
        this._methods = {};

        this._insert = this.insert;
        this.insert = this.insertEx;

        this.historySupport = (window.history != null ? window.history.pushState : null) != null

        this.configure();
        this.mount(routes || {});
    };

    Router.prototype.init = function (r) {
        var self = this
            , routeTo;
        this.handler = function(onChangeEvent) {
            var newURL = onChangeEvent && onChangeEvent.newURL || window.location.hash;
            var url = self.history === true ? self.getPath() : newURL.replace(/.*#/, '');
            self.dispatch('on', url.charAt(0) === '/' ? url : '/' + url);
        };

        listener.init(this.handler, this.history);

        if (this.history === false) {
            if (dlocHashEmpty() && r) {
                dloc.hash = r;
            } else if (!dlocHashEmpty()) {
                self.dispatch('on', '/' + dloc.hash.replace(/^(#\/|#|\/)/, ''));
            }
        }
        else {
            if (this.convert_hash_in_init) {
                // Use hash as route
                routeTo = dlocHashEmpty() && r ? r : !dlocHashEmpty() ? dloc.hash.replace(/^#/, '') : null;
                if (routeTo) {
                    window.history.replaceState({}, document.title, routeTo);
                }
            }
            else {
                // Use canonical url
                routeTo = this.getPath();
            }

            // Router has been initialized, but due to the chrome bug it will not
            // yet actually route HTML5 history state changes. Thus, decide if should route.
            if (routeTo || this.run_in_init === true) {
                this.handler();
            }
        }

        return this;
    };

    Router.prototype.explode = function () {
        var v = this.history === true ? this.getPath() : dloc.hash;
        if (v.charAt(1) === '/') { v=v.slice(1) }
        return v.slice(1, v.length).split("/");
    };

    Router.prototype.setRoute = function (i, v, val) {
        var url = this.explode();

        if (typeof i === 'number' && typeof v === 'string') {
            url[i] = v;
        }
        else if (typeof val === 'string') {
            url.splice(i, v, s);
        }
        else {
            url = [i];
        }

        listener.setHash(url.join('/'));
        return url;
    };

//
// ### function insertEx(method, path, route, parent)
// #### @method {string} Method to insert the specific `route`.
// #### @path {Array} Parsed path to insert the `route` at.
// #### @route {Array|function} Route handlers to insert.
// #### @parent {Object} **Optional** Parent "routes" to insert into.
// insert a callback that will only occur once per the matched route.
//
    Router.prototype.insertEx = function(method, path, route, parent) {
        if (method === "once") {
            method = "on";
            route = function(route) {
                var once = false;
                return function() {
                    if (once) return;
                    once = true;
                    return route.apply(this, arguments);
                };
            }(route);
        }
        return this._insert(method, path, route, parent);
    };

    Router.prototype.getRoute = function (v) {
        var ret = v;

        if (typeof v === "number") {
            ret = this.explode()[v];
        }
        else if (typeof v === "string"){
            var h = this.explode();
            ret = h.indexOf(v);
        }
        else {
            ret = this.explode();
        }

        return ret;
    };

    Router.prototype.destroy = function () {
        listener.destroy(this.handler);
        return this;
    };

    Router.prototype.getPath = function () {
        var path = window.location.pathname;
        if (path.substr(0, 1) !== '/') {
            path = '/' + path;
        }
        return path;
    };
    function _every(arr, iterator) {
        for (var i = 0; i < arr.length; i += 1) {
            if (iterator(arr[i], i, arr) === false) {
                return;
            }
        }
    }

    function _flatten(arr) {
        var flat = [];
        for (var i = 0, n = arr.length; i < n; i++) {
            flat = flat.concat(arr[i]);
        }
        return flat;
    }

    function _asyncEverySeries(arr, iterator, callback) {
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        (function iterate() {
            iterator(arr[completed], function(err) {
                if (err || err === false) {
                    callback(err);
                    callback = function() {};
                } else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback();
                    } else {
                        iterate();
                    }
                }
            });
        })();
    }

    function paramifyString(str, params, mod) {
        mod = str;
        for (var param in params) {
            if (params.hasOwnProperty(param)) {
                mod = params[param](str);
                if (mod !== str) {
                    break;
                }
            }
        }
        return mod === str ? "([._a-zA-Z0-9-%()]+)" : mod;
    }

    function regifyString(str, params) {
        var matches, last = 0, out = "";
        while (matches = str.substr(last).match(/[^\w\d\- %@&]*\*[^\w\d\- %@&]*/)) {
            last = matches.index + matches[0].length;
            matches[0] = matches[0].replace(/^\*/, "([_.()!\\ %@&a-zA-Z0-9-]+)");
            out += str.substr(0, matches.index) + matches[0];
        }
        str = out += str.substr(last);
        var captures = str.match(/:([^\/]+)/ig), capture, length;
        if (captures) {
            length = captures.length;
            for (var i = 0; i < length; i++) {
                capture = captures[i];
                if (capture.slice(0, 2) === "::") {
                    str = capture.slice(1);
                } else {
                    str = str.replace(capture, paramifyString(capture, params));
                }
            }
        }
        return str;
    }

    function terminator(routes, delimiter, start, stop) {
        var last = 0, left = 0, right = 0, start = (start || "(").toString(), stop = (stop || ")").toString(), i;
        for (i = 0; i < routes.length; i++) {
            var chunk = routes[i];
            if (chunk.indexOf(start, last) > chunk.indexOf(stop, last) || ~chunk.indexOf(start, last) && !~chunk.indexOf(stop, last) || !~chunk.indexOf(start, last) && ~chunk.indexOf(stop, last)) {
                left = chunk.indexOf(start, last);
                right = chunk.indexOf(stop, last);
                if (~left && !~right || !~left && ~right) {
                    var tmp = routes.slice(0, (i || 1) + 1).join(delimiter);
                    routes = [ tmp ].concat(routes.slice((i || 1) + 1));
                }
                last = (right > left ? right : left) + 1;
                i = 0;
            } else {
                last = 0;
            }
        }
        return routes;
    }

    var QUERY_SEPARATOR = /\?.*/;

    Router.prototype.configure = function(options) {
        options = options || {};
        for (var i = 0; i < this.methods.length; i++) {
            this._methods[this.methods[i]] = true;
        }
        this.recurse = options.recurse || this.recurse || false;
        this.async = options.async || false;
        this.delimiter = options.delimiter || "/";
        this.strict = typeof options.strict === "undefined" ? true : options.strict;
        this.notfound = options.notfound;
        this.resource = options.resource;
        this.history = options.html5history && this.historySupport || false;
        this.run_in_init = this.history === true && options.run_handler_in_init !== false;
        this.convert_hash_in_init = this.history === true && options.convert_hash_in_init !== false;
        this.every = {
            after: options.after || null,
            before: options.before || null,
            on: options.on || null
        };
        return this;
    };

    Router.prototype.param = function(token, matcher) {
        if (token[0] !== ":") {
            token = ":" + token;
        }
        var compiled = new RegExp(token, "g");
        this.params[token] = function(str) {
            return str.replace(compiled, matcher.source || matcher);
        };
        return this;
    };

    Router.prototype.on = Router.prototype.route = function(method, path, route) {
        var self = this;
        if (!route && typeof path == "function") {
            route = path;
            path = method;
            method = "on";
        }
        if (Array.isArray(path)) {
            return path.forEach(function(p) {
                self.on(method, p, route);
            });
        }
        if (path.source) {
            path = path.source.replace(/\\\//ig, "/");
        }
        if (Array.isArray(method)) {
            return method.forEach(function(m) {
                self.on(m.toLowerCase(), path, route);
            });
        }
        path = path.split(new RegExp(this.delimiter));
        path = terminator(path, this.delimiter);
        this.insert(method, this.scope.concat(path), route);
    };

    Router.prototype.path = function(path, routesFn) {
        var self = this, length = this.scope.length;
        if (path.source) {
            path = path.source.replace(/\\\//ig, "/");
        }
        path = path.split(new RegExp(this.delimiter));
        path = terminator(path, this.delimiter);
        this.scope = this.scope.concat(path);
        routesFn.call(this, this);
        this.scope.splice(length, path.length);
    };

    Router.prototype.dispatch = function(method, path, callback) {
        var self = this, fns = this.traverse(method, path.replace(QUERY_SEPARATOR, ""), this.routes, ""), invoked = this._invoked, after;
        this._invoked = true;
        if (!fns || fns.length === 0) {
            this.last = [];
            if (typeof this.notfound === "function") {
                this.invoke([ this.notfound ], {
                    method: method,
                    path: path
                }, callback);
            }
            return false;
        }
        if (this.recurse === "forward") {
            fns = fns.reverse();
        }
        function updateAndInvoke() {
            self.last = fns.after;
            self.invoke(self.runlist(fns), self, callback);
        }
        after = this.every && this.every.after ? [ this.every.after ].concat(this.last) : [ this.last ];
        if (after && after.length > 0 && invoked) {
            if (this.async) {
                this.invoke(after, this, updateAndInvoke);
            } else {
                this.invoke(after, this);
                updateAndInvoke();
            }
            return true;
        }
        updateAndInvoke();
        return true;
    };

    Router.prototype.invoke = function(fns, thisArg, callback) {
        var self = this;
        var apply;
        if (this.async) {
            apply = function(fn, next) {
                if (Array.isArray(fn)) {
                    return _asyncEverySeries(fn, apply, next);
                } else if (typeof fn == "function") {
                    fn.apply(thisArg, (fns.captures || []).concat(next));
                }
            };
            _asyncEverySeries(fns, apply, function() {
                if (callback) {
                    callback.apply(thisArg, arguments);
                }
            });
        } else {
            apply = function(fn) {
                if (Array.isArray(fn)) {
                    return _every(fn, apply);
                } else if (typeof fn === "function") {
                    return fn.apply(thisArg, fns.captures || []);
                } else if (typeof fn === "string" && self.resource) {
                    self.resource[fn].apply(thisArg, fns.captures || []);
                }
            };
            _every(fns, apply);
        }
    };

    Router.prototype.traverse = function(method, path, routes, regexp, filter) {
        var fns = [], current, exact, match, next, that;
        function filterRoutes(routes) {
            if (!filter) {
                return routes;
            }
            function deepCopy(source) {
                var result = [];
                for (var i = 0; i < source.length; i++) {
                    result[i] = Array.isArray(source[i]) ? deepCopy(source[i]) : source[i];
                }
                return result;
            }
            function applyFilter(fns) {
                for (var i = fns.length - 1; i >= 0; i--) {
                    if (Array.isArray(fns[i])) {
                        applyFilter(fns[i]);
                        if (fns[i].length === 0) {
                            fns.splice(i, 1);
                        }
                    } else {
                        if (!filter(fns[i])) {
                            fns.splice(i, 1);
                        }
                    }
                }
            }
            var newRoutes = deepCopy(routes);
            newRoutes.matched = routes.matched;
            newRoutes.captures = routes.captures;
            newRoutes.after = routes.after.filter(filter);
            applyFilter(newRoutes);
            return newRoutes;
        }
        if (path === this.delimiter && routes[method]) {
            next = [ [ routes.before, routes[method] ].filter(Boolean) ];
            next.after = [ routes.after ].filter(Boolean);
            next.matched = true;
            next.captures = [];
            return filterRoutes(next);
        }
        for (var r in routes) {
            if (routes.hasOwnProperty(r) && (!this._methods[r] || this._methods[r] && typeof routes[r] === "object" && !Array.isArray(routes[r]))) {
                current = exact = regexp + this.delimiter + r;
                if (!this.strict) {
                    exact += "[" + this.delimiter + "]?";
                }
                match = path.match(new RegExp("^" + exact));
                if (!match) {
                    continue;
                }
                if (match[0] && match[0] == path && routes[r][method]) {
                    next = [ [ routes[r].before, routes[r][method] ].filter(Boolean) ];
                    next.after = [ routes[r].after ].filter(Boolean);
                    next.matched = true;
                    next.captures = match.slice(1);
                    if (this.recurse && routes === this.routes) {
                        next.push([ routes.before, routes.on ].filter(Boolean));
                        next.after = next.after.concat([ routes.after ].filter(Boolean));
                    }
                    return filterRoutes(next);
                }
                next = this.traverse(method, path, routes[r], current);
                if (next.matched) {
                    if (next.length > 0) {
                        fns = fns.concat(next);
                    }
                    if (this.recurse) {
                        fns.push([ routes[r].before, routes[r].on ].filter(Boolean));
                        next.after = next.after.concat([ routes[r].after ].filter(Boolean));
                        if (routes === this.routes) {
                            fns.push([ routes["before"], routes["on"] ].filter(Boolean));
                            next.after = next.after.concat([ routes["after"] ].filter(Boolean));
                        }
                    }
                    fns.matched = true;
                    fns.captures = next.captures;
                    fns.after = next.after;
                    return filterRoutes(fns);
                }
            }
        }
        return false;
    };

    Router.prototype.insert = function(method, path, route, parent) {
        var methodType, parentType, isArray, nested, part;
        path = path.filter(function(p) {
            return p && p.length > 0;
        });
        parent = parent || this.routes;
        part = path.shift();
        if (/\:|\*/.test(part) && !/\\d|\\w/.test(part)) {
            part = regifyString(part, this.params);
        }
        if (path.length > 0) {
            parent[part] = parent[part] || {};
            return this.insert(method, path, route, parent[part]);
        }
        if (!part && !path.length && parent === this.routes) {
            methodType = typeof parent[method];
            switch (methodType) {
                case "function":
                    parent[method] = [ parent[method], route ];
                    return;
                case "object":
                    parent[method].push(route);
                    return;
                case "undefined":
                    parent[method] = route;
                    return;
            }
            return;
        }
        parentType = typeof parent[part];
        isArray = Array.isArray(parent[part]);
        if (parent[part] && !isArray && parentType == "object") {
            methodType = typeof parent[part][method];
            switch (methodType) {
                case "function":
                    parent[part][method] = [ parent[part][method], route ];
                    return;
                case "object":
                    parent[part][method].push(route);
                    return;
                case "undefined":
                    parent[part][method] = route;
                    return;
            }
        } else if (parentType == "undefined") {
            nested = {};
            nested[method] = route;
            parent[part] = nested;
            return;
        }
        throw new Error("Invalid route context: " + parentType);
    };



    Router.prototype.extend = function(methods) {
        var self = this, len = methods.length, i;
        function extend(method) {
            self._methods[method] = true;
            self[method] = function() {
                var extra = arguments.length === 1 ? [ method, "" ] : [ method ];
                self.on.apply(self, extra.concat(Array.prototype.slice.call(arguments)));
            };
        }
        for (i = 0; i < len; i++) {
            extend(methods[i]);
        }
    };

    Router.prototype.runlist = function(fns) {
        var runlist = this.every && this.every.before ? [ this.every.before ].concat(_flatten(fns)) : _flatten(fns);
        if (this.every && this.every.on) {
            runlist.push(this.every.on);
        }
        runlist.captures = fns.captures;
        runlist.source = fns.source;
        return runlist;
    };

    Router.prototype.mount = function(routes, path) {
        if (!routes || typeof routes !== "object" || Array.isArray(routes)) {
            return;
        }
        var self = this;
        path = path || [];
        if (!Array.isArray(path)) {
            path = path.split(self.delimiter);
        }
        function insertOrMount(route, local) {
            var rename = route, parts = route.split(self.delimiter), routeType = typeof routes[route], isRoute = parts[0] === "" || !self._methods[parts[0]], event = isRoute ? "on" : rename;
            if (isRoute) {
                rename = rename.slice((rename.match(new RegExp("^" + self.delimiter)) || [ "" ])[0].length);
                parts.shift();
            }
            if (isRoute && routeType === "object" && !Array.isArray(routes[route])) {
                local = local.concat(parts);
                self.mount(routes[route], local);
                return;
            }
            if (isRoute) {
                local = local.concat(rename.split(self.delimiter));
                local = terminator(local, self.delimiter);
            }
            self.insert(event, local, routes[route]);
        }
        for (var route in routes) {
            if (routes.hasOwnProperty(route)) {
                insertOrMount(route, path.slice(0));
            }
        }
    };

}(typeof exports === "object" ? exports : window));
/*!
 * artTemplate - Template Engine
 * https://github.com/aui/artTemplate
 * Released under the MIT, BSD, and GPL Licenses
 */

!(function () {


    /**
     * 模板引擎
     * @name    template
     * @param   {String}            模板名
     * @param   {Object, String}    数据。如果为字符串则编译并缓存编译结果
     * @return  {String, Function}  渲染好的HTML字符串或者渲染方法
     */
    var template = function (filename, content) {
        return typeof content === 'string'
            ?   compile(content, {
            filename: filename
        })
            :   renderFile(filename, content);
    };


    template.version = '3.0.0';
    template._tid = 0;

    /**
     * 设置全局配置
     * @name    template.config
     * @param   {String}    名称
     * @param   {Any}       值
     */
    template.config = function (name, value) {
        defaults[name] = value;
    };



    var defaults = template.defaults = {
        openTag: '<%',    // 逻辑语法开始标签
        closeTag: '%>',   // 逻辑语法结束标签
        escape: true,     // 是否编码输出变量的 HTML 字符
        cache: true,      // 是否开启缓存（依赖 options 的 filename 字段）
        compress: false,  // 是否压缩输出
        parser: null      // 自定义语法格式器 @see: template-syntax.js
    };


    var cacheStore = template.cache = {};


    /**
     * 渲染模板
     * @name    template.render
     * @param   {String}    模板
     * @param   {Object}    数据
     * @return  {String}    渲染好的字符串
     */
    template.render = function (source, options) {
        return compile(source, options);
    };


    /**
     * 渲染模板(根据模板名)
     * @name    template.render
     * @param   {String}    模板名
     * @param   {Object}    数据
     * @return  {String}    渲染好的字符串
     */
    var renderFile = template.renderFile = function (filename, data) {
        var fn = template.get(filename) || showDebugInfo({
                filename: filename,
                name: 'Render Error',
                message: 'Template not found'
            });
        return data ? fn(data) : fn;
    };


    /**
     * 获取编译缓存（可由外部重写此方法）
     * @param   {String}    模板名
     * @param   {Function}  编译好的函数
     */
    template.get = function (filename) {

        var cache;
        if (cacheStore[filename]) {
            // 使用内存缓存
            cache = cacheStore[filename];

        } else if (typeof document === 'object') {
            // 加载模板并编译
            var elem = filename;//document.getElementById(filename);
            if (elem) {
                template._tid++;
                var source = filename//(elem.value || elem.innerHTML)
                    .replace(/^\s*|\s*$/g, '');
                cache = compile(source, {
                    filename: '_cache_'+ template._tid
                });
            }
        }

        return cache;
    };


    var toString = function (value, type) {

        if (typeof value !== 'string') {

            type = typeof value;
            if (type === 'number') {
                value += '';
            } else if (type === 'function') {
                value = toString(value.call(value));
            } else {
                value = '';
            }
        }

        return value;

    };


    var escapeMap = {
        "<": "&#60;",
        ">": "&#62;",
        '"': "&#34;",
        "'": "&#39;",
        "&": "&#38;"
    };


    var escapeFn = function (s) {
        return escapeMap[s];
    };

    var escapeHTML = function (content) {
        return toString(content)
            .replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
    };


    var isArray = Array.isArray || function (obj) {
            return ({}).toString.call(obj) === '[object Array]';
        };


    var each = function (data, callback) {
        var i, len;
        if (isArray(data)) {
            for (i = 0, len = data.length; i < len; i++) {
                callback.call(data, data[i], i, data);
            }
        } else {
            for (i in data) {
                callback.call(data, data[i], i);
            }
        }
    };


    var utils = template.utils = {

        $helpers: {},

        $include: renderFile,

        $string: toString,

        $escape: escapeHTML,

        $each: each

    };/**
     * 添加模板辅助方法
     * @name    template.helper
     * @param   {String}    名称
     * @param   {Function}  方法
     */
    template.helper = function (name, helper) {
        helpers[name] = helper;
    };

    var helpers = template.helpers = utils.$helpers;




    /**
     * 模板错误事件（可由外部重写此方法）
     * @name    template.onerror
     * @event
     */
    template.onerror = function (e) {
        var message = 'Template Error\n\n';
        for (var name in e) {
            message += '<' + name + '>\n' + e[name] + '\n\n';
        }

        if (typeof console === 'object') {
            console.error(message);
        }
    };


// 模板调试器
    var showDebugInfo = function (e) {

        template.onerror(e);

        return function () {
            return '{Template Error}';
        };
    };


    /**
     * 编译模板
     * 2012-6-6 @TooBug: define 方法名改为 compile，与 Node Express 保持一致
     * @name    template.compile
     * @param   {String}    模板字符串
     * @param   {Object}    编译选项
     *
     *      - openTag       {String}
     *      - closeTag      {String}
     *      - filename      {String}
     *      - escape        {Boolean}
     *      - compress      {Boolean}
     *      - debug         {Boolean}
     *      - cache         {Boolean}
     *      - parser        {Function}
     *
     * @return  {Function}  渲染方法
     */
    var compile = template.compile = function (source, options) {

        // 合并默认配置
        options = options || {};
        for (var name in defaults) {
            if (options[name] === undefined) {
                options[name] = defaults[name];
            }
        }


        var filename = options.filename;


        try {

            var Render = compiler(source, options);

        } catch (e) {

            e.filename = filename || 'anonymous';
            e.name = 'Syntax Error';

            return showDebugInfo(e);

        }


        // 对编译结果进行一次包装

        function render (data) {

            try {

                return new Render(data, filename) + '';

            } catch (e) {

                // 运行时出错后自动开启调试模式重新编译
                if (!options.debug) {
                    options.debug = true;
                    return compile(source, options)(data);
                }

                return showDebugInfo(e)();

            }

        }


        render.prototype = Render.prototype;
        render.toString = function () {
            return Render.toString();
        };


        if (filename && options.cache) {
            cacheStore[filename] = render;
        }


        return render;

    };




// 数组迭代
    var forEach = utils.$each;


// 静态分析模板变量
    var KEYWORDS =
        // 关键字
        'break,case,catch,continue,debugger,default,delete,do,else,false'
        + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
        + ',throw,true,try,typeof,var,void,while,with'

        // 保留字
        + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
        + ',final,float,goto,implements,import,int,interface,long,native'
        + ',package,private,protected,public,short,static,super,synchronized'
        + ',throws,transient,volatile'

        // ECMA 5 - use strict
        + ',arguments,let,yield'

        + ',undefined';

    var REMOVE_RE = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g;
    var SPLIT_RE = /[^\w$]+/g;
    var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
    var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
    var BOUNDARY_RE = /^,+|,+$/g;
    var SPLIT2_RE = /^$|,+/;


// 获取变量
    function getVariable (code) {
        return code
            .replace(REMOVE_RE, '')
            .replace(SPLIT_RE, ',')
            .replace(KEYWORDS_RE, '')
            .replace(NUMBER_RE, '')
            .replace(BOUNDARY_RE, '')
            .split(SPLIT2_RE);
    };


// 字符串转义
    function stringify (code) {
        return "'" + code
            // 单引号与反斜杠转义
                .replace(/('|\\)/g, '\\$1')
                // 换行符转义(windows + linux)
                .replace(/\r/g, '\\r')
                .replace(/\n/g, '\\n') + "'";
    }


    function compiler (source, options) {

        var debug = options.debug;
        var openTag = options.openTag;
        var closeTag = options.closeTag;
        var parser = options.parser;
        var compress = options.compress;
        var escape = options.escape;



        var line = 1;
        var uniq = {$data:1,$filename:1,$utils:1,$helpers:1,$out:1,$line:1};



        var isNewEngine = ''.trim;// '__proto__' in {}
        var replaces = isNewEngine
            ? ["$out='';", "$out+=", ";", "$out"]
            : ["$out=[];", "$out.push(", ");", "$out.join('')"];

        var concat = isNewEngine
            ? "$out+=text;return $out;"
            : "$out.push(text);";

        var print = "function(){"
            +      "var text=''.concat.apply('',arguments);"
            +       concat
            +  "}";

        var include = "function(filename,data){"
            +      "data=data||$data;"
            +      "var text=$utils.$include(filename,data,$filename);"
            +       concat
            +   "}";

        var headerCode = "'use strict';"
            + "var $utils=this,$helpers=$utils.$helpers,"
            + (debug ? "$line=0," : "");

        var mainCode = replaces[0];

        var footerCode = "return new String(" + replaces[3] + ");"

        // html与逻辑语法分离
        forEach(source.split(openTag), function (code) {
            code = code.split(closeTag);

            var $0 = code[0];
            var $1 = code[1];

            // code: [html]
            if (code.length === 1) {

                mainCode += html($0);

                // code: [logic, html]
            } else {

                mainCode += logic($0);

                if ($1) {
                    mainCode += html($1);
                }
            }


        });

        var code = headerCode + mainCode + footerCode;

        // 调试语句
        if (debug) {
            code = "try{" + code + "}catch(e){"
                +       "throw {"
                +           "filename:$filename,"
                +           "name:'Render Error',"
                +           "message:e.message,"
                +           "line:$line,"
                +           "source:" + stringify(source)
                +           ".split(/\\n/)[$line-1].replace(/^\\s+/,'')"
                +       "};"
                + "}";
        }



        try {


            var Render = new Function("$data", "$filename", code);
            Render.prototype = utils;

            return Render;

        } catch (e) {
            e.temp = "function anonymous($data,$filename) {" + code + "}";
            throw e;
        }




        // 处理 HTML 语句
        function html (code) {

            // 记录行号
            line += code.split(/\n/).length - 1;

            // 压缩多余空白与注释
            if (compress) {
                code = code
                    .replace(/\s+/g, ' ')
                    .replace(/<!--[\w\W]*?-->/g, '');
            }

            if (code) {
                code = replaces[1] + stringify(code) + replaces[2] + "\n";
            }

            return code;
        }


        // 处理逻辑语句
        function logic (code) {

            var thisLine = line;

            if (parser) {

                // 语法转换插件钩子
                code = parser(code, options);

            } else if (debug) {

                // 记录行号
                code = code.replace(/\n/g, function () {
                    line ++;
                    return "$line=" + line +  ";";
                });

            }


            // 输出语句. 编码: <%=value%> 不编码:<%=#value%>
            // <%=#value%> 等同 v2.0.3 之前的 <%==value%>
            if (code.indexOf('=') === 0) {

                var escapeSyntax = escape && !/^=[=#]/.test(code);

                code = code.replace(/^=[=#]?|[\s;]*$/g, '');

                // 对内容编码
                if (escapeSyntax) {

                    var name = code.replace(/\s*\([^\)]+\)/, '');

                    // 排除 utils.* | include | print

                    if (!utils[name] && !/^(include|print)$/.test(name)) {
                        code = "$escape(" + code + ")";
                    }

                    // 不编码
                } else {
                    code = "$string(" + code + ")";
                }


                code = replaces[1] + code + replaces[2];

            }

            if (debug) {
                code = "$line=" + thisLine + ";" + code;
            }

            // 提取模板中的变量名
            forEach(getVariable(code), function (name) {

                // name 值可能为空，在安卓低版本浏览器下
                if (!name || uniq[name]) {
                    return;
                }

                var value;

                // 声明模板变量
                // 赋值优先级:
                // [include, print] > utils > helpers > data
                if (name === 'print') {

                    value = print;

                } else if (name === 'include') {

                    value = include;

                } else if (utils[name]) {

                    value = "$utils." + name;

                } else if (helpers[name]) {

                    value = "$helpers." + name;

                } else {

                    value = "$data." + name;
                }

                headerCode += name + "=" + value + ",";
                uniq[name] = true;


            });

            return code + "\n";
        }


    };



// 定义模板引擎的语法


    defaults.openTag = '{{';
    defaults.closeTag = '}}';


    var filtered = function (js, filter) {
        var parts = filter.split(':');
        var name = parts.shift();
        var args = parts.join(':') || '';

        if (args) {
            args = ', ' + args;
        }

        return '$helpers.' + name + '(' + js + args + ')';
    }


    defaults.parser = function (code, options) {

        // var match = code.match(/([\w\$]*)(\b.*)/);
        // var key = match[1];
        // var args = match[2];
        // var split = args.split(' ');
        // split.shift();

        code = code.replace(/^\s/, '');

        var split = code.split(' ');
        var key = split.shift();
        var args = split.join(' ');



        switch (key) {

            case 'if':

                code = 'if(' + args + '){';
                break;

            case 'else':

                if (split.shift() === 'if') {
                    split = ' if(' + split.join(' ') + ')';
                } else {
                    split = '';
                }

                code = '}else' + split + '{';
                break;

            case '/if':

                code = '}';
                break;

            case 'each':

                var object = split[0] || '$data';
                var as     = split[1] || 'as';
                var value  = split[2] || '$value';
                var index  = split[3] || '$index';

                var param   = value + ',' + index;

                if (as !== 'as') {
                    object = '[]';
                }

                code =  '$each(' + object + ',function(' + param + '){';
                break;

            case '/each':

                code = '});';
                break;

            case 'echo':

                code = 'print(' + args + ');';
                break;

            case 'print':
            case 'include':

                code = key + '(' + split.join(',') + ');';
                break;

            default:

                // 过滤器（辅助方法）
                // {{value | filterA:'abcd' | filterB}}
                // >>> $helpers.filterB($helpers.filterA(value, 'abcd'))
                // TODO: {{ddd||aaa}} 不包含空格
                if (/^\s*\|\s*[\w\$]/.test(args)) {

                    var escape = true;

                    // {{#value | link}}
                    if (code.indexOf('#') === 0) {
                        code = code.substr(1);
                        escape = false;
                    }

                    var i = 0;
                    var array = code.split('|');
                    var len = array.length;
                    var val = array[i++];

                    for (; i < len; i ++) {
                        val = filtered(val, array[i]);
                    }

                    code = (escape ? '=' : '=#') + val;

                    // 即将弃用 {{helperName value}}
                } else if (template.helpers[key]) {

                    code = '=#' + key + '(' + split.join(',') + ');';

                    // 内容直接输出 {{value}}
                } else {

                    code = '=' + code;
                }

                break;
        }


        return code;
    };



// RequireJS && SeaJS
    if (typeof define === 'function') {
        define(function() {
            return template;
        });

// NodeJS
    } else if (typeof exports !== 'undefined') {
        module.exports = template;
    } else {
        this.template = template;
    }

})();
