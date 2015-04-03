/*
---
name: dom
requires: adam
...
*/

var local = require('../core/adam');
var document = local.global.document;

var dom = {

	extend: Function.prototype.extend,

	id: (function(){
	
		var types = {
			
			string: function(id, doc){
				var el = doc.getElementById(id);
				return el ? types.element(el) : null;
			},

			element: function(el){
				local.uidOf(el);
				return el;
			},

			object: function(obj, doc){
				var el = obj.toElement ? obj.toElement(doc) : (obj[0] && obj[0].nodeType === 1) ? obj[0] : null;
				return el && types.element(el);
			}

		};

		types.textnode = types.whitespace = types.window = types.document = function(zero){
			return zero;
		};

		return function(selector, doc){
			if (selector && selector.uniqueNumber) return selector;
			var type = local.type(selector);
			return types[type] ? types[type](selector, doc || document) : null;
		};

	})(),

	getDocument: function(node){
		node = node || document;
		return node.ownerDocument || node.document || node;
	},

	nodeName: function(node, name){
		return node && node.nodeName && node.nodeName.toUpperCase() === name.toUpperCase();
	}

};

module.exports = dom;