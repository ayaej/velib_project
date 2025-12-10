#!/bin/bash
# Script pour initialiser le Replica Set MongoDB

echo "🔧 Initialisation du MongoDB Replica Set..."

# Attendre que les instances MongoDB soient prêtes
sleep 10

# Se connecter au nœud primaire et initialiser le Replica Set
docker exec velib_mongodb_primary mongosh --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo:27017", priority: 2 },
    { _id: 1, host: "mongo-replica-2:27017", priority: 1 }
  ]
})
' --username admin --password admin123 --authenticationDatabase admin

echo "⏳ Attente de la configuration du Replica Set (30 secondes)..."
sleep 30

# Vérifier le statut du Replica Set
echo "📊 Statut du Replica Set:"
docker exec velib_mongodb_primary mongosh --eval 'rs.status()' --username admin --password admin123 --authenticationDatabase admin

echo "✅ Replica Set initialisé!"
echo ""
echo "📋 Résumé:"
echo "  - Primary:   mongo:27017"
echo "  - Secondary: mongo-replica-2:27017"
echo ""
echo "🔗 URI de connexion:"
echo "  mongodb://admin:admin123@mongo:27017,mongo-replica-2:27017/velib_db?replicaSet=rs0&authSource=admin"
