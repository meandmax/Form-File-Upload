var FilePreview = function($previewList, options){

	/**
	 * [previewFile description]
	 * @param  {[type]} file [description]
	 * @return {[type]}      [description]
	 */
	this.previewFile = function(file){
		if (options.tests.filereader === true && options.acceptedTypes[file.type] === true) {
			var reader = new FileReader();
			reader.onload = function (event) {
				var image = new Image();
					image.src = event.target.result;
					image.width = options.filePreview.thumbnailSize; // a fake resize
					$previewList.append(image);
			};
			reader.readAsDataURL(file);
		} else {
			$previewlist.innerHTML += '<p>Uploaded ' + file.name + ' ' + (file.size ? (file.size/1024|0) + 'K' : '');
			console.log(file);
		}
	};
};

module.exports = FilePreview;


