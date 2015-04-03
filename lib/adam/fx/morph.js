/*
---
name: Morph
requires: [Compile, dom]
...
*/

var dom = require('../dom/dom');

var Compile = require('./compile');

var Morph = Compile.extend({

	initialize: function(element, options){
		this.element = this.subject = dom.id(element);
		this.parent(options);
	},

	set: function(now){
		if (typeof now === 'string') now = this.search(now);
		for (var p in now) this.render(this.element, p, now[p], this.options.unitMap[p]);
		return this;
	},

	compute: function(from, to, delta){
		var now = {};
		for (var p in from) now[p] = this.parent(from[p], to[p], delta);
		return now;
	},

	start: function(properties){
		if (!this.check(properties)) return this;
		if (typeof properties === 'string') properties = this.search(properties);
		var from = {}, to = {};
		for (var p in properties){
			var parsed = this.prepare(this.element, p, properties[p]);
			from[p] = parsed.from;
			to[p] = parsed.to;
		}
		return this.parent(from, to);
	}

});

module.exports = Morph;
