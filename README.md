azure-table-node
================

Simplified Azure Table Storage client library for NodeJS.

*This is a work in progress. Not usable yet!*

Usage
==============

## Setting the default client connection info and other settings

Default client uses environment variable to set up the access key and storage URL if possible. It looks for the `CLOUD_STORAGE_ACCOUNT` setting with three elements (it is the default format used by Azure Storage):

```
TableEndpoint=http://accountName.table.core.windows.net/;AccountName=accountName;AccountKey=theKey
```

No error is returned if this doesn't exists, is incomplete or malformed.

*Current version does not support quotes and AccountKey must be the last one to be parsed correctly. This will be fixed in the future.*

If the environment variable is not set, the default connection info have to be set using below command to be usable:

```javascript
var azureTable = require('azure-table-node');
azureTable.setDefaultClient({
  accountUrl: 'http://accountName.table.core.windows.net/',
  accountName: 'accountName',
  accountKey: 'theKey'
});
```

The same method allows to set other default client settings (see *Client settings*).

## Using default client

```javascript
var azureTable = require('azure-table-node');
var defaultClient = azureTable.getDefaultClient();

// use the client to create the table
defaultClient.createTable('tableName', true, cb);

defaultClient.insert('table', entity, options, cb);
```

## Creating customized client

It is possible to create additional clients that are based on other client (or on default settings), but customized and independent. This allows to for example use several table storage accounts but still have one default for convenience.

```javascript
var azureTable = require('azure-table-node');
var tableClient = azureTable.createClient({
  // predefined settings
}, [baseClient]);

```

Base client is the client on which the new one will be based. If not provided, it is based on the default one.

Client settings
===============

Account related:

* `accountUrl` (string) - URL of the service's endpoint (no default value)
* `accountName` (string) - name of the used account (no default value)
* `accountKey` (string) - base64 encoded account key (no default value)

Underlying HTTP request related (passed without changes to request module):

* `timeout` (int) - request timeout in miliseconds (default: 10000)
* `proxy` (string) - proxy URL
* `forever` (bool) - use true to turn advanced socket reuse
* `agentOptions` (object) - used to set maxSockets for forever or standard agent
* `pool` (false|object) - use false to turn off socket reuse

Azure Table Storage related:

* `metadata` (string) - default metadata level, available values: `no`, `minimal`, `full` (default: `no`)
* `returnInserts` (bool) - set to true to get back inserted content (usable if etag is needed)

API
===

If not explained differently, `cb` in API is a functions in format function cb(err, data). For queries there may be additional third argument passed if there is a continuation token.

## Module level

### getDefaultClient()

Returns default `Client` object. If `setDefaultClient()` was not used earlier the client only have default module settings and environment variable applied.

### setDefaultClient(settings)

Sets up and returns default `Client` object with provided `settings`. It is using default settings as a base.

### createClient(settings, [base])

Returns new `Client` object using new settings and `base` client settings as a fallback. If `base` is not provided, uses default client settings.

## Client object level

### create(settings)

Returns new `Client` object using only provided settings object. Shouldn't be used directly unless you want to provide all options. Use `createClient` from main module if possible.

### getSettings()

Returns sealed settings object used by this client.

### createTable(table, [options], cb)

Creates new table. The `table` is table name. The `options` is optional, but if exists and `ignoreIfExists` key equals `true`, the error 'table already exists' is ignored. The `cb` is a standard callback function.

### deleteTable(table, cb)

Removes existing table. The `table` is table name. The `cb` is a standard callback function.

### listTables([options], cb)

Returns array with table names (as strings). The `options` is optional, but if exists and `nextTableName` key is provided, the retrieval will start from last continuation token. The `cb` is a standard callback function, but if continuation is required, the third argument will be passed with value for `nextTableName` key.

