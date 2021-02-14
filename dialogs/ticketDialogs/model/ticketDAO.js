
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var connectionString = process.env.MongoConnectionString;
var dbName = process.env.MongoDBName;

class TicketDAO {
    // Useless constructor.
    constructor() {
        this.id = 'id';
    }

    async insertDocument(data) {
        MongoClient.connect(connectionString, function(err, client) {
            assert.equal(null, err);
            console.log('Connected successfully to server');

            const db = client.db(dbName);
            // Get the documents collection
            const collection = db.collection('tickets');
            // Insert some documents
            collection.insertOne(data);
            client.close();
        });
    }
}

module.exports.TicketDAO = TicketDAO;
