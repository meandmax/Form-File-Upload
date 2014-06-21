var gulp         = require('gulp');
var browserify   = require('gulp-browserify');
var less         = require('gulp-less');
var csso         = require('gulp-csso');
var watch        = require('gulp-watch');
var uglify       = require('gulp-uglify');
var livereload   = require('gulp-livereload');

var lvr = false;

gulp.task('less', function () {
	var stream = gulp.src('.src/less/app.less')
		.pipe(less({
			paths: [ path.join(__dirname, '.src', 'less') ]
		}))
		.pipe(csso())
		.pipe(gulp.dest('./src'));
	lvr && stream.pipe(livereload());
});

gulp.task('scripts', function() {
	// Single entry point to browserify
	var stream = gulp.src('.src/js/app.js')
		.pipe(browserify({
			debug: true
		}))
		.pipe(uglify())
		.pipe(gulp.dest('./src'));
	lvr && stream.pipe(livereload());
});

gulp.task('watch', function() {
	lvr = true;
	// calls 'build-js' whenever anything changes
	gulp.watch('.src/js/**/*.js', ['scripts']);
	gulp.watch('.src/less/**/*.less', ['less']);
});

gulp.task('build', ['scripts', 'less'], function() {

	gulp.src('./index.html')
		.pipe(inlinesource())
		.pipe(gulp.dest('./dist'));

	gulp.src('./favicon.ico')
		.pipe(gulp.dest('./dist'));

	gulp.src('./.htaccess')
		.pipe(gulp.dest('./dist'));

	gulp.src('./src/**/*')
		.pipe(gulp.dest('./dist/src'));

	gulp.src('./assets/**/*')
		.pipe(gulp.dest('./dist/assets'));
});

gulp.task('default', ['scripts', 'less']);
