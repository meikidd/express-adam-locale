/*
---
name: mout.color
provides: [hexToRgb, rgbToHex]
requires: Array
...
*/


module.exports = {

	/**
	 * Converts an hexadecimal color value to RGB. Input array must be the 
	 * following hexadecimal color format.
	 * @param  {Array|String} An hexadecimal color value.
	 * @param  {Boolean} If true is passed, will output an array (e.g. [255, 51, 0]) 
	 *			instead of a string (e.g. "rgb(255, 51, 0)"). 
	 * @return {Array|String} If the array flag is set, an array will be returned 
	 *			instead, or a string representing the color in RGB. 
	 */
	hexToRgb: function(item, array){
		var hex;

		if (typeof item === 'string'){
			hex = item.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
			hex && hex.shift();
		} else {
			hex = item;
		}

		if (!hex || !Array.isArray(hex) || hex.length !== 3) return null;
		var rgb = hex.map(function(value){
			if (value.length == 1) value += value;
			return parseInt(value, 16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},

	/**
	 * Converts an RGB color value to hexadecimal. Input array must be in 
	 * one of the following RGB color formats. [255, 255, 255], or [255, 255, 255, 1]
	 * @param  {Array|String} An RGB color value.
	 * @param  {Boolean} If true is passed, will output an array (e.g. 
	 *			['ff', '33', '00']) instead of a string (e.g. '#ff3300').
	 * @return {Array|String} If the array flag is set, an array will be returned instead.
	 *			A string representing the color in hexadecimal, or 'transparent' string if 
	 *			the fourth value of rgba in the input array is 0 (rgba).
	 */
	rgbToHex: function(item, array){
		var rgb = typeof item === 'string' ? item.match(/\d{1,3}/g) : item;

		if (!rgb || !Array.isArray(rgb) || rgb.length < 3) return null;
		if (rgb.length === 4 && rgb[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (rgb[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

};