
module.exports = function(grunt){
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
        test: {
          options: {
            reporter: 'spec',
            captureFile: 'test-results.txt', // Optionally capture the reporter output to a file 
            quiet: false, // Optionally suppress output to standard out (defaults to false) 
            clearRequireCache: false, // Optionally clear the require cache before running tests (defaults to false) 
            noFail: false // Optionally set to not fail on failed tests (will still fail on other errors) 
            },
            src: ['test/**/*.js']
        }
    }
  });
  grunt.registerTask('default', 'mochaTest');
}
