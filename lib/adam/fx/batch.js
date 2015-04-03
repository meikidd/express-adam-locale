/*
---
name: Batch
requires: [Compile, dom.selector, each]
...
*/

var dom = require('../dom/selector'),
	mout = require('../mout/collection');

var Compile = require('./compile');

var Batch = Compile.extend({

	initialize: function(elements, options){
		this.elements = this.subject = dom.parse(elements);
		this.parent(options);
	},

	compute: function(from, to, delta){
		var now = {};

		for (var i in from){
			var iFrom = from[i], iTo = to[i], iNow = now[i] = {};
			for (var p in iFrom) iNow[p] = this.parent(iFrom[p], iTo[p], delta);
		}

		return now;
	},

	set: function(now){
		mout.each(now, function(item, i){
			if (!this.elements[i]) return;
			for (var p in item) this.render(this.elements[i], p, item[p], this.options.unitMap[p]);
		}, this);
		return this;
	},

	start: function(obj){
		if (!this.check(obj)) return this;
		var from = {}, to = {}, avlbObjItem;

		obj = Array.from(obj);
		mout.each(this.elements, function(element, i){
			var item = avlbObjItem = obj[i] || avlbObjItem;
			if (!element) return;
			var cf = from[i] = {}, ct = to[i] = {};
			for (var p in item){
				var parsed = this.prepare(element, p, item[p]);
				cf[p] = parsed.from;
				ct[p] = parsed.to;
			}
		}, this);

		return this.parent(from, to);
	}

});

module.exports = Batch;
