/*
---
name: dom.manipulation
requires: [adam, each]
...
*/

var local = require('../core/adam');

/*<ltIE9>*/
var window = local.global;

var mout = require('../mout/collection');

var hasAttachEvent = window.attachEvent && !window.addEventListener;

var collected = {};

var clean = function(item){
	var uid = item.uniqueNumber;
	if (dom.removeEvents) dom.removeEvents(item);
	if (item.clearAttributes) item.clearAttributes();
	if (uid != null){
		delete collected[uid];
	}
	return item;
};
/*</ltIE9>*/

var storage = {};

var get = function(obj){
	var uid = local.uidOf(obj);
	return (storage[uid] || (storage[uid] = {}));
};

var dom = {

	addListener: function(node, type, fn, capture){
		/*<ltIE9>*/
		if (hasAttachEvent) collected[local.uidOf(node)] = node;
		/*</ltIE9>*/
		if (node.addEventListener) node.addEventListener(type, fn, !!capture);
		else node.attachEvent('on' + type, fn);
		return this;
	},

	removeListener: function(node, type, fn, capture){
		if (node.removeEventListener) node.removeEventListener(type, fn, !!capture);
		else node.detachEvent('on' + type, fn);
		return this;
	},

	retrieve: function(node, property, dflt){
		var storage = get(node), prop = storage[property];
		if (dflt != null && prop == null) prop = storage[property] = dflt;
		return prop != null ? prop : null;
	},

	store: function(node, property, value){
		var storage = get(node);
		storage[property] = value;
		return this;
	},

	eliminate: function(node, property){
		var storage = get(node);
		delete storage[property];
		return this;
	}	

};

/*<ltIE9>*/
if (hasAttachEvent){
	var gc = function(){
		mout.each(collected, clean);
		if (window.CollectGarbage) CollectGarbage();
		dom.removeListener(window, 'unload', gc);
	};
	dom.addListener(window, 'unload', gc);
}
/*</ltIE9>*/

module.exports = dom;