# koa-adam-locale

 Simple Multi Language Middleware for Koa.

## Installation

```js
$ npm install koa-adam-locale
```

## Example
app.js:
```js
var Path = require('path');
var View = require('koa-views')
var KAL = require('koa-adam-locale');
var Session = require('koa-session');
var koa = require('koa');
var app = koa();

app.keys = ['some secret hurr'];
app.use(Session(app));

/* i18n */
app.use(KAL({
	path: Path.resolve(__dirname, 'i18n')
}, app));

/* templating */
app.use(View(__dirname + '/views', {
	default: 'ejs'
}));

app.use(function * () {
	if(!this.path == '/') return;
	yield this.render('locale')
})

app.listen(process.argv[2])
```
i18n/en-us.json
```json
{
	"hello": "hello",
	"world": "world"
}
```
views/locale.ejs
```html
<p><%= _i18n_.hello %>, <%= _i18n_.world %>.</p>
<p>current:<%= _i18n_current_ %>.</p>
<% for(var i in _i18n_supported_) { %>
<a href='/set_locale?lang=<%= _i18n_supported_[i].code %>'>
	switch to <%= _i18n_supported_[i].lang %>
</a>
<% } %>
```

## Options

### path {String}
The folder path of i18n files
### supported {Array}
The supported languages. default value: `[{code:'en-us', lang:'English'},{code:'zh-cn', lang:'简体中文'}]`
#### Example:
```js
app.use(KAL({
  path: Path.resolve(__dirname, 'i18n'),
  supported: [{code:'en-us', lang:'English'},{code:'zh-cn', lang:'简体中文'}]
}, app));
```
### default {String}
Default language

### set_url {String}
The url to switch current language. default value: `/set_locale`
#### Example:
```js
app.use(KAL({
  path: Path.resolve(__dirname, 'i18n'),
  set_url: '/set_locale'
}, app));

```
Then you can set current language by request url like this '/set_locale?lang=en-us'


## Local Params
The following three params are set to `this.locals`  
- `this.locals._i18n_` {Object}
- `this.locals._i18n_current_` {String}
- `this.locals._i18n_supported_` {Array}

## Debug

Set the `DEBUG` environment variable to `koa-adam-locale` when starting your server.

```bash
$ DEBUG=koa-adam-locale
```

## License

  MIT
