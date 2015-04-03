/*
---
name: env.mobile
requires: env
...
*/

var env = require('./env');

var UA = navigator.userAgent.toLowerCase();

var expose = function(property){
	if (property !== 'unknown') env[property] = true;
};

// ENV.online
env.online = navigator.onLine;

// TODO 目前主流浏览器没有实现navigator.connection
// 暂时不支持直接判断wifi/2g/3g网络类型
// 改为使用network模块的网络测速来判断网络好坏。


// ENV.isHybrid
var isHybrid = function() {
	return /AliApp\((.+)?\/[\d\.]+\)/igm.test(navigator.userAgent);
};
env.isHybrid = isHybrid();

// ENV.locale
var probe = navigator.userLanguage || navigator.language || 'unknown';
env.locale = probe.toLowerCase();
expose(env.locale);


// ENV.orientation
var detectOrientation = function(){
	var orientation = 'portrait';

	if (typeof window.orientation === 'number'){
		if (window.orientation === 90 || window.orientation === -90) orientation = 'landscape';
	} else {
		if (window.matchMedia('(orientation: portrait)').matches) orientation = 'portrait';
		else if (window.matchMedia('(orientation: landscape)').matches) orientation = 'landscape';
	}
	env.orientation = orientation;	
};
detectOrientation();


// ENV.device
var width = env.orientation === 'portrait' ? window.screen.width : window.screen.height;
var device = /windows\s(?!phone)|macintosh/.test(UA) ? 'pc' :
	width < 640 ? 'mobile' : 
	width >= 640 ? 'tablet' : 
	'unknown';
env.device = device;
expose(device);


// ENV.platform
var OS = [
	["blackberry", /(\bBB[0-9]|PlayBook|blackberry|BlackBerry)/],
	["winphone", /windows phone (?:os )?([0-9.]+)/i],
	["symbian", /symbianos\/([0-9.]+)/i],
	["yunos", /aliyunos ([0-9.]+)/i],
	["chromeos", /cros i686 ([0-9.]+)/i]
];

// ENV.browser
var BROWSER = [
	// 需要在androidbrowser之前
	["ucbrowser", /\bucbrowser\/([0-9.]+)/i],
	// Android 默认浏览器。该规则需要在 safari 之前。
	["androidbrowser", /\bandroid\b.*version\/([0-9.]+(?: beta)?)/i],
	["opera-mini", / (?:opios)\/([0-9.]+)/i],
	["blackberry", /(\bBB[0-9]|PlayBook|blackberry|BlackBerry)/]
];

// ENV.company
var COMPANY = [
    ["apple", /\bmac os x ([0-9._]+)/i],
    ["apple", /\bcpu(?: iphone)? os ([0-9._]+)/i],
    ['samsung', /(samsung|GT-I9|SHV-E|SGH-T|SGH-I|SGH-N|SCH-R5|SCH-I5|SPH-L7)/i],
	['LG', /\bLG/],
	['nokia', /\bnokia/i],
	['nokia', /SymbianOS\/([0-9.]+)/],
	['motorola', /\b(milestone|droid|xoom)\b/i],
	['blackberry', /(\bBB[0-9]|PlayBook|blackberry|BlackBerry)/],
	['HTC', /\bHTC[\b-_]?/]
];

// 解析ua，检测platform, browser, company
var detectUA = function(key, ua, patterns){
	var env = {};

	if (key === 'company') env.company = 'unknown';

	for (var i = 0; i < patterns.length; i++){
		var p = patterns[i];
		var expr = p[1];
		if (expr.test(ua)){
			env[key] = p[0];
			var m = expr.exec(ua);
			if (m){
				if (m.length >= 2 && m[1]){
					var ver = m[1].replace(/_/g, ".");
					env[key + 'Version'] = parseFloat(ver) || '-1';
				}
			}
		}
	}

	return env;
};

var parseUA = env.parse;
var detect = function(ua){
	var result = parseUA(ua);
	result.extend(detectUA('platform', ua, OS));
	result.extend(detectUA('company', ua, COMPANY));
	result.extend(detectUA('browser', ua, BROWSER));
	if (result.browserVersion){
		result.version = result.browserVersion;
		delete result.browserVersion;
	}
	return result;
};

env.parse = detect;
env.extend(detect(navigator.userAgent));

if (window.addEventListener) window.addEventListener('orientationchange', detectOrientation);

module.exports = env;
