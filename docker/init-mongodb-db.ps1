# Script d'initialisation de la base de donnees MongoDB
# Cree la base de donnees velib_db et l'utilisateur de l'application

Write-Host "Initialisation de la base de donnees MongoDB..." -ForegroundColor Cyan

# Attendre que MongoDB soit pret
Write-Host "Attente du demarrage de MongoDB..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Creer la base de donnees et l'utilisateur
$mongoCommand = @"
use admin
db.auth('admin', 'admin123')

use velib_db
db.createUser({
  user: 'velib_user',
  pwd: 'velib_pass',
  roles: [
    { role: 'readWrite', db: 'velib_db' },
    { role: 'dbAdmin', db: 'velib_db' }
  ]
})

// Creer les collections
db.createCollection('stations')
db.createCollection('stations_aggregated')
db.createCollection('daily_stats')
db.createCollection('station_incidents')
db.createCollection('stations_empty_full_tracking')

// Creer les index pour ameliorer les performances
db.stations.createIndex({ stationCode: 1 })
db.stations.createIndex({ timestamp: -1 })
db.stations_aggregated.createIndex({ station_code: 1 })
db.station_incidents.createIndex({ station_code: 1 })
db.stations_empty_full_tracking.createIndex({ station_code: 1 })

print('Base de donnees velib_db creee avec succes')
print('Collections creees')
print('Index crees')
"@

# Executer les commandes sur le noeud primaire
docker exec velib_mongodb mongosh --eval $mongoCommand

Write-Host "`nInitialisation terminee!" -ForegroundColor Green
Write-Host "Base de donnees: velib_db" -ForegroundColor Cyan
Write-Host "Utilisateur: velib_user" -ForegroundColor Cyan
Write-Host "Mot de passe: velib_pass" -ForegroundColor Cyan
Write-Host "`nURI de connexion:" -ForegroundColor Yellow
Write-Host "mongodb://velib_user:velib_pass@mongo:27017/velib_db?authSource=velib_db" -ForegroundColor White
