var initializeFileUpload = function() {
	var fileUpload = document.querySelector('.js_fileupload');
	var dropBox    = document.querySelector('.js_dropbox');

	new FormFileUpload(fileUpload, dropBox, {
		// your options are going here
	});
};

document.addEventListener("DOMContentLoaded", initializeFileUpload);
