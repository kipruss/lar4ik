'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const debug = require('gulp-debug');
const gulpIf = require('gulp-if');
const del = require('del');
const jade = require('gulp-jade');
const newer = require('gulp-newer');  // gulp-changed
//const concat = require('gulp-concat');
//const autoprefixer = require('gulp-autoprefixer');
const remember = require('gulp-remember');
//const cached = require('gulp-cached');
const path = require('path');
const browserSync = require('browser-sync').create();
const notify = require('gulp-notify');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const rev = require('gulp-rev');
const revReplace = require('gulp-rev-replace');
const combiner = require('stream-combiner2').obj;
const eslint = require('gulp-eslint');
const through2 = require('through2').obj;
const fs = require('fs');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

const src_dir = './src';
const build_dir = './build';
const manifest_dir = './manifest';

gulp.task('styles', function() {
    return combiner(
        gulp.src(src_dir + '/styles/styles.scss'/*, {since: gulp.lastRun('styles')}*/),
        //cached('styles'),
        gulpIf(isDevelopment, sourcemaps.init()),
        sass(),
        gulpIf(!isDevelopment, revReplace({
            manifest: gulp.src(manifest_dir + '/images.json', {allowEmpty: true})
        })),
        /*autoprefixer({
            browsers: ['last 2 versions']
        }),*/
        gulpIf(isDevelopment, sourcemaps.write('.')),
        gulpIf(!isDevelopment, cssnano()),
        gulpIf(!isDevelopment, rev()),
        remember('styles'),
        //debug({title: 'styles'}),
        //concat('all.css'),
        gulp.dest(build_dir + '/css'),
        gulpIf(!isDevelopment, rev.manifest('css.json')),
        gulpIf(!isDevelopment, gulp.dest(manifest_dir))
    ).on('error', notify.onError());
});

gulp.task('clean', function() {
    return del(build_dir, manifest_dir);
});

gulp.task('assets', function() {
    return gulp.src(src_dir + '/assets/**/*.*', {since: gulp.lastRun('assets')})
        .pipe(newer(build_dir))
        .pipe(gulp.dest(build_dir));
});

gulp.task('images', function() {
    return combiner(
        gulp.src(src_dir + '/images/**/*.*', {since: gulp.lastRun('images')}),
        gulpIf(!isDevelopment, rev()),
        remember('images'),
        gulp.dest(build_dir + '/images'),
        gulpIf(!isDevelopment, rev.manifest('images.json')),
        gulpIf(!isDevelopment, gulp.dest(manifest_dir))
    ).on('error', notify.onError());
});

gulp.task('js', function() {
    return combiner(
        gulp.src(src_dir + '/js/**/*.*'/*, {since: gulp.lastRun('js')}*/),
        //concat('main.js'),
        gulpIf(!isDevelopment, uglify()),
        gulpIf(!isDevelopment, rev()),
        remember('js'),
        gulp.dest(build_dir + '/js'),
        gulpIf(!isDevelopment, rev.manifest('js.json')),
        gulpIf(!isDevelopment, gulp.dest(manifest_dir))
    ).on('error', notify.onError());
});

gulp.task('templates', function() {
    let YOUR_LOCALS = {};
 
    return gulp.src(src_dir + '/templates/*.jade')
        //.pipe(cached('templates'))
        .pipe(jade({
            locals: YOUR_LOCALS,
            pretty: isDevelopment
        }))
        .pipe(gulpIf(!isDevelopment, revReplace({
            manifest: gulp.src(manifest_dir + '/css.json', {allowEmpty: true})
        })))
        .pipe(gulpIf(!isDevelopment, revReplace({
            manifest: gulp.src(manifest_dir + '/js.json', {allowEmpty: true})
        })))
        .pipe(gulpIf(!isDevelopment, revReplace({
            manifest: gulp.src(manifest_dir + '/images.json', {allowEmpty: true})
        })))
        .pipe(remember('templates'))
        .pipe(gulp.dest(build_dir))
});

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('styles', 'js', 'images', 'assets', 'templates'))
);

gulp.task('buildproduction', gulp.series('clean', 'images', 'styles', 'js', 'assets', 'templates'));

gulp.task('watch', function() {
    gulp.watch(src_dir + '/styles/**/*.*', gulp.series('styles')).on('unlink', function(filepath) {
        remember.forget('styles', path.resolve(filepath));
        //delete cached.caches.styles[path.resolve(filepath)];
    });
    gulp.watch(src_dir + '/js/**/*.*', gulp.series('js')).on('unlink', function(filepath) {
        remember.forget('js', path.resolve(filepath));
    });
    gulp.watch(src_dir + '/images/**/*.*', gulp.series('images')).on('unlink', function(filepath) {
        remember.forget('images', path.resolve(filepath));
    });
    gulp.watch(src_dir + '/assets/**/*.*', gulp.series('assets'));
    gulp.watch(src_dir + '/templates/**/*.*', gulp.series('templates')).on('unlink', function(filepath) {
        remember.forget('templates', path.resolve(filepath));
    });
});

gulp.task('serve', function() {
    browserSync.init({
        server: build_dir,
        port: 1234
    });
    browserSync.watch(build_dir + '/**/*.*').on('change', browserSync.reload);
});

gulp.task('dev',
    gulp.series('build', gulp.parallel('watch', 'serve'))
);

gulp.task('lint-old', function() {
  return gulp.src('src/js/**/*.*')
      .pipe(eslint())
      .pipe(eslint.failAfterError());
});

gulp.task('lint', function() {
    let eslintResults = {};
    let cacheFilePath = process.cwd() + '/work/tmp/lintCache.json';

    try {
        eslintResults = JSON.parse(fs.readFileSync(cacheFilePath));
    } catch (e) {}

    return gulp.src('src/js/**/*.*', {read: false})
        .pipe(gulpIf(
            function(file) {
                return eslintResults[file.path] && eslintResults[file.path].mtime == file.stat.mtime.toJSON();
            },
            through2(function(file, enc, callback) {
                file.eslint = eslintResults[file.path].eslint;
                callback(null, file);
            }),
            combiner(
                through2(function(file, enc, callback) {
                    file.contents = fs.readFileSync(file.path);
                    callback(null, file);
                }),
                eslint(),
                through2(function(file, enc, callback) {
                    eslintResults[file.path] = {
                        eslint: file.eslint,
                        mtime: file.stat.mtime
                    };
                    callback(null, file);
                })
            )
        ))
        .on('end', function() {
            fs.writeFileSync(cacheFilePath, JSON.stringify((eslintResults)));
        })
        .pipe(eslint.failAfterError());
});
