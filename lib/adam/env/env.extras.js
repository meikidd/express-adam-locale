/*
---
name: env.extras
requires: env
...
*/


var env = require('./env');

var ua = navigator.userAgent.toLowerCase(),
	match = ua.match(/(maxthon|traveler|theworld|greenbrowser|360se|se|version)[\)\s\/:]([\w\d\.]+)?.*?/) || [null, 'unknown', 0],
	shell = match[1] === 'version' ? match[3] : match[1] === '360se' ? 'se360' : match[1],
	version = match[2];

if (shell !== 'unknown'){
	env.shell = shell;
	env[shell] = true;
}

if (version) env[shell + parseInt(version, 10)] = true;

module.exports = env;