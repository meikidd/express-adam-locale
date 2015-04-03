/*
---
name: animate
requires: [adam, Class, Morph, Batch, isEmptyObject, dom.style]
...
*/
var local = require('../core/adam');
var Class = require('../class/class');
var Morph = require('./morph');
var Batch = require('./batch');
var lazy = require('../lazy/lazy');
var dom = require('../dom/style');

var isEmptyObject = require('../mout/types').isEmptyObject;

var global = local.global;

var setStyle = (function(){
    function set( el, props ){
        for( var k in props ) {
            var compact = k.indexOf('$') == 0;
            dom.setStyle( el, compact ? k.slice(1) : k, props[k], compact );
        }
    }
    return function( el, props ){
        if ( typeof el.length != 'undefined' ) {
            for( var i=0,l=el.length; i<l; i++ ) {
                set( el, props );
            }
        }
        else {
            set( el, props );
        }
    };
})();

/**
 * Most code of `defaultDisplay()` comes from jQuery
 * See: https://github.com/jquery/jquery/blob/7e09619cdf2813f2cd9da600ba682be8f91b08b6/src/css/defaultDisplay.js
 */
var defaultDisplay = (function(){
    var iframe,
        elemdisplay = {
    		// Support: Firefox
    		// We have to pre-define these values for FF (#10227)
    		HTML: "block",
    		BODY: "block"
    	};

    function actualDisplay( name, doc ) {
        var display,
            el = doc.createElement( name );
        doc.body.appendChild( el );
		display = dom.getStyle( el, 'display' );
        doc.body.removeChild( el );
    	return display;
    }

    function appendIframe(){
        if ( !iframe ) {
            iframe = document.createElement('iframe');
            iframe.frameborder = '0';
            iframe.width = '0';
            iframe.height = '0';
        }
        doc.body.appendChild( iframe );
        return iframe;
    }

    function detachIframe(){
        doc.body.removeChild( iframe );
    }

    return function ( nodeName ) {
    	var doc = document,
    		display = elemdisplay[ nodeName ];

    	if ( !display ) {
    		display = actualDisplay( nodeName, doc );

    		// If the simple way fails, read from inside an iframe
    		if ( display === "none" || !display ) {

    			// Use the already-created iframe if possible
    			iframe = appendIframe();

    			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
    			doc = ( iframe[ 0 ].contentWindow || iframe[ 0 ].contentDocument ).document;

    			// Support: IE
    			doc.write();
    			doc.close();

    			display = actualDisplay( nodeName, doc );
    			detachIframe();
    		}

    		// Store the correct default display
    		elemdisplay[ nodeName ] = display;
    	}

    	return display;
    };
})();

