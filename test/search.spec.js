// Search Tests
// ------------

var _ = require('lodash');

describe('search', function () {
  var spawn = sinon.stub(childProcess, 'spawn');
  var glob = sinon.stub();
  var search;

  describe('basics', function () {

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
        stderr: helpers.emptyStream()
      });

      glob.yields(null, 'index.js');

      helpers.streamToString(search('index.js', 'push', {}), function (err, result) {
        expect(result).to.be.eql(simpleResult + 'Found 12 matches in 1 file(s).\n');
        done();
      });
    });
    it('should count the number of matched files', function (done) {
      spawn.returns({
        stdout: fs.createReadStream(__dirname + '/fixtures/filecount.txt'),
        stderr: helpers.emptyStream()
      });

      glob.yields(null, 'index.js');

      helpers.streamToString(search('index.js', 'found', {}), function (err, result) {
        var parts = _.compact(result.split('\n'));
        var lastLine = parts[parts.length - 1];
        expect(lastLine).to.be.eql('Found 4 matches in 4 file(s).');
        done();
      });
    });

  });

  describe('options', function () {
    search = require('../index').search;
    var origPath = __dirname + '/fixtures/simpleOriginal.txt';


    describe('-w whole word', function () {
      it('should only find whole words', function (done) {
        var opts = {
          literal: true,
          wordRegexp: true,
          ignoreCase: true,
          cmd: ack
        };

        helpers.streamToString(search(origPath, 'team', opts), function (err, result) {
          var expected = fs.readFileSync(__dirname + '/fixtures/wordSearchExpected.txt').toString();
          expect(result).to.be.eql(result);
          done();
        });
      });
    });
  });
});

