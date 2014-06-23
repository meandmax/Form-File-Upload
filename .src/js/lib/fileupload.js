var DropBox     = require('./dropbox.js');
var FilePreview = require('./filepreview.js');

var Fileupload = function(fileInput, url, opts){
	var self = this;

	var options = {};
	var selectedFiles = [];

	var defaultOptions = {
		/**
		 * Tests to ensure that Filereader, DragnDrop and FormData are not undefined
		 * @type {Object}
		 */
		tests: {
			filereader: typeof FileReader !== 'undefined',
			file : typeof File !== 'undefined',
			fileList: typeof Filelist !== 'undefined',
			blob: typeof Blob !== 'undefined',
			dnd: 'draggable' in document.createElement('span'),
			formdata: !!window.FormData
		},

		/**
		 * MaximumFileSize
		 * @type {Number}
		 */
		fileSizeLimit: 3000,

		/**
		 * Max. Number of Files
		 * @type {Number}
		 */
		fileNumberLimit: 3,

		/**
		 * If null there is no DragnDrop Functionality
		 * has to be a $object
		 */
		dropBox: null,

		/**
		 * Has to be defined by the user to display a list
		 * has to be a $object
		 */
		list: null,

		/**
		 * If enabled an enanced DataList with filepreview is rendered instead of the normal list
		 * If not false then it has to be a $object
		 * @type {Boolean}
		 */
		filePreview: { el: null, thumbnailSize: 50},

		/**
		 * If enabled the Progess is displayed while uploading a file.
		 * If not false then it has to be a $object
		 * @type {Boolean}
		 */
		progess: false,

		/**
		 * Default errormessages
		 * @type {Object}
		 */
		errormessages:{
			FileSizeLimit: "We allow Files with a max. filesize of 3 MB.",
			fileNumberLimit: "The allowed number of fileuploads is 3."
		},

		/**
		 * Default accepted types, can be extended with further data formats
		 * @type {Object}
		 */
		acceptedTypes: { 'image/png': true, 'image/jpeg': true, 'image/gif': true}
	};




	var init = function() {
		/**
		 * Merge defaultoptions and useroptions
		 */
		for (var i in defaultOptions) {
			if (defaultOptions.hasOwnProperty(i)) {
				options[i] = opts && typeof(opts[i]) !== 'undefined' ? opts[i] : defaultOptions[i];
				if (typeof(options[i]) === 'function') {
					options[i] = options[i].bind(self);
				}
			}
		}

		if(options.dropBox){
			self.dropbox = initDropBox();
		};

		if(options.filePreview){
			self.filePreview = initFilePreview();
		};

		console.log(options);

		/**
		 * [description]
		 * @return {[type]} [description]
		 */
		// $fileInput.on('change', function(){
		// 	var fileData = $(this).prop('files');
		// 	self.uploadFiles(fileData);
		// });
	};

	/**
	 * [getFileSize description]
	 * @param  {[type]} size [description]
	 * @return {[type]}      [description]
	 */
	var calcFileSize = function(size){
		return Math.floor(size/1000);
	};

	/**
	 * [showData description]
	 * @param  {[type]} file [description]
	 * @return {[type]}      [description]
	 */
	var addFileDataToDOM = function(file){
		var $listElement = $('<li class="file"></li>');
		$listElement.html('<span class="name">' + file.name + ' </span><span class="type">' + file.type + ' </span><span class="size">' + calcFileSize(file.size) + ' KB</span> ');
		options.list.append($listElement);
	};

	/**
	 * [initDropBox description]
	 * @return {[type]} [description]
	 */
	var initDropBox = function(){
		if(options.tests.dnd && DropBox){
			return new DropBox(options.dropBox, self.uploadFiles);
		}
	};

	/**
	 * [initProgess description]
	 * @return {[type]} [description]
	 */
	var initProgess = function(){
		if(options.progessbar){
			return new Progress();
		}
	};

	/**
	 * [initFilepreview description]
	 * @return {[type]} [description]
	 */
	var initFilePreview = function(){
		if(options.filePreview && options.tests.filereader) {
			return new FilePreview(options.filePreview.el, options);
		}
	};

	/**
	 * [uploadFile description]
	 * @param  {[type]} files [description]
	 * @return {[type]}       [description]
	 */
	var sendData = function(files){
      xhr = new XMLHttpRequest();
      for(var i = 0; i < files.length; i++){
      	var file = files[i];
      	file.xhr = xhr;
      }

		// var promise = $.ajax({
		// 	url: url,
		// 	type: 'POST',
		// 	cache: false,
		// 	contentType: 'multipart/form-data',
		// 	processData: false,
		// 	data: filedata
		// });

		// return promise;

	};

	var onFileUploadDone = function(file){
		if(options.filePreview){
			self.filePreview.previewFile(file);
		} else {
			addFileDataToDOM(file);
		}
	};

	var onFileUploadFail = function(file){
		console.log('fileUploadFailed');
		console.log(file);
	};

	/**
	 * Handle the Ajax Response and notifies the right Callbacks
	 * @param  {[type]} promise [description]
	 * @param  {[type]} file    [description]
	 * @return {[type]}         [description]
	 */
	var handleAjaxResponse = function(promise, file){
		/**
		 * Notifies callback on success
		 * @return {[type]} [description]
		 */
		promise.done(function() {
			onFileUploadDone(file);
		});

		/**
		 * Notifies callback on fail
		 * @return {[type]} [description]
		 */
		promise.fail(function() {
			onFileUploadFail(file);
		});
	};

	/**
	 * Initialize the Upload for each selected File
	 * @return {[type]} [description]
	 */
	this.uploadFiles = function(fileData){
			var promise = sendData(fileData);
			handleAjaxResponse(promise, file);
	};

	init();
};

module.exports = Fileupload;
