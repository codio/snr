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
  },
  {
    names: ['context', 'C'],
    type: 'number',
    helpArg: 'NUM',
    help: '  Print NUM lines of output context.'
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

var contextSize = opts.context || 2;

// Match the color code for background orange.
var matchRegexp = new RegExp(/[\u001b]\[30;43m/);

// Create arguments for ack
var ackArgs = ['-H', '--flush', '--heading', '--color'];

if (opts.ignore_case) ackArgs.push('-i');
if (opts.literal) ackArgs.push('-Q');
if (opts.context) {
  ackArgs.push('-C');
  ackArgs.push(contextSize);
}


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

    var stopIn = -1;
    var stopped = false;

    child.stdout.pipe(split())
      .on('data', function(line) {
        if (stopped) return;

        line = line.trim();
        if (line.length === 0) {
          return;
        }

        // Count all occurrences of the match in the line
        var matchesCount = line.match(matchRegexp)
        resultsCount += matchesCount ? matchesCount.length : 0;

        if (stopIn === 0) {
          stopped = true;
          child.kill('SIGHUP');
          cb('Stopped because of max-result-limit at ' + resultsCount + '.');
        }

        // Output
        console.log(line);

        // Decrement stopIn after output.
        if (stopIn > 0) return stopIn--;

        // If we are over the maximum stop the process and exit.
        if (stopIn === -1 && maxResults && resultsCount >= maxResults) {
          stopIn = contextSize;
        }
      })
      .on('end', function() {
        cb();
      });
    child.stderr.pipe(process.stderr);
  });
}


// Detect all matches in a line
function countMatches(line) {
  //  Example match: \u001b[30;43mconsole\u001b[0m
  return line.match(matchRegexp).length;
}