/*
---
name: mout.random
provides: [rand, random, uid, guid]
requires: [Array, Date]
...
*/

var uid = Date.now();

/**
 * @constant Minimum 32-bit signed integer value (-2^31).
 */
var MIN_INT = -2147483648;

/**
 * @constant Maximum 32-bit signed integer value. (2^31 - 1)
 */
var MAX_INT = 2147483647;

var dict = '0123456789abcdef'.split('');

var hex = function(n){
	var result = '';
	while (n--) result += choice(dict);
	return result;
};

function choice(items){
	var dict = arguments.length === 1 && Array.isArray(items) ? items : arguments;
	return dict.length ? dict[this.random(0, dict.length - 1)] : null;
}

module.exports = {

	/**
	 * Returns a random element from the supplied arguments
	 * or from the array (if single argument is an array).
	*/
	choice: choice,	

    /**
     * Returns random number inside range
     */
	rand: function(min, max){
		min = min == null ? MIN_INT : min;
		max = max == null ? MAX_INT : max;
		return Math.random() * (max - min + 1) + min;
	},

	/**
	 * Returns a random integer between the two passed in values.
	 * @param  {Number} The minimum value (inclusive).
	 * @param  {Number} The maximum value (inclusive).
	 * @return {Number} A random number between min and max.
	 */
	random: function(min, max){
		return Math.floor(this.rand(min, max));
	},

	uid: function(){
		return (uid++).toString(36);
	},

	/**
	 * Returns pseudo-random guid (UUID v4)
	 */
	guid: function(){
		return [hex(8), hex(4), 4 + hex(3), this.choice(8, 9, 'a', 'b') + hex(3), hex(12)].join('-');
	}

};