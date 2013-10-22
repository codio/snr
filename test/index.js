require('better-stack-traces').install();
var stream = require('stream');

var expect = require('chai').expect;
var sinon = require('sinon');
var SandboxedModule = require('sandboxed-module');
var strs = require('stringstream');
var sh = require('execSync');
var fs = require('fs-extra');


var childProcess = require('child_process');
var ack = sh.run('hash ack-grep 2>/dev/null') === 1 ? 'ack' : 'ack-grep';

// Fixture files
var simpleResult = fs.readFileSync(__dirname + '/fixtures/simple.txt').toString();

var toString = function (s, cb) {
  var result = [];
  s.on('data', function (data) {
    result.push(data.toString());
  });
  s.on('end', function () {
    cb(null, result.join(''));
  });
  s.on('error', function (error) {
    cb(error);
  });
};

var emptyStream = function () {
  var s = new stream.Readable();
  s._read = function () {};
  return s;
};

describe('search and replace', function () {
  var search, replace;

  describe('search', function () {
    var spawn = sinon.stub(childProcess, 'spawn');
    var glob = sinon.stub();

    beforeEach(function () {
      search = SandboxedModule.require('../index', {
        requires: {
          child_process: childProcess,
          glob: glob
        }
      }).search;
    });

    it('should exist', function () {
      expect(search).to.be.a('function');
    });
    it('should return matches', function (done) {
      spawn.returns({
        stdout: fs.createReadStream(__dirname + '/fixtures/simple.txt'),
        stderr: emptyStream()
      });

      glob.yields(null, 'index.js');

      toString(search('index.js', 'push', {}), function (err, result) {
        expect(result).to.be.eql(simpleResult + 'Found 12 matches.\n');
        done();
      });
    });
  });

  describe('replace', function () {
    // var exec = sinon.stub(childProcess, 'exec');
    // var glob = sinon.stub();
    var destPath = __dirname + '/fixtures/simpleReplace.txt';

    beforeEach(function (done) {
      replace = require('../index').replace;

      // Copy replace file
      var origPath = __dirname + '/fixtures/simpleOriginal.txt';
      fs.copy(origPath, destPath, done);
    });

    afterEach(function (done) {
      fs.remove(destPath, done);
    });

    it('should exist', function () {
      expect(replace).to.be.a('function');
    });

    describe('options', function () {
      describe('-w whole word', function () {
        it('should work with literal option', function (done) {
          var opts = {
            replace: 'codio',
            literal: true,
            wordRegexp: true,
            ignoreCase: true,
            cmd: ack
          };
          var out = replace(destPath, 'team', opts);
          out.on('data', function () {});
          out.on('end', function () {
            var result = fs.readFileSync(destPath).toString();
            var expected = fs.readFileSync(__dirname + '/fixtures/simpleExpected.txt').toString();
            expect(result).to.be.eql(expected);
            done();
          });
        });
      });
    });
  });
});