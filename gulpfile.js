var gulp          = require('gulp');
var browserify    = require('gulp-browserify');
var less          = require('gulp-less');
var csso          = require('gulp-csso');
var watch         = require('gulp-watch');
var uglify        = require('gulp-uglify');
var livereload    = require('gulp-livereload');
var sourcemaps    = require('gulp-sourcemaps');
var jshint        = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');
var rename        = require('gulp-rename');
var mocha         = require('gulp-mocha');

var lvr = false;

gulp.task('less', function() {
	var stream = gulp.src('./src/less/app.less')
		.pipe(less())
		.pipe(sourcemaps.init())
			.pipe(csso())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./demo'));
	lvr && stream.pipe(livereload());
});

gulp.task('scripts', function() {
	// Single entry point to browserify
	var stream = gulp.src('./src/js/easyformfileupload.js')
		.pipe(browserify({standalone: 'EasyFormFileUpload'}))
		.pipe(gulp.dest('./dist'))
		.pipe(gulp.dest('./demo/js'));
	lvr && stream.pipe(livereload());
});

gulp.task('umd', function() {
	var stream = gulp.src('./src/js/easyformfileupload.js')
		.pipe(browserify({standalone: 'EasyFormFileUpload'}))
		.pipe(gulp.dest('./dist'))
});

gulp.task('minify', function() {
	var stream = gulp.src('./demo/js/easyformfileupload.js')
		.pipe(rename(function (path) {
			path.basename += ".min";
		}))
		.pipe(uglify())
		.pipe(gulp.dest('./dist'))
		.pipe(gulp.dest('./demo/js'));
});

gulp.task('lint', function() {
	return gulp.src('./src/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter(jshintStylish));
});

gulp.task('test', function () {
	return gulp.src('./test/*.js', {read: false})
		.pipe(mocha());
});

gulp.task('dist', ['scripts'], function() {
	gulp.src('./src/**/*.js')
		.pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function() {
	lvr = true;
	// calls 'build-js' whenever anything changes
	gulp.watch('./src/js/**/*.js', ['scripts', 'test', 'lint']);
	gulp.watch('./src/less/**/*.less', ['less']);
	gulp.watch('./demo/js/easyformfileupload.js', ['minify']);
});

gulp.task('default', ['scripts', 'less', 'lint', 'test', 'minify']);
