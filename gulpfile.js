'use strict';

var gulp          = require('gulp');
var less          = require('gulp-less');
var csso          = require('gulp-csso');
var uglify        = require('gulp-uglify');
var jshint        = require('gulp-jshint');
var jscs          = require('gulp-jscs');
var rename        = require('gulp-rename');
var mocha         = require('gulp-mocha');
var concat        = require('gulp-concat');
var jshintStylish = require('jshint-stylish');
var browserSync   = require('browser-sync');
var reload        = browserSync.reload;

/**
 * jshint task for all javascript files
 */
gulp.task('lint', function () {
    return gulp.src([
            './src/js/formfileupload.js',
            './test/**/*.js',
            './gulpfile.js'
        ])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter(jshintStylish))
        .pipe(jscs('.jscsrc'));
});

/**
 * executes the javascript tests
 */
gulp.task('test', ['lint'], function () {
    return gulp.src('./test/*.js')
        .pipe(mocha());
});

/**
 * Build task for the final css files
 */
gulp.task('less', function () {
    return gulp.src('./src/less/app.less')
        .pipe(less())
        .pipe(csso())
        .pipe(gulp.dest('./demo'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('browser-sync', function () {
    browserSync({
        server: {
            baseDir: './demo'
        }
    });
});

/**
 * Build task for the final javascript files
 */
gulp.task('scripts', ['lint'], function () {
    return gulp.src([
            './src/js/umd-header.js',
            './src/js/formfileupload.js',
            './src/js/umd-footer.js'
        ])
        .pipe(concat('formfileupload.js'))
        .pipe(gulp.dest('./dist'))
        .pipe(gulp.dest('./demo/js'))
        .pipe(rename(function (path) {
            path.basename += '.min';
        }))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'))
        .pipe(gulp.dest('./demo/js'))
        .pipe(reload({
            stream: true
        }));
});

/**
 * Task to build the module as a proper jQuery Plugin
 */
gulp.task('jQuery', function () {
    return gulp.src([
            './src/js/umd-header.js',
            './src/js/formfileupload.js',
            './src/js/jquery.plugin.js',
            './src/js/umd-footer.js'
        ])
        .pipe(concat('jquery.formfileupload.js'))
        .pipe(gulp.dest('./dist'))
        .pipe(gulp.dest('./demo/js'))
        .pipe(uglify())
        .pipe(rename(function (path) {
            path.basename += '.min';
        }))
        .pipe(gulp.dest('./dist'))
        .pipe(gulp.dest('./demo/js'));
});

/**
 * Dev Task uses browser-sync instead of livereload and runs tests, linters and scripts on js file change and less task on less file changes
 */
gulp.task('dev', ['browser-sync'], function () {
    gulp.watch('./src/js/**/*.js', [
        'scripts',
        'jQuery'
    ]);

    gulp.watch('./src/less/**/*.less', [
        'less'
    ]);
});

gulp.task('default', [
    'scripts',
    'less',
    'jQuery'
]);
