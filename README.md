classname-audit
===============

Node based cli tool to audit the classnames of a website during a site crawl.


This tool crawls a website from any given URL and builds two JSON files. 
The first lists all the URLs found on the site and then lists all the classes found at each URL.
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

The second JSON file lists all the classes found during the crawl and then lists all the URLs where that class appears.

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

The intention is that a JSON viewer (such as http://tomeko.net/software/JSONedit/) can then be used to inspect the JSON and allow you to determine where exactly your classes are being used to find out if you've got any redundancies or whatever.

Of course, with the JSON files in place, though, it would be possible to use them in all sorts of ways, for example to use them with your style-guide to instantly show where each pattern is being used.


WiP
---

Please note this tool is a work in progress. I haven't yet had the time to learn how make this a 'proper' package.
Any offers of help in this regard would be greatly appreciated.


No JS classes
-------------

This tool doesn't use a real browser like Phantom so it isn't able to find classes that are added to a page via javascript.
I tried to write this tool using Phantom but I wasn't successful. Again, any help with this would be great.


Usage
-----

Firstly you'll need [Node](http://nodejs.org/) installed. There are loads of guides out there if you need more help with that.

Once you've set that up, follow these steps:

1. Clone this repo into a local folder.
2. Open a command prompt and `cd` to `YOUR_NEW_FOLDER`.
3. Run `npm install` to install the dependency packages.
2. Run `cd lib`.
3. Run `node classname-audit.js http://www.your_url [your_config.js]`.
Note the [] indicate the argument is optional - don't include the braces.

Config
------

It's possible to specify a config file when running a command to set options such as URL ignore patterns or specifying a context (see below).
The best way to create a config file is to make a copy of the `default_config.js` file and edit to your needs.
Then you can include the path to it (relative to the `lib` directory) as the second argument when running the command.


Ignoring URLs
----------------

It's possible to specify an array of regex patterns that will be applied to each URL found in the crawl before it's actually crawled.
This will help de-clutter the results by not crawling, say, anything in your `/css` or `/img` folders.


Ignoring classes
----------------

It's possible to specify an array of classes that you want ignored. These classes won't be added to either JSON file.
This is most useful if you're using a set of classes on template and you _know_ these will appear on every page so it can be convenient to exclude them from the list to help de-clutter the results.
However, ignoring template classes like this may not be suitable in all cases. 
Perhaps you're using a pattern library and you use a certain class on your main template but also in a few other places on certain pages.
It won't be possible to track to those down using the ignore method. So instead you can:

Specify a context
-----------------

Specifying a DOM selector in your config will limit the audit to that particular node.
For example if you used `<main>` element to contain your page-specific content, you could simply specify `var context = 'main';` as the context variable in your config file.
You could also use an id if you like, e.g. `<div id="my_context">` and  `var context = '#my_context';`;



Future plans
------------

This tool does what I need it to do for now, but it could definitely be improved. 
If anyone else starts using this and finds they need some changes, please raise issues and/or create pull requests.

First off, I'd like to turn this into a 'proper' tool/package/app - call it what you will.
I haven't had time to learn how to do this yet but it would definitely be better to be able to install this properly.

Secondly I may consider extending the 'config' to allow for changing things like the SimpleCrawler settings.

