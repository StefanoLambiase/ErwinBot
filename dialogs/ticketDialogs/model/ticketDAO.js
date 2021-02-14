// Imports for mongo.
var { MongoClient } = require('mongodb');
var connectionString = process.env.MongoConnectionString;
var dbName = process.env.MongoDBName;

/**
 * Implements the logic to access the DB for the ticket operation.
 */
class TicketDAO {
    // Useless constructor.
    constructor() {
        this.id = 'id';
    }

    /**
     * Implements the logic that insert a ticket in the DB.
     * @param {Ticket} data - The Ticket object to save in the DB.
     */
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

    /**
     * Implements the logic that find all the tickets by the receiver email.
     * @param {String} managerEmail - The receiver email.
     */
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
