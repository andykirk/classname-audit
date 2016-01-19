#! /usr/bin/env node

// https://github.com/cgiffard/node-simplecrawler

var user_arguments = process.argv.slice(2); // copies arguments list but removes first two options (script exec type & exec location)

if (user_arguments.length > 2) {
    throw new Error('Only up to two arguments should be specified (the url you want to start the audit at, and a copnfiguration file (optional))');
}

var fs                  = require('fs');
var vm                  = require('vm');
var Crawler             = require("simplecrawler");
var Cheerio             = require('cheerio');

var url                 = user_arguments[0];
var config              = user_arguments.length == 2 ? user_arguments[1] : false;
var url_classnames      = {};
var classname_urls      = {};
var debug               = [];

var queue_remaining     = {};
 
// Check the URL:
if (urlProvided(url)) {
    url = cleanUrl(url);
} else {
    throw new Error('Sorry a valid URL could not be recognised');
}

// Assemble the config:
var content = fs.readFileSync('../default_config.js')
vm.runInThisContext(content)
//console.log(url_ignores, class_ignores);
if (config) {
    // A bit lame but will do for now:
    if (config.indexOf('/') === -1) {
        config = '../' + config;
    }
    content = fs.readFileSync(config);
    vm.runInThisContext(content);
    //console.log(url_ignores, class_ignores);
}
console.log(url_ignores, class_ignores);

// Assemble the output file paths:
var url_classnames_file = output_dir + 'url-classnames.json';
var classname_urls_file = output_dir + 'classname_urls.json';

// Begin:
var site_crawler = Crawler.crawl(url);
console.log('Crawling...');

// Interval needs to be at least 4 seconds otherwise Phantom doesn't complete and
// blocks next process.
site_crawler.interval       = 1000;
//site_crawler.maxConcurrency = 5;
site_crawler.timeout        = 10000;
//site_crawler.scanSubdomains = true;


if (url.match(/^https/)) {
    site_crawler.initialProtocol = 'https';
}


site_crawler.addFetchCondition(function(parsed_url) {
    if (url_ignores.length == 0) {
        return true;
    }
    var fetch_condition = new RegExp(url_ignores.join('|'), 'i');
    //console.log(parsed_url.path);
    //console.log(fetch_condition);
    return !parsed_url.path.match(fetch_condition);
});
/*
site_crawler.addFetchCondition(function(parsed_url) {
    //url_ignores = url_ignores.replace();
    //var fetch_condition = new RegExp('\\\\');
    var fetch_condition = new RegExp('%5C');
    //console.log(parsed_url.path);
    //console.log(fetch_condition);
    return !parsed_url.path.match(fetch_condition);
});
*/

site_crawler.on('complete', function() {
    createJSONFile(url_classnames_file, url_classnames);
    createJSONFile(classname_urls_file, classname_urls);
    createJSONFile(process.cwd() + '/queue.json', queue_remaining);
    createDebugFile(debug);
    console.log('Done');
});


site_crawler.on('fetchheaders', function(queue_item, responseObject) {
    //console.log('fetchheaders: ', queue_item.referrer);
    console.log('Starting: ', queue_item.url);
    queue_remaining[queue_item.url.replace(/\/$/, '')] = queue_item.referrer;
});

/*
site_crawler.on('fetchstart', function(queue_item, request_options) {
    //console.log('Headers: ', queue_item.status);
    console.log('Starting: ', queue_item.url);
    queue_remaining[queue_item.url] = 1;
});
*/


site_crawler.on('queueduplicate', function(url_data) {
    //console.log('fetchheaders: ', queue_item.referrer);
    //console.log('queueduplicate: ', url_data);
    url = url_data.protocol + '://' + url_data.host + url_data.path;
    //delete queue_remaining[url.replace(/\/$/, '')];
    delete queue_remaining[url];
});


