README v0.0.4 / 22 APRIL 2016

# Thr0w SVG Module

## Introduction

The Thr0w Project is about building inexpensive and manageable interactive (or
not) digital displays using commodity hardware, web technologies, and open source
software. The key to this solution is having one computer behind each screen
networked to a single computer acting as a server. With this design, the
splitting and synchronization of content is accomplished through software. More
information on the Thr0w Project:

<https://github.com/larkintuckerllc/thr0w-server>

This repository provides a Thr0w module to create interactive
scalable vector graphics (SVGs).

## Installation

Assuming that one has a functional Thr0w Server and Thr0w Client
environment:

Download the latest version:

<https://github.com/larkintuckerllc/thr0w-svg/releases>

To install this module:

Add the module's CSS to the HTML *head* after the
Thr0w Client entry, e.g.:

```
<link rel="stylesheet" type="text/css" href="ROOT/dist/thr0w-svg.css">
```

and the module's JavaScript library to the HTML *body*
after the Thr0w Client entry, e.g.,

```
<script src="ROOT/dist/thr0w-svg.min.js"></script>
```

where *ROOT* is the URL path to the root folder of the download.

## Usage

The examples provided in *ROOT/examples*
provide inline documentation on using this module's API.

The module's API reference is available at:

<http://rawgit.com/larkintuckerllc/thr0w-svg/master/doc/index.html>

## Contributing

Submit bug or enhancement requests using the Github *Issues* feature. Submit
bug fixes or enhancements as pull requests. Specifically, follow GitHub's
document *Contributing to Open Source on GitHub*.

<https://guides.github.com/activities/contributing-to-open-source/>

The CSS and JavaScript need only be tested against the latest version of
Chrome Browser.

To compile, install the development dependencies using *npm* and compile with
*gulp*.

Where possible, the CSS and JavaScript is not to require any
additional third-party libraries.

CSS entries are prefixed with *thr0w_svg_*.

The CSS is to follow the BEM naming convention.

<https://css-tricks.com/bem-101/>

The JavaScript is to pass JSHint with the default configuration. The JavaScript
is to pass JSCS with the Google preset.

* <http://jshint.com/>
* <http://jscs.info/>

The JavaScript is to comply with the following style guide.

* Modules are to be wrapped in an Immediately Invoked Function Expression
(IIFE); no globals.
* Modules' expose their functionality as an appropriately named property on
the global *thr0w* object, e.g., *thr0w.svg* for this module.
* Use named functions instead of passing an anonymous function in as a callback.
* Define functions in the scope where they are used.
* Place functions declarations at the end of the scope; rely on hoisting.

The exposed JavaScript classes (or objects) are to be documented using YUIDoc.

<http://yui.github.io/yuidoc/>

## Credits

TODO

## Contact

General questions and comments can be directed to <mailto:john@larkintuckerllc.com>.

## License

This project is licensed under GNU General Public License.
