/*
---
name: defer
requires: [adam, Array, Date]
...
*/

var global = require('../core/adam').global;

var callbacks = {
	timeout: {},
	frame: [],
	immediate: []
};

var push = function(collection, callback, context, defer){
	var iterator = function(){
		iterate(collection);
	};

	if (!collection.length) defer(iterator);

	var entry = {
		callback: callback,
		context: context
	};

	collection.push(entry);

	return function(){
		var index = collection.indexOf(entry);
		if (index > -1) collection.splice(index, 1);
	};
}

var iterate = function(collection){
	var time = Date.now();

	collection.splice(0).forEach(function(entry){
		entry.callback.call(entry.context, time);
	});
};

var defer = function(fn, argument, context){
	return typeof argument === 'number' ? defer.timeout(fn, argument, context) : defer.immediate(fn, argument);
};

var immediate, root;

var doc = global.document;

var mutationObserver = global.MutationObserver || 
	global.WebKitMutationObserver || 
	global.MozMutationObserver;

if (global.process && process.nextTick){
	immediate = process.nextTick.bind(process);
} else if (global.setImmediate){
	immediate = setImmediate.bind(global);
} else if (mutationObserver && doc){
	(function(){
		var iterations = 0;
		var node = doc.createTextNode('');
		var observer = new mutationObserver(function(){
			iterate(callbacks.immediate);
		});
		observer.observe(node, {
			characterData: true
		});
	
		immediate = function() {
			node.data = (iterations = ++iterations % 2);
		};
	})();
} else if (global.postMessage && global.addEventListener){
	global.addEventListener('message', function(event){
		if (event.source === global && event.data === '@deferred'){
			event.stopPropagation();
			iterate(callbacks.immediate);
		}
	}, true);

	immediate = function(){
		postMessage('@deferred', '*');
	};
} else if (global.attachEvent && doc){
	root = doc.documentElement;
	immediate = function(iterator){
		var node = doc.createElement('script');
		node.onreadystatechange = function(){
			iterator();
			node.onreadystatechange = null;
			root.removeChild(node);
			node = null;
		};
		root.appendChild(node);
	};
} else {
	immediate = function(iterator){
		setTimeout(iterator, 0);
	};
}

defer.immediate = function(callback, context){
	return push(callbacks.immediate, callback, context, immediate);
};

var requestAnimationFrame = global.requestAnimationFrame ||
	global.webkitRequestAnimationFrame ||
	global.mozRequestAnimationFrame ||
	global.oRequestAnimationFrame ||
	global.msRequestAnimationFrame ||
	function(callback){
		setTimeout(callback, 1e3 / 60);
	};

defer.frame = function(callback, context){
	return push(callbacks.frame, callback, context, requestAnimationFrame);
};

var clear;

defer.timeout = function(callback, interval, context){
	var timeout = callbacks.timeout;

	if (!clear) clear = defer.immediate(function(){
		clear = null;
		callbacks.timeout = {};
	});

	return push(timeout[interval] || (timeout[interval] = []), callback, context, function(iterator){
		setTimeout(iterator, interval);
	});
};

module.exports = defer;