site_crawler.on('fetchcomplete', function(queue_item, response_buffer, response) {
    //var $ = cheerio.load(responseBuffer.toString('utf8'));
    var url        = queue_item.url;
    var html       = response_buffer.toString();
    
    if (context) {
        $    = Cheerio.load(html);
        html = $(context).html();
    }
    
    var classnames = getCSSClassenames(html, class_ignores);
    
    console.log('Completed:', url);
    //console.log(classnames);

    // Add url_classnames data:
    if (!(url in url_classnames)) {
        url_classnames[url] = classnames;
    }
    
    // Add classname_urls data:
    var i = 0;
    var l = classnames.length;
    for (i = 0; i<l; i++) {
        var classname = classnames[i];
        if (!(classname in classname_urls)) {
            classname_urls[classname] = [];
        }
        classname_urls[classname].push(url);
    }
    //console.log(classname_urls);
    
    delete queue_remaining[queue_item.url.replace(/\/$/, '')];
    //fs.writeFile(process.cwd() + '/queue.json', JSON.stringify(queue_remaining));
});


/*
    Taken from: http://snipplr.com/view/6488/
*/
function getCSSClassenames(html, ignore_list) {
    //console.log(html);
    //console.log(ignore_list);
    var ignores        = ignore_list ? ignore_list : [];
    var regex          = /class="([^"]*)"/gi;
    var all_classnames = [];
    var match;
    while (match = regex.exec(html))
    {
        classes    = match[1].replace(/\s+/g, ' ');
        classnames = classes.split(' ');
        var i = 0;
        var l = classnames.length;
        for (i = 0; i<l; i++) {
            var classname = classnames[i];
            //console.log(classname);
            if (inArray(classname, ignore_list)) {
                continue;
            }
            if (!inArray(classname, all_classnames)) {
                all_classnames.push(classname);
            }
        }
    }
    return all_classnames; 
}


function inArray(needle, haystack) {
    var i = 0;
    var l = haystack.length;
    for(i = 0; i<l; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}


function createDebugFile(debug_data, cb) {
    //fs.writeFile(process.cwd() + '/css-classes.json', JSON.stringify(data.css_classes), function(err) {
    fs.writeFile(process.cwd() + '/debug.txt', debug_data.join("\n"), function(err) {
        if (err) throw err;

        log('Debug file created');
        if (typeof cb === 'function') cb();
    });
}


function createJSONFile(file, data, cb) {
    fs.writeFile(file, JSON.stringify(data), function(err) {
        if (err) throw err;

        log('JSON file created (' + file + ')');
        if (typeof cb === 'function') cb();
    });


    //fs.writeFile(process.cwd() + '/css-classes.json', JSON.stringify(data.css_classes), function(err) {
    /*fs.writeFile(process.cwd() + '/css-classes.json', JSON.stringify(data), function(err) {
        if (err) throw err;

        log('JSON file created');
    });*/
}


function log(message) {
    process.stdout.write(message + '\n');
}


function error(err) {
    process.stderr.write(err);
}


function urlProvided(url) {
    return /(?!https?:\/\/)?(?:www\.)?[a-z-z1-9]+\./i.test(url);
}


function cleanUrl(provided_url) {
    // If no http or https found at the start of the url...
    if (/^(?!https?:\/\/)[\w\d]/i.test(provided_url)) {
        return 'http://' + provided_url + '/';
    }
    return provided_url;
}

// Manually emit SIGINT event for windows
// See http://stackoverflow.com/questions/10021373/what-is-the-windows-equivalent-of-process-onsigint-in-node-js
if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

// If the process is exited, save anything we have so far
process.on("SIGINT", function() {
    var i = 3,
    createFileCallback = function() {
        i--;
        if (!i) process.exit();
    };
    createJSONFile(url_classnames_file, url_classnames, createFileCallback);
    createJSONFile(classname_urls_file, classname_urls, createFileCallback);
    createDebugFile(debug, crea);
    console.log('Process ended prematurely, saving progress..');
});
