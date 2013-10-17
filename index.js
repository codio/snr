#!/usr/bin/env node

var Glob = require('glob').Glob;
var spawn = require('child_process').spawn;

// Usage
//
// search "[ag OPTIONS] PATTERN" PATH [PATH...]

var args = process.argv.slice(2);



var searchArgs = args.shift().split(' ');

var paths = args;


paths.forEach(function(location) {
  var matcher = new Glob(location);

  matcher.on('match', ag);

  matcher.on('error', function (err) {
    console.error(err);
  });
});

// Execute ag on a given file
function ag(file) {
  var child = spawn('ag', searchArgs.concat([file, '--nocolor', '-C', '2']));
  var output = [];
  child.stdout.on('data', function (d) {output.push(d)});
  child.stdout.on('end', function () {
    if (output.length > 0) {
      console.log([file, '\n'].concat(output).join(''));
    }
  });
}