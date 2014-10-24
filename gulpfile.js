var gulp          = require('gulp');
var browserify    = require('gulp-browserify');
var less          = require('gulp-less');
var csso          = require('gulp-csso');
var watch         = require('gulp-watch');
var uglify        = require('gulp-uglify');
var jshint        = require('gulp-jshint');
var rename        = require('gulp-rename');
var mocha         = require('gulp-mocha');
var concat        = require('gulp-concat');
var jshintStylish = require('jshint-stylish');

/**
 * jshint task for all javascript files
 */
gulp.task('lint', function() {
	return gulp.src('./src/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter(jshintStylish));
});

/**
 * executes the javascript tests
 */
gulp.task('test', function() {
	return gulp.src('./test/*.js')
		.pipe(mocha());
});

gulp.task('jQuery', function() {
	return gulp.src(['./src/js/formfileupload.js', './src/js/jquery.plugin.js'])
		.pipe(concat('jquery.formfileupload.js'))
		.pipe(browserify())
		.pipe(gulp.dest('./dist'))
		.pipe(gulp.dest('./demo/js'))
		.pipe(uglify())
		.pipe(rename(function(path){
			path.basename += '.min';
		}))
		.pipe(gulp.dest('./dist'))
		.pipe(gulp.dest('./demo/js'));
});

/**
 * Build task for the final css files
 */
gulp.task('less', function() {
	var stream = gulp.src('./src/less/app.less')
		.pipe(less())
		.pipe(csso())
		.pipe(gulp.dest('./demo'));
});

/**
 * Build task for the final javascript files
 */
gulp.task('scripts', ['jQuery', 'lint', 'test'], function() {
	// Single entry point to browserify
	var stream = gulp.src('./src/js/formfileupload.js')
		.pipe(browserify({standalone: 'FormFileUpload'}))
		.pipe(gulp.dest('./dist'))
		.pipe(gulp.dest('./demo/js'))
		.pipe(rename(function (path) {
			path.basename += ".min";
		}))
		.pipe(uglify())
		.pipe(gulp.dest('./dist'))
		.pipe(gulp.dest('./demo/js'));
});

gulp.task('dev', function() {
	gulp.watch('./src/js/**/*.js', ['scripts', 'test', 'lint']);
	gulp.watch('./src/less/**/*.less', ['less']);
});

gulp.task('build', ['scripts', 'less']);
