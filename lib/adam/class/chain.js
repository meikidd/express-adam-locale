/*
---
name: Chain
requires: [Class, flatten, append]
...
*/

var mout = require('../mout/array');

var Class = require('./class');

var Chain = new Class({

	$chain: [],

	chain: function(){
		mout.append(this.$chain, mout.flatten(arguments));
		return this;
	},

	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},

	clearChain: function(){
		this.$chain.length = 0;
		return this;
	}

});

module.exports = Chain;