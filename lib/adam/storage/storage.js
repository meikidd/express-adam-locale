/*
---
name: Storage
requires: [adam, Base, Array, JSON, append, flatten, merge, dom.manipulation]
...
*/

var window = require('../core/adam').global;

var Base = require('../class/base');

var mout = require('../mout/array');
var merge = require('../mout/object').merge;
var dom = require('../dom/manipulation');

var localStorageName = 'localStorage';

var Storage = Base.extend({

	options: {/*
		onStorage: function(data){}*/
		type: 'local'
	},

	hooks: {
		session: 'sessionStorage',
		local: localStorageName
	},

	initialize: function(options){
		this.setOptions(options);

		var win = window,
			area = this.name = this.hooks[this.options.type];

		if (area in win && win[area]) this.storage = win[area];
		else throw new Error('There are currently no available storage.');
	},

	set: function(key, value){
		if (typeof value === 'undefined') return this.remove(key);
		if (typeof value === 'function') value = value.call(this, this.get(key), key);

		if (!this.equal(key, value)){
			var origin = this.get(key);
			this.storage.setItem(key, JSON.stringify(value));
			this.stored(key, origin);
		}
		return this;
	}.overloadSetter(),

	get: function(key, dflt){
		var result = this.deserialize(this.storage.getItem(key));
		return result == null ? dflt : result;
	},

	remove: function(){
		Array.from(arguments).forEach(function(key){
			var origin = this.get(key);
			if (origin === void 0) return;
			this.storage.removeItem(key);
			this.stored(key, origin);
		}, this);
		return this;
	},

	clear: function(){
		var storage = this.storage, len = this.size();
		if (!len) return this;
		if (storage.clear) storage.clear();
		else for (i = 0; i < len; i++) storage.removeItem(storage.key(i));
		return this.stored();
	},

	all: function(){
		var result = {}, storage = this.storage;
		for (var i = 0, l = this.size(), key; i < l; i++){
			key = storage.key(i);
			result[key] = this.get(key);
		}
		return result;
	},

	size: function(){
		return this.storage.length;
	},

	stored: function(key, value){
		/*<ltIE8>*/
		this.saved && this.saved();
		/*</ltIE8>*/
		this.emit('storage', {
			key: key,
			oldValue: value,
			newValue: key && this.get(key),
			url: location.href,
			storageArea: this.name
		});
		return this;
	},

	equal: function(key, value){
		return this.get(key) === value;
	},

	invert: function(key){
		return this.set(key, !this.get(key));
	},

	sum: function(key, num){
		return this.set(key, this.get(key) + parseInt(num, 10));
	},

	increase: function(key, num){
		return this.sum(key, num || 1);
	},

	decrease: function(key, num){
		return this.sum(key, -(num || 1));
	},

	concat: function(key, value){
		return this.set(key, this.get(key) + value);
	},

	push: function(key){
		var args = Array.slice(arguments, 1);
		return this.set(key, mout.append(this.get(key, []), args));
	},

	merge: function(key, k, v){
		return this.set(key, merge(this.get(key, {}), k, v));
	},

	erase: function(key){
		var object = this.get(key, {});
		mout.flatten(arguments).slice(1).forEach(function(name){
			delete object[name];
		});
		return this.set(key, object);
	},

	deserialize: function(value){
		if (typeof value !== 'string') return;
		try { return JSON.parse(value); }
		catch(e) { return value || null; }
	}

});

/*<ltIE8>*/
var document = window.document;
var supportLocalStorage = localStorageName in window && window[localStorageName];

if (!supportLocalStorage && document.documentElement.addBehavior){

	// In IE7, keys cannot start with a digit or contain certain chars.
	var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g");
	function fixKey(key) {
		return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___');
	}

	Storage.implement({

		initialize: function(options){
			this.setOptions(options);

			var type = this.options.type;
			this.name = this.hooks[type];

            var storage = this.storage = document.body.appendChild(document.createElement('div'));
            storage.style.display = 'none';
            // See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
            // and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
            storage.addBehavior('#default#userData');
            storage.load(this.name);

            // clear session storage & gc.
            var clean = function(){
            	if (type === 'session') this.clear();
            	document.body.removeChild(storage);
               	dom.removeListener(window, 'unload', clean);
            }.bind(this);
            dom.addListener(window, 'unload', clean);
		},

		get: function(key, dflt){
			this.storage.load(this.name);
			var result = this.deserialize(this.storage.getAtribute(fixKey(key)));
			return result == null ? dflt : result;
		},

		set: function(key, value){
			if (typeof value === 'undefined') return this.remove(key);
			if (typeof value === 'function') value = value.call(this, this.get(key), key);

			if (!this.equal(key, value)){
				var origin = this.get(key);
				this.storage.setAttribute(fixKey(key), JSON.stringify(value));
				this.stored(key, origin);
			}
			return this;
		}.overloadSetter(),

		remove: function(){
			Array.from(arguments).forEach(function(key){
				var origin = this.get(key);
				if (origin === void 0) return;
				this.storage.removeAttribute(fix(key));
				this.stored(key, origin);
			}, this);
			return this;
		},

		clear: function(){
			var storage = this.storage, 
				attributes = storage.XMLDocument.documentElement.attributes,
				len = attributes.length;
			if (!len) return this;	
			for (var i = 0; i < len; i++) storage.removeAttribute(attributes[i].name);
			return this.stored();
		},

		all: function(){
			var result = {}, items = this.storage.XMLDocument.documentElement.attributes;
			for (var i = 0, item; items[i]; i++) result[item.name] = this.get(item.name);
			return result;
		},

		size: function(){
			return this.storage.XMLDocument.documentElement.attributes.length;
		},

		saved: function(){
			this.storage.save(this.name);
		}

	});

}
/*</ltIE8>*/

module.exports = Storage;