var AnimationChain = new Class({

    el: null,             // Cached element[s]
    currentNodes: null,   // Need this cache when `cancle()`, `pause()`, `resume()`
    running: false,
    paused: false,
    chain: [],
    loopBuffer: [],

    initialize: function(){
        this.delayToStart = lazy.doWhenIdle(function(){
            this.paused = false;
            this.callChain();
        }.bind(this), 100/6);
    },

    delayToStart: null,

    destroy: function(){
        this.off();
    },

    callChain: function(){
        var self = this, sub = this.chain.shift();
        if ( sub ) {
            if ( !this.running ) this.running = true;
            var waitCount = sub.length;
            this.loopBuffer.push(sub);
            this.currentNodes = sub;
            sub.forEach(function( node ){
                node.start(function(){
                    if ( node.args && node.args.callback ) { node.args.callback.call( global ); }
                    if ( --waitCount <= 0 ) self.callChain();
                });
            });
        }
        else {
            this.running = false;
        }
    },

    pushChain: function( type, args ){
        var sub = [];
        this.chain.push( sub );
        if ( arguments.length === 0 ) {
            return this;
        }
        else {
            sub.push( this.geneChainNode( type, args ) );
        }

        if ( !this.running ) this.delayToStart();
    },

    pushAnd: function( type, args ){
        var sub = this.chain[ this.chain.length -1 ];
        if ( sub ) {
            sub.push( this.geneChainNode( type, args ) );
        }
        if ( !this.running ) this.delayToStart();
    },

    geneChainNode: function( type, args ){
        switch ( type ) {
            case 'fx':
                return {
                    inst: this,
                    type: type,
                    animer: null,
                    args: args,
                    start: function( fn ){
                        var el, args = this.args, self = this;
                        el = this.el = this.inst.el = args.el || this.inst.el;
                        if ( !el ) throw new Error('Must assign an element for animate.');
                        if ( this.args.beforeStart ) this.args.beforeStart.call( this );
                        args.link = 'cancel';
                        // Use stale animater if it exists.
                        this.animer = ( this.animer ? this.animer : new (el.length ? Batch : Morph)( el, args).on('complete', function(){
                            if ( self.args.afterDone ) self.args.afterDone.call( self );
                            fn();
                        }) ).start( args.to );
                    },
                    cancel: function(){
                        this.animer.cancel();
                    },
                    pause: function(){
                        this.animer.pause();
                    },
                    resume: function(){
                        this.animer.resume();
                    }
                };
            case 'immediate':
                return {
                    inst: this,
                    type: type,
                    args: args,
                    start: function( fn ){
                        this.args.func();
                        fn();
                    },
                    cancel: function(){},
                    pause: function(){},
                    resume: function(){}
                };
            case 'delay':
                return {
                    inst: this,
                    type: type,
                    args: args,
                    timer: null,
                    duration: null,
                    startTime: null,
                    callback: null,
                    start: function( fn ){
                        this.startTime = Date.now();
                        this.callback = fn;
                        this.duration = Number(this.args.duration) || 0;
                        this.timer = setTimeout( fn, this.duration );
                    },
                    cancel: function(){
                        clearTimeout(this.timer);
                    },
                    pause: function(){
                        clearTimeout(this.timer);
                        this.duration -= Date.now() - this.startTime;
                    },
                    resume: function(){
                        this.startTime = Date.now();
                        this.timer = setTimeout( this.callback, this.duration );
                    }
                };
            case 'custom':
                return {
                    inst: this,
                    type: type,
                    args: args,
                    paused: false,
                    complete: false,
                    callback: null,
                    canceled: false,
                    start: function( fn ){
                        this.paused   = false;
                        this.complete = false;
                        this.canceled = false;
                        this.callback = fn;
                        this.args.func( function(){
                            if ( !this.paused && !this.canceled ) fn();
                            this.complete = true;
                        });
                        return this;
                    },
                    cancel: function(){
                        this.canceled = true;
                    },
                    pause: function(){
                        if ( !this.complete ) this.paused = true;
                    },
                    resume: function(){
                        if ( this.complete ) this.callback();
                        else  this.paused = false;
                    }
                };
            case 'loop':
                return {
                    inst: this,
                    start: function( fn ){
                        this.inst.chain = this.inst.loopBuffer;
                        this.inst.loopBuffer = [];
                        fn();
                        return this;
                    },
                    cancel: function(){},
                    pause: function(){},
                    resume: function(){}
                };
        }
    },

    // then()
    // then( function (){} ) **sync**
    // then( function ( resolve ){  } ) **async**
    // then( prop, value [, duration, transitions, callback] )
    // then( { props:values... }, [, duration, transitions, callback] )
    // then( el[s], prop, value [, duration, transitions, callback] )
    // then( el[s], { props:values... }, [, duration, transitions, callback] )
    then: function( arg0, prop, value, duration, transitions, callback ){
        if ( arguments.length === 0 ) {
            this.pushChain();
        }
        else if ( arguments.length == 1 ) {
            if ( local.type( arg0 ) == 'function' ) {
                if ( /function.+?\(\s*\S+.*\)/.test( arg0 ) ) {
                    this.pushChain('custom',  { func: arg0 });
                }
                else {
                    this.pushChain('immediate', { func: arg0 });
                }
            }
            else if ( local.type( arg0 ) == 'object' ) {
                if ( local.type( arg0.then ) == 'function' ) {
                    this.pushChain('promise', arg0);
                }
                else {
                    this.pushChain('fx', parseAnimArgs.apply(this, arguments));
                }
            }
            else {
                this.pushChain('fx', parseAnimArgs.apply(this, arguments));
            }
        }
        else {
            this.pushChain('fx', parseAnimArgs.apply(this, arguments));
        }

        return this;
    },

    // and( function (){} ) **sync**
    // and( function ( resolve ){} ) **async**
    // and( prop, value [, duration, transitions, callback] )
    // and( { props:values... }, [, duration, transitions, callback] )
    // and( el, prop, value [, duration, transitions, callback] )
    // and( el, { props:values... }, [, duration, transitions, callback] )
    and: function( arg0, prop, value, duration, transitions, callback ){
        if ( arguments.length > 1 ) {
            var argsCpy = Array.slice(arguments, 0);
            this.pushAnd('fx', parseAnimArgs.apply(this, arguments));
        }
        else if ( arguments.length == 1 && local.type( arg0 ) == 'function'  ) {
            if ( /function.+?\(\s*\S+.*\)/.test( arg0 ) ) {
                this.pushAnd('custom', { func: arg0 });
            }
            else {
                this.pushAnd('immediate', { func: arg0 });
            }
        }

        return this;
    },

    setStyle: function( el, prop, value ){
        var argsCpy = Array.slice(arguments), e;

        if ( ~'element|array|collection'.indexOf( local.type( argsCpy[0] ) ) ) {
            e = argsCpy[0];
            argsCpy.shift();
        }

        var p = argsCpy[0],
            v = argsCpy[1],
            props = local.type( p ) == 'object' ? p : {};
        if ( typeof p === 'string' ) {
            props[ p ] = v;
        }
        if ( isEmptyObject(props) ) throw new Error('Must assign some property for setStyle().');

        this.pushAnd('immediate', {
            el: e,
            inst: this,
            props: props,
            func: function(){
                var el = this.el || this.inst.el;
                if ( !el ) throw new Error('Must assign an element for setStyle().');
                var props = this.props;
                setStyle( el, props );
            }
        });

        return this;
    },

    delay: function( duration, callback ){
        this.pushChain('delay', {
            callback: local.type( callback ) == 'function' ? callback : undefined,
            duration: duration
        });
        return this;
    },

    cancel: function(){
        if ( this.currentNodes ) {
            this.currentNodes.forEach(function( node ){
                node.cancel();
            });
        }
        this.chain = this.loopBuffer.concat( this.chain );
        this.loopBuffer = [];
        this.running = false;
        return this;
    },

    pause: function(){
        // 动画运行且未暂停时执行pause，动画将被暂停
        if ( this.running && !this.paused ) {
            this.paused = true;
            if ( this.currentNodes ) {
                this.currentNodes.forEach(function( node ){
                    node.pause();
                });
            }
            return this;
        }
        else if ( !this.running ) {
            this.delayToStart.pause();
        }
        return this;
    },

    resume: function(){
        // 动画被暂停时执行resume，则动画恢复执行
        if ( this.running && this.paused ) {
            this.paused = false;
            if ( this.currentNodes ) {
                this.currentNodes.forEach(function( node ){
                    node.resume();
                });
            }
            return this;
        }
        // 未开始运行时执行resume，则开始运行动画
        else if ( !this.running ){
            this.paused = false;
            this.delayToStart();
        }
        return this;
    },

    loop: function(){
        this.pushChain('loop');
        return this;
    }

});

