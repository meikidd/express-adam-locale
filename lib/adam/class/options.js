/*
---
name: Options
requires: [Class, Array, merge]
...
*/


var Class = require('./class');

var merge = require('../mout/object').merge;

var Options = new Class({

	setOptions: function(){
		var options = this.options = merge.apply(null, [{}, this.options].concat(Array.from(arguments)));
		if (this.on) for (var option in options){
			if (typeof options[option] !== 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.on(option, options[option]);
			delete options[option];
		}
		return this;
	}

});

module.exports = Options;