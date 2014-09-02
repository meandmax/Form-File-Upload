var initializeFileUpload = function() {
	var fileUpload = document.querySelector('.js_fileupload');
	var fileSelect = document.querySelector('.js_selectfile');
	var dropBox    = document.querySelector('.js_dropbox');

	new EasyFormFileUpload(fileUpload, fileSelect, dropBox, {
		// your options are going here
	});
};

document.addEventListener("DOMContentLoaded", initializeFileUpload);
