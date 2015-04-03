/*
---
name: mout.querystring
provides: [encode, decode, parse, getQuery, getParam, setParam, hasParam, cleanParam]
requires: [adam, Array, each, typecast]
...
*/

var local = require('../core/adam');

var typecast = require('../mout/types').typecast,
	each = require('../mout/collection').each;

var toQueryString = function(object, base){
	var queryString = [];

	each(object, function(value, key){
		if (base) key = base + '[' + key + ']';
		var result;
		switch (local.type(value)){
			case 'object': result = toQueryString(value, key); break;
			case 'array':
				var qs = {};
				value.forEach(function(val, i){
					qs[i] = val;
				});
				result = toQueryString(qs, key);
			break;
			default: result = key + '=' + encodeURIComponent(value);
		}
		if (value != null) queryString.push(result);
	});

	return queryString.join('&');
};

module.exports = {

    /**
     * Encode object into a query string.
     */
	encode: toQueryString,

    /**
     * Decode query string into an object of keys => vals.
     */
	decode: function(string, shouldTypecast){
		var result = {}, 
			rmultikeys = /([^\]\[]+|(\B)(?=\]))/g;

		if (typeof string !== 'string') return string;

		shouldTypecast = shouldTypecast == null ? true : !!shouldTypecast;

		string = string.substring(string.indexOf('?') + 1);
		string.split('&').forEach(function(item){
			var index = item.indexOf('=') + 1,
				value = index ? decodeURIComponent(item.substr(index)) : '',
				keys = index ? item.substr(0, index - 1).match(rmultikeys) : [item],
				obj = result;

			if (!keys) return;
			if (value && shouldTypecast) value = typecast(value);

			keys.forEach(function(key, i, keys){
				var current = obj[key]; 

				if (i < keys.length - 1) obj = obj[key] = current || {};
				else if (Array.isArray(current)) current.push(value);
				else obj[key] = current != null ? [current, value] : value;
			});
		});

		return result;
	},

    /**
     * Get query string, parses and decodes it.
     */
	parse: function(url, shouldTypecast){
		return this.decode(this.getQuery(url), shouldTypecast);
	},

    /**
     * Gets full query as string with all special chars decoded.
     */
	getQuery: function(url){
        //valid chars according to: http://www.ietf.org/rfc/rfc1738.txt
        var queryString = /\?[a-zA-Z0-9\=\&\%\$\-\_\.\+\!\*\'\(\)\,]+/.exec(url.replace(/#.*/, '')); 
        return queryString ? decodeURIComponent(queryString[0]) : '';		
	},

    /**
     * Get query parameter value.
     */
	getParam: function(url, param, shouldTypecast){
        var regexp = new RegExp('(\\?|&)'+ param + '=([^&]*)'),
	        result = regexp.exec(this.getQuery(url)),
	        value = result && result[2] || null;
        return shouldTypecast == null || shouldTypecast ? typecast(value) : value;
	},

    /**
     * Set query string parameter value
     */
	setParam: function(url, name, value){
        url = url || '';

        var regexp = new RegExp('(\\?|&)'+ name +'=[^&]*');
        var param = name + '=' + encodeURIComponent(value);

        if (regexp.test(url)) return url.replace(regexp, '$1'+ param);
        if (url.indexOf('?') === -1) url += '?';
        if (url.contains('=')) url += '&';
        return url + param;
   	},

    /**
     * Checks if query string contains parameter.
     */
	hasParam: function(url, param){
        var regexp = new RegExp('(\\?|&)'+ param +'=', 'g'); //matches `?param=` or `&param=`
        return regexp.test(this.getQuery(url));
	},

	/**
	 * Clean query string invalid parameter.
	 */
	cleanParam: function(url, fn){
		var querystring = url.contains('?') ? this.getQuery(url).substr(1) : url;
		return querystring.split('&').filter(function(item){
			var index = item.indexOf('='),
				key = index < 0 ? '' : item.substr(0, index),
				value = item.substr(index + 1);

			return fn ? fn.call(null, key, value) : (value || value === 0);
		}).join('&');
	}
	
};