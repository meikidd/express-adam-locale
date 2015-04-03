/*
---
name: mout
requires: Array
...
*/


var slice = Array.prototype.slice;

var rretype = /^object|string|array$/;

var mout = function(item){
	if (item instanceof mout) return item;
	if (!(this instanceof mout)) return new mout(item);
	this.$item = item;
};

mout.prototype.value = function(){
	return this.$item;
};

mout.mixin = function(name, method){
	if (this[name] == null) this[name] = method;
	if (this.prototype[name] == null) this.prototype[name] = function(){
		var result = method.apply(this, [this.$item].concat(slice.call(arguments)));
		if (result === this.$item) return this;
		if (rretype.test(typeof result)){
			this.$item = result;
			return this;
		}
		return result;
	};
}.overloadSetter();

['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'].forEach(function(name){
	var method = Array.prototype[name];
	mout.prototype[name] = function(){
		method.apply(this.$item, arguments);
		return this;
	};
});

['concat', 'join', 'slice'].forEach(function(name){
	var method = Array.prototype[name];
	mout.prototype[name] = function(){
		this.$item = method.apply(this.$item, arguments);
		return this;
	};
});

module.exports = mout;