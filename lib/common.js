

// Dependencies
// ------------

var _ = require('lodash');
var path = require('path');


// Location of the ack binary.
exports.ackCmd = path.join(__dirname, '..', 'bin', 'ack');

// Generate the arguments array for ack
//
// opts     - Options object.
// defaults - Default values that are added additionally.
//
// Returns an array of arguments for ack.
exports.makeArgs = function makeArgs(opts, defaults) {
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
};
