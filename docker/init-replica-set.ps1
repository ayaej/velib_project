# Script PowerShell pour initialiser le MongoDB Replica Set

Write-Host "🔧 Initialisation du MongoDB Replica Set..." -ForegroundColor Cyan

# Attendre que les instances MongoDB soient prêtes
Write-Host "⏳ Attente du démarrage des instances MongoDB..."
Start-Sleep -Seconds 15

# Initialiser le Replica Set
Write-Host "🚀 Configuration du Replica Set..."
docker exec velib_mongodb_primary mongosh --eval "rs.initiate({ _id: 'rs0', members: [ { _id: 0, host: 'mongo:27017', priority: 2 }, { _id: 1, host: 'mongo-replica-2:27017', priority: 1 } ] })" --username admin --password admin123 --authenticationDatabase admin

Write-Host "⏳ Attente de la configuration du Replica Set (30 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Vérifier le statut
Write-Host "`n📊 Statut du Replica Set:" -ForegroundColor Green
docker exec velib_mongodb_primary mongosh --eval "rs.status()" --username admin --password admin123 --authenticationDatabase admin

Write-Host "`n✅ Replica Set initialisé!" -ForegroundColor Green
Write-Host "`n📋 Résumé:" -ForegroundColor Cyan
Write-Host "  - Primary:   mongo:27017 (velib_mongodb_primary)"
Write-Host "  - Secondary: mongo-replica-2:27017 (velib_mongodb_secondary)"
Write-Host "`n🔗 URI de connexion:" -ForegroundColor Cyan
Write-Host "  mongodb://admin:admin123@mongo:27017,mongo-replica-2:27017/velib_db?replicaSet=rs0&authSource=admin"
