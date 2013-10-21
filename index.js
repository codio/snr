var glob = require('glob');
var Readable = require('stream').Readable;
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var split = require('split');
var async = require('async');
var _ = require('lodash');



// Generate the arguments array for ack
//
// opts     - Options object.
// defaults - Default values that are added additionally.
//
// Returns an array of arguments for ack.
var makeArgs = function (opts, defaults) {
  // Create arguments for ack
  var result = [].concat(defaults);

  if (opts.ignoreCase) result.push('-i');
  if (opts.literal) result.push('-Q');
  if (opts.word_regexp) result.push('-w');
  if (opts.context && !_.contains(defaults, '-l')) {
    result.push('-C');
    result.push(opts.context);
  }
  return result;
};


// Search files
//
// files   - File patterns to search through.
// pattern - String pattern to search for.
// opts    - Object with search options.
//
// Returns a Readable Stream.
var search = function (files, pattern, opts) {
  // Result Stream
  opts._readable = new Readable();
  opts._readable._read = function (size) {};

  // Result Counter
  opts._resultsCount = 0;

  opts._args = makeArgs(opts, ['-H', '--flush', '--heading', '--color']);

  // Execute the search in series on all patterns.
  async.mapSeries(files, function (file, cb) {
    find(pattern, file, opts, cb);
  }, function (err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    opts._readable.push('Found ' + opts._resultsCount  + ' matches.');
    opts._readable.push(null);
  });

  return opts._readable;
};


// Execute the search cmd on a list of files.
//
// pattern  - Search pattern.
// location - Glob pattern to search through.
// opts     - Search options.
// cb       - Callback function.
//
var find = function (pattern, location, opts, cb) {
  // Match the color code for background orange.
  var matchRegexp = new RegExp(/[\u001b]\[30;43m/g);

  // Copy args
  var args = [].concat(opts._args);

  // Execute globs
  glob(location, function (error, files) {
    if (error) return cb(error);

    if (files.length === 0) return console.error('No files found');
    // Spawn the ack process
    var child = spawn(opts.cmd, args.concat(pattern).concat(files));

    var stopIn = -1;
    var stopped = false;

    child.stdout.pipe(split())
      .on('data', function(line) {
        if (stopped) return;

        line = line.trim();
        if (line.length === 0) {
          return;
        }

        if (stopIn === 0) {
          stopped = true;
          child.kill('SIGHUP');
          cb('Stopped because of max-result-limit at ' + opts._resultsCount + '.');
        }


        // Count all occurrences of the match in the line
        var matchesCount = line.match(matchRegexp);
        opts._resultsCount += matchesCount ? matchesCount.length : 0;

        // Output
        opts._readable.push(line + '\n');

        // Decrement stopIn after output.
        if (stopIn > 0) return stopIn--;

        // If we are over the maximum stop the process and exit.
        if (stopIn === -1 && opts.maxResults && opts._resultsCount >= opts.maxResults) {
          stopIn = opts.context;
        }
      })
      .on('end', function() {
        cb();
      });

    child.stderr.pipe(process.stderr);
  });
}

// Replace in files
//
// files   - File patterns to search through.
// pattern - String pattern to search for.
// opts    - Object with search options.
//
// Returns a Readable Stream.
var replace = function (files, pattern, opts) {

  opts._readable = new Readable();
  opts._readable._read = function (size) {};

  opts._args = makeArgs(opts, ['-l']);

  // Execute the search in series on all patterns.
  async.mapSeries(files, function (locations, cb) {
    // Execute globs
    glob(locations, function (error, location) {
      if (error) return cb(error);
      if (files.length === 0) return console.error('No files found');

      var cmd = [opts.cmd].concat(opts._args).concat([pattern]).concat(location).concat([
        '|xargs', 'perl', '-pi', '-e',
        '\'$count += s/' + pattern + '/' + opts.replace +'/g;',
        'END{print "Replaced $count occurence(s).\n"}\''
      ]).join(' ');

      // Exec the replace process
      exec(cmd, function (error, stdout, stderr) {

        if (error) return cb(error);

        opts._readable.push(stdout);
        cb();
      });
    });
  }, function (err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    //opts._readable.push('Finished\n');
    opts._readable.push(null);
  });


  return opts._readable;
};




exports.search = search;
exports.replace = replace;
