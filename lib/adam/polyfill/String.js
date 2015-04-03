/*
---
name: String
...
*/

String.implement({

	//<!ES5>
	trim: function(){
		return String(this).replace(/^\s+|\s+$/g, '');
	},
	//</!ES5>

	//<!ES6>
	repeat: function(times){
		times = parseInt(times, 10);
		return times > 0 ? new Array(times + 1).join(this) : '';
	},

	startsWith: function(string, index){
		index = index || 0;
		return String(this).lastIndexOf(string, index) === index;
	},

	endsWith: function(string, index){
		index = Math.min(index || this.length, this.length) - string.length;
		return String(this).indexOf(string, index) === index;
	},

	contains: function(string, index){
		return (index ? String(this).slice(index) : String(this)).indexOf(string) > -1;
	}
	//</!ES6>

});