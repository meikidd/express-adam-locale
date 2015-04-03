/*
---
name: Tween
requires: [Compile, dom, flatten]
...
*/

var dom = require('../dom/dom'),
	mout = require('../mout/array');

var Compile = require('./compile');

var Tween = Compile.extend({

	initialize: function(element, options){
		this.element = this.subject = dom.id(element);
		this.parent(options);
	},

	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unitMap[p]);
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = mout.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

module.exports = Tween;
