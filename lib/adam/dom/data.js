/*
---
name: dom.data
requires: [dom.manipulation, typecast, hyphenate]
...
*/


var dom = require('../dom/manipulation');

var typecast = require('../mout/types').typecast, 
	hyphenate = require('../mout/string').hyphenate;

module.exports = {

	/**
	 * Gets, sets and removes custom data to be stored as HTML5 data-* attributes.
	 * @param {String} name The name of the attribute, execluding the 'data-' part.
	 * @param {String} [value] The value to set. If set to false, the attribute will be removed.
	 */
	data: function(node, name, value){
		// Gets all values
		if (name === undefined) return dom.retrieve(node);

		if (value === undefined){
			var data = dom.retrieve(node, name);

			if (data === null){
				var property = 'data-' + hyphenate(name);
				data = node.getAttribute(property);

				if (typeof data === 'string'){
					data = typecast(data);
					dom.store(node, property, data);
				} else {
					data = null;
				}
			}
			return data || null;
		} else if (value === null){
			dom.eliminate(node, name);
		} else {
			dom.store(node, name, value);
		}
		return this;
	},

	removeData: function(node, name){
		return this.data(node, name, null);
	}

};