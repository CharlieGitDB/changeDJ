module.exports = function(grunt) {
    // Project configuration.
    var files = ['scripts/logreg.js', 'scripts/main.js', 'scripts/youtube.js', 'scripts/view.js'];
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            build: {
                files: [{
                  expand: true,
                  src: files,
                  dest: 'server/public/',
                  ext: '.min.js'
                }]
            }
        },
        watch: {
    			scripts: {
    				files: ["scripts/logreg.js", "scripts/main.js", "scripts/youtube.js", "scripts/view.js"],
    				tasks: ["uglify"],
    				options: {
    					spawn: false
    				}
    			}
    		},
        copy: {
            main: {
                expand: true,
                cwd: "node_modules/",
                src: [
                    "angular/angular.min.js",
                    "angular/angular.min.js.map",
                    "angular/angular-csp.css"
                ],
                "dest": "server/public/vendors/"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");

    // Default task(s).
    grunt.registerTask("default", ["copy", "uglify", "watch"]);

};
