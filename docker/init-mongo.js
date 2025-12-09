// Script d'initialisation MongoDB pour le projet Vélib
// Crée la base de données, les collections et les utilisateurs nécessaires

db = db.getSiblingDB('velib_db');

print('📦 Creating Vélib database...');

// Créer les collections
print('📁 Creating collections...');

db.createCollection('stations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['stationCode', 'name', 'timestamp'],
      properties: {
        stationCode: {
          bsonType: 'string',
          description: 'Code unique de la station - requis'
        },
        name: {
          bsonType: 'string',
          description: 'Nom de la station - requis'
        },
        capacity: {
          bsonType: 'int',
          minimum: 0,
          description: 'Capacité totale de la station'
        },
        numBikesAvailable: {
          bsonType: 'int',
          minimum: 0,
          description: 'Nombre de vélos disponibles'
        },
        numDocksAvailable: {
          bsonType: 'int',
          minimum: 0,
          description: 'Nombre de places disponibles'
        },
        isInstalled: {
          bsonType: 'bool',
          description: 'Station installée ou non'
        },
        coordinates: {
          bsonType: 'array',
          description: 'Coordonnées GPS [longitude, latitude]'
        },
        timestamp: {
          bsonType: 'string',
          description: 'Timestamp de la donnée - requis'
        }
      }
    }
  }
});

db.createCollection('stations_aggregated');
db.createCollection('daily_stats');
db.createCollection('hourly_patterns');

print('✅ Collections created successfully');

// Créer les index pour optimiser les performances
print('📊 Creating indexes...');

db.stations.createIndex({ stationCode: 1 }, { unique: true });
db.stations.createIndex({ timestamp: -1 });
db.stations.createIndex({ name: 1 });
db.stations.createIndex({ 'coordinates': '2dsphere' }); // Index géospatial

db.stations_aggregated.createIndex({ stationCode: 1, date: -1 });
db.daily_stats.createIndex({ date: -1 });

print('✅ Indexes created successfully');

// Créer un utilisateur pour l'application
print('👤 Creating application user...');

db.createUser({
  user: 'velib_user',
  pwd: 'velib_password123',
  roles: [
    {
      role: 'readWrite',
      db: 'velib_db'
    }
  ]
});

print('✅ User created successfully');

// Insérer des données de test (optionnel)
print('🧪 Inserting test data...');

db.stations.insertOne({
  stationCode: 'TEST001',
  name: 'Station de Test',
  capacity: 20,
  numBikesAvailable: 10,
  numDocksAvailable: 10,
  isInstalled: true,
  isReturning: true,
  isRenting: true,
  coordinates: [2.3522, 48.8566],
  timestamp: new Date().toISOString(),
  lastUpdate: new Date().toISOString()
});

print('✅ Test data inserted');

print('');
print('========================================');
print('✅ MongoDB initialization completed!');
print('========================================');
print('Database: velib_db');
print('Collections: stations, stations_aggregated, daily_stats, hourly_patterns');
print('User: velib_user');
print('========================================');
