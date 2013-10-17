#!/usr/bin/env node

var glob = require('glob');
var spawn = require('child_process').spawn;

// Usage
//
// search "[ag OPTIONS] PATTERN" PATH [PATH...]

var args = process.argv.slice(2);

var defaultArgs = args.shift().split(' ').concat(['-C', '2']);

var paths = args;

paths.forEach(function(location) {
  glob(location, function (error, files) {
    if (error) return console.error(error);
    ag(files);
  });
});

// Execute ag on a list of files
function ag(files) {
  console.log(defaultArgs.concat(files));
  var child = spawn('ag', defaultArgs.concat(files), {customFds: [0, 1, 2]});
}