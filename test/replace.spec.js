// Replace Tests
// -------------

describe('replace', function () {
  var replace;
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
    describe('-l literal', function () {
      it('should work', function (done) {
        var opts = {
          replace: 'codio',
          literal: true,
          wordRegexp: false,
          ignoreCase: false,
          cmd: ack
        };
        var out = replace(destPath, 'TEAM', opts);
        out.on('data', function (data) {
          expect(data.toString()).to.be.eql('Replaced 1 occurrence(s).\n');
        });
        out.on('end', function () {
          var result = fs.readFileSync(destPath).toString();
          var expected = fs.readFileSync(__dirname + '/fixtures/literalExpected.txt').toString();
          expect(result).to.be.eql(expected);
          done();
        });
      });
    });
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
        out.on('data', function (data) {
          expect(data.toString()).to.be.eql('Replaced 2 occurrence(s).\n');
        });
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
