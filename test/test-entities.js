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

  it('should insert entity in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('accept', 'application/json;odata=minimalmetadata')
      .matchHeader('prefer', 'return-no-content')
      .post('/testtable', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFG","value2":"2012-10-02T03:03:15.000Z","value2@odata.type":"Edm.DateTime","otherValue":1234567})
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        etag: 'W/"datetime\'2014-01-22T12%3A05%3A09.900357Z\'"',
        location: 'https://dummy.table.core.windows.net/testtable(PartitionKey=\'tests\',RowKey=\'insert\')',
        'x-ms-version': '2013-08-15',
        'preference-applied': 'return-no-content',
        dataserviceid: 'https://dummy.table.core.windows.net/testtable(PartitionKey=\'tests\',RowKey=\'insert\')',
        date: 'Wed, 22 Jan 2014 12:05:09 GMT' });

    client.insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFG',
      value2: new Date('2012-10-02T03:03:15Z'),
      otherValue: 1234567
    }, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.equal('W/"datetime\'2014-01-22T12%3A05%3A09.900357Z\'"');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should insert entity in testtable table and return the created entity', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('accept', 'application/json;odata=minimalmetadata')
      .post('/testtable', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFG","value2":"2012-10-02T03:03:15.000Z","value2@odata.type":"Edm.DateTime","otherValue":1234567})
      .reply(201, "{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable/@Element\",\"PartitionKey\":\"tests\",\"RowKey\":\"insert\",\"Timestamp\":\"2014-01-22T12:26:09.6190646Z\",\"value1\":\"ABCDEFG\",\"value2@odata.type\":\"Edm.DateTime\",\"value2\":\"2012-10-02T03:03:15Z\",\"otherValue\":1234567}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        etag: 'W/"datetime\'2014-01-22T12%3A26%3A09.6190646Z\'"',
        location: 'https://dummy.table.core.windows.net/testtable(PartitionKey=\'tests\',RowKey=\'insert\')',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': '248201a7-37d9-4a40-b2a4-4f2fd13cd5dd',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Wed, 22 Jan 2014 12:26:08 GMT' });

    client.insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFG',
      value2: new Date('2012-10-02T03:03:15Z'),
      otherValue: 1234567
    }, {returnEntity: true}, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal({
        PartitionKey: 'tests',
        RowKey: 'insert',
        Timestamp: new Date('2014-01-22T12:26:09.6190646Z'),
        value1: 'ABCDEFG',
        value2: new Date('2012-10-02T03:03:15Z'),
        otherValue: 1234567,
        __etag: 'W/"datetime\'2014-01-22T12%3A26%3A09.6190646Z\'"'
      });
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return error if entity already exists', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/testtable', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFG","value2":"2012-10-02T03:03:15.000Z","value2@odata.type":"Edm.DateTime","otherValue":1234567})
      .reply(409, "{\"odata.error\":{\"code\":\"EntityAlreadyExists\",\"message\":{\"lang\":\"en-US\",\"value\":\"The specified entity already exists.\\nRequestId:5625a0b2-dba1-485c-996d-99184424adc7\\nTime:2014-01-22T12:35:16.8015235Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-request-id': '5625a0b2-dba1-485c-996d-99184424adc7',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 12:35:15 GMT' });

    client.insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFG',
      value2: new Date('2012-10-02T03:03:15Z'),
      otherValue: 1234567
    }, function(err, data) {
      expect(err).to.not.be.null;
      expect(err).to.have.property('code', 'EntityAlreadyExists');
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should replace entity in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .put('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFGHIJ","otherValue":123})
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        etag: 'W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"',
        'x-ms-request-id': '33323700-3a66-4de6-a2de-d758b41040e0',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 13:09:20 GMT' });

    client.insertOrReplaceEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFGHIJ',
      otherValue: 123
    }, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.equal('W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should insert minimal entity with strange characters in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .put('/testtable(PartitionKey=%27tes%25ts%27,RowKey=%27ins%27%27ert%27)', {"PartitionKey":"tes%ts","RowKey":"ins'ert"})
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        etag: 'W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"',
        'x-ms-request-id': 'd8aeabe4-974b-4c64-86fe-ca01c2b98135',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 13:36:07 GMT' });

    client.insertOrReplaceEntity('testtable', {
      PartitionKey: 'tes%ts',
      RowKey: 'ins\'ert'
    }, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.equal('W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should merge entity in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .merge('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)', {"PartitionKey":"tests","RowKey":"insert","value1":"AB","otherValue":124})
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        etag: 'W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"',
        'x-ms-request-id': '33323700-3a66-4de6-a2de-d758b41040e0',
        'x-ms-version': '2013-08-15',
        date: 'Wed, 22 Jan 2014 13:09:20 GMT' });

    client.insertOrMergeEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'AB',
      otherValue: 124
    }, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.equal('W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should update an entity using provided etag', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .put('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFG","value2":"2012-10-02T03:03:15.000Z","value2@odata.type":"Edm.DateTime","otherValue":1234567})
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        etag: 'W/"datetime\'2014-01-23T07%3A08%3A23.9691837Z\'"',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': '02e2f50c-08e3-4d09-bd9e-9f49a2ea6a88',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Thu, 23 Jan 2014 07:08:25 GMT' });

    client.updateEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFG',
      value2: new Date('2012-10-02T03:03:15Z'),
      otherValue: 1234567,
      __etag: 'W/"datetime\'2014-01-22T12%3A26%3A09.6190646Z\'"'
    }, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.equal('W/"datetime\'2014-01-23T07%3A08%3A23.9691837Z\'"');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return error if etag is not right', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('if-match', 'W/"datetime\'2014-01-22T12%3A26%3A09.6190646Z\'"')
      .put('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFG","value2":"2012-10-02T03:03:15.000Z","value2@odata.type":"Edm.DateTime","otherValue":1234567})
      .reply(412, "{\"odata.error\":{\"code\":\"UpdateConditionNotSatisfied\",\"message\":{\"lang\":\"en-US\",\"value\":\"The update condition specified in the request was not satisfied.\\nRequestId:236c7d3a-e01d-4e45-9e25-edee69e2e998\\nTime:2014-01-23T07:03:01.7014489Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Thu, 23 Jan 2014 07:03:01 GMT' });

    client.updateEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFG',
      value2: new Date('2012-10-02T03:03:15Z'),
      otherValue: 1234567,
      __etag: 'W/"datetime\'2014-01-22T12%3A26%3A09.6190646Z\'"'
    }, function(err) {
      expect(err).to.not.be.null;
      expect(err).to.have.property('code', 'UpdateConditionNotSatisfied');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should throw an error if __etag is not provided', function(done) {
    function updateEntity() {
      client.updateEntity('testtable', {
        PartitionKey: 'tests',
        RowKey: 'insert',
        otherValue: 1234567
      }, function() {
        done(true);
      });
    }

    expect(updateEntity).to.throw('__etag in entity are required if force is not used');
    done();
  });

  it('should update an entity without using etag (force=true)', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('if-match', '*')
      .put('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFG","value2":"2012-10-02T03:03:15.000Z","value2@odata.type":"Edm.DateTime","otherValue":1234567})
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        etag: 'W/"datetime\'2014-01-23T07%3A08%3A23.9691837Z\'"',
        'x-ms-version': '2013-08-15',
        date: 'Thu, 23 Jan 2014 07:08:25 GMT' });

    client.updateEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFG',
      value2: new Date('2012-10-02T03:03:15Z'),
      otherValue: 1234567
    }, {force: true}, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.equal('W/"datetime\'2014-01-23T07%3A08%3A23.9691837Z\'"');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should merge an entity using provided etag', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('if-match', 'W/"datetime\'2014-01-22T12%3A26%3A09.6190646Z\'"')
      .merge('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFG","value2":"2012-10-02T03:03:15.000Z","value2@odata.type":"Edm.DateTime","otherValue":1234567})
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        etag: 'W/"datetime\'2014-01-23T07%3A08%3A23.9691837Z\'"',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': '02e2f50c-08e3-4d09-bd9e-9f49a2ea6a88',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Thu, 23 Jan 2014 07:08:25 GMT' });

    client.mergeEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFG',
      value2: new Date('2012-10-02T03:03:15Z'),
      otherValue: 1234567,
      __etag: 'W/"datetime\'2014-01-22T12%3A26%3A09.6190646Z\'"'
    }, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.equal('W/"datetime\'2014-01-23T07%3A08%3A23.9691837Z\'"');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should merge an entity without using etag (force=true)', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('if-match', '*')
      .merge('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)', {"PartitionKey":"tests","RowKey":"insert","value1":"ABCDEFG","value2":"2012-10-02T03:03:15.000Z","value2@odata.type":"Edm.DateTime","otherValue":1234567})
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        etag: 'W/"datetime\'2014-01-23T07%3A08%3A23.9691837Z\'"',
        'x-ms-version': '2013-08-15',
        date: 'Thu, 23 Jan 2014 07:08:25 GMT' });

    client.mergeEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      value1: 'ABCDEFG',
      value2: new Date('2012-10-02T03:03:15Z'),
      otherValue: 1234567
    }, {force: true}, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.equal('W/"datetime\'2014-01-23T07%3A08%3A23.9691837Z\'"');
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should delete an entity using provided etag', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('if-match', 'W/"datetime\'2014-01-23T07%3A34%3A30.4871837Z\'"')
      .delete('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)')
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        'x-ms-version': '2013-08-15',
        date: 'Thu, 23 Jan 2014 09:31:03 GMT' });

    client.deleteEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert',
      __etag: 'W/"datetime\'2014-01-23T07%3A34%3A30.4871837Z\'"'
    }, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should delete an entity without using etag (force=true)', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('if-match', '*')
      .delete('/testtable(PartitionKey=%27tests%27,RowKey=%27insert%27)')
      .reply(204, "", { 'cache-control': 'no-cache',
        'content-length': '0',
        'x-ms-version': '2013-08-15',
        date: 'Thu, 23 Jan 2014 09:31:03 GMT' });

    client.deleteEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert'
    }, {force: true}, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should get one entity without additional options', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/testtable(PartitionKey=%27tests%27,RowKey=%27tests%27)')
      .reply(200, "{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable/@Element\",\"PartitionKey\":\"tests\",\"RowKey\":\"tests\",\"Timestamp\":\"2014-01-22T13:09:18.8313916Z\",\"otherValue\":123,\"value1\":\"ABCDEFGHIJ\"}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        etag: 'W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"',
        'x-ms-version': '2013-08-15',
        date: 'Thu, 23 Jan 2014 11:38:08 GMT' });

    client.getEntity('testtable', 'tests', 'tests', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal({
        PartitionKey: 'tests',
        RowKey: 'tests',
        Timestamp: new Date('2014-01-22T13:09:18.8313916Z'),
        otherValue: 123,
        value1: 'ABCDEFGHIJ',
        __etag: 'W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"'
      });
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should get one entity but only some of the fields', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/testtable(PartitionKey=%27tests%27,RowKey=%27tests%27)?%24select=RowKey%2Cvalue1')
      .reply(200, "{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable/@Element&$select=RowKey,value1\",\"RowKey\":\"tests\",\"value1\":\"ABCDEFGHIJ\"}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        etag: 'W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"',
        'x-ms-version': '2013-08-15',
        date: 'Thu, 23 Jan 2014 12:30:59 GMT' });

    client.getEntity('testtable', 'tests', 'tests', {onlyFields: ['RowKey', 'value1']}, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal({
        RowKey: 'tests',
        value1: 'ABCDEFGHIJ',
        __etag: 'W/"datetime\'2014-01-22T13%3A09%3A18.8313916Z\'"'
      });
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return error if entity is not found', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/testtable(PartitionKey=%27tests%27,RowKey=%27testz%27)')
      .reply(404, "{\"odata.error\":{\"code\":\"ResourceNotFound\",\"message\":{\"lang\":\"en-US\",\"value\":\"The specified resource does not exist.\\nRequestId:df9c833f-dcd1-4b66-85eb-38ad1584b3a8\\nTime:2014-01-23T12:41:50.7219655Z\"}}}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Thu, 23 Jan 2014 12:41:50 GMT' });

    client.getEntity('testtable', 'tests', 'testz', function(err, data) {
      expect(err).to.have.property('code', 'ResourceNotFound');
      expect(data).to.be.undefined;
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return empty array if no entities match query', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/testtable()?%24filter=PartitionKey%20eq%20%27tests1%27')
      .reply(200, "{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable\",\"value\":[]}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Fri, 24 Jan 2014 12:46:16 GMT' });

    client.queryEntities('testtable', {
      query: azureTable.Query.create('PartitionKey', '==', 'tests1')
    }, function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.an.array;
      expect(data).to.have.lengthOf(0);
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return all 3 array elements if no query is used', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/testtable()')
      .reply(200, "{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable\",\"value\":[{\"PartitionKey\":\"tests\",\"RowKey\":\"test1\",\"Timestamp\":\"2014-01-24T11:18:02Z\",\"Ab\":\"ABC\"},{\"PartitionKey\":\"tests\",\"RowKey\":\"test2\",\"Timestamp\":\"2014-01-24T11:18:25Z\",\"Ab\":\"DEF\"},{\"PartitionKey\":\"testz\",\"RowKey\":\"test1\",\"Timestamp\":\"2014-01-24T11:18:49Z\",\"Ab\":\"XYZ\"}]}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Fri, 24 Jan 2014 12:52:29 GMT' });

    client.queryEntities('testtable', function(err, data, continuation) {
      expect(err).to.be.null;
      expect(data).to.be.an.array;
      expect(data).to.have.lengthOf(3);
      expect(data[0]).to.have.property('PartitionKey', 'tests');
      expect(data[0]).to.have.property('RowKey', 'test1');
      expect(data[0].Timestamp.toISOString()).to.equal('2014-01-24T11:18:02.000Z');
      expect(data[0]).to.have.property('Ab', 'ABC');

      expect(data[1]).to.have.property('PartitionKey', 'tests');
      expect(data[1]).to.have.property('RowKey', 'test2');

      expect(data[2]).to.have.property('PartitionKey', 'testz');
      expect(data[2]).to.have.property('RowKey', 'test1');

      expect(continuation).to.be.undefined;

      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return all 2 array elements when limitTo is 2, only selected fields and return continuation', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/testtable()?%24top=2&%24select=RowKey%2CAb')
      .reply(200, "{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable&$select=RowKey,Ab\",\"value\":[{\"RowKey\":\"test1\",\"Ab\":\"ABC\"},{\"RowKey\":\"test2\",\"Ab\":\"DEF\"}]}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        'x-ms-continuation-nextpartitionkey': '1!8!dGVzdHo-',
        'x-ms-continuation-nextrowkey': '1!8!dGVzdDE-',
        date: 'Fri, 24 Jan 2014 14:21:35 GMT' });

    client.queryEntities('testtable', {
      limitTo: 2,
      onlyFields: ['RowKey', 'Ab']
    }, function(err, data, continuation) {
      expect(err).to.be.null;
      expect(data).to.be.an.array;
      expect(data).to.have.lengthOf(2);
      expect(data[0]).to.not.have.property('PartitionKey');
      expect(data[0]).to.have.property('RowKey', 'test1');
      expect(data[0]).to.not.have.property('Timestamp');
      expect(data[0]).to.have.property('Ab', 'ABC');
      expect(data[1]).to.have.property('RowKey', 'test2');
      expect(data[1]).to.have.property('Ab', 'DEF');

      expect(continuation).to.be.an.array;
      expect(continuation).to.be.deep.equal(['1!8!dGVzdHo-','1!8!dGVzdDE-']);

      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should use continuation to return next part of results', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/testtable()?%24top=2&NextPartitionKey=1!8!dGVzdHo-&NextRowKey=1!8!dGVzdDE-&%24select=RowKey%2CAb')
      .reply(200, "{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable&$select=RowKey,Ab\",\"value\":[{\"RowKey\":\"test1\",\"Ab\":\"XYZ\"}]}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Fri, 24 Jan 2014 14:30:57 GMT' });

    client.queryEntities('testtable', {
      limitTo: 2,
      onlyFields: ['RowKey', 'Ab'],
      continuation: ['1!8!dGVzdHo-','1!8!dGVzdDE-']
    }, function(err, data, continuation) {
      expect(err).to.be.null;
      expect(data).to.be.an.array;
      expect(data).to.have.lengthOf(1);
      expect(data[0]).to.not.have.property('PartitionKey');
      expect(data[0]).to.have.property('RowKey', 'test1');
      expect(data[0]).to.not.have.property('Timestamp');
      expect(data[0]).to.have.property('Ab', 'XYZ');

      expect(continuation).to.be.undefined;

      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should return a limited query with etags', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .matchHeader('accept', 'application/json;odata=fullmetadata')
      .get('/testtable()?%24filter=Ab%20eq%20%27XYZ%27%20or%20Ab%20eq%20%27ABC%27')
      .reply(200, "{\"odata.metadata\":\"https://dummy.table.core.windows.net/$metadata#testtable\",\"value\":[{\"odata.type\":\"dummy.testtable\",\"odata.id\":\"https://dummy.table.core.windows.net/testtable(PartitionKey='tests',RowKey='test1')\",\"odata.etag\":\"W/\\\"datetime'2014-01-24T11%3A18%3A02.8439287Z'\\\"\",\"odata.editLink\":\"testtable(PartitionKey='tests',RowKey='test1')\",\"PartitionKey\":\"tests\",\"RowKey\":\"test1\",\"Timestamp@odata.type\":\"Edm.DateTime\",\"Timestamp\":\"2014-01-24T11:18:02.8439287Z\",\"Ab\":\"ABC\"},{\"odata.type\":\"dummy.testtable\",\"odata.id\":\"https://dummy.table.core.windows.net/testtable(PartitionKey='testz',RowKey='test1')\",\"odata.etag\":\"W/\\\"datetime'2014-01-24T11%3A18%3A49.3485787Z'\\\"\",\"odata.editLink\":\"testtable(PartitionKey='testz',RowKey='test1')\",\"PartitionKey\":\"testz\",\"RowKey\":\"test1\",\"Timestamp@odata.type\":\"Edm.DateTime\",\"Timestamp\":\"2014-01-24T11:18:49.3485787Z\",\"Ab\":\"XYZ\"}]}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=fullmetadata;streaming=true;charset=utf-8',
        'x-ms-version': '2013-08-15',
        date: 'Fri, 24 Jan 2014 14:39:24 GMT' });

    client.queryEntities('testtable', {
      query: azureTable.Query.create().where('Ab', '==', 'XYZ').or('Ab', '==', 'ABC'),
      forceEtags: true
    }, function(err, data, continuation) {
      expect(err).to.be.null;
      expect(data).to.be.an.array;
      expect(data).to.have.lengthOf(2);
      expect(data[0]).to.have.property('Ab', 'ABC');
      expect(data[0]).to.have.property('__etag');
      expect(data[1]).to.have.property('Ab', 'XYZ');
      expect(data[1]).to.have.property('__etag');

      expect(continuation).to.be.undefined;

      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should throw an exception on invalid input data', function(done) {
    function limitToThrow() {
      client.queryEntities('testtable', {
        limitTo: 1001
      }, function() {
        done(true);
      });
    }
    expect(limitToThrow).to.throw('The limitTo must be in rage [1, 1000]');

    function limitToThrow2() {
      client.queryEntities('testtable', {
        limitTo: -1
      }, function() {
        done(true);
      });
    }
    expect(limitToThrow2).to.throw('The limitTo must be in rage [1, 1000]');

    function continuationThrow() {
      client.queryEntities('testtable', {
        continuation: [1,2]
      }, function() {
        done(true);
      });
    }
    expect(continuationThrow).to.throw('The continuation array must contain strings');

    function onlyFieldsThrow() {
      client.queryEntities('testtable', {
        onlyFields: []
      }, function() {
        done(true);
      });
    }
    expect(onlyFieldsThrow).to.throw('The onlyFields field from options must be an nonempty array if used');

    done();
  });
});