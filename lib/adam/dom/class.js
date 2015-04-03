/*
---
name: dom.class
requires: [Array, clean]
...
*/

var clean = require('../mout/string').clean;

var hasClassList = !!document.documentElement.classList;

var classes = function(className){
	var classNames = clean(className || '').split(' '), uniques = {};
	return classNames.filter(function(className){
		if (className && !uniques[className]) return uniques[className] = className;
	});
};

module.exports = {

	hasClass: hasClassList ? function(node, className){
		return node.classList.indexOf(className) > -1;
	} : function(node, className){
		return classes(node.className).indexOf(className) > -1;
	},

	addClass: hasClassList ? function(node, className){
		classes(className).forEach(function(item){
			this.classList.add(item);
		}, node);
		return this;
	} : function(node, className){
		node.className = classes(className + ' ' + node.className).join(' ');
		return this;
	},

	removeClass: hasClassList ? function(node, className){
		classes(className).forEach(function(item){
			this.classList.remove(item);
		}, node);
		return this;
	} : function(node, className){
		className = classes(className);
		var classNames = classes(node.className).filter(function(item){
			return className.indexOf(item) === -1;
		});
		node.className = classNames.join(' ');
		return this;
	}

};