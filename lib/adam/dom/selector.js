/*
---
name: dom.selector
requires: [adam, dom, dom.class, flatten]
...
*/

var local = require('../core/adam'),
	mout = require('../mout/array');

var document = local.global.document,
	root = document.documentElement,
	rsingleId = /^#[\w-]+$/,
	// parseExpr = /^(?:#([\w-]+))?\s*([\w-]+|\*)?\.?([\w-]+)?$/;
	// Added tag namespace support.
	parseExpr = /^(?:#([\w-]+))?\s*((?:[\w-]*:?)[\w-]+|\*)?\.?([\w-]+)?$/;

var nodeName = require('./dom').nodeName, 
	hasClass = require('../dom/class').hasClass;

var nativeMatchesSelector = root.matches || /*root.msMatchesSelector ||*/ root.mozMatchesSelector || root.webkitMatchesSelector;
if (nativeMatchesSelector) try {
	// if matchesSelector trows errors on incorrect sintaxes we can use it
	nativeMatchesSelector.call(root, ':adam');
	nativeMatchesSelector = null;
} catch(e){};

/**
 * Retrieves an Array of HTMLElement based on the given CSS selector.
 * @param {string} selector
 * @param {string|HTMLElement} context An #id string or a HTMLElement used as context
 * @return {Array} The array of found HTMLElement
 */
function parse(selector, context){
	var id, tag, cls, match, r, result = [];
	var type = local.type(selector);

	context = getContext(context);

	if (!selector) return null;

    // Ref: http://ejohn.org/blog/selectors-that-people-actually-use/
    // Support selector:
	// #id
    // tag
    // .cls
    // #id tag
    // #id .cls
	// #id.cls
    // tag.cls
    // #id tag.cls
	if (type === 'string'){
		selector = selector.trim();

		// #id
		if (rsingleId.test(selector)){
			r = getElementById(selector.slice(1), context);
			if (r) result = [r];
		} else if (match = parseExpr.exec(selector)){
			id = match[1];
			tag = match[2];
			cls = match[3];

			if ((context = id ? getElementById(id, context) : context)){
				// #id.cls | #id .cls | #id tag.cls | .cls | tag.cls
				if (cls){
					if (!id || selector.contains(' ')){
						result = getElementsByClassName(cls, tag, context);
					// #id.cls
					} else {
						r = getElementById(id, context);
						if (r && hasClass(r, cls)) result = [r];
					}
				// #id tag | tag
				} else if (tag){
					result = getElementsByTagName(tag, context);
				}
			}
		} else if (local.slick){
			return local.slick(selector, context);
		} else {
			showError(selector);
		}
	// array | element collection
	} else if (type === 'array' || type === 'collection'){
		result = selector;
	} else {
		result = [selector];
	}

	return result || [];
}

function getContext(context){
	if (context === undefined) context = document;
	else if (typeof context === 'string' && rsingleId.test(context)) context = getElementById(context.slice(1), document);
	else if (context && context.nodeType !== 1 && context.nodeType !== 9) context = null;
	return context;
}

function getElementById(id, context){
	return (context.nodeType !== 9 ? context.ownerDocument : context).getElementById(id);
}

function getElementsByTagName(tag, context){
	return context.getElementsByTagName(tag);
}

// Check to see if the browser returns only elements
// when doing getElementsByTagName('*')
(function(document){
	// Create a fake element
	var div = document.createElement('div');
	div.appendChild(document.createComment(''));

	// Make sure no comments are found
	if (div.getElementsByTagName('*').length){
		getElementsByTagName = function(tag, context){
			var elements = context.getElementsByTagName(tag);
			if (tag === '*'){
				var result = [], i = 0, node;
				while (node = elements[i++]){
					if (node.nodeType === 1) result[result.length] = node;
				}
				elements = result;
			}
			return elements;
		};
	}
})(document);

function getElementsByClassName(cls, tag, context){
	var elements = context.getElementsByClassName(cls),
		result = elements, element;
	if (tag && tag !== '*'){
		result = [];
		for (var i = 0, l = elements.length; i < l; ++i){
			element = elements[i];
			nodeName(element, tag) && result.push(element);
		}
	}
	return result;
}

if (!document.getElementsByClassName){
	if (document.querySelectorAll){
		getElementsByClassName = function(cls, tag, context){
			return context && context.querySelectorAll((tag || '') + '.' + cls);
		};
	} else {
		getElementsByClassName = function(cls, tag, context){
			var elements = context.getElementsByTagName(tag || '*'), 
				element, result = [];
			for (var i = 0, l = elements.length; i < l; ++i){
				element = elements[i];
				if (hasClass(element, cls)) result.push(element);
			}
			return result;
		};
	}
}

function showError(selector){
	local.log('Unsupported selector: ' + selector);
}

function match(node, selector){
	if (!(node && selector)) return false;
	if (!selector || selector === node) return true;
	return matchNode(node, selector);
}

function matchNode(node, selector){
	if (nativeMatchesSelector){
		try {
			return nativeMatchesSelector.call(node, selector.replace(/\[([^=]+)=\s*([^'"\]]+?)\s*\]/g, '[$1="$2"]'));
		} catch(matchError) {}
	}

	var nodes = parse(selector);
	if (!nodes.length) return true;

	var i, item;
	for (i = 0; item = nodes[i++];){
		if (item === node) return true;
	}
	return false;
}

module.exports = {

	match: function(selector, expression){
		return !expression || match(selector, expression);
	},
	
	parse: function(selector, context){
		if (typeof selector === 'string'){
			var result = [], selectors = selector.split(',');
			for (var i = 0, l = selectors.length; i < l; i++){
				result.push(parse(selectors[i], context));
			}
			return mout.flatten(result);
		}
		return parse(selector, context);
	}

};


    /**
     * Filters an array of elements to only include matches of a filter.
     * @param filter selector or fn
     */
	/*filter: function(selector, filter){
		var elements = parse(selector), cls, tag, match, result = [];
		var type = local.type(filter);

		if (type === 'string' && (match = parseExpr.exec(filter)) && !macth[1]){
			tag = match[2];
			cls = match[3];
			filter = function(element){
				return !((tag && !nodeName(element, tag))) || (cls && !hasClass(element, cls)));
			};
		}

		if (type === 'function') result = local.filter(elements, filter);
		else if (filter && local.slick) result = local.slick(selector, filter + '');
		else showError(filter);

		return result;
	},*/

    /**
     * Returns true if the passed element(s) match the passed filter
     */
    /*test: function(selector, filter){
        var elements = parse(selector);
        return elements.length && (this.filter(elements, filter).length === elements.length);
    }

});*/

/**
 * References:
 *  - http://ejohn.org/blog/selectors-that-people-actually-use/
 *  - http://ejohn.org/blog/thoughts-on-queryselectorall/
 *  - MDC: querySelector, querySelectorAll, getElementsByClassName
 *  - Sizzle: http://github.com/jeresig/sizzle
 *  - MINI: http://james.padolsey.com/javascript/mini/
 *  - Peppy: http://jamesdonaghue.com/?p=40
 *  - Sly: http://github.com/digitarald/sly
 *  - XPath, TreeWalker：http://www.cnblogs.com/rubylouvre/archive/2009/07/24/1529640.html
 *
 *  - http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
 *  - http://www.quirksmode.org/dom/getElementsByTagNames.html
 *  - http://ejohn.org/blog/comparing-document-position/
 *  - http://github.com/jeresig/sizzle/blob/master/sizzle.js
 */