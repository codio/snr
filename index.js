#!/usr/bin/env node

var glob = require('glob');
var spawn = require('child_process').spawn;
var split = require('split');
var async = require('async');
var dashdash = require('dashdash');
var sh = require('execSync');


// Argument Handling

var options = [
  {
    names: ['ignore-case', 'i'],
    type: 'bool',
    help: 'Ignore case distinctions in PATTERN.'
  },
  {
    names: ['literal', 'Q'],
    type: 'bool',
    help: 'Quote all metacharacters; PATTERN is literal.'
  },
  {
    name: 'color',
    type: 'bool',
    help: 'Higlight matched text.'
  },
  {
    name: 'max-result-count',
    type: 'number',
    helpArg: 'NUM',
    help: 'Stop after NUM results.'
  },
  {
    name: 'replace',
    type: 'string',
    helpArg: 'REPlACE',
    help: 'Replace all matches with REPLACE.'
  },
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help and exit.'
  }
];


var parser = dashdash.createParser({options: options});

try {
  var opts = parser.parse(process.argv);
} catch (error) {
  console.error('search: error: %s', error.message);
  process.exit(1);
}

// Use `parser.help()` for formatted options help.
if (opts.help) {
  var help = parser.help({includeEnv: true}).trimRight();
  console.log('usage: search [OPTION]... PATTERN [FILES OR DIRECTORIES OR GLOBS]\n'
              + 'options:\n'
              + help);
  process.exit(0);
}

// ack or ack-grep
var cmd = sh.run('hash ack-grep 2>/dev/null') === 1 ? 'ack' : 'ack-grep';


// Result Counter
var resultsCount = 0;

// Search pattern
var searchPattern = opts._args[0];

// Max results
var maxResults = opts.max_result_count;

// File patterns
var patterns = opts._args.slice(1);

// Create arguments for ack
var ackArgs = ['-H', '--flush', '--noheading', '-C', '2'];

if (opts.ignore_case) ackArgs.push('-i');
if (opts.literal) ackArgs.push('-Q');
if (opts.color) ackArgs.push('--color')


// Execute the search in series on all patterns.
async.mapSeries(patterns, search, function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Found ' + resultsCount  + ' matches.');
});


// Execute ag on a list of files
function search(location, cb) {
  glob(location, function (error, files) {
    if (error) return cb(error);
    if (files.length === 0) return console.error('No files found');
    // Spawn the ack process
    var child = spawn(cmd, ackArgs.concat(searchPattern).concat(files));

    child.stdout.pipe(split())
      .on('data', function(line) {
        line = line.trim();
        if (line.length === 0) {
          return;
        }

        if (line === '--') {
          resultsCount++;
        }

        if (maxResults && resultsCount >= maxResults) {
          return child.kill('SIGHUP');
        }
        console.log(line);

      })
      .on('end', function() {
        cb();
      });
    child.stderr.pipe(process.stderr);
  });
}