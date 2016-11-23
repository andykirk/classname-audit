#! /usr/bin/env node

// https://github.com/cgiffard/node-simplecrawler

var user_arguments = process.argv.slice(2); // copies arguments list but removes first two options (script exec type & exec location)

if (user_arguments.length > 2) {
    throw new Error('Only up to two arguments should be specified (the url you want to start the audit at, and a configuration file (optional))');
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
    is_https = isHttps(url);
    url = cleanUrl(url);
} else {
    throw new Error('Sorry a valid URL could not be recognised');
}

// Assemble the config:
var content = fs.readFileSync('../default_config.js')
vm.runInThisContext(content)

if (config) {
    // A bit lame but will do for now:
    if (config.indexOf('/') === -1) {
        config = '../' + config;
    }
    content = fs.readFileSync(config);
    vm.runInThisContext(content);
}
console.log(url_ignores, class_ignores);

// Assemble the output file paths:
var url_classnames_file = output_dir + 'url-classnames.json';
var classname_urls_file = output_dir + 'classname_urls.json';


if (is_https) {
    console.log('Is https');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    var site_crawler = new Crawler(url, '/', 443);
    site_crawler.initialProtocol  = 'https';
    site_crawler.ignoreInvalidSSL = true;
} else {
    var site_crawler = new Crawler(url);
    site_crawler.initialProtocol = 'http';
}


site_crawler.interval       = 1000;
//site_crawler.maxConcurrency = 5;
site_crawler.timeout        = 10000;
//site_crawler.scanSubdomains = true;


site_crawler.addFetchCondition(function(parsed_url) {
    if (url_ignores.length == 0) {
        return true;
    }
    var fetch_condition = new RegExp(url_ignores.join('|'), 'i');
    return !parsed_url.path.match(fetch_condition);
});


site_crawler.on('complete', function() {
    createJSONFile(url_classnames_file, url_classnames);
    createJSONFile(classname_urls_file, classname_urls);
    createJSONFile(process.cwd() + '/queue.json', queue_remaining);
    createDebugFile(debug);
    console.log('Done');
});


site_crawler.on('fetchheaders', function(queue_item, responseObject) {
    console.log('Starting: ', queue_item.url);
    queue_remaining[queue_item.url.replace(/\/$/, '')] = queue_item.referrer;
});


site_crawler.on('queueduplicate', function(url_data) {
    url = url_data.protocol + '://' + url_data.host + url_data.path;
    delete queue_remaining[url];
});


site_crawler.on('fetchcomplete', function(queue_item, response_buffer, response) {
    var url  = queue_item.url;
    var html = response_buffer.toString();
    
    if (context) {
        $    = Cheerio.load(html);
        html = $(context).html();
    }
    
    var classnames = getCSSClassenames(html, class_ignores);
    
    console.log('Completed:', url);

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
    
    delete queue_remaining[queue_item.url.replace(/\/$/, '')];
});


site_crawler.on('fetchclienterror', function(queueItem, error) {
    console.log('fetchclienterror', queueItem, error);
});

site_crawler.on('fetcherror', function(queueItem, responseObject) {
    console.log('fetcherror', queueItem, responseObject);
});

site_crawler.on('fetchredirect', function(queueItem, parsedURL, response) {
    console.log('URL Redirected from: ', queueItem.url, ' to ', response.headers.location);
});


// Begin:
console.log('Crawling...');
site_crawler.start();


/*
    Taken from: http://snipplr.com/view/6488/
*/
function getCSSClassenames(html, ignore_list) {
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

function isHttps(url) {
    return /^https/i.test(url);
}


function cleanUrl(provided_url) {
    return provided_url.replace(/https?:\/\//, '');
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
    createJSONFile(process.cwd() + '/queue.json', queue_remaining);
    createDebugFile(debug, createFileCallback);
    console.log('Process ended prematurely, saving progress..');
});
