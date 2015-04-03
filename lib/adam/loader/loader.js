/*
---
name: loader
requires: [adam, Array, Promise, Emitter, uid]
...
*/

var local = require('../core/adam');
var mout = require('../mout/random');
var Emitter = require('../class/emitter');

var document = local.global.document;
var head = document && document.getElementsByTagName('head')[0];

var links = {
// src : id
};

var loader = new Emitter();

loader.image = function(path, success, failure){
	var iterable = Array.from(path).map(function(item){
		return new Promise(function(resolve, reject){
			var img = new Image();
			img.onload = function(){
				loader.emit('complete').emit('success', item);
				if (typeof success === 'function') success(item);
				resolve(this);
			};
			img.onerror = img.onabort = function(e){
				loader.emit('complete').emit('failure', item);
				if (typeof failure === 'function') failure(item);
				reject(e);
			};
			img.src = item;
			loader.emit('loadstart', item);
		});
	});
	return Promise.all(iterable);
};

loader.script = document ? function(path, success, failure){
	var iterable = Array.from(path).map(function(item){
		return new Promise(function(resolve, reject){
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.async = true;
			script.onload = function(){
				loader.emit('complete').emit('success', item);
				if (typeof success === 'function') success(item);
				resolve(this);
			};
			script.onerror = script.onabort = function(e){
				loader.emit('complete').emit('failure', item);
				if (this.parentNode) this.parentNode.removeChild(this);
				if (typeof failure === 'function') failure(item);
				reject(e);
			};
			script.src = item;
			loader.emit('loadstart', item);
			document.body.appendChild(script);
		});
	});
	return Promise.all(iterable);
} : function(path, callback){
	Array.from(path).map(require);
	callback();
};

loader.style = function(path, success, failure){
	var iterable = Array.from(path).map(function(item){
		return new Promise(function(resolve, reject){
			var staleId = links[item];
			var stale = staleId ? document.getElementById(staleId) : null;
			if (stale){
				resolve(stale);
			} else {
				var link = document.createElement('link'),
					uid = mout.uid();
				links[item] = uid;
				link.id = uid;
				link.rel = 'stylesheet';
				link.type = 'text/css';
				link.media = 'all';
				link.href = item;
				link.onload = function(){
					loader.emit('complete').emit('success', item);
					if (typeof success === 'function') success(item);
					resolve(this);
				};
				link.onerror = link.onabort = function(e){
					loader.emit('complete').emit('failure', item);
					if (this.parentNode) this.parentNode.removeChild(this);
					if (typeof failure === 'function') failure(item);
					reject(e);
				};
				loader.emit('loadstart', item);
				head.appendChild(link);
			}
		});
	});
	return Promise.all(iterable);
};

module.exports = loader;