/*
---
name: view
requires: [adam, Base, router, history, dom.index, gesture, env, animate, mout]
...
*/

var global = require('../core/adam').global;
var Base = require('../class/base');
var animate = require('../fx/animate');
var router = require('../router/router');
var History = require('../router/history');
var mout = require('../mout/string');
var gesture = require('../mobile/gesture');
var env = require('../env/env.mobile.js');
var dom = require('../dom/index');
var Hawe = global.Hawe;
var $ = dom.parse;

var tapDisable = false;

function bound(){
	gesture(this.wrapper).on('tap', function(event) {
		if (tapDisable) return;
		tapDisable = true;
		setTimeout(function() { tapDisable = false; }, 500);
		var target = event.target;
		while (target.getAttribute
			&& target.getAttribute('data-role') !== 'back'
			&& target.getAttribute('data-role') !== 'forward')
		{
			target = target.parentNode;
			if (!target || target.tagName === 'BODY') {
				return;
			}
		}

		if(target.hasAttribute && target.getAttribute('data-role') === 'forward') {
			this.forwardFx();
			var href = target.getAttribute('data-href');
			if(env.isHybrid) {
				Hawe.redirect('http://' + location.host + href);
			}else {
				this.targetHref = href;
			}
		}else if(target.hasAttribute && target.getAttribute('data-role') === 'back') {
			var views = $(this.options.viewWraper+' .view');
			if(views.length <= 1) {
				this.forwardFx();
				this.targetHref = '';
			}else {
				if (env.isHybrid) Hawe.dismiss();
				else this.backFx();
			}
		}
	}.bind(this));
}

var View = Base.extend({

	options: {
		activeClass: 'active',
		customForward: function(oldView, newView){
			animate(newView, {opacity: 1}, 100);
		}/*,
		onForwardEnd: function(){}*/
	},

	initialize: function(options){
		this.setOptions(options);

		this.wrapper = $(this.options.viewWraper)[0];

		History.start({
			html5Mode: true,
			anchor: false
		});

		bound.call(this);
	},
	forwardFx: function() {
		var oldView = $('.' + this.options.activeClass)[0];
		var activeClass = this.options.activeClass;
		// active view 退场
		dom.setStyle(oldView, 'opacity', 1);
		animate(oldView, {opacity: 0}, 100)
		.then(function() {
			dom.hide(oldView).removeClass(oldView, activeClass);
		})
		// new view 进场
		.then(function() {
			var newView = document.createElement('div');
			newView.className = 'view ' + activeClass;
			dom.setStyle(newView, 'opacity', 0);
			this.wrapper.appendChild(newView);
			this.options.customForward(oldView, newView);
			this.emit('forwardEnd');
		}.bind(this));
	},
	backFx: function() {
		var views = $(this.options.viewWraper+' .view');
		var oldView = $('.'+this.options.activeClass)[0];
		var newView = views[views.length-2];
		animate(oldView, {opacity:0}, 100)
		.then(function() {
			this.wrapper.removeChild(oldView);
			dom.show(newView).addClass(newView, this.options.activeClass);
			animate(newView, {opacity:1}, 100);
			this.back();
		}.bind(this));
	},

	route: function(path) {
		var div = document.createElement('div');
		div.className = 'view ' + this.options.activeClass;
		this.wrapper.appendChild(div);
		router.route('get', path);
	},

	addRouter: function(path, fn){
		router.add('get', path, fn);
		this.on('forwardEnd', function(){
			History.updateLocation(mout.ltrim(this.targetHref, '/'));
		});
	},

	back: function() {
		history.back();
	}

});

module.exports = View;