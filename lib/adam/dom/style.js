/*
---
name: dom.style
requires: [dom, dom.manipulation, env, flatten, capitalize, hyphenate, camelCase, rgbToHex]
...
*/

var env = require('../env/env'),
	mout = require('../mout/string'),
	stored = require('../dom/manipulation');

var getDocument = require('./dom').getDocument,
	rgbToHex = require('../mout/color').rgbToHex,
	flatten = require('../mout/array').flatten;

var html = document.documentElement, el;

//<ltIE9>
// Check for oldIE, which does not remove styles when they're set to null
el = document.createElement('div');
el.style.color = 'red';
el.style.color = null;
var doesNotRemoveStyles = el.style.color == 'red';

// check for oldIE, which returns border* shorthand styles in the wrong order (color-width-style instead of width-style-color)
var border = '1px solid #123abc';
el.style.border = border;
var returnsBordersInWrongOrder = el.style.border != border;
el = null;
//</ltIE9>

var hasGetComputedStyle = !!window.getComputedStyle,
	supportBorderRadius = (html.style.borderRadius != null),
	hasBackgroundPositionXY = (html.style.backgroundPositionX != null);

var hasOpacity = (html.style.opacity != null),
	hasFilter = (html.style.filter != null),
	reAlpha = /alpha\(opacity=([\d.]+)\)/i;

var setVisibility = function(element, opacity){
	stored.store(element, '$opacity', opacity);
	element.style.visibility = opacity > 0 ? 'visible' : 'hidden';
};

var setOpacity = (hasOpacity ? function(element, opacity){
	element.style.opacity = opacity;
} : (hasFilter ? function(element, opacity){
	if (!element.currentStyle || !element.currentStyle.hasLayout) element.style.zoom = 1;
	opacity = opacity == 1 && getOpacity(element) !== 1 || opacity != null ? opacity : '';
	opacity = opacity && 'alpha(opacity=' + parseInt(Math.min(100, Math.max(0, opacity * 100)), 10) + ')';
	var style = element.style, filter = style.filter || dom.getComputedStyle(element, 'filter') || '';
	style.filter = reAlpha.test(filter) ? filter.replace(reAlpha, opacity) : filter + opacity;
	if (!style.filter) style.removeAttribute('filter');
} : setVisibility));

var getOpacity = (hasOpacity ? function(element){
	var opacity = element.style.opacity || dom.getComputedStyle(element, 'opacity');
	return (opacity == '') ? 1 : parseFloat(opacity);
} : (hasFilter ? function(element){
	var filter = (element.style.filter || dom.getComputedStyle(element, 'filter')),
		opacity;
	if (filter) opacity = filter.match(reAlpha);
	return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
} : function(element){
	var opacity = stored.retrieve(element, '$opacity');
	if (opacity == null) opacity = (element.style.visibility == 'hidden' ? 0 : 1);
	return opacity;
}));

var floatName = (html.style.cssFloat == null) ? 'styleFloat' : 'cssFloat';

var styleCheck = function(property){
	return mout.camelCase(property === 'float' ? floatName : property);
};

var namedPositions = {left: '0%', top: '0%', center: '50%', right: '100%', bottom: '100%'},
	prefixMap = {ie: 'ms', opera: 'o', firefox: 'moz', webkit: 'webkit'}, 
	prefix = prefixMap[env.browser] || null;

