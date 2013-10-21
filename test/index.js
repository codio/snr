require('better-stack-traces').install();
var fs = require('fs');
var stream = require('stream');

var expect = require('chai').expect;
var sinon = require('sinon');
var SandboxedModule = require('sandboxed-module');
var strs = require('stringstream');


var childProcess = require('child_process');

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
        expect(result).to.be.eql(simpleResult + 'Found 12 matches.');
        done();
      });
    });
  });

  describe('replace', function () {
    beforeEach(function () {
      replace = require('../index').replace;
    });

    it('should exist', function () {
      expect(replace).to.be.a('function');
    });
  });
});