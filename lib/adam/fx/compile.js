/*
---
name: Compile
requires: [Fx, dom.style, each, escapeRegExp, rgbToHex, hexToRgb, camelCase]
...
*/

var dom = require('../dom/style');

var uc = require('../mout/color'),
	us = require('../mout/string');

var forEach = require('../mout/collection').each;

var Fx = require('./fx');

var Compile = Fx.extend({

	//prepares the base from/to object
	prepare: function(element, property, values){
		values = Array.from(values);
		var from = values[0], to = values[1];
		this.options.unitMap = this.options.unitMap || {};
		var unit = this.options.unitMap[ property ] = (/[\d.]+([A-z%]+)$/).test(to == null ? from : to) ?
														  RegExp.$1
														: (/[\d.]+([A-z%]*)$/).test(dom.getStyle(element, property)) ?
															  RegExp.$1
															: '';
		if (to == null){
			to = from;
			from = dom.getStyle(element, property);
			// adapted from: https://github.com/ryanmorr/fx/blob/master/fx.js#L299
			if ( from && typeof from === 'string' && from.slice(-unit.length) != unit && parseFloat(from) != 0){
				dom.setStyle(element, property, to + unit);
				var value = dom.getComputedStyle(element, property);
				// IE and Opera support pixelLeft or pixelWidth
				if (!(/px$/.test(value))){
					value = element.style[us.camelCase('pixel-' + property)];
					if (value == null){
						// adapted from Dean Edwards' http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
						var left = element.style.left;
						element.style.left = to + unit;
						value = element.style.pixelLeft;
						element.style.left = left;
					}
				}
				from = (to || 1) / (parseFloat(value) || 1) * (parseFloat(from) || 0);
				dom.setStyle(element, property, from + unit);
			}
		}
		return {from: this.parse(from), to: this.parse(to)};
	},

	//parses a value into an array
	parse: function(value){
		value = typeof value === 'function' ? value() : value;
		value = typeof value === 'string' ? value.split(' ') : Array.from(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			forEach(Compile.Parsers, function(parser){
				if (found) return;
				var parsed = parser.parse(val);
				if (parsed || parsed === 0) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Compile.Parsers.String};
			return found;
		});
	},

	//computes by a from and to prepared objects, using their parsers.
	compute: function(from, to, delta){
		var computed = [], length = Math.min(from.length, to.length);
		for (var i = 0; i < length; i++){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		}
		computed.$type = 'fx:compile:value';
		return computed;
	},

	//serves the value as settable
	serve: function(value, unit){
		if (value.$type !== 'fx:compile:value') value = this.parse(value);
		var returned = [];
		value.forEach(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},

	//renders the change to an element
	render: function(element, property, value, unit){
		dom.setStyle(element, property, this.serve(value, unit));
	},

	//searches inside the page css to find the values for a selector
	search: function(selector){
		if (Compile.Cache[selector]) return Compile.Cache[selector];
		var to = {}, selectorTest = new RegExp('^' + us.escapeRegExp(selector) + '$');

		var searchStyles = function(rules){
			Array.from(rules).forEach(function(rule){
				if (rule.media){
					searchStyles(rule.rules || rule.cssRules);
					return;
				}
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorTest.test(selectorText)) return;
				forEach(dom.styles, function(value, style){
					if (!rule.style[style] || dom.styleHooks[style]) return;
					value = String(rule.style[style]);
					to[style] = ((/^rgb/).test(value)) ? uc.rgbToHex(value) : value;
				});
			});
		};

		Array.from(document.styleSheets).forEach(function(sheet){
			var href = sheet.href;
			if (href && href.indexOf('://') > -1 && href.indexOf(document.domain) == -1) return;
			var rules = sheet.rules || sheet.cssRules;
			searchStyles(rules);
		});
		return Compile.Cache[selector] = to;
	}

});

Compile.Cache = {};

Compile.Parsers = {

	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return uc.hexToRgb(value, true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},

	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},

	String: {
		parse: function(){
			return false;
		},
		compute: function(zero, one){
			return one;
		},
		serve: function(zero){
			return zero;
		}
	}

};

module.exports = Compile;
