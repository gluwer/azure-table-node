'use strict';

var crypto = require('crypto');

var ACCOUNT_STRING_KEYS = ['TableEndpoint', 'AccountName', 'AccountKey'];
var ACCOUNT_STRING_SETTINGS_KEYS = ['accountUrl', 'accountName', 'accountKey'];

exports.parseAccountString = function parseAccountString(accountString) {
  if (typeof accountString !== 'string') {
    return null;
  }

  var trimmedAS = accountString.trim();
  if (trimmedAS.length < 30) {
    return null;
  }

  var splittedAS = trimmedAS.split(';');
  if (splittedAS.length < 3) {
    return null;
  }

  var entry, i, j, retrievedValues = {};
  for (i = 0; i < splittedAS.length; ++i) {
    entry = splittedAS[i].split('=');
    if (entry.length < 2) {
      return null;
    }
    // get back if within string
    if (entry.length > 2) {
      for (j = 2; j < entry.length; ++j) {
        entry[1] += '='+entry[j];
      }
    }
    if (ACCOUNT_STRING_KEYS.indexOf(entry[0]) !== -1) {
      retrievedValues[entry[0]] = entry[1];
    }
  }

  if (Object.keys(retrievedValues).length !== ACCOUNT_STRING_KEYS.length) {
    return null;
  }

  // convert to settings keys
  var finalValues = {};
  for (i = 0; i < ACCOUNT_STRING_SETTINGS_KEYS.length; ++i) {
    finalValues[ACCOUNT_STRING_SETTINGS_KEYS[i]] = retrievedValues[ACCOUNT_STRING_KEYS[i]];
  }

  return finalValues;
};

exports.base64Decode = function base64Decode(base64String) {
  return new Buffer(base64String, 'base64');
};

exports.hmacSha256 = function hmacSha256(keyBuffer, stringToSign) {
  return crypto.createHmac('sha256', keyBuffer).update(stringToSign).digest('base64');
};
