var initializeFileUpload = function() {
	var $fileUpload = $('.js_fileupload');
	var $fileSelect = $fileUpload.find('.js_selectfile');
	var $dropBox    = $fileUpload.find('.js_dropbox');

	var easyFileupload = new EasyFileUpload($fileUpload, $fileSelect, $dropBox);
};

$(document).ready(initializeFileUpload);
