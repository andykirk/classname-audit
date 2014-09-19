classname-audit
===============

Node based cli tool to audit the classnames of a website during a site crawl.


This tool crawls a website from any given URL and build two JSON files. 
The first lists all the URLS found on the site and then lists all the classes found at each URL.
I.e.

~~~~~
www.some_url.com
  |___ some-class
  |___ another-class
  |___ third-class

www.some_url.com/somepage
  |___ my-class
  |___ another-class
  |___ third-class
~~~~~

The second JSON file lists all the classes found on the and then lists all the URLS where that class appears.

~~~~~
some-class
  |___ www.some_url.com
  
another-class
  |___ www.some_url.com
  |___ www.some_url.com/somepage
  
third-class
  |___ www.some_url.com
  |___ www.some_url.com/somepage
  
my-class
  |___ www.some_url.com/somepage

~~~~~

WiP
---

Please note this tool is a work in progress. I haven't yet had the time to learn how make this a 'proper' package.
Any offers of help in this regard would be greatly appreciated.


No JS classes
-------------

This tool doesn't use something like Phantom so it isn't able to find classes that are added to a page via javascript.
I tried to get write this tool using Phantom but I wasn't successful. Again, any help with this w9ould be great.


Usage
-----

Firstly you'll need Node installed. There are loads of guids out there to help you do that.

Once you've set that up, follow these steps:

1. Clone this repo into a local folder.
2. Open a command promt and `cd` to `YOUR_PATH`.
3. Run `npm install` to install the dependency packages.
2. Open a command promt and `cd` to `YOUR_PATH/lib`.
3. Run `node classname-audit.js http://www.your_url [your_config.js].


Ignoring URLs
----------------

It's possible to specify an array regex patterns that will be applied to each URL found in the crawl before it's acutally crawled.
This will help de-clutter the results by not crawling, say, anything in you `/css` or `/img` folders.


Ignoring classes
----------------

It's possible to specify an array of classes that you want ignored. These classes wont' be added to either file.
This is most useful if you're using a set of classes on template and you _know_ these will appear on every page so it can be convenient to exclude them from the list to help de-clutter the results.
However, ignoring template classes like this may not be suitable in all cases. 
Perhaps you're using a pattern library and you use a certain class on you main template but also in a few other places on certain pages.
It won't be possible to track to those down using the ignore method, so you can:

Specify a context
-----------------

Specifying a DOM selector in your config will limit the audit to that particular node.
For example if you used `<main>` element to contain your page-specific content, you could simply specify `var context = 'main';` as the context variable.
You could also use an id if you like, e.g. `<div id="my_context">` and  `var context = '#my_context';`;#


Future plans
------------

This tool does what I need it to do for now, but it could definitely be improved. 
If anyone else starts using this and finds they need some changes, please raise issues and/or create pull requests.

First off, I'd like to turn this into a 'proper' tool/package/app - call it what you will.
I haven't had time to learn how to do this yet but it would definitely be better to be able to install this properly.

Secondly I may consider extending the 'config' to allow for changing things like the SimpleCrawler settings.

