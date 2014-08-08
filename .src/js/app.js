var EasyFileupload = require('./lib/easyfileupload.js');

var initializeFileUpload = function() {
	var $fileUpload = $('.js_fileupload');

	var url = '/';

	var options = {
		maxFileSize: 6145728
	};

	var easyFileupload = new EasyFileupload($fileUpload, url, options);
};

$(document).ready(initializeFileUpload);
