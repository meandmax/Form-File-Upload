# easy-FormFileUpload

[![Build Status](https://magnum.travis-ci.com/meandmax/easy-FormFileUpload.svg?token=apnBwHLjZ974yJCoHTh7&branch=master)](https://magnum.travis-ci.com/meandmax/easy-FormFileUpload)

Easy FormFileUpload is a very lightweight module to implement a Drag\`n Drop Fileupload in your forms. It is as lightweight as possible, so no jQuery ( the module could still handle jQuery Objects if you want) and no other dependencies. It supports not even uploading files async via Ajax. It is simply just for that one usecase: To have a smart little module with datavalidation, filepreview and Drag\`n Drop support to upload base64 converted files to your server. Nothing special, but very helpful if you need exactly this.

## Features

* Super easy to implement
* Lightweight, no dependencies (written vanilla)
* Fallback for uploading files even with IE8 coming soon
* Development Server written in KOA.

## Get Started

### Install

You can download the latest generated and minified module here.

### Vanilla JS

Even if you could use jQuery objects, you can also just pass normal DOM objects to the module.

```js
<script src="/path/to/easyformfileupload.min.js"></script>
<script>
    var fileUpload = document.querySelector('.js_fileupload');
    var fileSelect = document.querySelector('.js_selectfile');
    var dropBox    = document.querySelector('.js_dropbox');

    new EasyFormFileUpload(fileUpload, fileSelect, dropBox, {
        // your options are going here
    });
</script>
```

## Browser Support

Chrome, Safari, FireFox, Internet Explorer 9+

## Options


## Tests

Just run in your terminal  ``gulp test`` to run the tests.

## Credits

Thanks to SinnerSchrader for inspiring me at first to build this plugin.

## Copyright

Copyright (c) 2014 Maximilian Heinz, contributors. Released under the MIT, GPL licenses
