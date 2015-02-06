
// Dependencies
// ------------

var glob = require('glob');
var Readable = require('stream').Readable;
var spawn = require('child_process').spawn;
var _ = require('lodash');
var async = require('async');
var common = require('./common');

// Deep defaults
var defaultOptions = require('./defaults');

var ackCmd = common.ackCmd;

function startProcess(stdin, cmd, args, cb) {
  var out = [];
  var err = [];
  var child =  spawn(cmd, args);

  if (_.isString(stdin) && stdin.length > 0) {
    child.stdin.setEncoding = 'utf-8';
    child.stdin.write(stdin);
    child.stdin.end();
  }

  child.stdin.end();

  child.stdout.on('data', function (data) {
    out.push('' + data);
  });

  child.stderr.on('data', function (data) {
    err.push('' + data);
  });

  child.on('close', function (code) {
    cb(code !== 0, out.join(''), err.join(''));
  });
}


// Do a negative look behind replace
//
// input    - String, input string.
// nonMatch - String, what should not be matched
// match    - String, the part that should be matched
// rPattern - String, the string to replace match with
//
// Returns the replaced string.
function negativeLookBehind(input, nonMatch, match, rPattern) {

  var re = new RegExp('(' + nonMatch  + ')?' + match, 'g');

  return input.replace(re, function ($0, $1) {
    return $1 ? $0 : rPattern;
  });
}


// Replace in files
//
// files   - File patterns to search through.
// pattern - String pattern to search for.
// opts    - Object with search options.
//
// Returns a Readable Stream.
module.exports = function (files, pattern, opts) {

  opts._readable = new Readable();
  opts._readable._read = function (size) {};

  files = _.isArray(files) ? files : [files];
  files = _.uniq(files);

  // Default options
  opts = _.defaults(opts || {}, defaultOptions);

  opts._args = common.makeArgs(opts, ['-l']);

  var perlCmd = 'perl';
  var perlArgs = ['g'];
  var perlPattern = pattern;

  if (_.contains(opts._args, '-Q')) {
    // Escape forward slashes in the find pattern
    perlPattern = negativeLookBehind(perlPattern, '\\\\', '\\/', '\\/');

    // Escape backward slashes in the replace pattern
    opts.replace = negativeLookBehind(opts.replace, '\\\\', '\\\\' , '\\\\');

    // Escape forward slashes in the replace pattern
    opts.replace = negativeLookBehind(opts.replace, '\\\\', '\\/', '\\/');

    // Escape dollar sign
    opts.replace = opts.replace.replace(/\$/g, '\\$');
  }

  // Ignore case option
  if (_.contains(opts._args, '-i')) perlArgs.push('i');

  // Literal option
  if (_.contains(opts._args, '-Q')) perlPattern = '\\Q' + perlPattern + '\\E';

  // Whole word option
  if (_.contains(opts._args, '-w')) perlPattern = '\\b' + perlPattern + '\\b';



  // Execute the search in series on all patterns.
  async.mapSeries(files, function (locations, cb) {
    // Execute globs
    glob(locations, {mark: true}, function (error, location) {
      if (error) return cb(error);
      location = _.uniq(location);
      location = _.filter(location, function (item) {
        return item.lastIndexOf('/') !== item.length - 1;
      });
      return cb(null, location);
    });
  }, function (err, results) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    var files = _.union.apply(null, results);
    if (files.length === 0) {
      console.error('No files found.');
      process.exit(1);
    }
    startProcess(files.join('\n'),
      'xargs', [ackCmd].concat(opts._args).concat([pattern]),
      function (error, out, err) {
        startProcess(out, 'xargs', [ perlCmd, '-pi', '-e',
          '$count += s/' + perlPattern + '/' + opts.replace + '/' +
          perlArgs.join('') + ';END{print "$count"}'
          ],
          function (error, stdout, stderr) {
            if (error) {
              console.error(err);
              process.exit(1);
            }
            stdout = stdout.trim().replace(/\\n/g, '');
            var count = parseInt(stdout, 10);

            // Empty result is converted to NaN
            count = _.isNaN(count) ? 0 : count;
            opts._readable.push('Replaced ' + count + ' occurrence(s).\n');
            opts._readable.push(null);
          });
      }
    );
  });

  return opts._readable;
};
