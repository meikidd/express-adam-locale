/*
---
name: dom.ready
requires: [adam, dom.manipulation]
...
*/

var dom = require('../dom/manipulation');

var window = require('../core/adam').global;
var document = window.document;

var ready,
	fns = [],
	checks = [],
	shouldPoll,
	timer,
	testElement = document.createElement('div');

var domready = function(){
	clearTimeout(timer);
	if (!ready) {
		ready = true;
		dom.removeListener(document, 'DOMContentLoaded', domready);
		dom.removeListener(document, 'readystatechange', check);

		var fn, i = 0;
		while (fn = fns[i++]) fn.call(document);
	}
	// cleanup scope vars
	document = window = testElement = null;
};

var check = function(){
	for (var i = checks.length; i--;) if (checks[i]()){
		domready();
		return true;
	}
	return false;
};

var poll = function(){
	clearTimeout(timer);
	if (!check()) timer = setTimeout(poll, 10);
};

dom.addListener(document, 'DOMContentLoaded', domready);

/*<ltIE8>*/
// doScroll technique by Diego Perini http://javascript.nwbox.com/IEContentLoaded/
// testElement.doScroll() throws when the DOM is not ready, only in the top window
var doScrollWorks = function(){
	try {
		testElement.doScroll();
		return true;
	} catch (e){}
	return false;
};
// If doScroll works already, it can't be used to determine domready
//   e.g. in an iframe
if (testElement.doScroll && !doScrollWorks()){
	checks.push(doScrollWorks);
	shouldPoll = true;
}
/*</ltIE8>*/

if (document.readyState) checks.push(function(){
	var state = document.readyState;
	return (state === 'loaded' || state === 'complete');
});

if ('onreadystatechange' in document) dom.addListener(document, 'readystatechange', check);
else shouldPoll = true;

if (shouldPoll) poll();

dom.addListener(window, 'load', domready);

module.exports = function(fn){
	if (ready) fn.call(document);
	else if (fns) fns.push(fn);
};