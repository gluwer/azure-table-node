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
    client = azureTable.setDefaultClient({
      retry: {
        firstDelay: 100 // normal delay would be too long to wait
      }
    });
  });

  afterEach(function(){
    nock.cleanAll();
  });

  it('should retry the create testtable when receiving error', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/Tables', {TableName:"testtable"})
      .reply(500, "{\"odata.error\":{\"code\":\"SomeError\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' })
      .post('/Tables', {TableName:"testtable"})
      .reply(412, "{\"odata.error\":{\"code\":\"ETIMEDOUT\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' })
      .post('/Tables', {TableName:"testtable"})
      .reply(204, '', { 'cache-control': 'no-cache',
        'content-length': '0',
        location: 'https://dummy.table.core.windows.net/Tables(\'testtable\')',
        'x-ms-version': '2013-08-15',
        date: 'Tue, 21 Jan 2014 12:11:40 GMT' });

    client.createTable('testtable', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return error when all retries are erroring', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/Tables', {TableName:"testtable"})
      .reply(501, "{\"odata.error\":{\"code\":\"SomeError\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' })
      .post('/Tables', {TableName:"testtable"})
      .reply(412, "{\"odata.error\":{\"code\":\"EADDRINUSE\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' })
      .post('/Tables', {TableName:"testtable"})
      .reply(502, "{\"odata.error\":{\"code\":\"SomeError\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' })
    .post('/Tables', {TableName:"testtable"})
      .reply(400, "{\"odata.error\":{\"code\":\"ECONNRESET\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' });

    client.createTable('testtable', function(err, data) {
      expect(err).to.not.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });
});

describe('client with retry disabled', function() {
  var client;

  before(function(){
    client = azureTable.createClient({
      retry: false
    });
  });

  afterEach(function(){
    nock.cleanAll();
  });

  it('should return error to requester after first error', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/Tables', {TableName:"testtable"})
      .reply(503, "{\"odata.error\":{\"code\":\"SomeError\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' });

    client.createTable('testtable', function(err, data) {
      expect(err).to.not.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });
});

describe('client with custom retry options', function() {
  var client;

  before(function(){
    client = azureTable.createClient({
      retry: {
        retries: 1,
        firstDelay: 50,
        nextDelayMult: 1,
        variability:  0,
        transientErrors: [502]
      }
    });
  });

  afterEach(function(){
    nock.cleanAll();
  });

  it('should return error immediately if it is not a transient one', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/Tables', {TableName:"testtable"})
      .reply(503, "{\"odata.error\":{\"code\":\"SomeError\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' });

    client.createTable('testtable', function(err, data) {
      expect(err).to.not.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should make only one retry', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/Tables', {TableName:"testtable"})
      .reply(502, "{\"odata.error\":{\"code\":\"SomeError1\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' })
      .post('/Tables', {TableName:"testtable"})
      .reply(502, "{\"odata.error\":{\"code\":\"SomeError2\",\"message\":{\"lang\":\"en-US\",\"value\":\"Some error.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' });

    client.createTable('testtable', function(err, data) {
      expect(err).to.not.be.null;
      expect(err).to.have.property('code', 'SomeError2');
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });
});