/*
---
name: Array
...
*/


var local = require('../core/adam');

var slice = [].slice;

Array.extend({

	/*<!ES5>*/
	isArray: function(item){
		return local.type(item) === 'array';
	},
	/*</!ES5>*/

	/*<!ES6>*/
	from: function(item){
		if (item == null) return [];
		return local.isEnumerable(item) ? Array.isArray(item) ? item : slice.call(item) : [item];
	},
	/*</!ES6>*/

	slice: function(item, start, end){
		return slice.call(item, start, end);
	}

});

Array.implement({

	/*<!ES5>*/
	forEach: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (i in this) fn.call(bind, this[i], i, this);
		}
	},

	every: function(fn, bind){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if ((i in this) && !fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	filter: function(fn, bind){
		var item, results = [];
		for (var i = 0, l = this.length >>> 0; i < l; i++) if (i in this){
			item = this[i];
			if (fn.call(bind, item, i, this)) results.push(item);
		}
		return results;
	},

	indexOf: function(item, from){
		var len = this.length >>> 0;
		for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	map: function(fn, bind){
		var len = this.length >>> 0, results = Array(len);
		for (var i = 0; i < len; i++){
			if (i in this) results[i] = fn.call(bind, this[i], i, this);
		}
		return results;
	},

	some: function(fn, bind){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if ((i in this) && fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},

	reduce: function(fn, value){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if (i in this) value = value === void 0 ? this[i] : fn.call(null, value, this[i], i, this);
		}
		return value;
	},

	reduceRight: function(fn, value){
		var i = this.length >>> 0;
		while (i--){
			if (i in this) value = value === void 0 ? this[i] : fn.call(null, value, this[i], i, this);
		}
		return value;
	},
	/*</!ES5>*/

	/*<!ES6>*/
	find: function(fn, bind){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if ((i in this) && fn.call(bind, this[i], i, this)) return this[i];
		}
	},

	findIndex: function(fn, bind){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if ((i in this) && fn.call(bind, this[i], i, this)) return i;
		}
		return -1;
	}
	/*</!ES6>*/

});