# express-adam-locale

 Simple Multi Language Middleware for Express.

## Installation

```js
$ npm install express-adam-locale --save
```

## Example
app.js:
```js
var Path = require('path');
var express = require('express');
var EAL = require('../index');
var session = require('express-session');
var app = express();

app.use(session({ 
	secret: 'express-adam-locale'
}));

/* i18n */
app.use(EAL({
	path: Path.resolve(__dirname, 'i18n'),
	supported:[{
		code:'en-us',
		lang:'English'
	}, {
		code:'zh-cn',
		lang:'中文简体'
	}]
}, app));

/* templating */
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

/* page */
app.get('/', function(req, res){
	res.render('locale');
});

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
app.use(EAL({
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
app.use(EAL({
  path: Path.resolve(__dirname, 'i18n'),
  set_url: '/set_locale'
}, app));

```
Then you can set current language by request url like this '/set_locale?lang=en-us'


## Local Params
The following three params are set to `res.locals`  
- `res.locals._i18n_` {Object}
- `res.locals._i18n_current_` {String}
- `res.locals._i18n_supported_` {Array}

## Debug

Set the `DEBUG` environment variable to `express-adam-locale` when starting your server.

```bash
$ DEBUG=express-adam-locale
```

## License

  MIT
