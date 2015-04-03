/*
---
name: mout.string
provides: [truncate, crop, ltrim, rtrim, clean, camelCase, hyphenate, capitalize, escape, unescape, escapeRegExp, stripScripts, stripHtmlTags, substitute]
requires: env
...
*/


var env = require('../env/env');

function escapeChars(chars, start){
	var regexp = [chars ? '[' + escapeRegExp(chars) + ']' : '\\s', '+'];
	regexp[start ? 'unshift' : 'push'](start ? '^' : '$');
	return new RegExp(regexp.join(''), 'g');
}

function escapeRegExp(string){
	return string.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
}

module.exports = {

    /**
     * Limit number of chars.
     */
	truncate: function(string, max, fill, full){
		fill = fill || '...';
		string = string.trim();
		return string.length > max ? string.slice(0, Math.min(full ^ string.lastIndexOf(' '), max - fill.length)) + fill : String(string);
	},

    /**
     * Truncate string at full words.
     */
	crop: function(string, max, fill){
		return this.truncate(string, max, fill, true);
	},

    /**
     * Remove chars from beginning of string.
     */
	ltrim: function(string, chars){
		return string.replace(escapeChars(chars, 1), '');
	},

    /**
     * Remove chars from end of string.
     */
	rtrim: function(string, chars){
		return string.replace(escapeChars(chars), '');
	},

	clean: function(string){
		return string.replace(/\s+/g, ' ').trim();
	},

	/**
	 * Convert string to camelCase text.
	 */
	camelCase: function(string){
		return string.replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	/**
	 * Replaces spaces with hyphens, split camelCase text, 
	 * remove non-word chars, remove accents and convert to lower case.
	 */
	hyphenate: function(string){
		return string.replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},

	capitalize: function(string){
		return string.replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	/**
	 * Escapes a string for insertion into HTML.
	 */
	escape: function(string){
		return string.replace(/&(?!\w+;)/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
	},

	/**
	 * Unescapes HTML special chars.
	 */
	unescape: function(string){
		return string.replace(/&amp;/g , '&')
			.replace(/&lt;/g  , '<')
			.replace(/&gt;/g  , '>')
			.replace(/&#0*39;/g , "'")
			.replace(/&quot;/g, '"');
	},

	/**
	 * Escape RegExp string chars.
	 */
	escapeRegExp: escapeRegExp,

	/**
	 * Remove script tags from string.
	 */
	stripScripts: function(string, exec){
		var scripts = '';
		var text = string.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(all, code){
			scripts += code + '\n';
			return '';
		});
		if (exec === true) env.exec(scripts);
		else if (typeof exec === 'function') exec(scripts, text);
		return text;
	},

	/**
	 * Remove HTML tags from string.
	 */
	stripHtmlTags: function(string){
		return string.replace(/<[^>]*>/g, '');
	},

	substitute: function(string, object, regexp){
		return string.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) === '\\') return match.slice(1);
			return (object[name] != null) ? object[name] : '';
		});
	}

};