var path          = require('path');
var gulp          = require('gulp');
var browserify    = require('gulp-browserify');
var less          = require('gulp-less');
var csso          = require('gulp-csso');
var watch         = require('gulp-watch');
var uglify        = require('gulp-uglify');
var inlinesource  = require('gulp-inline-source');
var livereload    = require('gulp-livereload');
var sourcemaps    = require('gulp-sourcemaps');
var jshint        = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');

var lvr = false;

gulp.task('less', function () {
	var stream = gulp.src('.src/less/app.less')
		.pipe(less({
			paths: [ path.join(__dirname, '.src', 'less') ]
		}))
		.pipe(sourcemaps.init())
			.pipe(csso())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./src'));
	lvr && stream.pipe(livereload());
});

gulp.task('scripts', function() {
	// Single entry point to browserify
	var stream = gulp.src('.src/js/app.js')
			.pipe(browserify())
			.pipe(sourcemaps.init())
				.pipe(jshint())
				.pipe(jshint.reporter(jshintStylish))
				.pipe(uglify())
			.pipe(sourcemaps.write())
		.pipe(gulp.dest('./src'));
	lvr && stream.pipe(livereload());
});

gulp.task('watch', function() {
	lvr = true;
	// calls 'build-js' whenever anything changes
	gulp.watch('.src/js/**/*.js', ['scripts']);
	gulp.watch('.src/less/**/*.less', ['less']);
});

gulp.task('dist', ['scripts'], function() {
	gulp.src('./src/**/*.js')
		.pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['scripts', 'less']);
