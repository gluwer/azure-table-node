/* jshint expr: true, quotmark: false */
/* globals it, describe, before, afterEach */
'use strict';

var uuid = require('node-uuid');
var expect = require('chai').expect;
var nock = require('nock');
var azureTable = require('../index');

//nock.recorder.rec();

// force constant uuid in batch tests
uuid.v4 = function() {
  return '0000000-0000-0000-0000-000000000000';
};

describe('SAS generation', function() {
  var client;

  before(function(){
    client = azureTable.getDefaultClient();
  });

  it('should return SAS query string for only minimal set of options', function() {
    var sas = client.generateSAS('testtable', 'r', new Date(2014, 5, 5, 12, 0, 11));
    expect(sas).to.be.equal('sv=2013-08-15&tn=testtable&se=2014-06-05T10%3A00%3A11Z&sp=r&sig=n0tfK%2B74%2FbQVwKslkN2CvtxLqIh6jxawRuVi1rzvxTY%3D');
  });
  it('should return SAS query string for all possible options', function() {
    var sas = client.generateSAS('testtable', 'raud', new Date(2024, 11, 15, 12, 3, 11), {
      start: new Date(2012, 5, 5, 0, 0, 0),
      policyId: 'policy201402',
      startPK: 'test',
      startRK: 'insert',
      endPK: 'zebra',
      endRK: 'zero'
    });
    expect(sas).to.be.equal('sv=2013-08-15&tn=testtable&st=2012-06-04T22%3A00%3A00Z&se=2024-12-15T11%3A03%3A11Z&sp=raud&spk=test&srk=insert&epk=zebra&erk=zero&si=policy201402&sig=J64MCh8bSMBOa8DtdjlnfYHZWWYJjI7F0Oabnm5BP6E%3D');
  });
});

describe('SAS based client', function() {
  var client;

  before(function() {
    var sas = azureTable.getDefaultClient().generateSAS('testtable', 'raud', new Date(2030, 11, 31, 0, 0, 0));
    client = azureTable.createClient({
      accountKey: null,
      sas: sas
    });
  });

  afterEach(function(){
    nock.cleanAll();
  });

  it('should get entity in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .get('/testtable(PartitionKey=%27tests%27,RowKey=%27test1%27)?sv=2013-08-15&tn=testtable&se=2030-12-30T23%3A00%3A00Z&sp=raud&sig=NZptPGmTPQ1hf3YC8cdPSEcuw87lZpZtI8FrxABDAh4%3D')
      .reply(200, "{\"odata.metadata\":\"https://bint.table.core.windows.net/$metadata#testtable/@Element\",\"PartitionKey\":\"tests\",\"RowKey\":\"test1\",\"Timestamp\":\"2014-01-24T11:18:02.8439287Z\",\"Ab\":\"ABC\"}", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
        etag: 'W/"datetime\'2014-01-24T11%3A18%3A02.8439287Z\'"',
        server: 'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id': '6f905214-5e99-453f-9ce7-42f0e29c16aa',
        'x-ms-version': '2013-08-15',
        'x-content-type-options': 'nosniff',
        date: 'Thu, 06 Feb 2014 11:47:34 GMT' });

    client.getEntity('testtable', 'tests', 'test1', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal({
        "PartitionKey": "tests",
        "RowKey": "test1",
        "Timestamp": new Date("2014-01-24T11:18:02.843Z"),
        "Ab": "ABC",
        "__etag": "W/\"datetime'2014-01-24T11%3A18%3A02.8439287Z'\""
      });
      expect(azure.isDone()).to.be.true;

      done();
    });
  });

  it('should insert and delete entity in testtable table', function(done) {
    var azure = nock('https://dummy.table.core.windows.net:443')
      .post('/$batch?sv=2013-08-15&tn=testtable&se=2030-12-30T23%3A00%3A00Z&sp=raud&sig=NZptPGmTPQ1hf3YC8cdPSEcuw87lZpZtI8FrxABDAh4%3D', "--batch_0000000-0000-0000-0000-000000000000\r\nContent-Type: multipart/mixed; boundary=changeset_0000000-0000-0000-0000-000000000000\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nPOST https://dummy.table.core.windows.net/testtable HTTP/1.1\r\ncontent-id: 0\r\naccept: application/json;odata=minimalmetadata\r\ncontent-type: application/json\r\nprefer: return-no-content\r\n\r\n{\"PartitionKey\":\"tests\",\"RowKey\":\"insert4\",\"value\":1}\r\n--changeset_0000000-0000-0000-0000-000000000000\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nDELETE https://dummy.table.core.windows.net/testtable(PartitionKey=%27tests%27,RowKey=%27test1%27) HTTP/1.1\r\ncontent-id: 1\r\naccept: application/json;odata=minimalmetadata\r\nif-match: *\r\n\r\n--changeset_0000000-0000-0000-0000-000000000000--\r\n--batch_0000000-0000-0000-0000-000000000000--")
      .reply(202, "--batchresponse_85204905-2e47-4b8e-90ee-8413cef12182\r\nContent-Type: multipart/mixed; boundary=changesetresponse_c028c68c-bc85-4afe-b7be-1d6b6539ef4c\r\n\r\n--changesetresponse_c028c68c-bc85-4afe-b7be-1d6b6539ef4c\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 0\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nPreference-Applied: return-no-content\r\nDataServiceVersion: 3.0;\r\nLocation: https://bint.table.core.windows.net/testtable(PartitionKey='tests',RowKey='insert4')\r\nDataServiceId: https://bint.table.core.windows.net/testtable(PartitionKey='tests',RowKey='insert4')\r\nETag: W/\"datetime'2014-02-06T12%3A22%3A44.8859653Z'\"\r\n\r\n\r\n--changesetresponse_c028c68c-bc85-4afe-b7be-1d6b6539ef4c\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 204 No Content\r\nContent-ID: 1\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\nDataServiceVersion: 1.0;\r\n\r\n\r\n--changesetresponse_c028c68c-bc85-4afe-b7be-1d6b6539ef4c--\r\n--batchresponse_85204905-2e47-4b8e-90ee-8413cef12182--\r\n", { 'cache-control': 'no-cache',
        'transfer-encoding': 'chunked',
        'content-type': 'multipart/mixed; boundary=batchresponse_85204905-2e47-4b8e-90ee-8413cef12182',
        'x-content-type-options': 'nosniff',
        date: 'Thu, 06 Feb 2014 12:22:44 GMT' });

    var batchClient = client.startBatch();
    batchClient.insertEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'insert4',
      value: 1
    }).deleteEntity('testtable', {
      PartitionKey: 'tests',
      RowKey: 'test1'
    }, {force: true});

    batchClient.commit(function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.deep.equal(['W/"datetime\'2014-02-06T12%3A22%3A44.8859653Z\'"',undefined]);
      expect(azure.isDone()).to.be.true;

      done();
    });
  });
});