// Search Tests
// ------------

/* global describe, beforeEach, afterEach, it, childProcess, SandboxedModule, fs, helpers, expect, ack */

var _ = require('lodash');

describe('search', function () {
  var spawn, glob;
  var search = require('../index').search;

  describe('basics', function () {
    spawn = sinon.stub(childProcess, 'spawn');
    var searchBoxed;

    beforeEach(function () {
      glob = sinon.stub();
      searchBoxed = SandboxedModule.require('../index', {
        requires: {
          child_process: {spawn: spawn},
          glob: glob
        }
      }).search;
    });


    it('should exist', function () {
      expect(searchBoxed).to.be.a('function');
    });

    it('should return matches', function (done) {
      spawn.returns({
        stdout: fs.createReadStream(__dirname + '/fixtures/simple.txt'),
        stderr: helpers.emptyStream(),
        stdin: helpers.emptyWriteStream()

      });

      glob.yields(null, 'index.js');

      helpers.streamToString(searchBoxed('index.js', 'push', {}), function (err, result) {
        expect(result).to.be.eql(simpleResult + 'Found 12 matches in 1 file(s).\n');
        done();
      });
    });
    it('should count the number of matched files', function (done) {
      spawn.returns({
        stdout: fs.createReadStream(__dirname + '/fixtures/filecount.txt'),
        stderr: helpers.emptyStream(),
        stdin: helpers.emptyWriteStream()
      });

      glob.yields(null, 'index.js');

      helpers.streamToString(searchBoxed('index.js', 'found', {}), function (err, result) {
        var parts = _.compact(result.split('\n'));
        var lastLine = parts[parts.length - 1];
        expect(lastLine).to.be.eql('Found 4 matches in 4 file(s).');
        done();
      });
    });
  });

  describe('options', function () {
    var origPath = 'test/fixtures/simpleOriginal.txt';
    search = require('../index').search;

    describe('--max-result-count', function () {
      it('should limit results', function (done) {
        var opts = {
          maxResults: 1
        };

        helpers.streamToString(search('test/fixtures/filecount.txt', 'found', opts), function (err, result) {
          var lastLine = _.last(_.compact(result.split('\n')));
          expect(lastLine).to.be.eql('Stopped because of max-result-limit at 2 match(es) in 1 file(s).');
          done();
        });
      });
    });

    describe('-w whole word', function () {
      it('should only find whole words', function (done) {
        var opts = {
          literal: true,
          wordRegexp: true,
          ignoreCase: true,
          context: 2
        };

        helpers.streamToString(search(origPath, 'team', opts), function (err, result) {
          var expected = fs.readFileSync(__dirname + '/fixtures/wordSearchExpected.txt').toString();
          expect(result).to.be.eql(expected);
          done();
        });
      });
    });
  });
});

