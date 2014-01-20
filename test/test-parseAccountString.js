/* jshint expr: true */
/* globals it, describe */
'use strict';

var expect = require('chai').expect;
var parseAccountString = require('../lib/utils').parseAccountString;

describe('parseAccountString', function() {
  it('should return account info for properly constructed account string', function() {
    var returnedValue;

    // the most common version used on azure
    returnedValue = parseAccountString('BlobEndpoint=http://dummy.blob.core.windows.net/;QueueEndpoint=http://dummy.queue.core.windows.net/;TableEndpoint=http://dummy.table.core.windows.net/;AccountName=dummy;AccountKey=XUpVW5efmPDA42r4VY/86bt9k+smnhdEFVRRGrrt/wE0SmFg==');

    expect(returnedValue).to.not.be.null;
    expect(returnedValue).to.have.property('accountUrl', 'http://dummy.table.core.windows.net/');
    expect(returnedValue).to.have.property('accountName', 'dummy');
    expect(returnedValue).to.have.property('accountKey', 'XUpVW5efmPDA42r4VY/86bt9k+smnhdEFVRRGrrt/wE0SmFg==');

    // minimalistic (only required data)
    expect(parseAccountString('AccountName=dummy;TableEndpoint=http://dummy.table.core.windows.net/;AccountKey=XUpVW5efmPDA42r4VY/86bt9k+smnhdEFVRRGrrt/wE0SmFg==')).to.be.deep.equal(returnedValue);
  });

  it('should return null for incomplete account string', function() {
    expect(parseAccountString('TableEndpoint=http://dummy.table.core.windows.net/;AccountKey=XUpVW5efmPDA42r4VY/86bt9k+smnhdEFVRRGrrt/wE0SmFg==')).to.be.null;
    expect(parseAccountString('TableEndpoint=http://dummy.table.core.windows.net/;AccountName=dummy')).to.be.null;
    expect(parseAccountString('AccountName=dummy;AccountKey=XUpVW5efmPDA42r4VY/86bt9k+smnhdEFVRRGrrt/wE0SmFg==')).to.be.null;
  });

  it('should return null for invalid or not existing account string', function() {
    expect(parseAccountString(undefined)).to.be.null;
    expect(parseAccountString(null)).to.be.null;
    expect(parseAccountString('')).to.be.null;
    expect(parseAccountString('           Key=value           ')).to.be.null;
  });
});