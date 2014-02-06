/* jshint expr: true */
/* globals it, describe */
'use strict';

var expect = require('chai').expect;

describe('default client', function() {
  it('should be created with storage account settings', function() {
    var azureTable = require('../index');
    var defaultClient = azureTable.getDefaultClient();

    expect(defaultClient).to.be.an('object');

    var settings = defaultClient.getSettings();
    expect(settings).to.have.property('accountUrl', 'https://dummy.table.core.windows.net/');
    expect(settings).to.have.property('accountName', 'dummy');
    expect(settings).to.have.property('accountKey', 'DWFdvtgaJ/4okdYJs1sAr1yyvrRe4dAuY5yPg+R+Wsl5wMiX6QOZ+6egJseLXK8YlDASx6eP0bfWV3rgZlgxYA==');
    expect(settings).to.have.property('timeout', 30000);
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
    expect(settings).to.have.property('accountUrl', 'https://dummy.table.core.windows.net/');
    expect(settings).to.have.property('accountName', 'zebra');
    expect(settings).to.have.property('accountKey', 'DWFdvtgaJ/4okdYJs1sAr1yyvrRe4dAuY5yPg+R+Wsl5wMiX6QOZ+6egJseLXK8YlDASx6eP0bfWV3rgZlgxYA==');
    expect(settings).to.have.property('timeout', 15000);
    expect(settings).to.have.property('aSetting', 'HELLO');

    azureTable.setDefaultClient({
      timeout: 30000,
      aSetting: null,
      accountName: 'dummy'
    });
  });

  it('should use default client as singleton', function() {
    var azureTable = require('../index');
    var defaultClient1 = azureTable.getDefaultClient();
    var defaultClient2 = azureTable.getDefaultClient();

    expect(defaultClient1).to.equal(defaultClient2);
  });

});
