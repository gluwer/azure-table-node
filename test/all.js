'use strict';

var Mocha = require('mocha');

// mocha options
var options = {};
var suites = [];

// run each suite independently to allow to run each one manually using mocha test/{test}.js
suites.push((new Mocha(options)).addFile('test/test-parseAccountString.js'));
suites.push((new Mocha(options)).addFile('test/test-defaultClient.js'));
suites.push((new Mocha(options)).addFile('test/test-createClient.js'));

var currentSuite = 0;

var failedTests = false;
function runSuites() {
  if (currentSuite < suites.length) {
    suites[currentSuite].run(function(failures) {
      if (failures) {
        failedTests = true;
      }
      currentSuite += 1;
      setImmediate(runSuites);
    });
  } else {
    if (failedTests) {
      process.exit(1);
    }
  }
}
runSuites();

