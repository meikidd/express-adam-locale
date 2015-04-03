/*
---
name: Promise
requires: [adam, Array, defer]
...
*/

var local = require('../core/adam').global;

var Promise = local.Promise;

var isFunction = function(fn){
	return typeof fn === 'function';
};

var supportPromise = 'Promise' in local &&
	'resolve' in Promise &&
	'reject' in Promise &&
	'all' in Promise &&
	'race' in Promise &&
	(function(){
		var resolve;
		new Promise(function(fn){
			resolve = fn;
		});
		return isFunction(resolve);
	})();

if (supportPromise) return Promise;

var defer = require('../defer/defer');

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

// Promise polyfill 
Promise = function(resolver){
	if (!isFunction(resolver)){
		throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	}

	if (!(this instanceof Promise)){
		throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	}

	this.subscribers = [];

	invokeResolver(resolver, this);
};

Promise.prototype = {

	constructor: Promise,

	/**
	state: undefined,
	stack: undefined,
	*/

	then: function(onFulfilled, onRejected){
		var then = new this.constructor(function(){});

		if (this.state){
			var callbacks = arguments;
			defer(function(){
				invokeCallback(this.state, then, callbacks[this.state - 1], this.stack);
			}, this);
		} else {
			this.subscribers.push(then, onFulfilled, onRejected);
		}

		return then;
	},

	catch: function(onRejected){
		return this.then(null, onRejected);
	}
};

function invokeResolver(resolver, promise){
	function resolvePromise(value){
		resolve(promise, value);
	}

	function rejectPromise(reason){
		reject(promise, reason);
	}

	try {
		resolver(resolvePromise, rejectPromise);
	} catch(e){
		rejectPromise(e);
	}
}

function invokeCallback(settled, promise, callback, stack){
	var hasCallback = isFunction(callback),
		value, error, succeeded, failed;

	if (hasCallback){
		try {
			value = callback(stack);
			succeeded = true;
		} catch(e) {
			failed = true;
			error = e;
		}
	} else {
		value = stack;
		succeeded = true;
	}

	if (handleThenable(promise, value)) return;
	else if (hasCallback && succeeded) resolve(promise, value);
	else if (failed) reject(promise, error);
	else if (settled === FULFILLED) resolve(promise, value);
	else if (settled === REJECTED) reject(promise, value);
}

function handleThenable(promise, obj){
	var then = null, 
		resolved;

	try {
		if (promise === obj){
			throw new TypeError('A promises callback cannot return that same promise.');
		}

		if (isFunction(obj) || (typeof obj === 'object' && obj !== null)){
			then = obj.then;

			if (isFunction(then)){
				then.call(obj, function(val){
					if (resolved) return true;
					resolved = true;

					if (obj !== val) resolve(promise, val);
					else fulfill(promise, val);
				}, function(val) {
					if (resolved) return true;
					resolved = true;
					reject(promise, val);
				});
				return true;
			}
		}
	} catch (ex){
		if (resolved) return true;
		reject(promise, ex);
		return true;
	}

	return false;
}

function resolve(promise, value){
	if (promise === value || !handleThenable(promise, value)){
		fulfill(promise, value);
	}
}

function reject(promise, reason){
	if (promise.state !== PENDING) return;
	promise.state = SEALED;
	promise.stack = reason;

	defer(function(){
		publish(this, this.state = REJECTED);
	}, promise);
}

function fulfill(promise, value){
	if (promise.state !== PENDING) return;
	promise.state = SEALED;
	promise.stack = value;

	defer(function(){
		publish(this, this.state = FULFILLED);
	}, promise);
}

function publish(promise, settled){
	var subscribers = promise.subscribers, 
		stack = promise.stack;

	for (var i = 0; i < subscribers.length; i += 3){
		invokeCallback(settled, subscribers[i], subscribers[i + settled], stack);
	}

	promise.subscribers = null;
}

/**
 * Returns a promise that will become rejected with the passed `reason`.
 */
Promise.reject = function(reason){
	return new Promise(function(resolve, reject){
		reject(reason);
	});
};

/**
 * Returns a Promise object that is resolved with the given value. 
 */
Promise.resolve = function(value){
	if (value && typeof value === 'object' && value.constructor === this) return value;
	return new Promise(function(resolve){
		resolve(value);
	});
};

/**
 * Returns a promise that resolves when all of the promises in iterable have resolved.
 */
Promise.all = function(iterable){
	if (!Array.isArray(iterable))
		throw new TypeError('You must pass an array to all.');

	return new Promise(function(resolve, reject){
		var results = [], remaining = iterable.length,
			promise;

		if (remaining === 0) resolve([]);

		function resolver(index){
			return function(value){
				resolveAll(index, value);
			};
		}

		function resolveAll(index, value){
			results[index] = value;
			if (--remaining === 0) resolve(results);
		}

		for (var i = 0; i < iterable.length; i++){
			promise = iterable[i];
			if (promise && isFunction(promise.then)) promise.then(resolver(i), reject);
			else resolveAll(i, promise);
		}
	});

};

/**
 * Returns a promise that resolves or rejects as soon as one of 
 * the promises in the iterable resolves or rejects, 
 * with the value or reason from that promise.
 */
Promise.race = function(iterable){
	if (!Array.isArray(iterable))
		throw new TypeError('You must pass an array to race.');

	return new Promise(function(resolve, reject){
		for (var i = 0, l = iterable.length, promise; i < l; i++){
			promise = iterable[i];
			if (promise && isFunction(promise.then)) promise.then(resolve, reject);
			else resolve(promise);
		}
	});
};

local.Promise = Promise;