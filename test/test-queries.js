/* jshint expr: true */
/* globals it, describe */
'use strict';

var expect = require('chai').expect;
var Query = require('../lib/query').Query;

describe('Query', function() {
  it('should allow to create simple queries', function() {
    expect(Query.create('PartitionKey', '==', 'ABC')).to.have.property('_query','PartitionKey eq \'ABC\'');
    expect(Query.create().where('zebra', '>', 12)).to.have.property('_query','zebra gt 12');
    expect(Query.create().where('zebra2', '<=', 2147483648)).to.have.property('_query','zebra2 le 2147483648L');
  });

  it('should handle different value types', function() {
    expect(Query.create('test', '==', '4185404a-5818-48c3-b9be-f217df0dba6f')).to.have.property('_query','test eq guid\'4185404a-5818-48c3-b9be-f217df0dba6f\'');
    expect(Query.create('test', '==', true)).to.have.property('_query','test eq true');
    expect(Query.create('test', '==', new Date('2012-08-11T07:12:55Z'))).to.have.property('_query','test eq datetime\'2012-08-11T07:12:55.000Z\'');
    expect(Query.create('test', '==', [1, 2])).to.have.property('_query','test eq \'1,2\'');
  });

  it('should handle different comparisons', function() {
    expect(Query.create('test', '>=', 1)).to.have.property('_query','test ge 1');
    expect(Query.create('test', '<=', 1)).to.have.property('_query','test le 1');
    expect(Query.create('test', '!=', 1)).to.have.property('_query','test ne 1');
    expect(Query.create('test', '<', 1)).to.have.property('_query','test lt 1');
  });

  it('should throw exception in several situations', function() {
    function exception1() {
      Query.create().and('test', '>=', 1);
    }
    expect(exception1).to.throw('and() cannot be used as first filter');

    function exception2() {
      Query.create().or('test', '>=', 1);
    }
    expect(exception2).to.throw('or() cannot be used as first filter');

    function exception3() {
      Query.create().where('test', '>=', 1).where('test2', '>=', 1);
    }
    expect(exception3).to.throw('where() can be used only as first filter');

    function exception4() {
      Query.create('test', '=!', 1);
    }
    expect(exception4).to.throw('Invalid comparison');
  });

  it('should allow to create complex queries', function() {
    var q = Query.create('PartitionKey', '==', 'ABC').not().and('RowKey', '>=', 'EFG');
    expect(q).to.have.property('_query','PartitionKey eq \'ABC\' and not RowKey ge \'EFG\'');

    q = Query.create('A', '!=', 22).and('RowKey', '<', 'EFG').or('zz', '=', true);
    expect(q).to.have.property('_query','A ne 22 and RowKey lt \'EFG\' or zz eq true');
  });
});
