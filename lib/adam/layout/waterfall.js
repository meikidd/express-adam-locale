/*
---
name: waterfall
requires: [Base, Request, lazy, dom.style, dom.manipulation]
...
*/

var Base = require('../class/base');
var Request = require('../request/request');
var lazy = require('../lazy/lazy');
var dom = require('../dom/style');
var evt = require('../dom/manipulation');

var Waterfall = Base.extend({

	options: {
		trigger: '',
		wrapper: '',
		url: '',
		params: {}
	},
	cache: [],
	waterfallCache: [],
	render: function() {
		return '';
	},

	filter: function(data) {
		return data;
	},
	initialize: function(options){
		this.setOptions(options);

		var ul = this.options.wrapper.getElementsByTagName('ul');
		this.col = ul.length;
		for (var i = 0; i < this.col; i++) {
			this.waterfallCache.push([]);
		}
		this.bindEvent();
		this.getData();
	},

	bindEvent: function() {
		// 参考文档lazy.md #doWhenIdle
		evt.addListener(window, 'scroll', lazy.doWhenIdle(function(){
			if(lazy.visible(this.options.trigger)) this.getData();
		}.bind(this), 100));
	},

	// 数据缓存
	cacheData: function(data) {
		if(!Array.isArray(data)) return;
		this.cache = this.cache.concat(data);
		var ul = this.options.wrapper.getElementsByTagName('ul');
		for (var i = 0; i < data.length; i++) {
			var index = this.getMinHeightIndex();
			this.waterfallCache[index].push(data[i]);
			var li = document.createElement('li');
			li.innerHTML = this.options.render(data[i]);
			ul[index].appendChild(li);
		}
	},

	// 瀑布流布局
	getMinHeightIndex: function() {
		var minheight = 0;
		var index = 0;
		var ul = this.options.wrapper.getElementsByTagName('ul');
		for (var i = 0; i < this.col; i++) {
			var height = parseInt(dom.getStyle(ul[i], 'height'), 10);
			if(i === 0) {
				minheight = height;
			}else if(height < minheight) {
				minheight = height;
				index = i;
			}
		}
		return index;
	},
	// 无限加载
	getData: function() {
		new Request({
			url: this.options.url,
			data: this.options.params,
			method: 'get',
			format:'json',
			onSuccess: function(data) {
				this.emit('getdata');
				data = this.options.filter(JSON.parse(data));
				this.cacheData(data);
			}.bind(this)
		}).send();
	},
	reset: function(opt) {
		for (var k in opt) {
			this.options.params[k] = opt[k];
		}
		this.getData();
	}
});

module.exports = Waterfall;