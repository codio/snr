#!/usr/bin/env node

var glob = require('glob');
var spawn = require('child_process').spawn;
var split = require('split');
var async = require('async');

// Usage
//
// search "[ag OPTIONS] PATTERN" PATH [PATH...]

var args = process.argv.slice(2);

var defaultArgs = args.shift().split(' ');

// Global counter
var counter = 0;

async.mapSeries(args, search, function(err) {
  console.log('Found ' + counter + ' matches.');
});


// Execute ag on a list of files
function search(location, cb) {
  glob(location, function (error, files) {
    if (error) return cb(error);

    var child = spawn('ack', defaultArgs.concat(files));

    child.stdout.pipe(split())
      .on('data', function(line) {
        if (line.trim().length > 0) {
          console.log(line);
          counter++;
        }
      })
      .on('end', function() {
        cb();
      });
  });
}