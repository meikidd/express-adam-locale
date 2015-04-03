/*
---
name: locale
requires: [Array, Class, Emitter, loader, merge, clone, insert]
...
*/

var hasOwnProperty = Object.prototype.hasOwnProperty;

function getFromPath(source, parts){
	if (typeof parts === 'string') parts = parts.split('.');
	for (var i = 0, l = parts.length; i < l; i++){
		if (!hasOwnProperty.call(source, parts[i])) return;
		source = source[parts[i]];
	}
	return source;
}

var rsplit = /[^, ]+/g;

var languages = {
	'af': 1,
	'ar': 1,
	'bg': 1,
	'bn': 1,
	'bs': 1,
	'ca': 1,
	'cs': 1,
	'cy': 1,
	'da': 1,
	'de': 1,
	'el': 1,
	'en-au': 1,
	'en-ca': 1,
	'en-gb': 1,
	'en': 1,
	'eo': 1,
	'es': 1,
	'et': 1,
	'eu': 1,
	'fa': 1,
	'fi': 1,
	'fo': 1,
	'fr-ca': 1,
	'fr': 1,
	'gl': 1,
	'gu': 1,
	'he': 1,
	'hi': 1,
	'hr': 1,
	'hu': 1,
	'is': 1,
	'it': 1,
	'ja': 1,
	'km': 1,
	'ko': 1,
	'lt': 1,
	'lv': 1,
	'mn': 1,
	'ms': 1,
	'nb': 1,
	'nl': 1,
	'no': 1,
	'pl': 1,
	'pt-br': 1,
	'pt': 1,
	'ro': 1,
	'ru': 1,
	'sk': 1,
	'sl': 1,
	'sr-latn': 1,
	'sr': 1,
	'sv': 1,
	'th': 1,
	'tr': 1,
	'uk': 1,
	'vi': 1,
	'zh-cn': 1,
	'zh': 1
};

var Class = require('../class/class');
var Emitter = require('../class/emitter');

var loader = require('../loader/loader');

var clone = require('../mout/collection').clone,
	merge = require('../mout/object').merge,
	insert = require('../mout/array').insert;

var Locale = new Class({

	Implements: Emitter,

	locales: {},

	initialize: function(name){
		this.name = name || '';
	},

	define: function(lang, set, key, value){
		if (Array.isArray(lang)){
			lang.forEach(function(item){
				this.define(item, set, key, value);
			}, this);
			return this;
		}

		var locale = this.locales[lang];
		if (!locale) locale = this.locales[lang] = new Locale.Set(lang, this.name);

		locale.define(set, key, value);

		if (!this.current) this.current = locale;
		return locale;
	},

	use: function(lang, source){
		source = source || lang;

		var locale = this.locales[lang];

		if (locale){
			this.current = locale;
			this.emit('change', lang);
		} else if (source){
			loader.script(source, this.use.bind(this, lang));
		}
		return this;
	},

	get: function(key, args){
		return this.current ? this.current.get(key, args) : '';
	},

	inherit: function(locale, inherits, set){
		locale = this.locales[locale];

		if (locale) locale.inherit(inherits, set);
		return this;
	},

	detect: function(defl, probe){
		probe = probe || navigator.userLanguage || navigator.language;

		var parts = probe.toLowerCase().match(/([a-z]+)(?:-([a-z]+))?/);
		var lang = parts[1], locale = parts[2];

		if (languages[lang + '-' + locale]) lang = lang + '-' + locale;
		else if (!languages[lang]) lang = null;

		return lang || defl;
	},

	list: function(locale){
		return this.locales[locale];
	}

});


Locale.Set = new Class({

	sets: {},

	inherits: {
		sets: {},
		locales: []
	},

	initialize: function(name, dict){
		this.name = name || '';
		this.dict = dict || '';
	},

	define: function(set, key, value){
		if (typeof set === 'object' || value == null){
			var args = Array.from(arguments);
			args.unshift(null);

			set = args[0];
			key = args[1];
			value = args[2];
		}

		if (set && !this.sets[set]) this.sets[set] = {};

		var defineData = this.sets[set] || this.sets; 

		if (key){
			if (typeof key == 'object') defineData = merge(defineData, key);
			else defineData[key] = value;
		}

		return this;
	},

	get: function(key, args, base){
		var locale, value, names;

		if (!base) base = [];

		// get value of all
		if (!key){
			names = this.inherits.locales;

			for (var i = 0, l = names.length; i < l; i++){
				locale = getLocale(this.dict, names[i]);
				if (!locale) continue;

				value = locale.get();
				if (value != null) return value;
			}

			return this.sets;
		}

		// get value of china keys
		value = getFromPath(this.sets, key);
		if (value != null){
			var type = typeof value;
			if (type === 'function') value = value.apply(null, Array.from(args));
			else if (type === 'object') value = clone(value);
			return value;
		}

		// get value of inherited locales
		var index = key.indexOf('.'),
			set = index < 0 ? key : key.substr(0, index);

		names = (this.inherits.sets[set] || []).concat(this.inherits.locales);
		
		for (var i = 0, l = names.length; i < l; i++){
			if (~base.indexOf(names[i])) continue;
			insert(base, names[i]);
			
			locale = getLocale(this.dict, names[i]);
			if (!locale) continue;
			
			value = locale.get(key, args, base);
			if (value != null) return value;
		}
		
		return '';
	},

	inherit: function(locales, set){
		var inherits = this.inherits, inheritor;

		if (set && !inherits.sets[set]) inherits.sets[set] = [];

		inheritor = inherits.sets[set] || inherits.locales;

		locales.replace(rsplit, function(item){
			inheritor.unshift(item);
		});

		return this;
	}

});

var getLocale;

module.exports = (function(){
	var dicts = {};

	getLocale = function(name, code){
		var locale = dicts[name];
		return locale ? locale.locales[code] : null;
	};

	return function(name){
		if (!name) return null;

		var locale = dicts[name];
		if (!locale) locale = dicts[name] = new Locale(name);

		return locale;
	};

})();
