'use strict';

var crypto = require('crypto');
var _ = require('lodash');

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

exports.prepareEntityPath = function prepareEntityPath(table, partitionKey, rowKey) {
  return table + '(PartitionKey=\'' + encodeURIComponent(partitionKey.replace(/'/g, '\'\'')) + '\',RowKey=\'' + encodeURIComponent(rowKey.replace(/'/g, '\'\'')) + '\')';
};

exports.prepareSelectQS = function prepareSelectQS(fields) {
  return fields.join(',');
};

var _guidRegExp = /^([0-9a-fA-F]){8}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){12}$/;
exports.isGuid = function isGuid(value) {
  return _guidRegExp.test(value);
};

exports.serializeEntity = function serializeEntity(entity) {
  var finalObject = {}, value;
  for (var key in entity) {

    // __etag will be provided in different way, so skip it here too
    if (!entity.hasOwnProperty(key) || key === '__etag' || key === 'Timestamp') {
      continue;
    }
    // they do not require any special handling
    if (key === 'PartitionKey' || key === 'RowKey' ) {
      finalObject[key] = entity[key];
      continue;
    }

    value = entity[key];
    if (typeof value === 'string') {
      if (value.length === 36 && _guidRegExp.test(value)) {
        finalObject[key] = value;
        finalObject[key+'@odata.type'] = 'Edm.Guid';
      } else {
        finalObject[key] = value; // normal string, no need to pass type info
      }
    } else if (typeof value === 'number') {
      if (value % 1 === 0) { // checks if it is integer
        if (Math.abs(value) < 2147483648) {
          finalObject[key] = value; // 32 bit can be passed as int without type info
        } else {
          finalObject[key] = value.toString();
          finalObject[key+'@odata.type'] = 'Edm.Int64';
        }
      } else {
        finalObject[key] = value; // float can be passed without type info
      }
    } else if (_.isDate(value)) {
      finalObject[key] = value.toISOString();
      finalObject[key+'@odata.type'] = 'Edm.DateTime';
    } else if (_.isBoolean(value)) {
      finalObject[key] = value;
    } else if (value instanceof Buffer) {
      finalObject[key] = value.toString('base64');
      finalObject[key+'@odata.type'] = 'Edm.Binary';
    } else { // to be on a safe side, convert anything else to string
      finalObject[key] = value.toString();
    }
  }

  return finalObject;
};

exports.deserializeEntity = function deserializeEntity(entity) {
  var finalObject = {}, value, type;
  for (var key in entity) {
    // skip all the odata info keys too
    if (!entity.hasOwnProperty(key) || key.indexOf('odata.') >= 0) {
      continue;
    }
    value = entity[key];

    // handle always returned values first
    if (key === 'PartitionKey' || key === 'RowKey') {
      finalObject[key] = value;
      continue;
    } else if (key === 'Timestamp') {
      finalObject[key] = new Date(value);
      continue;
    }

    // handle other properties but check if they need converting
    type = entity[key+'@odata.type'];
    if (!type) {
      finalObject[key] = value;
    } else {
      if (type === 'Edm.Int64') {
        finalObject[key] = parseInt(value, 10);
      } else if (type === 'Edm.DateTime') {
        finalObject[key] = new Date(value);
      } else if (type === 'Edm.Binary') {
        finalObject[key] = new Buffer(value, 'base64');
      } else { // for all other do not convert
        finalObject[key] = value;
      }
    }
  }

  if ('odata.etag' in entity) {
    finalObject.__etag = entity['odata.etag'];
  }

  return finalObject;
};

