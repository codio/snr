
// Dependencies
// ------------

var Readable = require('stream').Readable;
var async = require('async');
var _ = require('lodash');
var split = require('split');
var glob = require('glob');
var spawn = require('child_process').spawn;

var common = require('./common');

// Deep defaults
var defaultOptions = require('./defaults');

var ackCmd = common.ackCmd;

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
  var newFileRegexp = new RegExp(/^[\u001b]\[1;32m/);

  // Copy args
  var args = [].concat(opts._args);

  // Counter for number of files with matches
  var fileCount = 0;

  // Execute globs
  glob(location, {mark: true, dot: true}, function (error, files) {
    if (error) return cb(error);

    // Filter out all directories and .git .hg
    files = _.filter(files, function (file) {
      return !common.endsWith(file, '/') && !common.startsWith(file, '.git/') && !common.startsWith(file, '.hg/');
    });

    if (files.length === 0) return console.error('No files found.');

    // Spawn the ack process
    var child = spawn('xargs', [ackCmd].concat(args).concat(pattern));

    child.stdin.setEncoding = 'utf-8';
    child.stdin.write(files.join('\n'));
    child.stdin.end();

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

          return cb([
            'Stopped because of max-result-limit at ',
            opts._resultsCount,
            ' match(es) in ',
            fileCount,
            ' file(s).\n'
          ].join(''));
        }


        // Count all occurrences of the match in the line
        var matchesCount = line.match(matchRegexp);
        opts._resultsCount += matchesCount ? matchesCount.length : 0;

        if (line.match(newFileRegexp)) ++fileCount;

        // Output
        opts._readable.push(line + '\n');

        // Decrement stopIn after output.
        if (stopIn > 0) return stopIn--;

        // If we are over the maximum stop the process and exit.
        if (stopIn === -1
            && opts.maxResults
            && opts._resultsCount >= opts.maxResults) {
          stopIn = opts.context;
        }
      })
      .on('end', function() {
        cb(null, fileCount);
      });

    child.stderr.pipe(process.stderr);
  });
}

// Search files
//
// files   - File patterns to search through.
// pattern - String pattern to search for.
// opts    - Object with search options.
//
// Returns a Readable Stream.
module.exports = function (files, pattern, opts) {
  // Result Stream
  opts._readable = new Readable();
  opts._readable._read = function (size) {};

  // Result Counter
  opts._resultsCount = 0;

  // Default options
  opts = _.defaults(opts || {}, defaultOptions);


  opts._args = common.makeArgs(opts, ['-H', '--flush', '--heading', '--color']);

  files = _.isArray(files) ? files : [files];
  files = _.uniq(files);

  // Execute the search in series on all patterns.
  async.mapSeries(files, function (file, cb) {
    find(pattern, file, opts, cb);
  }, function (err, fileCount) {
    if (err) {
      if (_.isString(err)
          && err.indexOf('Stopped because of max-result-limit') === 0) {
        opts._readable.push(err);
        return opts._readable.push(null);
      }

      console.error(err);
      opts._readable.push(null);
      process.exit(1);
    }

    if (_.isArray(fileCount)) {
      fileCount = _.reduce(fileCount, function (sum, part) {
        return sum += part;
      }, 0);
    }

    opts._readable.push([
      'Found ',
      opts._resultsCount,
      ' matches in ',
      fileCount,
      ' file(s).\n'
    ].join(''));
    opts._readable.push(null);
  });

  return opts._readable;
};
