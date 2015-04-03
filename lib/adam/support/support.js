/*
---
name: support
requires: [adam, capitalize]
...
*/

var global = require('../core/adam').global;
var mout = require('../mout/string');

var document = global.document || {};
var prefixes = ['webkit', 'moz', 'ms', 'o'];

// Basic Object detection
var support = {
	extend: Function.prototype.extend,
	air: !!(global.runtime),
	xpath: !!(document.evaluate),
	query: !!(document.querySelector),
	plugins: {}
};

// Flash detection
var version = (Function.attempt(function(){
	return navigator.plugins['Shockwave Flash'].description;
}, function(){
	return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
}) || '0 r0').match(/\d+/g);

support.plugins.Flash = {
	version: Number(version[0] || '0.' + version[1]) || 0,
	build: Number(version[2]) || 0
};

// Property prefix detection.
support.property = function(object, property){
	if (typeof object[property] !== 'undefined') return property;

	property = mout.capitalize(property);
	for (var i = 0, l = prefixes.length, hook; i < l; i++){
		hook = prefixes[i] + property;
		if (typeof object[hook] !== 'undefined') return hook;
	}
	return false;
};

module.exports = support;
