/*
---
name: mout.collection
provides: [clone, each, map, find, filter, some, every, reduce, erase, invoke, pluck, min, max, contains, compact, size]
requires: [adam, Array, Object, mout, values]
...
*/

var local = require('../core/adam');

var cloneOf = function(item){
	switch (local.type(item)){
		case 'array': return cloneArray(item);
		case 'object': return cloneObject(item);
		default: return item;
	}
};

var cloneArray = function(array){
	var i = array.length, clone = new Array(i);
	while (i--) clone[i] = cloneOf(array[i]);
	return clone;
};

var cloneObject = function(object){
	var clone = {};
	for (var key in object) clone[key] = cloneOf(object[key]);
	return clone;
};
// Expose clone{function} before mout/object.js been required.
// To avoid infinite require loop.
exports.clone = cloneOf;

var mout = require('../mout/object');
var hasOwnProperty = Object.prototype.hasOwnProperty;

var isObject = function(item){
	return item.length !== +item.length;
};

var castOf = function(item){
	return isObject(item) ? mout.values(item) : Array.from(item);
};

module.exports = {

    /**
     * Collection clone.
     */
	clone: cloneOf,

    /**
     * Collection each.
     */
	each: function(object, fn, bind){
		if (object != null){
			if (isObject(object)){
				for (var key in object){
					if (hasOwnProperty.call(object, key)) fn.call(bind, object[key], key, object);
				}
			} else {
				for (var i = 0, l = object.length; i < l; i++){
					if (i in object) fn.call(bind, object[i], i, object);
				}
			}
		}
		return object;
	},

    /**
     * Collection map.
     */
	map: function(object, fn, bind){
		if (object == null) return [];

		if (isObject(object)){
			var results = {};
			for (var key in object){
				if (hasOwnProperty.call(object, key)) results[key] = fn.call(bind, object[key], key, object);
			}
			return results;
		}

		return Array.from(object).map(fn, bind);
	},

    /**
     * Returns first item that matches criteria.
     */
	find: function(object, fn, bind){
		if (object != null){
			if (isObject(object)){
				for (var key in object){
					var value = object[key];
					if (hasOwnProperty.call(object, key) && fn.call(bind, value, key, object)) return value;
				}
			} else {
				return Array.from(object).find(fn, bind);
			}
		}
	},

    /**
     * Collection filter.
     */
	filter: function(object, fn, bind){
		if (object == null) return [];

		if (isObject(object)){
			var results = {};
			for (var key in object){
				var value = object[key];
				if (hasOwnProperty.call(object, key) && fn.call(bind, value, key, object)) results[key] = value;
			}
			return results;
		}

		return Array.from(object).filter(fn, bind);
	},

    /**
     * Collection some.
     */
	some: function(object, fn, bind){
		if (object == null) return false;

		if (isObject(object)){
			for (var key in object){
				if (hasOwnProperty.call(object, key) && fn.call(bind, object[key], key)) return true;
			}
			return false;
		}

		return Array.from(object).some(fn, bind);
	},

    /**
     * Collection every.
     */
	every: function(object, fn, bind){
		if (object == null) return true;

		if (isObject(object)){
			for (var key in object){
				if (hasOwnProperty.call(object, key) && !fn.call(bind, object[key], key)) return false;
			}
			return true;
		}

		return Array.from(object).every(fn, bind);
	},

    /**
     * Collection reduce.
     */
	reduce: function(object, fn, initialValue){
		if (object == null) return initialValue;

		if (isObject(object)){
			for (var key in object){
				var value = object[key];
				if (hasOwnProperty.call(object, key)) initialValue = initialValue === void 0 ? value : fn.call(null, initialValue, value, key, object);
			}
			return initialValue;
		}

		var args = Array.slice(arguments, 1);
		return [].reduce.apply(Array.from(object), args);
	},

	/**
	 * Removes all occurrences of an item from the array.
	 * @param  {Object} The item to search for in the array.
	 * @return {Array} This array with all occurrences of the item removed.
	 */
	erase: function(object, item){
		if (object != null){
			if (isObject(object)){
				for (var key in object){
					if (hasOwnProperty.call(object, key) && object[key] === item) delete object[key];
				}
			} else {
				for (var i = object.length; i--;){
					if (object[i] === item) object.splice(i, 1);
				}
			}
		}
		return object;
	},

	/**
	 * Returns an array with the named method applied to the array's contents.
	 * @param  {String} The method to apply to each item in the array.
	 * @param  {Mixed} Any number of arguments to pass to the named method.
	 * @return {Array} A new array containing the results of the applied method.
	 */
	invoke: function(obj, method){
		var args = Array.slice(arguments, 2);
		return this.map(obj, function(item){
			return item[method].apply(item, args);
		});
	},

    /**
     * Extract a list of property values.
     */
	pluck: function(obj, property){
		return this.map(obj, function(item){
			return item[property];
		});
	},

    /**
     * Return minimum value inside collection.
     */
	min: function(obj, fn, bind){
		if (obj == null) return obj;

		var items = castOf(obj);
		if (!fn) return Math.min.apply(null, items);

		var result,
			value,
			compare = Infinity,
			temp,
			i = -1,
			l = items.length;

		while (++i < l){
			value = items[i];
			temp = fn.call(bind, value, i, items);
			if (temp < compare){
				compare = temp;
				result = value;
			}
		}

		return result;
	},

    /**
     * Return maximum value inside collection.
     */
	max: function(obj, fn, bind){
		if (obj == null) return obj;

		var items = castOf(obj);
		if (!fn) return Math.max.apply(null, items);

		var result,
			value,
			compare = -Infinity,
			temp,
			i = -1,
			l = items.length;

		while (++i < l){
			value = items[i];
			temp = fn.call(bind, value, i, items);
			if (temp > compare){
				compare = temp;
				result = value;
			}
		}

		return result;
	},

	/**
	 * Tests an array for the presence of an item.
	 * @param  {Object} The item to search for in the array.
	 * @param  {Number} The index of the array at which to begin the search.
	 * @return {Boolean} If the array contains the item specified, returns true. Otherwise, returns false.
	 */
	contains: function(obj, item, from){
		if (obj == null) return false;
		return castOf(obj).indexOf(item, from) !== -1;
	},

	/**
	 * Creates a new array with all of the elements of the array which are
	 * defined (i.e. not null or undefined).
	 * @return {Array} The new filtered array.
	 */
	compact: function(obj){
		return this.filter(obj, function(item){
			return item != null;
		});
	},

    /**
     * Get object size
     */
	size: function(obj){
		if (obj == null) return 0;
		return isObject(obj) ? Object.keys(obj).length : obj.length;
	}

};