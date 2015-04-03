/*
---
name: mout.array
provides: [last, append, insert, empty, combine, flatten, range, unique, union, without, shuffle, sortBy, groupBy, countBy]
requires: [adam, Array, mout]
...
*/

var local = require('../core/adam');

var rlikeArray = /^(array|arguments|collection)$/;

var makeIterator = function(fn, bind){
	if (fn == null) return function(obj){
		return obj;
	};

	switch (typeof fn){
		case 'function':
			return typeof bind === 'undefined' ? fn : function(item, index, object){
				return fn.call(bind, item, index, object);
			};
		case 'string':
		case 'number':
			return function(obj){
				return obj[fn];
			};
	}
};

module.exports = {

	/**
	 * Returns the last item from the array.
	 * @return {Mixed} The last item in this array. If this array is empty, returns null.
	 */
	last: function(array){
		return (array.length) ? array[array.length - 1] : null;
	},

	/**
	 * Appends the passed array to the end of the current array.
	 * @param  {Array} The array containing values you wish to append.
	 * @return {Array} The original array including the new values.
	 */
	append: function(array, items){
		array.push.apply(array, items);
		return array;
	},

	/**
	 * Pushes the passed element into the array if it's not already present (case and type sensitive).
	 * @param  {Object} The item that should be added to this array.
	 * @return {Array} This array with the new item included.
	 */
	insert: function(array, item){
		if (!~array.indexOf(item)) array.push(item);
		return array;
	},

	/**
	 * Empties an array.
	 * @return {Array} This array, emptied.
	 */
	empty: function(array){
		array.length = 0;
		return array;
	},

    /**
     * Combines an array with all the items of another.
     * Does not allow duplicates and is case and type sensitive.
     */
	combine: function(array, items){
		for (var i = 0, l = items.length; i < l; i++) this.insert(array, items[i]);
		return array;
	},

	/**
	 * Flattens a multidimensional array into a single array.
	 * @return {Array} A new flat array.
	 */
	flatten: function(array){
		var result = [];
		for (var i = 0, l = array.length; i < l; i++){
			var item = array[i];
			if (item == null) continue;
			result = result.concat((rlikeArray.test(local.type(item)) || item instanceof Array) ? this.flatten(item) : item);
		}
		return result;
	},

    /**
     * Returns an Array of numbers inside range.
     */
	range: function(start, stop, step){
		if (stop == null){
			stop = start || 0;
			start = 0;
		}
		step = step || 1;

		var result = [],
			i = start;

		while (i < stop){
			result.push(i);
			i += step;
		}

		return result;
	},

    /**
     * @return {array} Array of unique items
     */
	unique: function(array){
		return this.combine([], array);
	},

    /**
     * Concat multiple arrays and remove duplicates.
     */
	union: function(){
		var result = [];
		Array.from(arguments).forEach(function(item){
			this.combine(result, item);
		}, this);
		return result;
	},

	without: function(array){
		var items = Array.slice(arguments, 1);
		return array.filter(function(item){
			return items.indexOf(item) === -1;
		});
	},

    /**
     * Shuffle array items.
     */
	shuffle: function(array){
		for (var i = array.length; i && --i;){
			var item = array[i], r = Math.floor(Math.random() * (i + 1));
			array[i] = array[r];
			array[r] = item;
		}
		return array;
	},

    /**
     * Sort array by the result of the callback.
     */
	sortBy: function(array, fn, bind){
		var iterator = makeIterator(fn, bind);
        return array.sort(function(a, b){
            a = iterator(a);
            b = iterator(b);
            return (a < b) ? -1 : ((a > b) ? 1 : 0);
        });
	},

    /**
     * Bucket the array values.
     */
	groupBy: function(array, fn, bind){
		var results = {};
		var iterator = makeIterator(fn, bind);
		array.forEach(function(item){
			var result = iterator(item);
			if (!(result in results)) results[result] = [];

			results[result].push(item);
		});

		return results;
	},

    /**
     * Count the array values.
     */
	countBy: function(array, fn, bind){
		var results = {};
		var iterator = makeIterator(fn, bind);
		array.forEach(function(item){
			var result = iterator(item);
			if (!(result in results)) results[result] = 0;

			results[result]++;
		});

		return results;
	}

};