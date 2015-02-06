// Replace Tests
// -------------

/* global describe, beforeEach, afterEach, it, childProcess, fs, helpers, expect, ack */

describe('replace', function () {
  var replace;
  var destPath = __dirname + '/fixtures/simpleReplace.txt';


  function testReplace(pattern, opts, matchCount, fixture, done) {
    var out = replace(destPath, pattern, opts);

    out.on('data', function (data) {
      expect(data.toString()).to.be.eql('Replaced ' + matchCount + ' occurrence(s).\n');
    });

    out.on('end', function () {
      var result = fs.readFileSync(destPath).toString();
      var expected = fs.readFileSync(__dirname + '/fixtures/' + fixture + '.txt').toString();
      expect(result).to.be.eql(expected);
      done();
    });
  }

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
    describe('empty replace', function () {
      it('should work with empty string', function () {
        var dashdash = require('dashdash');
        var options = {options: [{
          name: 'replace',
          type: 'string',
          helpArg: 'REPlACE',
          help: 'Replace all matches with REPLACE.'
        }]};
        var parser = dashdash.createParser(options);
        var opts = parser.parse([ 'node', '/usr/bin/snr', '--replace', '', 'text', '*.html' ]);
        expect(typeof opts.replace === 'string').to.be.eql(true);
        opts = parser.parse([ 'node', '/usr/bin/snr', 'text', '*.html' ]);
        expect(typeof opts.replace === 'string').to.be.eql(false);
      });
    });

    describe('-l literal', function () {
      it('should work', function (done) {
        testReplace('TEAM', {
          replace: 'codio',
          literal: true,
          wordRegexp: false,
          ignoreCase: false
        }, 1, 'literalExpected', done);
      });
    });
    describe('-w whole word', function () {
      it('should work with literal option', function (done) {
        testReplace('team', {
          replace: 'codio',
          literal: true,
          wordRegexp: true,
          ignoreCase: true
        }, 2, 'simpleExpected', done);
      });
    });
  });
  describe('issues', function () {
    it('dots', function (done) {
      testReplace('<name>', {
        replace: '<..name>',
        literal: true,
        wordRegexp: false,
        ignoreCase: true
      }, 2, 'dotsExpected', done);
    });
    it('slashes', function (done) {
      testReplace('<name>', {
        replace: '<../name\\hello>',
        literal: true,
        wordRegexp: false,
        ignoreCase: true
      }, 2, 'slashesExpected', done);
    });
    it('slashes no escaping if not literal', function (done) {
      testReplace('<name>', {
        replace: '<..\\/name>',
        literal: false,
        wordRegexp: false,
        ignoreCase: true
      }, 2, 'slashesNonLiteralExpected', done);
    });
    it('multiple slashes', function (done) {
      testReplace('<name>', {
        replace: '<..//name\\hello>',
        literal: true,
        wordRegexp: false,
        ignoreCase: true
      }, 2, 'slashesMultExpected', done);
    });
    it('single slash', function (done) {
      testReplace('<name>', {
        replace: '/',
        literal: true,
        wordRegexp: false,
        ignoreCase: true
      }, 2, 'singleSlashExpected', done);
    });
    it('find with forward slash', function (done) {
      testReplace('testingtxt.org/', {
        replace: 'www.codio.com/hello',
        literal: true,
        wordRegexp: false,
        ignoreCase: true
      }, 1 ,'findSlashExpected', done);
    });
    it('find with forward slash', function (done) {
      testReplace('testingtxt.org/', {
        replace: 'www.codio.com/hello',
        literal: true,
        wordRegexp: false,
        ignoreCase: true
      }, 1, 'findSlashExpected', done);
    });
  });
});
