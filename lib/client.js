'use strict';

var request = require('request');
var url = require('url');

var versionInfo = require('../package.json').version;
var utils = require('./utils');

var Client = {
  // settings object, cannot be edited
  _settings: null,
  // request object with defaults for this client
  _request: null,
  // decoded azure key
  _azureKey: null,

  _prepareRequestDefaults: function(settings) {
    var defaults = {
      encoding: 'utf8',
      timeout: settings.timeout
    };
    if (settings.proxy) {
      defaults.proxy = settings.proxy;
    }
    if (settings.forever === true) {
      defaults.forever = settings.forever;
    }
    if (settings.agentOptions) {
      defaults.agentOptions = settings.agentOptions;
    }
    if (settings.pool != null) {
      defaults.pool = settings.pool;
    }
    return defaults;
  },

  _getRequestSpecificOptions: function _getRequestSpecificOptions(method, path, qs) {
    var now = new Date().toUTCString();

    var requestOptions = {
      method: method,
      uri: url.parse(this._settings.accountUrl + path),
      qs: qs,
      headers: {
        accept: 'application/json;odata='+this._settings.metadata+'metadata',
        DataServiceVersion: '3.0;NetFx',
        date: now,
        'user-agent': 'azure-table-node/'+versionInfo,
        'x-ms-date': now,
        'x-ms-version': '2013-08-15'
      }
    };

    // json key will add it, be we need it for signing header computation
    if (method !== 'GET' && method !== 'DELETE') {
      requestOptions.headers['content-type'] = 'application/json';
    }

    return requestOptions;
  },

  _addSharedKeyAuthHeader: function _addSharedKeyAuthHeader(requestOptions) {
    var stringToSign = requestOptions.method +'\n';
    stringToSign += (requestOptions.headers['content-md5'] ? requestOptions.headers['content-md5'] : '') + '\n';
    stringToSign += (requestOptions.headers['content-type'] ? requestOptions.headers['content-type'] : '') + '\n';
    stringToSign += (requestOptions.headers['x-ms-date'] ? requestOptions.headers['x-ms-date'] : '') + '\n';
    stringToSign += '/'+this._settings.accountName;
    stringToSign += requestOptions.uri.path;
    if (requestOptions.qs && 'comp' in requestOptions.qs) {
      stringToSign += '?comp=' + requestOptions.qs.comp;
    }

    requestOptions.headers.authorization = 'SharedKey ' + this._settings.accountName + ':' + utils.hmacSha256(this._azureKey, stringToSign);
    return requestOptions;
  },

  _normalizeCallback: function _normalizeCallback(cb, error, response, body) {
    if (error) {
      return cb(error);
    }
    if (!response) {
      return cb({code: 'UnknownError'});
    }
    // try to parse to JSON if it looks like JSON but is not
    if (body && typeof body === 'string' &&(body[0] === '{' || body[0] === '[')) {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }
    if (response.statusCode >= 400) {
      return cb({
        statusCode: response.statusCode,
        code: body && body['odata.error'] ? body['odata.error'].code : 'UnknownBody',
        body: body && body['odata.error'] ? body['odata.error'] : body
      });
    }
    return cb(null, {
      statusCode: response.statusCode,
      headers: response.headers, // continuations are in response headers
      body: body
    });
  },

  _makeRequest: function _makeRequest(method, path, qs, body, filter, cb) {
    if (cb == null) {
      cb = filter;
    }
    var options = this._getRequestSpecificOptions(method, path, qs);
    options = this._addSharedKeyAuthHeader(options);

    if (typeof body === 'object') {
      options.json = body;
    }

    if (cb !== filter && filter != null) {
      options = filter.call(this, options);
    }

    // TODO: possible place for retry logic
    this._request(options, this._normalizeCallback.bind(this, cb));
  },

  _preferNoContentFilter: function _insertEntityFilter(options) {
    options.headers.prefer = 'return-no-content';
    return options;
  },

  _matchIfAsteriskFilter: function _matchIfAsteriskFilter(options) {
    options.headers['if-match'] = '*';
    return options;
  },

  create: function create(settings) {
    if (!settings.accountUrl || !settings.accountName || !settings.accountKey) {
      throw 'Provide accountUrl, accountName, and accountKey in settings or in env CLOUD_STORAGE_ACCOUNT';
    }

    var sealedSettings = Object.seal(settings);

    // create request object with most of the default settings
    var defaultRequest = request.defaults(this._prepareRequestDefaults(sealedSettings));

    return Object.create(this, {
      _settings: {value: sealedSettings},
      _request: {value: defaultRequest},
      _azureKey: {value: utils.base64Decode(sealedSettings.accountKey)}
    });
  },

  getSettings: function getSettings() {
    return this._settings;
  },

  _createTableCb: function _createTableCb(cb, options, err, data) {
    if (!err && (data.statusCode === 201 || data.statusCode === 204)) {
      return cb(null);
    } else if (options && options.ignoreIfExists === true && err && err.code === 'TableAlreadyExists') {
      return cb(null);
    } else {
      return cb(err);
    }
  },
  createTable: function createTable(table, options, cb) {
    if (cb == null) {
      cb = options;
    }
    this._makeRequest('POST', 'Tables', null, {TableName:table}, this._preferNoContentFilter, this._createTableCb.bind(this, cb, options !== cb ? options : null));
    return this;
  },

  _deleteTableCb: function _deleteTableCb(cb, err, data) {
    if (!err && data.statusCode === 204) {
      return cb(null);
    } else {
      return cb(err);
    }
  },
  deleteTable: function deleteTable(table, options, cb) {
    if (cb == null) {
      cb = options;
    }
    this._makeRequest('DELETE', 'Tables(\''+table+'\')', null, null, this._deleteTableCb.bind(this, cb));
    return this;
  },

  _listTablesCb: function _listTablesCb(cb, err, data) {
    if (!err && data.statusCode === 200) {
      var results = new Array(data.body.value.length);
      data.body.value.forEach(function(r, i) {
        this[i] = r.TableName;
      }, results);
      var continuation = data.headers['x-ms-continuation-nexttablename'];
      return cb(null, results, continuation);
    } else {
      return cb(err);
    }
  },
  listTables: function listTables(options, cb){
    if (cb == null) {
      cb = options;
    }
    var qs = null;
    if (cb !== options && options.nextTableName) {
      qs = {
        NextTableName: options.nextTableName
      };
    }

    this._makeRequest('GET', 'Tables', qs, null, this._listTablesCb.bind(this, cb));
    return this;
  },

  _insertEntityCb: function _insertEntityCb(cb, options, err, data) {
    if (!err) {
      if (data.statusCode === 204) {
        return cb(null, data.headers.etag);
      } else { // data.statusCode === 201
        var entity = utils.deserializeEntity(data.body);
        entity.__etag = data.headers.etag;
        return cb(null, entity);
      }
    } else {
      return cb(err);
    }
  },
  insertEntity: function insertEntity(table, entity, options, cb) {
    if (!entity || typeof entity.PartitionKey !== 'string' || typeof entity.RowKey !== 'string') {
      throw 'PartitionKey and RowKey in entity are required';
    }
    if (cb == null) {
      cb = options;
    }

    var filter = null;
    if (cb === options || (cb !== options && options.returnEntityWithETag !== true)) {
      filter = this._preferNoContentFilter;
    }

    this._makeRequest('POST', table, null, utils.serializeEntity(entity), filter, this._insertEntityCb.bind(this, cb, options));
    return this;
  },

  _204Cb: function _204Cb(cb, err, data) {
    if (!err && data.statusCode === 204) {
      return cb(null, data.headers.etag);
    } else {
      return cb(err);
    }
  },
  _insertWithReplaceOrMerge: function _insertWithReplaceOrMerge(method, table, entity, cb) {
    if (!entity || typeof entity.PartitionKey !== 'string' || typeof entity.RowKey !== 'string') {
      throw 'PartitionKey and RowKey in entity are required';
    }

    this._makeRequest(method, utils.prepareEntityPath(table, entity.PartitionKey, entity.RowKey), null, utils.serializeEntity(entity), this._204Cb.bind(this, cb));
    return this;
  },

  insertOrReplaceEntity: function insertOrReplaceEntity(table, entity, cb) {
    return this._insertWithReplaceOrMerge('PUT', table, entity, cb);
  },

  insertOrMergeEntity: function insertOrMergeEntity(table, entity, cb) {
    return this._insertWithReplaceOrMerge('MERGE', table, entity, cb);
  },

  _updateMergeEntity: function _updateMergeEntity(method, table, entity, options, cb) {
    if (!entity || typeof entity.PartitionKey !== 'string' || typeof entity.RowKey !== 'string') {
      throw 'PartitionKey and RowKey in entity are required';
    }
    if (cb == null) {
      cb = options;
    }

    var filter = null;
    if (cb !== options && options.force === true) {
      filter = this._matchIfAsteriskFilter;
    } else if (!entity.__etag) {
      throw '__etag in entity are required if forceUpdate is not used';
    } else {
      filter = function(options) {
        options.headers['if-match'] = entity.__etag;
        return options;
      };
    }

    this._makeRequest(method, utils.prepareEntityPath(table, entity.PartitionKey, entity.RowKey), null, utils.serializeEntity(entity), filter, this._204Cb.bind(this, cb));
    return this;
  },

  updateEntity: function updateEntity(table, entity, options, cb) {
    return this._updateMergeEntity('PUT', table, entity, options, cb);
  },

  mergeEntity: function mergeEntity(table, entity, options, cb) {
    return this._updateMergeEntity('MERGE', table, entity, options, cb);
  },

  deleteEntity: function deleteEntity(table, entity, options, cb) {
    if (!entity || typeof entity.PartitionKey !== 'string' || typeof entity.RowKey !== 'string') {
      throw 'PartitionKey and RowKey in entity are required';
    }
    if (cb == null) {
      cb = options;
    }

    var filter = null;
    if (cb !== options && options.force === true) {
      filter = this._matchIfAsteriskFilter;
    } else if (!entity.__etag) {
      throw '__etag in entity are required if forceUpdate is not used';
    } else {
      filter = function(options) {
        options.headers['if-match'] = entity.__etag;
        return options;
      };
    }

    this._makeRequest('DELETE', utils.prepareEntityPath(table, entity.PartitionKey, entity.RowKey), null, null, filter, this._204Cb.bind(this, cb));
    return this;
  },

  _getEntityCb: function _listTablesCb(cb, err, data) {
    if (!err && data.statusCode === 200) {
      var entity = utils.deserializeEntity(data.body);
      entity.__etag = data.headers.etag;
      return cb(null, entity);
    } else {
      return cb(err);
    }
  },
  getEntity: function getEntity(table, partitionKey, rowKey, options, cb) {
    if (typeof partitionKey !== 'string' || typeof rowKey !== 'string') {
      throw 'The partitionKey and rowKey must be a string';
    }
    var filter = null, qs = null;
    if (cb == null) {
      cb = options;
    } else {
      if ('onlyFields' in options) {
        if (!Array.isArray(options.onlyFields) || options.onlyFields.length === 0) {
          throw 'The onlyFields field from options must be an nonempty array if used';
        } else {
          qs = {
            $select: utils.prepareSelectQS(options.onlyFields)
          };
        }
      }
    }

    this._makeRequest('GET', utils.prepareEntityPath(table, partitionKey, rowKey), qs, null, filter, this._getEntityCb.bind(this, cb));
    return this;
  }
};

exports.Client = Client;