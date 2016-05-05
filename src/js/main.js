/*
global $, window, document, Modernizr, setTimeout, clearTimeout, setInterval, console
*/

(function($, window, document) {
    'use strict';

    var App;
    App = {
        init: function() {
            console.log('inited');
        }
    };
    $(function() {
        App.init();
    });
})($, window, document);
