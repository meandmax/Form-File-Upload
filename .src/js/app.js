var EasyFileupload = require('./lib/easyformfileupload.js');

var initializeFileUpload = function() {
	var $fileUpload = $('.js_fileupload');
	var $fileSelect = $fileUpload.find('.js_selectfile');
	var $dropBox      = $fileUpload.find('.js_dropbox');

	var url = '/';

	var options = {
		maxFileSize: 6145728
	};

	var easyFileupload = new EasyFileupload($fileUpload, $fileSelect, $dropBox, url, options);
};

$(document).ready(initializeFileUpload);
