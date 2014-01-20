'use strict';

var _ = require('lodash');
var utils = require('./lib/utils');
var Client = require('./lib/client').Client;

var _defaultClientSetting = {
  timeout: 10000,
  metadata: 'no'
};

// default client is created lazily on first get or set request
var _defaultClient = null;

// initializes default client using default settings and environment variable CLOUD_STORAGE_ACCOUNT
function _initDefaultConnection() {
  if ('CLOUD_STORAGE_ACCOUNT' in process.env) {
    var accountSettings = utils.parseAccountString(process.env.CLOUD_STORAGE_ACCOUNT);
    if (accountSettings !== null) {
      _defaultClientSetting = _.defaults(_defaultClientSetting, accountSettings);
    }
  }
}

function getDefaultClient() {
  if (_defaultClient === null) {
    _defaultClient = Client.create(_defaultClientSetting);
  }
  return _defaultClient;
}

function setDefaultClient(settings) {
  _defaultClient = createClient(settings);
  return _defaultClient;
}

function createClient(settings, base) {
  var baseSettings;
  if (base) {
    baseSettings = base.getSettings();
  } else if (_defaultClient !== null) {
    baseSettings = _defaultClient.getSettings();
  } else {
    baseSettings = _defaultClientSetting;
  }

  var finalSettings = _.clone(baseSettings);
  if (settings) {
    finalSettings = _.merge(finalSettings, settings, function(a, b) {
      return _.isArray(a) ? a.concat(b) : undefined;
    });
  }

  return Client.create(finalSettings);
}


var azureTable = {
  // () -> Client object
  getDefaultClient: getDefaultClient,
  // (options{object}) -> Client object
  setDefaultClient: setDefaultClient,
  // (options{object}, [base{object}]) -> Client object
  createClient: createClient
};

_initDefaultConnection();

module.exports = azureTable;