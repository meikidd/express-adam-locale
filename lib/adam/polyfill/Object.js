/*
---
name: Object
...
*/

(function(){

	//<!ES5>
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	//</!ES5>

	Object.extend({

		//<!ES5>
		keys: function(object){
			var keys = [];
			for (var key in object){
				if (hasOwnProperty.call(object, key)) keys.push(key);
			}
			return keys;
		},
		//</!ES5>

		//<!ES6>
		is: function(a, b){
			if (a === 0 && b === 0) return 1 / a === 1 / b;
			else if (a !== a) return b !== b;
			else return a === b;
		},

		assign: function(original){
			for (var i = 1, l = arguments.length; i < l; i++){
				var extended = arguments[i] || {};
				for (var key in extended) original[key] = extended[key];
			}
			return original;
		}
		//</!ES6>

	});

})();