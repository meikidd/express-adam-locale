/*
---
name: Cache
requires: [Class, Options, Storage]
...
*/

var Class = require('../class/class'),
	Options = require('../class/options'),
	Storage = require('./storage');

var store = new Storage;

var storeKey = '_kscache';

var DATE = {
	s: 1000,
	m: 60000,
	H: 3600000, // 60 * 60 * 1000
	d: 86400000, // 24 * 60 * 60 * 1000
	E: 604800000, // 7 * 24 * 60 * 60 * 1000
	M: 2592000000, // 30 * 24 * 60 * 60 * 1000
	y: 31536000000 // 365 * 24 * 60 * 60 * 1000
};

var Cache = new Class({

	Implements: Options,

	options: {
		expires: '3M' // 3 month.
	},

	initialize: function(name, options){
		this.name = name;
		this.setOptions(options);
		this.cleanup();
		this.data = this.cache[name] = this.cache[name] || {};
	},

	hasExpired: function(key){
		var item = this.data[key];
		return item && parseInt(item.expire, 10) < Date.now();
	},

	set: function(key, value, expire){
		if (typeof value === 'undefined') return this.remove(key);

		var now = Date.now();
		if (expire instanceof Date && expire.getTime() < now) expire = null;
		expire = expire || this.options.expires;

		if (typeof expire === 'string'){
			var match = expire.match(/^(\d{1,5})\s*(s|m|H|d|E|M|y)$/);
			if (match){
				var num = match[1], unit = match[2];
				var delta = num * DATE[unit];
				expire = new Date(now + delta);
			}
		} 

		this.data[key] = {
			expire: +expire,
			value: value
		};

		store.set(storeKey, this.cache);
	},

	get: function(key, dflt){
		if (this.hasExpired(key)){
			this.remove(key);
			return dflt;
		}

		var item = this.data[key],
			value = item && item.value;
		return value == null ? dflt : value;
	},

	remove: function(key){
		delete this.data[key];
		store.set(storeKey, this.cache);
	},

	clear: function(){
		this.data = {};
		store.erase(storeKey, this.name);
	},

	cleanup: function(){
		var cache = store.get(storeKey, {}), item;
		for (var i in cache){
			item = cache[i];
			for (var k in item){
				if (this.hasExpired(k)) delete item[k];
			}
		}

		store.set(storeKey, cache);
		this.cache = cache;
	}

});

module.exports = Cache;
