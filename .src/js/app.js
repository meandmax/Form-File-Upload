var Fileupload  = require('./lib/fileupload.js');

var initializeFileUpload = function() {
	var $contactform = $(this);
	var $fileUpload  = $contactform.find('.js_fileupload');
	var $dropBox     = $fileUpload.find('.js_dropbox');
	var $previewList = $fileUpload.find('.js_previewList');
	var $fileInput   = $fileUpload.find('.js_fileinput');


	// For Simple File Display
	// var $list = $fileUpload.find('.js_list');

	var options = {
		dropBox: $dropBox,
		filePreview: { el: $previewList, thumbnailSize: 150}
	};

	var fileUpload = new Fileupload($, $fileInput, '/', options);
};

$(document).ready(initializeFileUpload);
