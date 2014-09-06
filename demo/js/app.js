var initializeFileUpload = function() {
	var fileUpload = document.querySelector('.js_fileupload');

	new FormFileUpload(fileUpload, {
		// your options are going here
	});
};

document.addEventListener("DOMContentLoaded", initializeFileUpload);
