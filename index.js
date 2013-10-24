var glob = require('glob');
var Readable = require('stream').Readable;
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var split = require('split');
var async = require('async');
var _ = require('lodash');


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

  // Default options
  opts = _.defaults(opts || {}, {
    ignoreCase: false,
    literal: false,
    wordRegexp: false,
    cmd: 'ack'
  });


  opts._args = makeArgs(opts, ['-H', '--flush', '--heading', '--color']);

  files = _.isArray(files) ? files : [files];


  // Execute the search in series on all patterns.
  async.mapSeries(files, function (file, cb) {
    find(pattern, file, opts, cb);
  }, function (err, fileCount) {
    if (err) {
      if (_.isString(err) && err.indexOf('Stopped because of max-result-limit') === 0) {
        opts._readable.push(err);
        return opts._readable.push(null);
      }

      console.error(err);
      opts._readable.push(null);
      process.exit(1);
    }
    opts._readable.push('Found ' + opts._resultsCount  + ' matches in ' + fileCount + ' file(s).\n');
    opts._readable.push(null);
  });

  return opts._readable;
};

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

  files = _.isArray(files) ? files : [files];


  // Default options
  opts = _.defaults(opts || {}, {
    ignoreCase: false,
    literal: false,
    wordRegexp: false,
    cmd: 'ack'
  });

  opts._args = makeArgs(opts, ['-l']);

  var perlCmd = 'perl';
  var perlArgs = ['g'];
  var perlPattern = pattern;

  // Ignore case option
  if (_.contains(opts._args, '-i')) perlArgs.push('i');

  // Literal option
  if (_.contains(opts._args, '-Q')) perlPattern = '\\Q' + perlPattern + '\\E';

  // Whole word option
  if (_.contains(opts._args, '-w')) perlPattern = '\\b' + perlPattern + '\\b';


  // Execute the search in series on all patterns.
  async.mapSeries(files, function (locations, cb) {
    // Execute globs
    glob(locations, function (error, location) {
      if (error) return cb(error);
      if (files.length === 0) return console.error('No files found.');

      var cmd = [opts.cmd].concat(opts._args).concat(['"' + pattern + '"']).concat(location).concat([
        '|xargs', perlCmd, '-pi', '-e',
        '\'$count += s/' + perlPattern + '/' + opts.replace + '/' + perlArgs.join('') + ';',
        'END{print "$count"}\''
      ]).join(' ');

      // Exec the replace process
      exec(cmd, function (error, stdout, stderr) {

        if (error) return cb(error);

        stdout = stdout.trim().replace(/\\n/g, '');
        var count = parseInt(stdout, 10);

        // Empty result is converted to NaN
        count = _.isNaN(count) ? 0 : count;

        cb(null, count);
      });
    });

  }, function (err, results) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    results = results || [];
    var total = results.reduce(function (a, b) {
      return a + b;
    }, 0);
    opts._readable.push('Replaced ' + total + ' occurrence(s).\n');
    opts._readable.push(null);
  });


  return opts._readable;
};

// Generate the arguments array for ack
//
// opts     - Options object.
// defaults - Default values that are added additionally.
//
// Returns an array of arguments for ack.
function makeArgs(opts, defaults) {
  // Create arguments for ack
  var result = [].concat(defaults);

  if (opts.ignoreCase) result.push('-i');
  if (opts.literal) result.push('-Q');
  if (opts.wordRegexp) result.push('-w');
  if (opts.context && !_.contains(defaults, '-l')) {
    result.push('-C');
    result.push(opts.context);
  }
  if (opts.colors && opts.colors.lineno) {
    result.push('--color-lineno');
    result.push(opts.colors.lineno);
  }

  return result;
}

// Execute the search cmd on a list of files.
//
// pattern  - Search pattern.
// location - Glob pattern to search through.
// opts     - Search options.
// cb       - Callback function.
//
function find(pattern, location, opts, cb) {
  // Match the color code for background orange.
  var matchRegexp = new RegExp(/[\u001b]\[30;43m/g);
  var newFileRegexp = new RegExp(/^[\u001b]\[[0-9]+;[0-9]+m[^0-9]/);

  // Copy args
  var args = [].concat(opts._args);

  // Counter for number of files with matches
  var fileCount = 0;

  // Execute globs
  glob(location, function (error, files) {
    if (error) return cb(error);

    if (files.length === 0) return console.error('No files found.');
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

          return cb('Stopped because of max-result-limit at ' + opts._resultsCount + '.\n');
        }


        // Count all occurrences of the match in the line
        var matchesCount = line.match(matchRegexp);
        opts._resultsCount += matchesCount ? matchesCount.length : 0;

        if (line.match(newFileRegexp)) fileCount++;

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
        cb(null, fileCount);
      });

    child.stderr.pipe(process.stderr);
  });
}


exports.search = search;
exports.replace = replace;
