/*
---
name: env
requires: adam
...
*/

var window = require('../core/adam').global;

var document = window.document;

var head = document.documentElement || document.getElementsByTagName[0];

var adapter = {
	trident: 'ie',
	crios: 'chrome'
};

var parse = function(ua, platform){
	ua = (ua || navigator.userAgent).toLowerCase();
	platform = (platform || navigator.platform).toLowerCase();

	var match = ua.match(/(opera|ie|firefox|chrome|trident|crios|version)[\s\/:]([\w\d\.]+)?.*?(safari|(?:rv[\s\/:]|version[\s\/:])([\w\d\.]+)|$)/) || [null, 'unknown', 0],
		name = adapter[match[1]] || match[1],
		mode = name === 'ie' && document.documentMode;

	return {
		extend: Function.prototype.extend,

		browser: (name === 'version') ? match[3] : name,

		version: mode || parseFloat((match[1].match(/(trident|opera)/) && match[4]) ? match[4] : match[2]),

		engine: (ua.match(/(trident|gecko|webkit|presto)/) || [name === 'ie' && 'trident' || 'unknown'])[0],

		platform: ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || ['unknown'])[0]
	};
};

var env = parse();

env[env.browser] = true;
env[env.browser + parseInt(env.version, 10)] = true;
env[env.platform] = true;
env[env.engine] = true;

env.parse = parse;

env.exec = function(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.text = text;
		head.appendChild(script);
		head.removeChild(script);
	}
	return text;
};

module.exports = env;