var DropBox = function ($dropBox, uploadFilesCallback){
	console.log('bier bier bier');

	/**
	 * DragnDrop Eventlistener
	 * @param  {[type]} e [description]
	 * @return {[type]}   [description]
	 */
	$dropBox.on('drop', function(e){
		e.stopPropagation();
		e.preventDefault();
		var fileData = e.originalEvent.dataTransfer.files;
		uploadFilesCallback(fileData);
	});

	$dropBox.on('dragenter', function(e){
		e.preventDefault();
	});

	$dropBox.on('dragleave', function(e){
		e.preventDefault();
	});

	$dropBox.on('dragover', function(e){
		e.preventDefault();
	});
}

module.exports = DropBox;
