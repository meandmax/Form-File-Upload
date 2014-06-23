var Fileupload  = require('./lib/fileupload.js');

var initializeFileUpload = function() {
	var contactform = this;
	var fileUpload = contactform.querySelector('.js_fileupload');
	var fileInput = fileUpload.querySelector('.js_fileinput');
	var dropBox = fileUpload.querySelector('.js_dropbox');
	var list = contactform.querySelector('.js_list');

	// console.log(list);
	// console.log(dropBox);
	// console.log(fileInput);
	// console.log(fileUpload);

	// For Simple File Display
	// var $list = $fileUpload.find('.js_list');

	var options = {
		dropBox: false
	};

	var fileUpload = new Fileupload(fileInput, '/', options);
};

$(document).ready(initializeFileUpload);
