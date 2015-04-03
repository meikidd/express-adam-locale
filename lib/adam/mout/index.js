/*
---
name: mout.index
requires: [mout, mout.array, mout.collection, mout.color, mout.hash, mout.object, mout.querystring, mout.random, mout.string, mout.types]
...
*/

var mout = require('./mout');

mout.mixin(require('../mout/array'));
mout.mixin(require('../mout/collection'));
mout.mixin(require('../mout/color'));
mout.mixin(require('../mout/object'));
mout.mixin(require('../mout/querystring'));
mout.mixin(require('../mout/random'));
mout.mixin(require('../mout/string'));
mout.mixin(require('../mout/types'));
mout.mixin('murmurhash', require('../mout/hash'));

module.exports = mout;