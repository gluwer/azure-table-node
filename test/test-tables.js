/* jshint expr: true, quotmark: false */
/* globals it, describe, before, afterEach */
'use strict';

var expect = require('chai').expect;
var nock = require('nock');
var azureTable = require('../index');

//nock.recorder.rec();

describe('default client', function() {
  var client;

  before(function(){
    client = azureTable.getDefaultClient();
  });

  afterEach(function(){
    nock.cleanAll();
  });

  it('should create testtable table using required headers', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('accept', 'application/json;odata=nometadata')
      .matchHeader('DataServiceVersion', '3.0;NetFx')
      .matchHeader('x-ms-version', '2013-08-15')
      .matchHeader('prefer', 'return-no-content')
      .matchHeader('authorization', /SharedKey/i)
      .matchHeader('x-ms-date', / \d\d:\d\d:\d\d /)
      .post('/Tables', {TableName:"testtable"})
      .reply(204, '', { 'cache-control': 'no-cache',
        'content-length': '0',
        location: 'https://dummy.table.core.windows.net/Tables(\'testtable\')',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': '1cf1c280-5af9-461d-b7fe-0c6f71dc765b',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        'preference-applied': 'return-no-content',
        dataserviceid: 'https://dummy.table.core.windows.net/Tables(\'testtable\')',
        date: 'Tue, 21 Jan 2014 12:11:40 GMT' });

    client.createTable('testtable', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return error when testtable table cannot be created', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
    .post('/Tables', {"TableName":"testtable"})
      .reply(409, "{\"odata.error\":{\"code\":\"TableAlreadyExists\",\"message\":{\"lang\":\"en-US\",\"value\":\"The table specified already exists.\\nRequestId:21590ff9-550a-4c6e-aa17-b89f331eb5cb\\nTime:2014-01-21T12:46:46.8753319Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=nometadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        'preference-applied': 'return-no-content',
        date: 'Tue, 21 Jan 2014 12:46:46 GMT' });

    client.createTable('testtable', function(err, data) {
      expect(err).to.not.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      expect(err).to.have.property('statusCode', 409);
      expect(err).to.have.property('code');

      done();
    });
  });

  it('should not return error when testtable table is not created if ignoreIfExists is used', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/Tables', {"TableName":"testtable"})
      .reply(409, "{\"odata.error\":{\"code\":\"TableAlreadyExists\",\"message\":{\"lang\":\"en-US\",\"value\":\"The table specified already exists.\\nRequestId:21590ff9-550a-4c6e-aa17-b89f331eb5cb\\nTime:2014-01-21T12:46:46.8753319Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=nometadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        'preference-applied': 'return-no-content',
        date: 'Tue, 21 Jan 2014 12:46:46 GMT' });

    client.createTable('testtable', {ignoreIfExists: true}, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return a list of tables with continuation', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/Tables')
      .reply(200, "{\"value\":[{\"TableName\":\"testtable\"}]}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=nometadata;streaming=true;charset=utf-8',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': '4f8a4aba-ade5-47b1-a72a-8c8bb7e4cd60',
        'x-ms-continuation-nexttablename': 'ABCD',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Tue, 21 Jan 2014 13:01:13 GMT' });

    client.listTables(function(err, data, continuation) {
      expect(err).to.be.null;
      expect(data).to.be.an.array;
      expect(data).to.have.length(1);
      expect(data[0]).to.be.equal('testtable');
      expect(continuation).to.be.equal('ABCD');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should use continuation in list of tables and return empty list', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
    .get('/Tables?NextTableName=testYable')
      .reply(200, "{\"value\":[]}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=nometadata;streaming=true;charset=utf-8',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': '0226bf5b-765b-4d95-9e7f-4d77ab41d754',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Tue, 21 Jan 2014 13:06:53 GMT' });

    client.listTables({nextTableName: 'testYable'}, function(err, data, continuation) {
      expect(err).to.be.null;
      expect(data).to.be.an.array;
      expect(data).to.have.length(0);
      expect(continuation).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should remove table without errors', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .delete('/Tables(%27testtable%27)')
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        'x-ms-version': '2013-08-15',
        date: 'Tue, 21 Jan 2014 13:24:42 GMT' });

    client.deleteTable('testtable', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.undefined;

      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return error if table is already removed', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
    .delete('/Tables(%27testtable%27)')
      .reply(404, "{\"odata.error\":{\"code\":\"ResourceNotFound\",\"message\":{\"lang\":\"en-US\",\"value\":\"The specified resource does not exist.\\nRequestId:d9eab66b-dcb9-442d-a7e2-46f0f690711e\\nTime:2014-01-21T13:29:42.2348727Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=nometadata;streaming=true;charset=utf-8',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': 'd9eab66b-dcb9-442d-a7e2-46f0f690711e',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Tue, 21 Jan 2014 13:29:42 GMT' });

    client.deleteTable('testtable', function(err, data) {
      expect(err).to.not.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      expect(err).to.have.property('statusCode', 404);
      expect(err).to.have.property('code', 'ResourceNotFound');

      done();
    });
  });
});