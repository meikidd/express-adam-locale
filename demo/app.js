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

