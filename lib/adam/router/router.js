/*
---
name: router
requires: [Base, Storage, JSON, insert]
...
*/

var mout = require('../mout/array');

var Base = require('../class/base');
var Storage = require('../storage/storage');

var store = new Storage;
var storeKey = '__ksrLastPath';

var placeholder = /([:*])(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g;

function parse(pattern, options){
	var keys = options.keys = [],
		compiled = '^', index = 0, match, 
		name, regexp, segment;

	while ((match = placeholder.exec(pattern))){
		name = match[2] || match[3]; // IE[78] returns '' for unmatched groups instead of null
		regexp = match[4] || match[1] === '*' ? '.*' : 'string';
		segment = pattern.substring(index, match.index);

		var def = patterns[regexp], key = {name: name};
		if (def){
			regexp = def.pattern;
			key.format = def.format;
		}
		keys.push(key);

		compiled += quoteRegExp(segment, regexp);
		index = placeholder.lastIndex;
	}
	segment = pattern.substring(index);

	compiled += quoteRegExp(segment) + (options.strict ? options.last : '\/?') + '$';
	options.regexp = new RegExp(compiled, options.caseInsensitive ? 'i' : undefined);

	return options;
}

function parseQuery(url){
	var array = url.split('?'),
		querystring = array[1],
		query = {};

	if (querystring){
		var seg = querystring.split('&'),
			len = seg.length, i = 0, qs;

		for (; i < len; i++){
			if (!seg[i]) continue;

			qs = seg[i].split('=');
			query[decodeURIComponent(qs[0])] = decodeURIComponent(qs[1]);
		}
	}

	return {
		path: array[0],
		query: query
	};
}

function quoteRegExp(string, pattern, optional){
	var result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, '\\$&');
	if (!pattern) return result;

	var flag = optional ? '?' : '';
	return result + flag + '(' + pattern + ')';
}

var patterns = {

	date: {
		pattern: '[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])',
		format: function(value){
			return new Date(value.replace(/\-/g, '/'));
		}
	},

	string: {
		pattern: '[^\/]*'
	},

	boolean: {
		pattern: '0|1',
		format: function(value){
			return parseInt(value, 10) === 0 ? false : true;
		}
	},

	digit: {
		pattern: '\d+',
		format: function(value){
			return parseInt(value, 10);
		}
	}

};

var methods = ['get', 'post', 'put, delete'];

var Router = Base.extend({

	options: {/*
		onError: function(){}*/
	},

	initialize: function(options){
		this.setOptions(options);

		var table = {};
		methods.forEach(function(method){
			table[method] = [];
		});
		this.routingTable = table;
	},

	addRule: function(name, definition){
		patterns[name] = definition;
	},

	getRoutable: function(method){
		return this.routingTable[method.toLowerCase()];
	},

	add: function(method, path, options){
		if (path.charAt(0) !== '/') path = '/' + path;
		if (typeof options === 'function') options = {fn: options};

		if (path.length > 2 && path.charAt(path.length - 1) === '/'){
			path = path.slice(0, -1);
			options.last = '/';
		} 
		mout.insert(this.getRoutable(method), parse(path, options));
	},

	route: function(method, path, query){
		path = path.trim();

		var table = this.getRoutable(method);

		for (var i = 0, item; item = table[i++];){
			var args = path.match(item.regexp);
			if (args){
				item.path = path;
				item.params = {};
				item.query = query || {};

				var keys = item.keys,
					params = item.params;

				args.shift();

				if (keys.length){
					for (var j = 0, k = keys.length; j < k; j++){
						var key = keys[j], value = args[j] || '', result;
						if (typeof key.format === 'function'){
							result = key.format(value);
						} else {
							try {result = JSON.parse(value);}
							catch(e) {result = value;}
						}
						args[j] = params[key.name] = result;
					}
				}
				return item.fn.apply(item, args);
			}
		}

		this.emit('error');
	},

	getLastPath: function(){
		return store.get(storeKey);
	},

	setLastPath: function(path){
		store.set(storeKey, path);
	},

	navigate: function(url){
		var parsed = parseQuery(url);
		this.route('get', parsed.path, parsed.query);
	}

});

methods.forEach(function(method){
	return Router.implement(method, function(path, fn){
		this.add(method, path, fn);
	});
});

module.exports = new Router;
