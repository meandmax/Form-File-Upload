var Progress = function(){

	/**
	 * [addXhrProgressEvent description]
	 */
	var addXhrProgressEvent = function(){
		var originalXhr = $.ajaxSettings.xhr;
		$.ajaxSetup({
			progress: function() { console.log("in progress"); },
			xhr: function() {
				var req = originalXhr(), that = this;
				if (req) {
					if (typeof req.addEventListener == "function") {
						req.addEventListener("progress", function(evt) {
							that.progress(evt);
						},false);
					}
				}
				return req;
			}
		});
	};

	this.onProgress = function(e) {
		if (e.lengthComputable) {
			console.log("Loaded " + parseInt( (e.loaded / e.total * 100), 10) + "%");
		}
		else {
			console.log("Length not computable.");
		}
	};

};

module.exports = Progress;
