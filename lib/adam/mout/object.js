/*
---
name: mout.object
provides: [merge, dict, pick, omit, values, keyOf]
requires: [adam, Array, mout, clone]
...
*/

var local = require('../core/adam');

var clone = require('../mout/collection').clone;

var hasOwnProperty = Object.prototype.hasOwnProperty;

function mergeOf(source, key, current){
	switch (local.type(current)){
		case 'object':
			if (local.type(source[key]) === 'object') merge(source[key], current);
			else source[key] = clone(current);
		break;
		case 'array': source[key] = clone(current); break;
		default: source[key] = current;
	}
	return source;
}

function merge(source, k, v){
	if (typeof k === 'string') return mergeOf(source, k, v);
	for (var i = 1, l = arguments.length; i < l; i++){
		var object = arguments[i];
		for (var key in object) mergeOf(source, key, object[key]);
	}
	return source;
}

module.exports = {

	merge: merge,

	dict: function(item, value){
		var type = local.type(item), result = {};
		if (type === 'object') return item;
		if (type === 'string') item = item.split(/[, ]+/);
		value = value == null ? 1 : value;
		Array.from(item).forEach(function(item){
			result[item] = value;
		});
		return result;
	},

	pick: function(object){
		var results = {},
			keys = this.flatten(arguments).slice(1);
		for (var i = 0, l = keys.length; i < l; i++){
			var k = keys[i];
			if (k in object) results[k] = object[k];
		}
		return results;
	},

	omit: function(object){
		var keys = [],
			args = this.flatten(arguments).slice(1);
		for (var key in object){
			if (hasOwnProperty.call(object, key) && args.indexOf(key) === -1) keys.push(key);
		}
		return this.pick(object, keys);
	},

	values: function(object){
		var values = [];
		for (var key in object){
			if (hasOwnProperty.call(object, key)) values.push(object[key]);
		}
		return values;
	},

	keyOf: function(object, value){
		for (var key in object){
			if (hasOwnProperty.call(object, key) && object[key] === value) return key;
		}
		return null;
	}

};