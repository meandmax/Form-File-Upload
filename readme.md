# Form File Upload

[![Version](http://img.shields.io/badge/version-0.0.1-green.svg)]()
[![Build Status](https://travis-ci.org/meandmax/Form-File-Upload.svg?branch=master)](https://travis-ci.org/meandmax/Form-File-Upload)
[![devDependency Status](https://david-dm.org/meandmax/Form-File-Upload/dev-status.svg)](https://david-dm.org/meandmax/Form-File-Upload#info=devDependencies)
[![Dependency Status](https://david-dm.org/meandmax/Form-File-Upload.svg)](https://david-dm.org/meandmax/Form-File-Upload.svg)

Form-File-Upload is a very lightweight module to implement a Drag & Drop Fileupload in your forms. It is as lightweight as possible, so no jQuery ( the module could still handle jQuery Objects if you want) and no other dependencies. It supports not even uploading files async via Ajax. It is simply just for that one usecase: To have a smart little module with datavalidation, filepreview and Drag & Drop support to upload base64 converted files to your server. Nothing special, but very helpful if you need exactly this.

## Features

* Super easy to implement
* Lightweight, no dependencies (written vanilla)
* Fallback for uploading files even with IE8 (normal fileinput fallback)
* Development Server written in KOA.

## Get Started

### Install

You can download the latest generated and minified module here.

### Vanilla JS

Even if you could use jQuery objects, you can also just pass normal DOM objects to the module.

```html
<script src="/path/to/easyformfileupload.min.js"></script>  
<script>
    var fileUpload = document.querySelector('.js_fileupload');
    var dropBox    = document.querySelector('.js_dropbox');

    new EasyFormFileUpload(fileUpload, dropBox, {
        // your options are going here
    });
</script>
```

## Browser Support

Chrome, Safari, FireFox, Internet Explorer 9+ & Fallback for IE8

## Options

**errorMessageTimeout** (number)  
**default:** 5000 (ms)  
**description:** timeout specifies how long the error messages are displayed  

**maxFileSize** (number)  
**default:** 3145728 (3MB)  
**description:** the maximum filesize of each file in bytes  

**maxFileNumber** (number)  
**default:** 3  
**description:** the maximum filesize of each file in bytes  

**circleThumbnail** (boolean)  
**default:** false  
**description:** defines if the thumbails are displayed in circles, otherwise rectangles  

**maxRequestSize** (number)  
**default:** 9437184 (9MB)  
**description:** defines the maximum size of each request in bytes  

**fallbackForIE8** (boolean)  
**default:** true  
**description:** If true the fallback for IE8 is activated  

**invalidFileNameError** (string)  
**default:** The name of the file has forbidden characters  
**description:** errormessage displayed when the file has characters which are not allowed  

**invalidFileTypeError** (string)  
**default:** The fileformat is not allowed  
**description:** errormessage displayed when the filetype is not allowed  

**maxRequestSizeError** (string)  
**default:** The requestsize of the files you want to upload is exceeded.  
**description:** errormessage displayed when the max. requestsize is reached  

**maxFileNumberError** (string)  
**default:** You can upload 3 files, not more!  
**description:** errormessage displayed when the max. filenumber is reached  

**maxFileSizeError** (string)  
**default:** One of the files is too large. the maximum filesize is 3 MB.  
**description:** errormessage displayed when the max. filensize is reached  

**unknownFileReaderError** (string)  
**default:** Unknown Error while loading the file.  
**description:** If something during the filereading process went wrong, then this message is displayed  

**acceptedTypes** (object)  
**default:** PNG, JPEG, GIF, TIFF, PDF, Excel & Word  
**objectstructur:** {'image/png': 'PNG-Bild', 'image/jpeg': 'JPEG-Bild'}  
**description:** objects contains all allowed mimetypes as keys & the prettified filenames as values  

## Development Server

Use the ``--harmony`` flag and the latest version of node to start the server. The server should be able to handle the base64 filedata and also files which are attached to fileinputs for the IE8 fallback at writing them into an files folder in the project. 

```
node --harmony server.js
```

## Tests

Just run in your terminal  ``gulp test`` to run the tests.

## Credits

Thanks to [SinnerSchrader](http://sinnerschrader.com/ "SinnerSchrader") for inspiring me at first to build this plugin.

## Copyright

Copyright (c) 2014 Maximilian Heinz, contributors. Released under the MIT, GPL licenses