var dom = {

	getComputedStyle: function(element, property){
		if (!hasGetComputedStyle && element.currentStyle) return element.currentStyle[styleCheck(property)];
		var defaultView = getDocument(element).defaultView,
			computed = defaultView ? defaultView.getComputedStyle(element, null) : null;
		return (computed) ? computed.getPropertyValue((property == floatName) ? 'float' : mout.hyphenate(property)) : null;
	},

	setStyle: function(element, property, value, compat){
		if (property === 'opacity'){
			value = value || value === 0 ? parseFloat(value) : null;
			setOpacity(element, value);
			return this;
		}
		property = styleCheck(property);
		if (typeof value !== 'string'){
			var map = (dom.styles[property] || '@').split(' ');
			value = Array.from(value).map(function(val, i){
				if (!map[i]) return '';
				return (typeof val === 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		element.style[property] = value;

		//<ltIE9>
		if ((value === '' || value == null) && doesNotRemoveStyles && element.style.removeAttribute){
			if (property === 'backgroundPosition'){
				element.style.removeAttribute(property + 'X');
				property += 'Y';
			}
			element.style.removeAttribute(property);
		}
		//</ltIE9>

		if (compat && prefix) element.style[prefix + mout.capitalize(property)] = value;

		return this;
	},

	getStyle: function(element, property){
		if (property === 'opacity') return getOpacity(element);
		if (property.contains('borderRadius') && supportBorderRadius){
			return ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map(function(corner){
				return this.style[corner] || '0px';
			}, element).join(' ');
		}
		property = styleCheck(property);
		var result = element.style[property];
		if (!result || property === 'zIndex'){
			if (dom.styleHooks.hasOwnProperty(property)){
				result = [];
				for (var s in dom.styleHooks[property]) result.push(dom.getStyle(element, s));
				return result.join(' ');
			}
			result = dom.getComputedStyle(element, property);
		}
		if (hasBackgroundPositionXY && /^backgroundPosition[XY]?$/.test(property)){
			return result.replace(/(top|right|bottom|left)/g, function(position){
				return namedPositions[position];
			}) || '0px';
		}
		if (!result && property === 'backgroundPosition') return '0px 0px';
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], rgbToHex(color[0]));
		}
		if (!hasGetComputedStyle && !element.style[property]){
			if ((/^(height|width)$/).test(property) && !(/px$/.test(result))){
				var values = (property === 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.forEach(function(value){
					size += parseInt(this.getStyle(element, 'border-' + value + '-width'), 10) + parseInt(this.getStyle(element, 'padding-' + value), 10);
				}, dom);
				return element['offset' + mout.capitalize(property)] - size + 'px';
			}
			if ((/^border(.+)Width|margin|padding/).test(property) && isNaN(parseFloat(result))) return '0px';
		}
		//<ltIE9>
		if (returnsBordersInWrongOrder && /^border(Top|Right|Bottom|Left)?$/.test(property) && /^#/.test(result)){
			return result.replace(/^(.+)\s(.+)\s(.+)$/, '$2 $3 $1');
		}
		//</ltIE9>
		return result;
	},

	setStyles: function(element, styles, compat){
		for (var style in styles) this.setStyle(element, style, styles[style], compat);
		return this;
	},

	getStyles: function(element){
		var result = {};
		flatten(arguments).slice(1).forEach(function(key){
			result[key] = this.getStyle(element, key);
		}, this);
		return result;
	},

	styles: {
		left: '@px', top: '@px', bottom: '@px', right: '@px',
		width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
		backgroundColor: 'rgb(@, @, @)', backgroundSize: '@px', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
		fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
		margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
		borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
		zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@', borderRadius: '@px, @px, @px, @px'
	},

	styleHooks: {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}}

};

['Top', 'Right', 'Bottom', 'Left'].forEach(function(direction){
	var hooks = dom.styleHooks, 
		styles = dom.styles;
	['margin', 'padding'].forEach(function(style){
		var sd = style + direction;
		hooks[style][sd] = styles[sd] = '@px';
	});
	var bd = 'border' + direction;
	hooks.border[bd] = styles[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	hooks[bd] = {};
	hooks.borderWidth[bdw] = hooks[bd][bdw] = styles[bdw] = '@px';
	hooks.borderStyle[bds] = hooks[bd][bds] = styles[bds] = '@';
	hooks.borderColor[bdc] = hooks[bd][bdc] = styles[bdc] = 'rgb(@, @, @)';
});

if (hasBackgroundPositionXY) dom.styleHooks.backgroundPosition = {backgroundPositionX: '@px', backgroundPositionY: '@px'};

module.exports = dom;