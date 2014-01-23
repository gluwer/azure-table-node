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

* `metadata` (string) - default metadata level, available values: `no`, `minimal`, `full` (default: `minimal`); if `no` is used, you have to take care yourself of changing Date, int64 and binary from strings to proper objects

API
===

If not explained differently, `cb` in API is a functions in format `function cb(err, data)`. For queries there may be additional third argument passed if there is a continuation token.

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

### insertEntity(table, entity, [options], cb)

Creates new `entity` in `table`. The `entity` must at least contain `PartitionKey` and `RowKey` as strings. The `options` have one setting supported `returnEntity`. If set to `true`, it will return the entity in `data` element in entity key (etag will be in `__etag` property). Otherwise function will return etag in data (as string).

### insertOrReplaceEntity(table, entity, cb)

Creates new `entity` in `table`. If it exists, it will be replaced. The `entity` must  contain `PartitionKey` and `RowKey` as strings. The `data` contains etag of inserted/replaced entity.

### insertOrMergeEntity(table, entity, cb)

Creates new `entity` in `table`. If it exists, passed values will be merged with existing ones. The `entity` must contain `PartitionKey` and `RowKey` as strings. The `data` contains etag of inserted/merged entity.

### updateEntity(table, entity, [options], cb)

Updates `entity` in `table`. The `entity` must contain `PartitionKey` and `RowKey` as strings and also `__etag` if `force` is not used. The `options` object is optional. Use key `force` set to `true` to not use etag for optimistic concurrency. The `data` in callback contains new etag value.

### mergeEntity(table, entity, [options], cb)

Merge update of `entity` in `table`. The `entity` must contain `PartitionKey` and `RowKey` as strings and also `__etag` if `force` is not used. The `options` object is optional. Use key `force` set to `true` to not use etag for optimistic concurrency. The `data` in callback contains new etag value.

### deleteEntity(table, entity, [options], cb)

Removes `entity` from `table`. The `entity` must contain `PartitionKey` and `RowKey` as strings and also `__etag` if `force` is not used. The `options` object is optional. Use key `force` set to `true` to not use etag for optimistic concurrency. The `data` in callback will always be undefined.

### getEntity(table, partitionKey, rowKey, [options], cb)

Retrieves one entity from `table`. Entity is located by `partitionKey` and `rowKey` values as strings. The `options` object is optional.  Use `onlyFields` as array of strings to retrieve only mentioned fields.



Running tests
=============

Run the tests using mocha from main project folder. But before that set the environment variable as some tests are relying on default:

```
set CLOUD_STORAGE_ACCOUNT=TableEndpoint=http://dummy.table.core.windows.net/;AccountName=dummy;AccountKey=DWFdvtgaJ/4okdYJs1sAr1yyvrRe4dAuY5yPg+R+Wsl5wMiX6QOZ+6egJseLXK8YlDASx6eP0bfWV3rgZlgxYA==
mocha
```