/* ==Requirements to build the gulp js file== */
const gulp = require('gulp');
const runSequence = require('gulp4-run-sequence');
const uglify = require('gulp-uglify');
const uglifycss = require('gulp-uglifycss');
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const autoprefixer = require('autoprefixer');
const clean = require('gulp-clean');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass')(require('sass'));
const notify = require('gulp-notify')
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

const outputPath = 'dist/src';

// set clean paths
const cleanPaths = [
	'dist/*',
	'composer.lock',
	'package-lock.json'
];

const handlebarsPaths = [
	'node_modules/handlebars/dist/handlebars.js',
	'node_modules/handlebars/dist/handlebars.min.js',
	'node_modules/handlebars/dist/handlebars.runtime.js',
	'node_modules/handlebars/dist/handlebars.runtime.min.js',
	'node_modules/handlebars/LICENSE'
];

const jsWatchPaths = [
	'./src/**/*.js',
];

const jsToBeCompiledPaths = {
	'updraft-theme/theme': './src/updraft-theme/theme.js',
};

const jsPaths = [
	'./src/**/*.js',
	...(
		Object.keys(jsToBeCompiledPaths).map(name => name.split('/')[0]).map(folder => `!./src/${folder}/**/*.js`)
	)
];

const phpPaths = [
	'src/**/*.php'
];

const svgsPaths = [
	'src/**/*.svg'
];

var fontPaths = [
	'src/**/*.woff2',
	'src/**/*.ttf'
];

const scssWatchPaths = [
	'src/updraft-theme/**/*.scss',
];

const scssPaths = [
	'src/updraft-theme/theme.scss',
	'src/updraft-theme/theme-colors.scss',
];

const cssWatchPaths = [
	'src/**/*.css',
];

const cssPaths = [
	'src/**/*.css',
];

const htmlPaths = [
	'src/**/*.html'
];

/* ==Start Gulp Process== */
gulp.copy = function(src,dest) {
	return gulp.src(src, {base:"."})
	.pipe(plumber(reportError))
	.pipe(gulp.dest(dest));
};

/* ==Images=== */
gulp.task('svgs_move', function(){
	return gulp.src(svgsPaths)
	.pipe(plumber(reportError))
	.pipe(gulp.dest(outputPath));
})

/* ==Fonts=== */
gulp.task('fonts_move', function(){
	return gulp.src(fontPaths)
	.pipe(plumber(reportError))
	.pipe(gulp.dest(outputPath));
});

/* ==Sorting HTML=== */
gulp.task('html_move', function(){
	return gulp.src(htmlPaths)
	.pipe(plumber(reportError))
	.pipe(gulp.dest(outputPath));
});

/* ===Sorting SCSS=== */
gulp.task('scss_compile', function(){
	return gulp.src(scssPaths, { base: 'src' })
	.pipe(plumber(reportError))
	.pipe(sourcemaps.init())
	.pipe(sass({silenceDeprecations: ['legacy-js-api', 'mixed-decls', 'color-functions', 'global-builtin', 'import']}))
	.pipe(postcss([ autoprefixer({ browsers: ['last 2 versions'] }) ]))
	.pipe(plumber(reportError))
	.pipe(gulp.dest(outputPath))
	.pipe(uglifycss({'maxLineLen': 0, 'uglyComments': true}).on('error', console.error))
	.pipe(rename({suffix: '.min'}))
	.pipe(sourcemaps.write('.'))
	.pipe(plumber.stop())
	.pipe(gulp.dest(outputPath));
});

gulp.task('copy_css', function () {
	return gulp.src(cssPaths, { base: './src' })
	.pipe(gulp.dest(outputPath));
});

/* ===Sorting JS=== */
gulp.task('js_compile', function(){
	return webpackStream({
            mode: 'production',
			entry: jsToBeCompiledPaths,
            output: {
                filename: '[name].js',
            },
        }, webpack)
        .pipe(gulp.dest(outputPath));
});

gulp.task('copy_plain_js', function () {
	return gulp.src(jsPaths, { base: './src' })
	.pipe(gulp.dest(outputPath));
});

/* ====Sorting PHP======= */
gulp.task('php_move', function(){
	return gulp.src(phpPaths)
	.pipe(plumber(reportError))
	.pipe(gulp.dest(outputPath));
})

gulp.task('copy_handlebar_to_updraft_theme', function(){
	return gulp.src(handlebarsPaths)
	.pipe(plumber(reportError))
	.pipe(gulp.dest(outputPath + '/updraft-theme/handlebar-library'));
});

gulp.task('copy_readme', function () {
	return gulp.src('README.md')
		.pipe(gulp.dest('dist'));
});

gulp.task('copy_composer_json', function () {
	return gulp.src('composer.json')
		.pipe(gulp.dest('dist'));
});

/*== Clean theme build ==*/
gulp.task('clean', function(){
	return gulp.src(cleanPaths, { allowEmpty: true })
	.pipe(plumber(reportError))
	.pipe(clean({force:true}));
})

/*== Building the files ==*/
gulp.task('build', function(done){
	runSequence('clean',
				['js_compile', 'copy_plain_js'],
				['php_move'],
				['html_move', 'copy_css', 'scss_compile', 'svgs_move', 'fonts_move'],
				['copy_handlebar_to_updraft_theme'],
				['copy_readme', 'copy_composer_json'],
				done
	);
});

/*== These tasks are ran to build gulp files ==*/

// ran with gulp build
gulp.task('default', function(){
	runSequence('clean', 'build', 'watch');
});

gulp.task('php', function(done){
	runSequence('php_move', done);
});

gulp.task('js', function(done) {
	runSequence('js_compile', 'copy_plain_js', done);
});

gulp.task('scss', function(done) {
	runSequence('scss_compile', done);
});

gulp.task('css', function(done) {
	runSequence('copy_css', done);
});

gulp.task('html', function(done){
	runSequence('html_move', done);
});

gulp.task('watch', function(){
	gulp.watch(scssWatchPaths, gulp.series(['scss']));
	gulp.watch(cssWatchPaths, gulp.series(['css']));
	gulp.watch(jsWatchPaths, gulp.series(['js']));
	gulp.watch(phpPaths, gulp.series(['php']));
	gulp.watch('src/updraft-theme/**/*.handlebars.html', gulp.series(['html']));
});

// Setup pretty error handling
var reportError = function (error) {
    var lineNumber = (error.lineNumber) ? 'LINE ' + error.lineNumber + ' -- ' : '';
    var report = '';
    var chalk = gutil.colors.white.bgRed;

    // Shows a pop when errors
    notify({
        title: 'Task Failed [' + error.plugin + ']',
		message: lineNumber + 'See console.',
        sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    }).write(error);

    report += chalk('GULP TASK:') + ' [' + error.plugin + ']\n';
    report += chalk('PROB:') + ' ' + error.message + '\n';
    if (error.lineNumber) { report += chalk('LINE:') + ' ' + error.lineNumber + '\n'; }
    if (error.fileName)   { report += chalk('FILE:') + ' ' + error.fileName + '\n'; }
    console.error(report);
    // console.log(error);
    process.exit(1);
}
