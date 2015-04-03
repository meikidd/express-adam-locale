/*
---
name: adam
...
*/

(function(global, undefined){

	'use strict';

	var root,

		// Configure whether for debug mode
		debug = false,

		// Configure whether for silent mode
		silent = true,
		
		// A global GUID counter for objects
		uid = 1,
			
		// Enumerables flag
		enumerables = true,

		// [[Class]] -> type pairs
		class2type = {},

		// Save a reference to {}.toString method
		toString = class2type.toString,

		// Pre-detect whether has module and module.export
		hasExports = typeof module !== 'undefined' && module.exports,

		// Pre-detect are run in a plain global object
		hasGlobalObject = this === global,

		// Local Adam object
		local;

	// Extended Function object, including overloading, implement, extend and other methods
	for (var i in {toString: 1}) enumerables = null;
	if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];

	Function.prototype.overloadSetter = function(usePlural){
		var self = this;
		return function(a, b){
			if (a == null) return this;
			if (usePlural || typeof a !== 'string'){
				for (var k in a) self.call(this, k, a[k]);
				if (enumerables) for (var i = enumerables.length; i--;){
					k = enumerables[i];
					if (a.hasOwnProperty(k)) self.call(this, k, a[k]);
				}
			} else {
				self.call(this, a, b);
			}
			return this;
		};
	};

	Function.prototype.implement = function(key, value){
		this.prototype[key] = value;
	}.overloadSetter();

	Function.implement({

		extend: function(key, value){
			this[key] = value;
		}.overloadSetter(),

		overloadGetter: function(usePlural){
			var self = this;
			return function(a){
				var args, result;
				if (typeof a !== 'string') args = a;
				else if (arguments.length > 1) args = arguments;
				else if (usePlural) args = [a];
				if (args){
					result = {};
					for (var i = 0; i < args.length; i++) result[args[i]] = self.call(this, args[i]);
				} else {
					result = self.call(this, a);
				}
				return result;
			};
		},

		traversalSetter: function(usePlural){
			var self = this;
			return function(a, b, c){
				if (a == null || b == null) return a || this;
				if (!a.length && !a.nodeType) a = [a];
				for (var i = 0, l = a.length; i < l; i++){
					if (usePlural || typeof b !== 'string'){
						for (var k in b) self.call(this, a[i], k, b[k]);
					} else {
						self.call(this, a[i], b, c);
					}
				}
				return a.length ? a : a[0];
			};
		}

	});

	var rfilepath = /^\.*\/?(.*?)(\.*(js|css|node|$))/;
	var rcamelcase = /^[a-z]?/;
	var rmeta = /\.+/g;

	local = function(name, factory){
		factory = factory || name;
		if (typeof name !== 'string') name = '';

		if (typeof define === 'function' && (define.amd || define.cmd)){
			define(factory);
		} else if (typeof exports !== 'undefined'){
			var results = factory(require, exports, module);
			if (typeof results === 'undefined') return;
			if (hasExports) exports = module.exports = results;
			if (name) exports[name.substring(name.lastIndexOf('.') + 1)] = results;
		} else {
			var namespaces = name.split('.');
			var scope = root;
			var module = {};
			var require = function(idx){
				idx = idx.replace(rfilepath, '$1').replace(rmeta, '/').split('/');

				var stack, id;

				for (var i = 0, l = idx.length; i < l; i++){
					id = idx[i];
					if (root[id]) stack = root[id];
					else if (stack && stack[id]) stack = stack[id];
				}

				if (!stack) stack = root[id.replace(rcamelcase, function(match){
					return match.toUpperCase();
				})];

				return stack || root;
			};

			for (var i = 0, l = namespaces.length - 1; i <= l; i++){
				var packageName = namespaces[i];
				var result = i < l ? {} : factory(require, module.exports = {}, module);
				if (typeof scope[packageName] === 'undefined'){
					scope[packageName] = result || module.exports;
				}
				scope = scope[packageName];
			}
	    }
	};

	local.extend({

		global: global,

		version: '0.0.4',

		noop: function(){},

		type: function(item){
			if (item == null) return String(item);
			return typeof item === 'object' || typeof item === 'function' ?
				class2type[toString.call(item)] || typeOfNode(item) || 'object' :
				typeof item;
		},

		log: function(){
			if (debug && global['console'] !== undefined && console.log){
				 console.log.apply(console, arguments);
			}
		},

		warn: function(){
	        if (!silent && global['console'] !== undefined && console.warn){
	            console.warn.apply(console, arguments);
	            if (debug && console.trace) console.trace();
	        }
		},

		error: function(msg, e){
			if (debug) throw new (e || Error)(msg);
		},

		uidOf: function(item){
			return item.uniqueNumber || (item.uniqueNumber = uid++);
		},

		isEnumerable: function(item){
			return (item != null && typeof item !== 'string' && typeof item.length === 'number' && toString.call(item) !== '[object Function]');
		}
		
	});

	'Boolean,Number,String,Function,Array,Date,RegExp,Object,Error,Arguments,Window'.replace(/[^,]+/g, function(name){
		class2type["[object " + name + "]"] = name.toLowerCase();
	});

	(function(){
		var args = arguments;

		var extend = function(name, method){
			if (this[name] == null) this[name] = method;
		}.overloadSetter();

		var implement = function(name, method){
			if (this.prototype[name] == null) this.prototype[name] = method;
		}.overloadSetter();

		for (var i = 0, l = args.length, object; i < l; i++){
			object = args[i];
			object.extend = extend;
			object.implement = implement;
		}
	})(Array, String, Function, Date, Object, local);	

	function typeOfNode(item){
		if (item === item.window) return 'window';

		if (item.nodeName){
			if (item.nodeType === 1) return 'element';
			if (item.nodeType === 9) return 'document';
			if (item.nodeType === 3) return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
		} else if (typeof item.length === 'number'){
			if ('callee' in item) return 'arguments';
			if ('item' in item) return 'collection';
		} 
	}

	// Export the adam object for **Node.js**, 
	// with backwards-compatibility for the old `require()` API. 
	// If we're in the browser, add `adam` as a global object.
	if (hasExports) exports = module.exports = local;
	if (!hasGlobalObject) global['adam'] = local;
	if (!this['adam']) this['adam'] = local;

	root = this.adam || global;

}).call(/*<CommonJS>*/typeof exports !== 'undefined' ? exports : /*</CommonJS>*/this, this);