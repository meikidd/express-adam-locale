/*
---
name: JSON
...
*/


(function(local){

	var global = local.global;

	var special = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'};

	var escape = function(chr){
		return special[chr] || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
	};

	var validate = function(string){
		string = string.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
						replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
						replace(/(?:^|:|,)(?:\s*\[)+/g, '');

		return (/^[\],:{}\s]*$/).test(string);
	};

	if (typeof global.JSON === 'undefined') global.JSON = {

		secure: true,

		stringify: function(obj){
			if (obj && obj.toJSON) obj = obj.toJSON();

			switch (local.type(obj)){
				case 'string':
					return '"' + obj.replace(/[\x00-\x1f\\"]/g, escape) + '"';
				case 'array':
					return '[' + obj.map(JSON.stringify).clean() + ']';
				case 'object':
					var string = [];
					Object.each(obj, function(value, key){
						var json = JSON.stringify(value);
						if (json) string.push(JSON.stringify(key) + ':' + json);
					});
					return '{' + string + '}';
				case 'number': case 'boolean': return '' + obj;
				case 'null': return 'null';
			}

			return null;
		},

		parse: function(string, secure){
			if (typeof string !== 'string') return null;

			if (secure == null) secure = JSON.secure;

			if (secure && !validate(string)) throw new Error('JSON could not decode the input; security is enabled and the value is not secure.');

			return eval('(' + string + ')');
		}

	};

})(adam);