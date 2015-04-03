/*
---
name: Emitter
requires: [adam, Class, Array, insert]
...
*/


var local = require('../core/adam');
var insert = require('../mout/array').insert;

var Class = require('./class');

var removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
};

var Emitter = new Class({

	$events: {},

	on: function(type, fn){
		type = removeOn(type);
		this.$events[type] = insert(this.$events[type] || [], fn);
		return this;
	}.overloadSetter(),

	emit: function(type, args){
		type = removeOn(type);
		var events = this.$events[type];
		if (!events) return this;
		args = local.type(args) === 'arguments' ? Array.from(args) : Array.slice(arguments, 1);
		events.forEach(function(fn){
			fn.apply(this, args);
		}, this);
		return this;
	},
	
	off: function(events, fn){
		var type, types;
		if (local.type(events) === 'object'){
			for (type in events) this.off(type, events[type]);
			return this;
		}
		if (events) type = removeOn(events);

		if (typeof fn === 'function'){
			events = this.$events[type];
			if (events){
				var index = events.indexOf(fn);
				if (index !== -1) delete events[index];
			}
			return this;
		}

		if (arguments.length > 0){
			types = [type];
			for (var i = 1, l = arguments.length; i < l; i++){
				types.push(removeOn(arguemnts[i]));
			}
		}

		for (type in this.$events){
			if (types && types.indexOf(type) === -1) continue;
			delete this.$events[type];
		}
		return this;
	}

});

module.exports = Emitter;