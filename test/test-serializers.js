/* jshint expr: true */
/* globals it, describe */
'use strict';

var expect = require('chai').expect;
var serializeEntity = require('../lib/utils').serializeEntity;
var deserializeEntity = require('../lib/utils').deserializeEntity;

describe('serializeEntity', function() {
  it('should return object prepared for sending to Azure Table Storage', function() {
    var returnedValue;

    // the most common version used on azure
    returnedValue = serializeEntity({
      PartitionKey: 'PartitionKey',
      RowKey: 'RowKey',
      Timestamp: new Date('2014-01-01T11:11:11.123Z'),
      __etag: 'hzdegfpvuf',
      aBinary: new Buffer('aBinary', 'ascii'),
      aBool1: true,
      aBool2: false,
      aString: 'aString',
      aInt32: 32,
      aInt64: 2147483648,
      aDouble: 3.1415,
      aDate: new Date('2014-01-12T12:12:12.124Z'),
      aGuid: '4185404a-5818-48c3-b9be-f217df0dba6f'
    });

    expect(returnedValue).to.be.deep.equal({
      PartitionKey: 'PartitionKey',
      RowKey: 'RowKey',
      aBinary: 'YUJpbmFyeQ==',
      'aBinary@odata.type': 'Edm.Binary',
      aBool1: true,
      aBool2: false,
      aString: 'aString',
      aInt32: 32,
      aInt64: '2147483648',
      'aInt64@odata.type': 'Edm.Int64',
      aDouble: 3.1415,
      aDate: '2014-01-12T12:12:12.124Z',
      'aDate@odata.type': 'Edm.DateTime',
      aGuid: '4185404a-5818-48c3-b9be-f217df0dba6f',
      'aGuid@odata.type': 'Edm.Guid'
    });
  });
});

describe('deserializeEntity', function() {
  it('should return object decoded from Azure Table Storage data', function() {
    var returnedValue;

    // the most common version used on azure
    returnedValue = deserializeEntity({
      'odata.id': 'Some value',
      'odata.etag': 'ETAG',
      PartitionKey: '123',
      RowKey: 'dummy',
      Timestamp: '2014-01-01T11:11:11.123Z',
      aBinary: 'YUJpbmFyeQ==',
      'aBinary@odata.type': 'Edm.Binary',
      aBool1: true,
      aBool2: false,
      aString: 'aString',
      aInt32: 32,
      aInt64: '2147483648',
      'aInt64@odata.type': 'Edm.Int64',
      aDouble: 3.1415,
      aDate: '2014-01-12T12:12:12.124Z',
      'aDate@odata.type': 'Edm.DateTime',
      aGuid: '4185404a-5818-48c3-b9be-f217df0dba6f',
      'aGuid@odata.type': 'Edm.Guid'
    });

    expect(returnedValue).to.have.property('__etag', 'ETAG');
    expect(returnedValue).to.have.property('PartitionKey', '123');
    expect(returnedValue).to.have.property('RowKey', 'dummy');
    expect(returnedValue).to.have.property('aBool1', true);
    expect(returnedValue).to.have.property('aBool2', false);
    expect(returnedValue).to.have.property('aString', 'aString');
    expect(returnedValue).to.have.property('aInt32', 32);
    expect(returnedValue).to.have.property('aInt64', 2147483648);
    expect(returnedValue).to.have.property('aDouble', 3.1415);
    expect(returnedValue).to.have.property('aGuid', '4185404a-5818-48c3-b9be-f217df0dba6f');
    expect(returnedValue.aBinary).to.be.instanceof(Buffer);
    expect(returnedValue.aBinary.toString('base64')).to.be.equal('YUJpbmFyeQ==');
    expect(returnedValue.aDate).to.be.instanceof(Date);
    expect(returnedValue.aDate.toISOString()).to.be.equal('2014-01-12T12:12:12.124Z');
    expect(returnedValue).to.not.have.property('aBinary@odata.type');
    expect(returnedValue).to.not.have.property('aInt64@odata.type');
    expect(returnedValue).to.not.have.property('aDate@odata.type');
    expect(returnedValue).to.not.have.property('aGuid@odata.type');
    expect(returnedValue).to.not.have.property('odata.id');
    expect(returnedValue).to.not.have.property('odata.etag');
  });
});