const gulp          = require("gulp");
const browserSync   = require("browser-sync").create();
const gulpif        = require("gulp-if");
const del           = require("del");
const sass          = require("gulp-sass");
const autoprefixer  = require("gulp-autoprefixer");
const notify        = require("gulp-notify");
const cssnamo       = require("gulp-cssnano");
const rename        = require("gulp-rename");
const concat        = require("gulp-concat");
const uglify        = require("gulp-uglifyjs");
const imagemin      = require("gulp-imagemin");
const htmlmin       = require("gulp-htmlmin");
const svgSprite     = require("gulp-svg-sprite");
const fileinclude   = require("gulp-file-include");
const babel         = require("gulp-babel");

const preProcessor = "scss";
const env = process.env.NODE_ENV && process.env.NODE_ENV.trim();
const isProduction = (env == "production");

const images = ["src/img/**/*.jpg", "src/img/**/*.png", "src/img/**/*.gif", "src/img/**/*.jpeg"];
const scripts = [
	"node_modules/jquery/dist/jquery.min.js"
];

gulp.task("server", function(){
    browserSync.init({
        watch: true,
        server: "./build"
    });
    gulp.watch("src/scss/**/*.scss", gulp.series("scss")).on("change", browserSync.reload);
    gulp.watch(["src/*.html", "src/includes/**/*.html"], gulp.series("html")).on("change", browserSync.reload);
    gulp.watch("src/js/**.js", gulp.series("js")).on("change", browserSync.reload);
});

gulp.task("clean:build", function(){
    return del("build");
});
gulp.task("clean:images", function(){
    return del("build/img/*");
});

gulp.task("html", function(){
    return gulp.src("src/*.html")
        .pipe(fileinclude({
            prefix: "@@",
            basepath: "src/includes/"
        }))
        .pipe(gulpif(isProduction, htmlmin({ collapseWhitespace: true })))
        .pipe(gulp.dest("build"));
});

gulp.task("scss", function(){
    return gulp.src(`src/${preProcessor}/*.${preProcessor}`)
        .pipe(sass())
        .on("error", notify.onError(function(e){
            return {
                title: `Error ${preProcessor}`,
                message: e.message
            }
        }))
        .pipe(autoprefixer({
            browsers: ["last 15 versions", "> 1%", "ie 8", "Firefox < 20"],
            cascade: true
        }))
        .pipe(gulp.dest("build"))
        .pipe(browserSync.stream());
});

gulp.task("css:min", function(){
    return gulp.src(["build/main.css"])
        .pipe(cssnamo())
        .pipe(rename({ suffix: ".min" }))
        .pipe(gulp.dest("build"))
});

gulp.task("js", function(){
    scripts.push(...["src/js/main.js", "src/js/*.js"]);

    return gulp.src(scripts)
        .pipe(babel({
            ignore: [
                "./node_modules"
            ],
            presets: ["@babel/env"]
        }))
        .pipe(concat("all.js"))
        .pipe(gulp.dest("build/js"))
});

gulp.task("js:min", function(){
    return gulp.src("build/js/**.js")
        .pipe(uglify())
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest("build/js"))
});

gulp.task("images:bitmap", function(){
    return gulp.src(images)
        .pipe(imagemin())
        .pipe(gulp.dest("build/img/bitmap"));
});

const config = {
    mode: {
        stack: {
            sprite: "../sprite.svg"
        }
    }
};
gulp.task("images:svg", function(){
    return gulp.src("src/img/**/*.svg")
        .pipe(svgSprite(config))
        .pipe(gulp.dest("build/img/svg"));
});

gulp.task("images", gulp.series("clean:images", "images:bitmap", "images:svg"));

gulp.task("fonts", function(){
    return gulp.src("src/fonts/**")
        .pipe(gulp.dest("build/fonts"));
});

gulp.task("watch", gulp.series("clean:build", "html", "scss", "js", "images", "fonts", "server"));
gulp.task("build", gulp.series("clean:build", "html", "scss", "css:min", "js", "js:min", "images", "fonts"));