/*
---
name: mout.types
provides: [typecast, isWindow, isNumeric, isPlainObject, isEmptyObject, isNativeCode]
requires: [adam, Array, JSON]
...
*/

var local = require('../core/adam');

// Matching native code
var rnative = /\{\s*\[native code\]\s*\}/;

// Matching array or object types of string
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/;

var hasOwnProperty = Object.prototype.hasOwnProperty;

var supportJSON = typeof JSON !== 'undefined';

module.exports = {

    /**
     * Parses string and convert it into a native value.
     */
	typecast: function(item){
		if (item == null) return item;
		if (typeof item === 'string'){
			return item === 'null' ? null : 
				item === 'undefined' ? undefined :
				item === 'true' ? true : 
				item === 'false' ? false :
				+item + '' === item ? +item :
				rbrace.test(item) && supportJSON ? JSON.parse(item) :
				item;
		}
	},

	isWindow: function(item){
		return item != null && item == item.window;
	},

	isNumeric: function(item){
		return !isNaN(parseFloat(item)) && isFinite(item);
	},

	/**
	 * Checks if the value is created by the `Object` constructor.
	 */
	isPlainObject: function(item){
		if (!item || local.type(item) !== 'object' || item.nodeType || this.isWindow(item)) return false;
		try {
			if (item.constructor && !hasOwnProperty.call(item.constructor.prototype, 'isPrototypeOf')) return false;
		} catch (e){
			return false;
		}
		return true;
	},

	isEmptyObject: function(obj){
		for (var i in obj) return false;
		return true;
	},

	isNativeCode: function(fn){
		return rnative.test('' + fn);
	}

};