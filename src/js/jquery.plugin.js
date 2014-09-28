$.fn.formFileUpload = function(options) {
	return this.each(function() {
		var instanceOptions;

		if (!$.data(this, 'formFileUpload')) {
			instanceOptions = $.extend({}, options, $(this).data());
			$.data(this, 'formFileUpload', new FormFileUpload(this, instanceOptions));
		}
	});
};
