/* jshint expr: true, quotmark: false */
/* globals it, describe, before, afterEach */
'use strict';

var uuid = require('node-uuid');
var expect = require('chai').expect;
var nock = require('nock');
var azureTable = require('../index');

// force constant uuid in batch tests
uuid.v4 = function() {
  return '0000000-0000-0000-0000-000000000000';
};

//nock.recorder.rec();

describe('batch client', function() {
  var client;

  before(function(){
    client = azureTable.getDefaultClient();
  });

  afterEach(function(){
    nock.cleanAll();
  });

  it('should insert two entities in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('maxdataserviceversion', '3.0;NetFx')
      .matchHeader('content-type', 'multipart/mixed; boundary=batch_0000000-0000-0000-0000-000000000000')
      .post('/$batch', "--batch_0000000-0000-0000-0000-000000000000\r\nContent-Type: multipart/mixed; boundary=changeset_0000000-0000-0000-0000-000000000000\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST https://dummy.table.core.windows.net/testtable HTTP/1.1\r\ncontent-id: 0\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\nprefer: return-no-content\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert1\",\"value\":1}\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST https://dummy.table.core.windows.net/testtable HTTP/1.1\r\ncontent-id: 1\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\nprefer: return-no-content\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert2\",\"value\":2}\r\n--changeset_0000000-0000-0000-0000-000000000000--\r\n--batch_0000000-0000-0000-0000-000000000000--")
      .reply(202, "--batchresponse_41dad341-0238-4695-b3fc-c8cc76d71e81\r\nContent-Type: multipart/mixed; boundary=changesetresponse_caf11926-d33a-478f-aac1-54e2b6e4a12b\r\n\r\n--changesetresponse_caf11926-d33a-478f-aac1-54e2b6e4a12b\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 0\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nPreference-Applied: return-no-content\r\nDataServiceVersion: 3.0;\r\nLocation: https://dummy.table.core.windows.net/testtable(PartitionKey='tests',RowKey='insert1')\r\nDataServiceId: https://dummy.table.core.windows.net/testtable(PartitionKey='tests',RowKey='insert1')\r\nETag: W/\"datetime'2014-01-31T10%3A14%3A18.918655Z'\"\r\n\r\n\r\n--changesetresponse_caf11926-d33a-478f-aac1-54e2b6e4a12b\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 1\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nPreference-Applied: return-no-content\r\nDataServiceVersion: 3.0;\r\nLocation: https://dummy.table.core.windows.net/testtable(PartitionKey='tests',RowKey='insert2')\r\nDataServiceId: https://dummy.table.core.windows.net/testtable(PartitionKey='tests',RowKey='insert2')\r\nETag: W/\"datetime'2014-01-31T10%3A14%3A18.918655Z'\"\r\n\r\n\r\n--changesetresponse_caf11926-d33a-478f-aac1-54e2b6e4a12b--\r\n--batchresponse_41dad341-0238-4695-b3fc-c8cc76d71e81--\r\n", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'multipart/mixed; boundary=batchresponse_41dad341-0238-4695-b3fc-c8cc76d71e81',
        'x-ms-version': '2013-08-15',
        date: 'Fri, 31 Jan 2014 10:14:18 GMT' });

    var batchClient = client.startBatch();
    batchClient.insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert1',
      value: 1
    }).insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert2',
      value: 2
    });

    batchClient.commit(function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal([ 'W/"datetime\'2014-01-31T10%3A14%3A18.918655Z\'"','W/"datetime\'2014-01-31T10%3A14%3A18.918655Z\'"' ]);
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return error if one of entities is already in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/$batch', "--batch_0000000-0000-0000-0000-000000000000\r\nContent-Type: multipart/mixed; boundary=changeset_0000000-0000-0000-0000-000000000000\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST https://dummy.table.core.windows.net/testtable HTTP/1.1\r\ncontent-id: 0\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\nprefer: return-no-content\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert3\",\"value\":3}\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST https://dummy.table.core.windows.net/testtable HTTP/1.1\r\ncontent-id: 1\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\nprefer: return-no-content\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert2\",\"value\":2}\r\n--changeset_0000000-0000-0000-0000-000000000000--\r\n--batch_0000000-0000-0000-0000-000000000000--")
      .reply(202, "--batchresponse_fe2c3109-0555-4011-abe3-55d0c32a4ca2\r\nContent-Type: multipart/mixed; boundary=changesetresponse_a2395820-82ca-4a23-bd49-290bfa44f306\r\n\r\n--changesetresponse_a2395820-82ca-4a23-bd49-290bfa44f306\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 409 Conflict\r\nContent-ID: 1\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nPreference-Applied: return-no-content\r\nDataServiceVersion: 3.0;\r\nContent-Type: application/json;odata=minimalmetadata;streaming=true;charset=utf-8\r\n\r\n{\"odata.error\":{\"code\":\"EntityAlreadyExists\",\"message\":{\"lang\":\"en-US\",\"value\":\"1:The specified entity already exists.\\nRequestId:a1f47a48-9bb1-4b3d-8c6d-d49d382153e8\\nTime:2014-01-31T10:28:02.5907425Z\"}}}\r\n--changesetresponse_a2395820-82ca-4a23-bd49-290bfa44f306--\r\n--batchresponse_fe2c3109-0555-4011-abe3-55d0c32a4ca2--\r\n", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'multipart/mixed; boundary=batchresponse_fe2c3109-0555-4011-abe3-55d0c32a4ca2',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': 'a1f47a48-9bb1-4b3d-8c6d-d49d382153e8',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Fri, 31 Jan 2014 10:28:01 GMT' });

    var batchClient = client.startBatch();
    batchClient.insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert3',
      value: 3
    }).insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert2',
      value: 2
    });

    batchClient.commit(function(err, data) {
      expect(err).to.not.be.null;
      expect(err).to.have.property('statusCode', 409);
      expect(err).to.have.property('code', 'EntityAlreadyExists');
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return error if credentials are not right', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/$batch', "--batch_0000000-0000-0000-0000-000000000000\r\nContent-Type: multipart/mixed; boundary=changeset_0000000-0000-0000-0000-000000000000\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST https://dummy.table.core.windows.net/testtable HTTP/1.1\r\ncontent-id: 0\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\nprefer: return-no-content\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert3\",\"value\":3}\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST https://dummy.table.core.windows.net/testtable HTTP/1.1\r\ncontent-id: 1\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\nprefer: return-no-content\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert2\",\"value\":2}\r\n--changeset_0000000-0000-0000-0000-000000000000--\r\n--batch_0000000-0000-0000-0000-000000000000--")
      .reply(403, "<?xml version=\"1.0\" encoding=\"utf-8\"?><m:error xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\"><m:code>AuthenticationFailed</m:code><m:message xml:lang=\"en-US\">Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.\nRequestId:1c91350d-f7b7-4266-9795-31ecb16318fb\nTime:2014-01-31T10:29:42.3593193Z</m:message></m:error>", { 'content-length': '419',
        'content-type': 'application/xml',
        date: 'Fri, 31 Jan 2014 10:29:42 GMT' });

    var batchClient = client.startBatch();
    batchClient.insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert3',
      value: 3
    }).insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert2',
      value: 2
    });

    batchClient.commit(function(err, data) {
      expect(err).to.not.be.null;
      expect(err).to.have.property('statusCode', 403);
      expect(err).to.have.property('code', 'UnknownBody');
      expect(err).to.have.property('body', '<?xml version="1.0" encoding="utf-8"?><m:error xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata"><m:code>AuthenticationFailed</m:code><m:message xml:lang="en-US">Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.\nRequestId:1c91350d-f7b7-4266-9795-31ecb16318fb\nTime:2014-01-31T10:29:42.3593193Z</m:message></m:error>');
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should update and delete entities in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/$batch', "--batch_0000000-0000-0000-0000-000000000000\r\nContent-Type: multipart/mixed; boundary=changeset_0000000-0000-0000-0000-000000000000\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPUT https://dummy.table.core.windows.net/testtable(PartitionKey=%27tests%27,RowKey=%27insert1%27) HTTP/1.1\r\ncontent-id: 0\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\nif-match: *\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert1\",\"value\":11}\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nDELETE https://dummy.table.core.windows.net/testtable(PartitionKey=%27tests%27,RowKey=%27insert2%27) HTTP/1.1\r\ncontent-id: 1\r\naccept: application/json;odata=minimalmetadata\r\nif-match: W/\"datetime'2014-01-31T10%3A14%3A18.918655Z'\"\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000--\r\n--batch_0000000-0000-0000-0000-000000000000--")
      .reply(202, "--batchresponse_e4a1a0da-d414-41fb-a62c-d6534bb8cbf4\r\nContent-Type: multipart/mixed; boundary=changesetresponse_20e8418a-6031-4765-aecd-88045fbe9b1b\r\n\r\n--changesetresponse_20e8418a-6031-4765-aecd-88045fbe9b1b\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 0\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nDataServiceVersion: 1.0;\r\nETag: W/\"datetime'2014-01-31T10%3A39%3A48.8625852Z'\"\r\n\r\n\r\n--changesetresponse_20e8418a-6031-4765-aecd-88045fbe9b1b\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 1\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nDataServiceVersion: 1.0;\r\n\r\n\r\n--changesetresponse_20e8418a-6031-4765-aecd-88045fbe9b1b--\r\n--batchresponse_e4a1a0da-d414-41fb-a62c-d6534bb8cbf4--\r\n", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'multipart/mixed; boundary=batchresponse_e4a1a0da-d414-41fb-a62c-d6534bb8cbf4',
        'x-ms-version': '2013-08-15',
        date: 'Fri, 31 Jan 2014 10:39:48 GMT' });

    var batchClient = client.startBatch();
    batchClient.updateEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert1',
      value: 11
    }, {force: true}).deleteEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert2',
      __etag: 'W/"datetime\'2014-01-31T10%3A14%3A18.918655Z\'"'
    });

    batchClient.commit(function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal(['W/"datetime\'2014-01-31T10%3A39%3A48.8625852Z\'"', undefined]);
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should get one entity from testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/$batch', "--batch_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nGET https://dummy.table.core.windows.net/testtable(PartitionKey=%27tests%27,RowKey=%27insert1%27) HTTP/1.1\r\ncontent-id: 0\r\naccept: application/json;odata=minimalmetadata\r\n\r\n--batch_0000000-0000-0000-0000-000000000000--")
      .reply(202, "--batchresponse_1e63b1d3-5284-43a5-b13f-b379dfe1a38b\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 200 OK\r\nDataServiceVersion: 3.0;\r\nContent-Type: application/json;odata=minimalmetadata;streaming=true;charset=utf-8\r\nContent-ID: 0\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nETag: W/\"datetime'2014-01-31T10%3A39%3A48.8625852Z'\"\r\n\r\n{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable/@Element\",\"PartitionKey\":\"tests\",\"RowKey\":\"insert1\",\"Timestamp\":\"2014-01-31T10:39:48.8625852Z\",\"value\":11}\r\n--batchresponse_1e63b1d3-5284-43a5-b13f-b379dfe1a38b--\r\n", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'multipart/mixed; boundary=batchresponse_1e63b1d3-5284-43a5-b13f-b379dfe1a38b',
        'x-ms-version': '2013-08-15',
        date: 'Fri, 31 Jan 2014 12:19:25 GMT' });

    var batchClient = client.startBatch();
    batchClient.getEntity('testtable', 'tests', 'insert1');

    batchClient.commit(function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal([{
        PartitionKey: 'tests',
        RowKey: 'insert1',
        Timestamp: new Date('2014-01-31T10:39:48.8625852Z'),
        value: 11,
        __etag: 'W/"datetime\'2014-01-31T10%3A39%3A48.8625852Z\'"'
      }]);
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should delete one entity in testtable table using batch', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/$batch', "--batch_0000000-0000-0000-0000-000000000000\r\nContent-Type: multipart/mixed; boundary=changeset_0000000-0000-0000-0000-000000000000\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nDELETE https://dummy.table.core.windows.net/testtable(PartitionKey=%27tests%27,RowKey=%27insert1%27) HTTP/1.1\r\ncontent-id: 0\r\naccept: application/json;odata=minimalmetadata\r\nif-match: *\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000--\r\n--batch_0000000-0000-0000-0000-000000000000--")
      .reply(202, "--batchresponse_a204e4c6-5ed8-48dc-9df4-352b48da3762\r\nContent-Type: multipart/mixed; boundary=changesetresponse_b116f347-44d6-4b4e-924c-37a72e8d7483\r\n\r\n--changesetresponse_b116f347-44d6-4b4e-924c-37a72e8d7483\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 0\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nDataServiceVersion: 1.0;\r\n\r\n\r\n--changesetresponse_b116f347-44d6-4b4e-924c-37a72e8d7483--\r\n--batchresponse_a204e4c6-5ed8-48dc-9df4-352b48da3762--\r\n", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'multipart/mixed; boundary=batchresponse_a204e4c6-5ed8-48dc-9df4-352b48da3762',
        'x-ms-version': '2013-08-15',
        date: 'Fri, 31 Jan 2014 12:51:23 GMT' });

    var batchClient = client.startBatch();
    batchClient.deleteEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert1'
    }, {force: true});

    batchClient.commit(function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal([undefined]);
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should work properly for uncommon values', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/$batch', "--batch_0000000-0000-0000-0000-000000000000\r\nContent-Type: multipart/mixed; boundary=changeset_0000000-0000-0000-0000-000000000000\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPUT https://dummy.table.core.windows.net/testtable(PartitionKey=%27tests%27,RowKey=%27insert22%27) HTTP/1.1\r\ncontent-id: 0\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert22\",\"valueUnicode\":\"łączy🐒🐵?\"}\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST https://dummy.table.core.windows.net/testtable HTTP/1.1\r\ncontent-id: 1\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert23\"}\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nMERGE https://dummy.table.core.windows.net/testtable(PartitionKey=%27tests%27,RowKey=%27insert24%27) HTTP/1.1\r\ncontent-id: 2\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert24\",\"value\":true,\"value2\":false}\r\n--changeset_0000000-0000-0000-0000-000000000000--\r\n--batch_0000000-0000-0000-0000-000000000000--")
      .reply(202, "--batchresponse_e8e693a9-3575-4a9e-9ae1-0ffc7eb59b06\r\nContent-Type: multipart/mixed; boundary=changesetresponse_6ab495d3-a2ad-44d7-a11e-3f347705a1c0\r\n\r\n--changesetresponse_6ab495d3-a2ad-44d7-a11e-3f347705a1c0\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 0\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nDataServiceVersion: 1.0;\r\nETag: W/\"datetime'2014-02-03T10%3A01%3A42.4998806Z'\"\r\n\r\n\r\n--changesetresponse_6ab495d3-a2ad-44d7-a11e-3f347705a1c0\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 201 Created\r\nDataServiceVersion: 3.0;\r\nContent-Type: application/json;odata=minimalmetadata;streaming=true;charset=utf-8\r\nContent-ID: 1\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nLocation: https://dummy.table.core.windows.net/testtable(PartitionKey='tests',RowKey='insert23')\r\nETag: W/\"datetime'2014-02-03T10%3A01%3A42.4236239Z'\"\r\n\r\n{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable/@Element\",\"PartitionKey\":\"tests\",\"RowKey\":\"insert23\",\"Timestamp\":\"2014-02-03T10:01:42.4236239Z\"}\r\n--changesetresponse_6ab495d3-a2ad-44d7-a11e-3f347705a1c0\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 2\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nDataServiceVersion: 1.0;\r\nETag: W/\"datetime'2014-02-03T10%3A01%3A42.5008806Z'\"\r\n\r\n\r\n--changesetresponse_6ab495d3-a2ad-44d7-a11e-3f347705a1c0--\r\n--batchresponse_e8e693a9-3575-4a9e-9ae1-0ffc7eb59b06--\r\n", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'multipart/mixed; boundary=batchresponse_e8e693a9-3575-4a9e-9ae1-0ffc7eb59b06',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': 'a5e1e35b-aabd-4bb3-8ce6-f14e1db8bff3',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Mon, 03 Feb 2014 10:01:41 GMT' });

    var batchClient = client.startBatch();
    batchClient.insertOrReplaceEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert22',
      valueUndefined: undefined,
      valueNull: null,
      valueUnicode: 'łączy🐒🐵?'
    }).insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert23'
    }, {returnEntity: true}).insertOrMergeEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert24',
      value: true,
      value2: false
    });

    batchClient.commit(function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal(["W/\"datetime'2014-02-03T10%3A01%3A42.4998806Z'\"",
        {
          "PartitionKey": "tests",
          "RowKey": "insert23",
          "Timestamp": new Date ("2014-02-03T10:01:42.423Z"),
          "__etag": "W/\"datetime'2014-02-03T10%3A01%3A42.4236239Z'\""
        },
        "W/\"datetime'2014-02-03T10%3A01%3A42.5008806Z'\""
      ]);
      expect(azure.isDone()).to.be.true;

      done();
    });
  });


});