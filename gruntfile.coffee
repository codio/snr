module.exports = (grunt) ->

  grunt.initConfig
    simplemocha:
      options:
        ignoreLeaks: no
        ui: 'bdd'
        reporter: 'spec'
      all:
        src: ['test/*.js']


  grunt.loadNpmTasks 'grunt-simple-mocha'

  grunt.registerTask 'test', ['simplemocha']
  grunt.registerTask 'default', ['test']
