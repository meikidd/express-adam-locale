/*
---
name: dom.index
requires: [dom, dom.class, dom.data, dom.manipulation, dom.selector, dom.style, dom.style.extras, dom.ready]
...
*/

var dom = require('./dom');

dom.extend(require('../dom/class'));
dom.extend(require('../dom/data'));
dom.extend(require('../dom/manipulation'));
dom.extend(require('../dom/selector'));
dom.extend(require('../dom/style'));
dom.extend(require('../dom/style.extras'));
dom.ready = require('../dom/ready');

module.exports = dom;