# Form File Upload

[![Version](http://img.shields.io/badge/version-0.0.2-green.svg)]()
[![Build Status](https://travis-ci.org/meandmax/Form-File-Upload.svg?branch=master)](https://travis-ci.org/meandmax/Form-File-Upload)
[![devDependency Status](https://david-dm.org/meandmax/Form-File-Upload/dev-status.svg)](https://david-dm.org/meandmax/Form-File-Upload#info=devDependencies)
[![Dependency Status](https://david-dm.org/meandmax/Form-File-Upload.svg)](https://david-dm.org/meandmax/Form-File-Upload.svg)

Form-File-Upload is a very lightweight module to implement a Drag & Drop Fileupload in your forms. It is as lightweight as possible, so no jQuery ( the module could still handle jQuery Objects if you want) and no other dependencies. It supports not even uploading files async via Ajax. It is simply just for that one usecase: To have a smart little module with datavalidation, filepreview and Drag & Drop support to upload base64 converted files to your server. Nothing special, but very helpful if you need exactly this.

## Features

* Super easy to implement
* Lightweight, no dependencies (written vanilla)
* Fallback for uploading files even with IE8 (normal fileinput fallback)
* Using Browsersync as development server

## Get Started

### Install

You can download the latest generated and minified module here.

### Vanilla JS

Even if you could use jQuery objects, you can also just pass normal DOM objects to the module.

```html
<script src="/path/to/formfileupload.min.js"></script>  
<script>
var initializeFileUpload = function() {
    var fileUpload = document.querySelector('.js_fileupload');

    new FormFileUpload(fileUpload, {
        // your options are going here
    });
};

document.addEventListener("DOMContentLoaded", initializeFileUpload);
</script>
```

### jQuery

To use the Form-File-Upload as a jQuery Plugin you need to load the a version of jQuery and the jQuery source of the plugin (jquery.formfileupload.min.js).

```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
<script src="js/jquery.formfileupload.min.js"></script>
<script>
        $(function() {
            $('.js_fileupload').formFileUpload({
                // your options are going here
            });
        });
</script>
```

## Browser Support

Chrome, Safari, FireFox, Internet Explorer 9+ & Fallback for IE8

#### Options

Option | Type | Default | Description
------ | ---- | ------- | -----------
errorMessageTimeout | number | 5000 (ms) | timeout specifies how long the error messages are displayed  
maxFileSize | number | 3145728 (3MB) | the maximum filesize of each file in bytes  
maxFileNumber | number | 3 | the maximum filesize of each file in bytes
maxRequestSize | number | 9437184 (9MB) | defines the maximum size of each request in bytes
circleThumbnail | boolean | false | defines if the thumbails are displayed in circles, otherwise rectangles  
fallbackForIE8 | boolean | true | If true the fallback for IE8 is activated  
invalidFileNameError | string | The name of the file has forbidden characters | errormessage displayed when the file has characters which are not allowed  
invalidFileTypeError | string | The fileformat is not allowed | errormessage displayed when the filetype is not allowed  
maxRequestSizeError | string | The requestsize of the files you want to upload is exceeded. | errormessage displayed when the max. requestsize is reached  
maxFileNumberError | string | You can upload 3 files, not more! | errormessage displayed when the max. filenumber is reached  
maxFileSizeError | string | One of the files is too large. the maximum filesize is 3 MB. | errormessage displayed when the max. filensize is reached  
unknownFileReaderError | string | Unknown Error while loading the file. | If something during the filereading process went wrong, then this message is displayed  
acceptedTypes | object | PNG, JPEG, GIF, TIFF, PDF, Excel & Word | objects contains all allowed mimetypes as keys & the prettified filenames as values  

## Tests

Just run in your terminal  ``gulp test`` to run the tests.

## Customizing

If you want to customize the module before using it, just start the development server with ``gulp dev`` and you are ready to dev!

## Credits

Thanks to [SinnerSchrader](http://sinnerschrader.com/ "SinnerSchrader") for inspiring me at first to build this plugin.

## Copyright

Copyright (c) 2014 Maximilian Heinz, contributors. Released under the MIT, GPL licenses
