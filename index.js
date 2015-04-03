/**!
 * express-adam-locale - index.js
 *
 * Author:
 *   meikidd <meikidd@gmail.com>
 */

'use strict';

require('./lib/adam/polyfill/Array');
var Path = require('path');
var debug = require('debug')('express-adam-locale');
var Locale = require('./lib/adam/locale/locale');

var languageSupported = [{
  code:'en-us',
  lang:'English'
}];

module.exports = function(opts, app){

  var eal = Locale('express-adam-locale');
  if (opts && typeof opts.use === 'function') {
    var tmp = app;
    app = opts;
    opts = tmp;
  }

  opts.supported = opts.supported || languageSupported;
  opts.set_url = opts.set_url || '/set_locale';

  debug('opts.path. path:'+opts.path);
  for(var i in opts.supported) {
    if (opts.supported.hasOwnProperty(i)) {
      var code = opts.supported[i].code;
      debug('opts.supported. code:'+code);
      var content = require(Path.resolve(opts.path, code)) || {};
      eal.define(code, content);
    }
  }
  app.eal = eal;

  return function (req, res, next) {
    res.locals = res.locals || {};
    if(res.locals._i18n_ || res.locals._i18n_current_ || res.locals._i18n_supported_) {
        debug('next().');
        next();
    }

    if(req.path == opts.set_url) {
      var lang = req.query.lang;
      req.session.eal_i18n_current = lang;
      debug('set session.eal_i18n_current:'+lang);
      res.redirect(302, 'back');
    }else {
      res.locals._i18n_current_ = req.session.eal_i18n_current || opts.default || 'en-us';
      debug('set locals._i18n_current_:'+res.locals._i18n_current_);
      req.app.eal.use(res.locals._i18n_current_);
      res.locals._i18n_ = req.app.eal.get();
      res.locals._i18n_supported_ = opts.supported;
      debug('set locals._i18n_supported_: %o', res.locals._i18n_supported_);
      next();
    }
    next();
  }
}