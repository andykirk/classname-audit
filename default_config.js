/*
    This file specifies all the config defaults to give an overview of what's available and to 
    prevent any 'not set' type errors.
    It's strongly recommended you leave this file alone and create a separate 'config.js' file 
    (or whatever) to include your specific config settings.
    This file should be specified as the second argument of the command entered in to the command 
    line.
    I.e. node classname-audit.js http://www,my_url.com config.js

*/

/*
    Array of regex patterns to ignore certain URLS.
    I.e.
    var url_ignores = [
        '/css/',    // ignores everything in the /css folder
        '\\?page=' // ignores any URL with a 'page' query string variable (note the double escaping)
    ];
*/
var url_ignores = [];

/*
    Array of classes to ignore.
    I.e.
    var class_ignores = [
        'no-js',
        'top'
    ];
*/
var class_ignores = [];

/*
    Specify a DOM element as the context of the audit:
*/  
var context = '';

/*
    Specify an output directory for the JSON files:
*/
var output_dir = '../output/';