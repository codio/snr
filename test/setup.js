// Test Setup
// ----------
/* global global, fs */

require('better-stack-traces').install();
global.stream = require('stream');

global.expect = require('chai').expect;
global.sinon = require('sinon');
global.SandboxedModule = require('sandboxed-module');
global.fs = require('fs-extra');
global.helpers = require('./helpers');

global.childProcess = require('child_process');

// Fixture files
global.simpleResult = fs.readFileSync(__dirname + '/fixtures/simple.txt').toString();
