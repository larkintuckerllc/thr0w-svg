'use strict';
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var yuidoc = require("gulp-yuidoc");
gulp.task('default', function() {
  gulp.src('./js/*.js')
    .pipe(gulp.dest('./dist/'))
    .pipe(uglify())
    .pipe(rename(addMin))
    .pipe(gulp.dest('./dist/'));
  gulp.src('./css/*.css')
    .pipe(gulp.dest('./dist/'));
  gulp.src("./js/*.js")
    .pipe(yuidoc())
    .pipe(gulp.dest("./doc"));
  function addMin(path) {
    path.basename += ".min";
  }
});
