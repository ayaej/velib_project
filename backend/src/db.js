const { MongoClient } = require('mongodb');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@mongo:27017/velib_db?authSource=admin';
const DB_NAME = 'velib_db';

let client = null;
let db = null;

/**
 * Connexion à MongoDB
 */
async function connectDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')}`);
    
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    
    // Vérifier la connexion
    await client.db(DB_NAME).command({ ping: 1 });
    
    db = client.db(DB_NAME);
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`   Database: ${DB_NAME}`);
    
    // Créer les index si nécessaire
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

/**
 * Créer les index pour optimiser les requêtes
 */
async function createIndexes() {
  try {
    const stationsCollection = db.collection('stations');
    
    // Index sur stationCode (unique)
    await stationsCollection.createIndex({ stationCode: 1 }, { unique: true });
    
    // Index sur timestamp (pour les requêtes temporelles)
    await stationsCollection.createIndex({ timestamp: -1 });
    
    // Index sur name (pour la recherche)
    await stationsCollection.createIndex({ name: 1 });
    
    console.log('✅ Indexes created successfully');
  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️  Indexes already exist');
    } else {
      console.warn('⚠️  Error creating indexes:', error.message);
    }
  }
}

/**
 * Obtenir la connexion à la base de données
 */
function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

/**
 * Fermer la connexion MongoDB
 */
async function closeDB() {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};