// TODO 对动画进行中的元素执行animate方法时的打断机制
function cancelStaleAnimation(  ){

}

var shortcut = {
    'fadeIn': {
        to: {
            opacity: 1
        },
        beforeStart: function() {
            var els = typeof this.el.length == 'undefined' ? [this.el]:this.el;
            for( var i=0, l=els.length; i<l; i++ ) {
                setStyle( this.el, {
                    opacity: 0,
                    display: defaultDisplay( els[i].nodeName )
                });
            }
        },
        afterDone: function() {
            setStyle( this.el, 'opacity', '' );
        }
    },
    'fadeOut': {
        to: {
            opacity: 0
        },
        afterDone: function() {
            setStyle( this.el, {
                display: 'none',
                opacity: ''
            });
        }
    }
    // TODO
    // 'slideDown',
    // 'slideUp',
    // 'slideToggle',
};

function parseUniqueTypeArgs ( args, types ){
    var res = {};
    for( var i=0,l=args.length; i<l; i++ ) {
        for( var k in types ) {
            if ( local.type( args[i] ) == types[k] ) {
                res[k] = args[i];
                delete types[k];
                break;
            }
        }
    }
    return res;
}

/**
 * el                        {elements|array|collection}
 * prop|props|animationType  {string|object|string}
 * [value]                   {mixed}
 * duration                  {Number}
 * transitions               {String}
 * callback                  {Function}
 *
 * Note: args.to = { prop: value }
 */
function parseAnimArgs ( el, prop, value, duration, transitions, callback ){
    var argsCpy = Array.slice(arguments, 0)
        args = {};

    if ( ~'element|array|collection'.indexOf( local.type( argsCpy[0] ) ) ) {
        args.el = argsCpy[0];
        argsCpy.shift();
    }
    args.to = argsCpy[0];
    var propType = adam.type( args.to );
    if ( propType == 'string' ) {
        var sc = shortcut[ args.to ];
        if ( sc ) {
            local.extend.call( args, sc );
            args.to = sc.to;
            argsCpy.shift();
        }
        else {
            args.to = {};
            args.to[argsCpy[0]] = argsCpy[1];
            argsCpy.shift();
            argsCpy.shift();
        }
    }
    else if ( propType == 'object' ) {
        argsCpy.shift();
    }
    else {
        throw new Error('Must assign a property for animate().');
    }

    adam.extend.call( args, parseUniqueTypeArgs( argsCpy, {
        duration: 'number',
        transitions: 'string',
        callback: 'function',
    }) );

    return args;
}

// animate( el, prop, value [, duration, transitions, callback] )
// animate( el, { props:values... }, [, duration, transitions, callback] )
function animate ( el, prop, value, duration, transitions, callback ) {
    if ( !~'element|array|collection'.indexOf( local.type( el ) ) ) {
        throw new Error('Must assign an element for animate().');
    }

    var newChain = new AnimationChain();
    return newChain.then.apply( newChain, arguments );
}


module.exports = animate;
