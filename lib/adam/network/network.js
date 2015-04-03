/*
---
name: network
requires: [adam, Emitter, clone, sortBy]
...
*/

var local = require('../core/adam');
var mout = require('../mout/collection');
var sortBy = require('../mout/array').sortBy;

var Emitter = require('../class/emitter');

var doc = local.global.document || {};

var network = new Emitter();

// Rank rule, ranking the current network through bandwidth.
// 网速排名规则，根据带宽给当前网速排名。
var bandwidthRank = network.bandwidthRank = [
    // Very bad - Bandwith: < 240kbps, Downlink speed: < 30 KB/s
    [ 0, 240*1024 ],
    // Bad - Bandwith: 240kbps ~ 1 mbps, Downlink speed: 30 KB/s ~ 128.0 KB/s
    [ 240*1024, 1024*1024] ,
    // Normal - Bandwith: 1 mbps ~ 3 mbps, Downlink speed: 128.0KB/s ~ 384.0KB/s
    [ 1024*1024, 3*1024*1024 ],
    // Good - Bandwith: 3 mbps ~ 9 mbps, Downlink speed: 384.0KB/s ~ 1.1MB/s
    [ 3*1024*1024, 9*1024*1024 ],
    // Excellent - Bandwith: > 9 mbps, Downlink speed: > 1.1MB/s
    [ 9*1024*1024 ]
];

var ranking = network.ranking = function( bandwidth ){
    var rank = 0;
    bandwidthRank.every(function( level, rankIndex ){
        if (
               ( level.length == 2 && bandwidth >= level[0] && bandwidth <= level[1] )
            || ( level.length == 1 && bandwidth >= level[0] )
        ) {
            rank = rankIndex;
            return false;
        }
        else {
            return true;
        }
    });
    return rank;
};

// Load this image first, in order to finish DNS looking up, and trigger Keep-alive.
// 首张被加载的图片，用于：完成DNS look up、触发Keep-alive，让后续图片的耗时组成更纯粹。
var firstTestImage = { name: '124B', url: 'http://style.aliunicorn.com/wimg/speedtest/124.png', bytes: 124 };

// Images for speed testing, group by fuzzy speed range.
// 测速所需图片，根据模糊网速的不同，采用不同组合的图片，以便提高测速精度、减少测速流量开销和时间开销。
// TODO 模糊速度更多的是反映网络时延，需要将分组依据改为只跟下行网速有关的值。
var testImageList = [
    {
        fuzzySpeedRange: [ 0, 0.3 ], // B/s
        images: [
            { name: '312B', url: 'http://style.aliunicorn.com/wimg/speedtest/312.jpg', bytes: 312 },
            { name: '1KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/1127.jpg', bytes: 1127 }
        ]
    },
    {
        fuzzySpeedRange: [ 0.3, 0.8 ],
        images: [
            { name: '124B', url: 'http://style.aliunicorn.com/wimg/speedtest/124.png', bytes: 124 },
            { name: '2KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/2040.jpg', bytes: 2040 },
            { name: '4KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/4066.jpg', bytes: 4066 },
            { name: '8KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/8131.jpg', bytes: 8131 }
        ]
    },
    {
        fuzzySpeedRange: [ 0.8, 2.5 ],
        images: [
            { name: '124B', url: 'http://style.aliunicorn.com/wimg/speedtest/124.png', bytes: 124 },
            { name: '124B', url: 'http://style.aliunicorn.com/wimg/speedtest/124.png', bytes: 124 },
            { name: '124B', url: 'http://style.aliunicorn.com/wimg/speedtest/124.png', bytes: 124 },
            { name: '124B', url: 'http://style.aliunicorn.com/wimg/speedtest/124.png', bytes: 124 },
            { name: '2KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/2040.jpg', bytes: 2040 },
            { name: '4KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/4066.jpg', bytes: 4066 },
            { name: '8KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/8131.jpg', bytes: 8131 },
            { name: '16KB', url: 'http://style.aliunicorn.com/wimg/speedtest/15912.jpg', bytes: 15912 }
        ]
    },
    {
        fuzzySpeedRange: [ 2.5 ],
        images: [
            { name: '2KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/2040.jpg', bytes: 2040 },
            { name: '2KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/2040.jpg', bytes: 2040 },
            { name: '8KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/8131.jpg', bytes: 8131 },
            { name: '8KB',  url: 'http://style.aliunicorn.com/wimg/speedtest/8131.jpg', bytes: 8131 },
            { name: '16KB', url: 'http://style.aliunicorn.com/wimg/speedtest/15912.jpg', bytes: 15912 },
            { name: '16KB', url: 'http://style.aliunicorn.com/wimg/speedtest/15912.jpg', bytes: 15912 },
            { name: '32KB', url: 'http://style.aliunicorn.com/wimg/speedtest/32320.jpg', bytes: 32320 },
            { name: '64KB', url: 'http://style.aliunicorn.com/wimg/speedtest/63586.jpg', bytes: 63586 }
        ]
    }

    // All images:
    // { name: '124B', url: 'http://style.aliunicorn.com/wimg/speedtest/124.png', bytes: 124 },
    // { name: '312B', url: 'http://style.aliunicorn.com/wimg/speedtest/312.jpg', bytes: 312 },
    // { name: '1KB', url: 'http://style.aliunicorn.com/wimg/speedtest/1127.jpg', bytes: 1127 },
    // { name: '2KB', url: 'http://style.aliunicorn.com/wimg/speedtest/2040.jpg', bytes: 2040 },
    // { name: '4KB', url: 'http://style.aliunicorn.com/wimg/speedtest/4066.jpg', bytes: 4066 },
    // { name: '8KB', url: 'http://style.aliunicorn.com/wimg/speedtest/8131.jpg', bytes: 8131 },
    // { name: '16KB', url: 'http://style.aliunicorn.com/wimg/speedtest/15912.jpg', bytes: 15912 },
    // { name: '32KB', url: 'http://style.aliunicorn.com/wimg/speedtest/32320.jpg', bytes: 32320 },
    // { name: '64KB', url: 'http://style.aliunicorn.com/wimg/speedtest/63586.jpg', bytes: 63586 },
    // { name: '128KB', url: 'http://style.aliunicorn.com/wimg/speedtest/127604.jpg', bytes: 127604 },
    // { name: '256KB', url: 'http://style.aliunicorn.com/wimg/speedtest/257340.jpg', bytes: 257340 },
    // { name: '512KB', url: 'http://style.aliunicorn.com/wimg/speedtest/519246.jpg', bytes: 519246 },
    // { name: '1024KB', url: 'http://style.aliunicorn.com/wimg/speedtest/1018716.jpg', bytes: 1018716 },
    // { name: '2048KB', url: 'http://style.aliunicorn.com/wimg/speedtest/1996068.jpg', bytes: 1996068 }
];

