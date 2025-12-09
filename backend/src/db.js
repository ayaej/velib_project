const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/velib_db?authSource=admin';
const DB_NAME = 'velib_db';
const COLLECTION_NAME = 'stations';

let client = null;
let db = null;

/**
 * Connexion à MongoDB
 */
async function connectDB() {
  try {
    if (client && client.topology && client.topology.isConnected()) {
      console.log('MongoDB already connected');
      return db;
    }

    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db(DB_NAME);
    
    console.log(`Connected to MongoDB database: ${DB_NAME}`);
    
    // Créer les index si nécessaire
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Créer les index pour optimiser les requêtes
 */
async function createIndexes() {
  try {
    const collection = db.collection(COLLECTION_NAME);
    
    // TODO: Créer les index nécessaires
    // Exemple: index sur stationCode, timestamp, etc.
    await collection.createIndex({ stationCode: 1 });
    await collection.createIndex({ timestamp: -1 });
    await collection.createIndex({ name: 1 });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

/**
 * Récupérer l'instance de la base de données
 */
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

/**
 * Récupérer la collection des stations
 */
function getStationsCollection() {
  const database = getDB();
  return database.collection(COLLECTION_NAME);
}

/**
 * Fermer la connexion MongoDB
 */
async function closeDB() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  connectDB,
  getDB,
  getStationsCollection,
  closeDB
};
