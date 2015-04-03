/*
---
name: history
requires: [adam, env, dom.manipulation, dom.ready, router, Class, Options]
...
*/

var Class = require('../class/class');
var Options = require('../class/options');

var dom = require('../dom/manipulation');
var domReady = require('../dom/ready');
var env = require('../env/env');
var router = require('./router');
var window = require('../core/adam').global;

var document = window.document;
var anchorElement = document.createElement('a');

var oldIE = env.ie6 || env.ie7;

var supportPushState = !!window.history.pushState;
var supportHashChange = !!('onhashchange' in window && !oldIE);

var History = new Class({

	Implements: Options,

	options: {
		prefix: '!',
		basepath: '/',
		html5Mode: false,
		interval: 50,
		anchor: true
	},

	initialize: function(){
		this.location = window.location;
	},

	start: function(options){
		if (History.started) throw new Error('History has already been started.');

		History.started = true;

		this.setOptions(options);

		options = this.options;

		this.prefix = '#' + options.prefix + '/';
		this.basepath = ('/' + options.basepath + '/').replace(/^\/+|\/+$/g, '/');

		anchorElement.href = this.basepath;
		this.rootpath = getAbsolutePath(anchorElement);

		var hook, polling;
		var html = '<!doctype html><html><body>@</body></html>';
		if (options.domain) html = html.replace('<body>', '<script>document.domain =' + options.domain + '</script><body>');

		var check = this.check = function(){
			if (polling && !hook) return false;

			var documentHash = this.getFragment(), hash;
			if (documentHash !== this.fragment) hash = documentHash;

			if (hook){
				var hookHash = this.getHash(hook.location);

				if (documentHash !== this.fragment){ // click page links
					var doc = hook.document;
					doc.open();
					doc.write(html);
					doc.close();
					hook.location.hash = this.prefix + hash;
				} else if (hookHash !== this.fragment){ // click backward
					this.location.hash = this.prefix + hookHash;
					hash = hookHash;
				}
			}

			if (hash !== void 0){
				this.fragment = hash;
				this.executeRouter(hash);
			}
		}.bind(this);

		this.html5Mode = supportPushState && !!options.html5Mode;		

		// popstate => Modern browsers
		// hashchange => IE8, IE9, FF3
		// poll => IE6, IE7
		// inspiration: https://github.com/browserstate/history.js/blob/master/scripts/uncompressed/history.html4.js#L272
		this.monitorMode = this.html5Mode ? 'popstate' : supportHashChange ? 'hashchange' : setInterval(check, options.interval);
		if (typeof this.monitorMode === 'string'){
			dom.addListener(window, this.monitorMode, check);	
		} else {
			// IE6 and IE7 use a iframe shared history, when the hash changes.
			domReady(function(){
				var iframe = document.createElement('iframe');
				iframe.tabIndex = -1;
				iframe.src = 'javascript:0';
				iframe.style.display = 'none';
				document.body.appendChild(iframe);
				hook = iframe.contentWindow;
				var doc = hook.document;
				doc.open();
				doc.write(html);
				doc.close();
			});
			polling = true;
		}

		this.fragment = this.getFragment();

		this.executeRouter(this.fragment || '/');
	},

	stop: function(){
		var monitor = this.monitorMode;
		if (typeof monitor === 'string') dom.removeListener(window, monitor, this.check);
		else clearInterval(monitor);
		History.started = false;
	},

	// IE6直接用location.hash取hash，可能会取少一部分内容
	// 比如 http://www.adamjs.org/#stream/xxxxx?lang=zh_c
	// ie6 => location.hash = #stream/xxxxx
	// 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
	// firefox 会对hash进行decodeURIComponent
	// 又比如 http://www.adamjs.org/#!/home/q={%22thedate%22:%2220121010~20121010%22}
	// firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
	// 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
	getHash: function(location){
		location = location || this.location;
		var url = location.href;
		var path = url.slice(url.indexOf('#'));
		var sliceIndex = path.startsWith('#/') ? 2 : path.startsWith('#!/') ? 3 : 0;
		return sliceIndex ? decodeURIComponent(path.slice(sliceIndex)) : '';
	},

	getPath: function(){
		var path = decodeURIComponent(this.location.pathname || this.location.search);
		var root = this.basepath.slice(0, -1);
		if (!path.indexOf(root)) path = path.slice(root.length);
		return path.slice(1); 
	},

	getFragment: function(fragment){
		if (fragment == null) fragment = this.html5Mode ? this.getPath() : this.getHash();
		return fragment.replace(/^[#\/]|\s+$/g, '');
	},

	executeRouter: function(hash){
		if (router && router.navigate){
			router.setLastPath(hash);
			router.navigate(hash === '/' ? hash : '/' + hash);
		}

		if (this.options.anchor) scrollToAnchor(hash.replace(/\?.*/g, ''));
	},

	updateLocation: function(hash){
		if (this.html5Mode){
			var path = this.rootpath + hash;
			window.history.pushState({path: path}, document.title, path);
			this.check();
		} else {
			this.location.hash = this.prefix + hash;
		}
	}

});

History.started = false;


function getFirstAnchor(elements){
	for (var i = 0, element; element = elements[i++];){
		if (element.nodeName === 'A') return element;
	}
}

function scrollToAnchor(selector, element){
	element = document.getElementById(selector) || getFirstAnchor(document.getElementsByName(selector));
	element ? element.scrollIntoView() : window.scrollTo(0, 0);
}

// Return whether the target this window.
// inspiration: https://github.com/quirkey/sammy/blob/master/lib/sammy.js#L219
function targetIsThisWindow(target){
	return !target || target === window.name || target === '_self' || (target === 'top' && window === window.top)
}

function getAbsolutePath(element){
	return !element.hasAttribute ? element.getAttribute('href', 4) : element.href;
}

var history = new History;

// inspiration: https://github.com/asual/jquery-address/blob/master/src/jquery.address.js
dom.addListener(document, 'click', function(event){
	var defaultPrevented = 'defaultPrevented' in event ? event['defaultPrevented'] : event.returnValue === false;
	if (defaultPrevented || event.ctrlKey || event.metaKey || event.which === 2) return;

	var target = event.target;
	while (target.nodeName !== 'A'){
		target = target.parentNode;
		if (!target || target.tagName === 'BODY') return;
	}

	if (targetIsThisWindow(target.target)){
		var prefix = history.prefix;
		var href = oldIE ? target.getAttribute('href', 2) : target.getAttribute('href') || target.getAttribute("xlink:href");
		var hash = href.replace(prefix, '').trim();

		if (href.startsWith(prefix) && hash){		
			event.preventDefault();
			history.updateLocation(hash);
		}
	}

});

module.exports = history;