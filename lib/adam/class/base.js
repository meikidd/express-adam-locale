/*
---
name: Base
requires: [Class, Emitter, Options]
...
*/


var Class = require('./class');
var Emitter = require('./emitter');
var Options = require('./options');

var Base = new Class({

	Implements: [Emitter, Options],
	
	initialize: function(options){
		this.setOptions(options);
	},

	destroy: function(){
		this.off();
	}

});

module.exports = Base;