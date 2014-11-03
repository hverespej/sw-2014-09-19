var Promise = require('bluebird');
var common = require('./testcommon');
var expect = common.loadExpect();
var dynamo = common.loadDynamo();
var client = require('../models').client;

describe('models/client', function() {
	var tableName = 'clients';

	after(function(done) {
		return common.clearDb(dynamo).then(function() { done(); });
	});

	describe('#init', function() {
		before(function(done) {
			return common.clearDb(dynamo).then(function() { done(); });
		});

		it ('Should create table', function() {
			return expect(
				client.init(dynamo).then(function() {
					return dynamo.listTablesAsync({});
				}).then(function(data) {
					return data.TableNames.length;
				})
			).to.eventually.equal(1);
		});
	});

	describe('#create', function() {
		var testUserData = {
			userName: 'jm',
			firstName: 'John',
			lastName: 'Malkovich',
			email: 'john@not.really',
			phone: '555-555-5555',
			profile: 'Great actor',
			savedLocations: [],
			paymentInfo: 'fake',
			appointments: [],
			joinedDate: '2014-11-01T12:00:00.000Z'
		};

		before(function(done) {
			return common.clearDb(dynamo).then(function() {
				return client.init(dynamo);
			}).then(function() { done(); });
		});

		describe('#', function() {
			it('Should return object', function() {
				expect(client.create()).to.exist;
			});
		});

		describe('#save', function() {
			beforeEach(function(done) {
				return dynamo.deleteItemAsync({
					TableName: tableName,
					Key: { userName: { S: testUserData.userName } },
					ReturnConsumedCapacity: 'NONE',
					ReturnItemCollectionMetrics: 'NONE',
					ReturnValues: 'NONE'
				}).then(function() {
					done();
				});
			});

			after(function(done) {
				return dynamo.deleteItemAsync({
					TableName: tableName,
					Key: { userName: { S: testUserData.userName } },
					ReturnConsumedCapacity: 'NONE',
					ReturnItemCollectionMetrics: 'NONE',
					ReturnValues: 'NONE'
				}).then(function() {
					done();
				});
			});

			it('Should store object in DB', function() {
				var c = client.create();
				c.set(testUserData);
				return expect(
					c.save().then(function() {
						return dynamo.getItemAsync({
							TableName: tableName,
							Key: { userName: { S: testUserData.userName } },
							ConsistentRead: true,
							ReturnConsumedCapacity: 'NONE'
						});
					}).then(function(retrieved) {
						return retrieved.Item.userName.S;
					})
				).to.eventually.equal(testUserData.userName);
			});

			it('Should store object in DB on etag match', function() {
				var c = client.create();
				c.set(testUserData);
				return expect(
					c.save().then(function() {
						return dynamo.getItemAsync({
							TableName: tableName,
							Key: { userName: { S: testUserData.userName } },
							ConsistentRead: true,
							ReturnConsumedCapacity: 'NONE'
						});
					}).then(function(retrieved) {
						return c.save();
					})
				).to.eventually.be.fulfilled;
			});

			it('Should fail to store object on etag mismatch', function() {
				var c = client.create();
				c.set(testUserData);
				return expect(
					c.save().then(function() {
						c.etag = '1';
						return c.save();
					})
				).to.eventually.be.rejectedWith(/^Conflict:/);
			});
		});

		describe('#load', function() {
			it('Should retrieve object with expected properties', function(done) {
				var c1 = client.create();
				var c2 = client.create();
				c1.set(testUserData);
				return c1.save().then(function() {
					return c2.load(testUserData.userName);
				}).then(function() {
					expect(c2.userName).to.equal(c1.userName);
					expect(c2.firstName).to.equal(c1.firstName);
					expect(c2.lastName).to.equal(c1.lastName);
					expect(c2.email).to.equal(c1.email);
					expect(c2.phone).to.equal(c1.phone);
					expect(c2.profile).to.equal(c1.profile);
					expect(c2.savedLocations).to.deep.equal(c1.savedLocations);
					expect(c2.paymentInfo).to.equal(c1.paymentInfo);
					expect(c2.appointments).to.deep.equal(c1.appointments);
					expect(c2.joinedDate).to.equal(c1.joinedDate);
					expect(c2.etag).to.exist;
					done();
				}).catch(function(err) {
					done(err);
				});
			});

			it('Should fail when loading non-existent object', function() {
				var c = client.create();
				return expect(
					c.load('doesNotExist')
				).to.eventually.be.rejectedWith(/^Not Found$/);
			});
		});
	});

	describe('#list', function() {
		it('!Is not yet implemented!', function() {
			expect(client.list).to.throw(/^Not Implemented$/);
		});
	});
});
