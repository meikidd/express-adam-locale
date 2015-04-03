/*
---
name: lazy
requires: [adam, Emitter, dom.style, dom.manipulation, support, loader, Request]
...
*/

var global = require('../core/adam').global;
var Emitter = require('../class/emitter');
var support = require('../support/support');
var loader = require('../loader/loader');
var Request = require('../request/request');
var dom = require('../dom/manipulation');
var getComputedStyle = require('../dom/style').getComputedStyle;

var document = global.document || {};

var lazy = new Emitter({
    pageHidden: false,
    pageVisibilityState: 'visible', // visible, hidden, prerender, unloaded
    networkIdle: false,
    userIdle: false
});

/* Utils.
 */
var doWhenIdle = lazy.doWhenIdle = function( fn, delay ){
    var timer;
    var run = function run( newDelay ){
        clearTimeout( timer );
        timer = setTimeout( fn, isNaN(newDelay) ? delay : Number(newDelay) );
    };
    run.pause = function(){
        clearTimeout( timer );
    };
    return run;
};

/* Page visibility.
 */
// Get propties with browser prefix.
var hiddenProp = support.property( document, 'hidden' );
var visibilityStateProp = support.property( document, 'visibilityState' );
var visibilitychangeEvent = (visibilityStateProp || '').toLowerCase().slice(0, -5) + 'change';

// Listening page visibility change event if it supports.
function updatePageVisibleProp(){
    lazy.pageHidden = document[ hiddenProp ];
    lazy.pageVisibilityState = document[ visibilityStateProp ];
}
if ( hiddenProp && visibilityStateProp ) {
    dom.addListener( document, visibilitychangeEvent, function(){
        updatePageVisibleProp();
        lazy.emit('pagevisibilitychange', lazy.pageHidden, lazy.pageVisibilityState );
    }, false);
}


/* Network idle.
 */
(function(){
    lazy.networkIdle = false;
    var enableEmit = false;
    var pendingCount = 0;

    var emitEventLazily = doWhenIdle(function(){
        lazy.emit('networkidlechange', lazy.networkIdle = !pendingCount );
    }, 500);

    function updatePendingCount ( adder ) {
        var staleCount = pendingCount;
        pendingCount = ( pendingCount += adder ) < 0 ? 0 : pendingCount;
        // 当页面同步资源完成加载，并且网络闲置状态产生了变化
        if ( enableEmit && !pendingCount != !staleCount ) {
            // 若当前有pending请求，则立即广播networkidlechange事件，告知闲置已结束
            if ( pendingCount > 0 ) emitEventLazily( 0 );
            // 若当前无pending请求，则等待此状态持续500ms后广播networkidlechange事件，告知已闲置
            else emitEventLazily();
        }
    };

    // 监听loader模块的加载行为
    loader.on('loadstart', function(){ updatePendingCount( 1 ); })
          .on('complete', function(){ updatePendingCount( -1 ); });

    // 监听所有Request实例的加载行为
    // Request.implement({
    //     initialize: function(){
    //         this.on('loadstart', function(){ updatePendingCount( 1 ); })
    //             .on('complete', function(){ updatePendingCount( -1 ); })
    //             .on('timeout', function(){ updatePendingCount( -1 ); });
    //     }
    // });

    // 页面同步资源加载完成后，开启事件广播开关，并立即检测一次。
    if ( document.readyState == 'complete' ) {
        enableEmit = true;
        updatePendingCount( 0 );
    }
    else {
        dom.addListener( global, 'load', function(){
            enableEmit = true;
            updatePendingCount( 0 );
        });
    }
})();


/* User idle.
 */
(function(){
    // 以局部变量noAction作为状态判断依据，以避免lazy.userIdle被覆写产生混乱
    var noAction = false;
    // 若用户500秒无动作，则将userIdle设为true，并广播事件
    var waitingForIdle = doWhenIdle( function(){
        lazy.emit('useridlechange', lazy.userIdle = noAction = true );
    }, 500);

    [   // PC events
        'mousedown', 'mousemove', 'mouseup', 'keydown', 'keyup', 'input', 'scroll',
        // Touch device events
        'touchstart', 'touchmove', 'touchend'
    ].forEach(function( event ){
        // 监听用户的各种动作
        dom.addListener( global, event, function(){
            // 若用户原来处于无动作状态，则立即将userIdle设为false，并立即广播事件
            if ( noAction ) {
                lazy.emit('useridlechange', lazy.userIdle = noAction = false );
            }
            // 重置等待闲置计时器
            waitingForIdle();
        });
    });
})();


/* Element visible check.
 */
function elementOverflowVisible ( element ){
    var rect = element.getBoundingClientRect();
    var clientX = rect.left;
    var clientY = rect.top;
    var height  = rect.height;
    var width   = rect.height;
    var parent  = element.parentNode;
    var parentRect;
    // Check if element has not been hidden by screen.
    if ( clientY > 0 - height && clientY < global.innerHeight && clientX > 0 - width && clientX < global.innerWidth ) {
        // Check if element has been hidden by parent element with `overflow: hidden|auto` style.
        while( parent && parent != document ) {
            if ( ~'auto|hidden'.indexOf( getComputedStyle( parent, 'overflow' ) ) ) {
                parentRect = parent.getBoundingClientRect();
                if (
                     clientY < parentRect.top - height
                  || clientY > parentRect.top + parentRect.height
                  || clientX < parentRect.left - width
                  || clientX > parentRect.left + parentRect.width
                ) {
                    return false;
                }
            }
            parent  = parent.parentNode;
        }
    }
    else {
        return false;
    }

    return true;
}

function elementCssVisible ( element ) {
    return element.offsetWidth > 0 && element.offsetHeight > 0;
}

lazy.visible = function ( element ) {
    return elementOverflowVisible( element )
        && elementCssVisible( element );
};


module.exports = lazy;
