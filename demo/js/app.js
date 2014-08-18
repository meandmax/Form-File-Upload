var initializeFileUpload = function() {
	var $fileUpload = $('.js_fileupload');
	var $fileSelect = $fileUpload.find('.js_selectfile');
	var $dropBox    = $fileUpload.find('.js_dropbox');

	var fileUpload = document.querySelector('.js_fileupload');
	var fileSelect = document.querySelector('.js_selectfile');
	var dropBox    = document.querySelector('.js_dropbox');

	var easyFileUpload = new EasyFormFileUpload(fileUpload, fileSelect, dropBox);
};

$(document).ready(initializeFileUpload);
