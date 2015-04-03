
/*
---
name: dom.style.extras
requires: [dom.style, dom.manipulation]
...
*/


var dom = require('../dom/style'),
	stored = require('../dom/manipulation');

module.exports = {

	isDisplayed: function(element){
		return dom.getStyle(element, 'display') !== 'none';
	},

	isVisible: function(element){
		var w = element.offsetWidth,
			h = element.offsetHeight;
		return (w == 0 && h == 0) ? false : (w > 0 && h > 0) ? true : element.style.display !== 'none';
	},

	toggle: function(element, force){
		return this[this.isDisplayed() ? 'hide' : 'show']();
	},

	hide: function(element){
		var d;
		try {
			//IE fails here if the element is not in the dom
			d = dom.getStyle(element, 'display');
		} catch(e){}
		if (d === 'none') return this;
		stored.store(element, 'element:_originalDisplay', d || '');
		return dom.setStyle(element, 'display', 'none');
	},

	show: function(element, display){
		if (!display && this.isDisplayed(element)) return this;
		display = display || stored.retrieve(element, 'element:_originalDisplay') || 'block';
		return dom.setStyle(element, 'display', (display === 'none') ? 'block' : display);
	}

};