var getTestImages = function( fuzzySpeed ){
    var index = 0;
    testImageList.every(function( item, itemIndex ){
        var range = item.fuzzySpeedRange;
        index = itemIndex;
        if (
               ( range.length == 2 && fuzzySpeed >= range[0] && fuzzySpeed <= range[1] )
            || ( range.length == 1 && fuzzySpeed >= range[0] )
        ) {
            return false;
        }
        else {
            return true;
        }
    });
    return mout.clone( testImageList[ index ].images );
};

// Transform number into string with binary prefix.
// 为数字加上二进制单位前缀
// e.g. 1024 -> '1 K', 1000 -> '0.9 K', 10 -> '10 '
network.binaryPrefix = function( number, toFixedValue ){
    var prefixes = [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ];

    number = Number(number);
    toFixedValue = isNaN(toFixedValue) ? 1 : Number(toFixedValue);

    if ( isNaN(number)  ) {
        number = null;
    }
    else {
        var i = 0
          , l = prefixes.length - 1;
        while( i < l && number > 1000 ) {
            number = number / 1024;
            i++;
        }
        number = (number).toFixed( toFixedValue ) + ' ' + prefixes[ i ];
    }
    return number;
};

// Calculate cases when each image finished loading.
// 当有测速图片加载成功时做计算。
function calculateProgress ( result, currIndex, timeCost ){
    var testImages = result.testImages;
    testImages[ currIndex ].timeCost = timeCost;
    for( var i = 0, l = currIndex; i <= l; i++ ) {
        if ( !result.resRows[ i ] ) {
            result.resRows[ i ] = [];
        }
        var row = result.resRows[ i ];
        for( var j = currIndex; j >= 0; j-- ) {
            if ( j >= i) {
                if ( row[j] ) {
                    continue;
                }
                var newItem = {}
                  , speed = (testImages[j].bytes - testImages[i].bytes) / (testImages[j].timeCost - testImages[i].timeCost) * 1000;
                if ( !speed || speed == Infinity || speed < 0 ) {
                    speed = null;
                    newItem.bad = true;
                }
                newItem.speed = speed;
                result.resRows[ i ][j] = newItem;
            }
        }
    }

}

// Calculate final result when all images finished loading.
// 所有图片都完成加载时进行一次最终结果计算，当前结果计算采用平均值算法。
function calculateResult ( result ) {
    var availableCases = [];

    // 剔除无用结果
    result.resRows.forEach(function( row ){
        row.forEach(function( item ){
            if ( !item.bad ) {
                availableCases.push( item );
            }
        });
    });

    // 忽略一个或数个最大值，使测速结果更稳定，并使测速结果偏低。
    if ( availableCases.length > result.testImages.length ) {
        var ignoreLength = parseInt( Math.sqrt( result.testImages.length ) );
        availableCases = sortBy( availableCases, function(item){ return item.speed; });
        while( ignoreLength-- > 0 ) {
            availableCases[ ignoreLength ].ignore = true;
        }
        availableCases = availableCases.filter(function( item ){ return !item.ignore; });
    }

    if ( availableCases.length > 0 ) {
        result.speed = availableCases.reduce(function(a, b){
            return a + b.speed;
        }, 0) / availableCases.length;
        result.bandwidth = result.speed * 8;
        result.rank = ranking( result.bandwidth );
    }
    else {
        result.bad = true; // Need retry.
    }

}


