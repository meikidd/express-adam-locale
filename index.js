/**!
 * express-adam-locale - index.js
 *
 * Author:
 *   meikidd <meikidd@gmail.com>
 */

'use strict';

require('./lib/adam/polyfill/Array');
const Path = require('path');
const debug = require('debug')('express-adam-locale');
const Locale = require('./lib/adam/locale/locale');

const languageSupported = [{
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

  return function *(next) {
    this.locals = this.locals || {};
    if(this.locals._i18n_ || this.locals._i18n_current_ || this.locals._i18n_supported_) {
        yield next;
    }

    if(this.path == opts.set_url) {
      var lang = this.request.query.lang;
      this.session.eal_i18n_current = lang;
      debug('set session.eal_i18n_current:'+lang);
      this.redirect('back', '/');
    }else {
      this.locals._i18n_current_ = this.session.eal_i18n_current || opts.default || 'en-us';
      debug('set locals._i18n_current_:'+this.locals._i18n_current_);
      this.app.eal.use(this.locals._i18n_current_);
      this.locals._i18n_ = this.app.eal.get();
      this.locals._i18n_supported_ = opts.supported;
      yield next;
    }
  }
}