var expect = require('chai').expect;

describe('search and replace', function () {
  var search, replace;

  describe('search', function () {
    beforeEach(function () {
      search = require('../index').search;
    });

    it('should exist', function () {
      expect(search).to.be.a('function');
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