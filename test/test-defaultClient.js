/* jshint expr: true */
/* globals it, describe, before, after */
'use strict';

var expect = require('chai').expect;

describe('default client', function() {
  var oldEnvSetting;
  before(function() {
    oldEnvSetting = process.env.CLOUD_STORAGE_ACCOUNT;
    process.env.CLOUD_STORAGE_ACCOUNT = 'TableEndpoint=http://dummy.table.core.windows.net/;AccountName=dummy;AccountKey=XUpVW5efmPDA42r4VY/86bt9k+smnhdEFVRRGrrt/wE0SmFg==';
  });

  after(function() {
    if (oldEnvSetting) {
      process.env.CLOUD_STORAGE_ACCOUNT = oldEnvSetting;
    } else {
      delete process.env.CLOUD_STORAGE_ACCOUNT;
    }

    // force reloading the index module for next tests
    delete require.cache[require.resolve('../index')];
  });

  it('should be created with storage account settings', function() {
    var azureTable = require('../index');
    var defaultClient = azureTable.getDefaultClient();

    expect(defaultClient).to.be.an('object');

    var settings = defaultClient.getSettings();
    expect(settings).to.have.property('accountUrl', 'http://dummy.table.core.windows.net/');
    expect(settings).to.have.property('accountName', 'dummy');
    expect(settings).to.have.property('accountKey', 'XUpVW5efmPDA42r4VY/86bt9k+smnhdEFVRRGrrt/wE0SmFg==');
    expect(settings).to.have.property('timeout', 10000);
  });

  it('should allow to create new default client with overridden settings', function() {
    var azureTable = require('../index');
    var newDefaultClient = azureTable.setDefaultClient({
      timeout: 15000,
      aSetting: 'HELLO',
      accountName: 'zebra'
    });

    expect(newDefaultClient).to.be.an('object');

    var settings = newDefaultClient.getSettings();
    expect(settings).to.have.property('accountUrl', 'http://dummy.table.core.windows.net/');
    expect(settings).to.have.property('accountName', 'zebra');
    expect(settings).to.have.property('accountKey', 'XUpVW5efmPDA42r4VY/86bt9k+smnhdEFVRRGrrt/wE0SmFg==');
    expect(settings).to.have.property('timeout', 15000);
    expect(settings).to.have.property('aSetting', 'HELLO');
  });

  it('should use default client as singleton', function() {
    var azureTable = require('../index');
    var defaultClient1 = azureTable.getDefaultClient();
    var defaultClient2 = azureTable.getDefaultClient();

    expect(defaultClient1).to.equal(defaultClient2);
  });

});