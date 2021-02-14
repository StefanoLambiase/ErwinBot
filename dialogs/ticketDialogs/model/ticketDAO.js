
var { MongoClient } = require('mongodb');
var connectionString = process.env.MongoConnectionString;
var dbName = process.env.MongoDBName;

class TicketDAO {
    // Useless constructor.
    constructor() {
        this.id = 'id';
    }

    async insertDocument(data) {
        const client = await new MongoClient(connectionString);
        try {
            await client.connect();
            const db = await client.db(dbName);
            // Get the documents collection.
            const collection = await db.collection('tickets');
            // Insert one document.
            await collection.insertOne(data);
        } catch (e) {
            console.error(e);
        } finally {
            client.close();
        }
    }

    async findTicketsByManagerEmail(managerEmail) {
        const client = await new MongoClient(connectionString);
        try {
            await client.connect();
            const db = await client.db(dbName);
            // Get the documents collection.
            const collection = await db.collection('tickets');
            // Get the tickets.
            const tickets = await collection.find({ managerEmail: managerEmail }).toArray();

            return tickets;
        } catch (e) {
            console.error(e);
        } finally {
            client.close();
        }
    }
}

module.exports.TicketDAO = TicketDAO;
