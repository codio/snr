// Test Setup
// ----------

require('better-stack-traces').install();
global.stream = require('stream');

global.expect = require('chai').expect;
global.sinon = require('sinon');
global.SandboxedModule = require('sandboxed-module');
global.sh = require('execSync');
global.fs = require('fs-extra');
global.helpers = require('./helpers');

global.childProcess = require('child_process');
global.ack = sh.run('hash ack-grep 2>/dev/null') === 1 ? 'ack' : 'ack-grep';

// Fixture files
global.simpleResult = fs.readFileSync(__dirname + '/fixtures/simple.txt').toString();