// Functions for loading image.
// 加载图片所需的方法
var loadTestImage = (function(){
    var count = 0;
    return function loadTestImage ( testImage, callback, errorCallback ){
        var img = new Image()
          , startTime = Date.now()
          , bytes = testImage.bytes;
        img.onload = function(){
            var timeCost = Date.now() - startTime;
            if ( typeof callback == 'function' ) {
                callback( bytes, timeCost, testImage );
            }
        };
        img.onerror = function(){
            if ( typeof errorCallback == 'function' ) {
                errorCallback( testImage );
            }
        };
        img.src = testImage.url + '?_=' + startTime  + count++;
    };
})();


// Functions for serial task management.
// 串行队列实现。
var pushSerialTask, clearSerialQueue;
(function(){
    var serialQueue = []
      , noPending = true
      , skipNextCallback = false;

    pushSerialTask = function pushSerialTask ( task ){

        if ( typeof task != 'function' ) {
            return ;
        }

        serialQueue.push(function(){
            // Detect callback like `function ( done ) {}`, as an async stick.
            if ( /^function\s*\(\s*(\w+).+?/.test( task.toString() ) && RegExp.$1 === 'done' ) {
                task(function done(){
                    if ( !skipNextCallback ) {
                        noPending = true;
                        nextSerialTask();
                    }
                    else {
                        skipNextCallback = false;
                    }
                });
            }
            // Otherwise as a sync stick.
            else {
                task();
                noPending = true;
                nextSerialTask();
            }
        });

        if ( serialQueue.length === 1 && noPending ) {
            nextSerialTask();
        }
    }

    function nextSerialTask (){
        if ( serialQueue.length > 0 && noPending ) {
            noPending = false;
            serialQueue.shift()();
        }
    }

    clearSerialQueue = function clearSerialQueue (){
        serialQueue = [];
        skipNextCallback = true;
    }

})();

// Callback list
var speedTestCallbacks = [];
// Testing status
network.speedTesting = false;

function speedTest ( result, callback ){
    testImageList.fuzzySpeedRange;

    pushSerialTask(function(){
        loadingImgIndex = 0;
        result.bad = false;
        result.speed = 0;
        result.rank = 0;
        result.fuzzySpeed = 0;
        result.resRows = [];
        result.resAvgs = [];
        result.testImages = [];
    });

    // Load image[0] (the minimal) for twice in order to ignore DNS lookup time in the loadings after.
    pushSerialTask(function( done ){
        loadTestImage( firstTestImage, done );
    });

    pushSerialTask(function( done ){
        loadTestImage( firstTestImage, function ( bytes, timeCost ){
            result.fuzzySpeed = bytes / timeCost;
            result.delay = timeCost / 2;
            result.testImages = getTestImages( result.fuzzySpeed );
            result.testImages.unshift( mout.clone( firstTestImage ) );
            calculateProgress( result, 0, timeCost );
            done();
        });
    });

    // Start testing.
    pushSerialTask(function(){

        result.testImages.forEach(function( v, i ){
            if ( i == 0 ) { return; }
            pushSerialTask(function( done ){
                loadTestImage( result.testImages[i], function( bytes, timeCost ){
                    calculateProgress( result, i, timeCost );
                    done();
                });
            });
        });

        pushSerialTask(function(){
            calculateResult( result );
        });

        if ( typeof callback == 'function' ) {
            pushSerialTask(function(){
                if ( !result.bad ) {
                    callback( result );
                }
                else {
                    if ( ++result.retryTimes < 10 ) {
                        speedTest( result, callback);
                    }
                }
            });
        }
    });
}

network.speedTest = function( callback ){
    if ( network.speedTesting ) {
        speedTestCallbacks.push( callback );
    }
    else {
        speedTestCallbacks = [];
        var result = {
            retryTimes: 0
        };
        network.speedTesting = true;
        speedTestCallbacks = [ callback ];
        speedTest(result, function( result ){
            network.speedTesting = false;
            speedTestCallbacks.forEach(function( func ){
                if ( typeof func == 'function' ) {
                    func( result );
                }
            });
        });
    }
    // Return result object for watching.
    return result;
};

// TODO cross browser test.
// Online state & onlinechange event
network.online = navigator.onLine;
var body = doc.body || {};

body.ononline = body.onoffline = function () {
    network.online = navigator.onLine;
    network.emit('onlinechange', network.online );
};

module.exports = network;
