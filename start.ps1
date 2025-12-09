# Script de démarrage rapide pour le projet Vélib
# Usage: .\start.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚴 Vélib Real-Time Pipeline" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est en cours d'exécution
Write-Host "🔍 Vérification de Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $?) {
    Write-Host "❌ Docker n'est pas en cours d'exécution!" -ForegroundColor Red
    Write-Host "   Veuillez démarrer Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker est en cours d'exécution" -ForegroundColor Green
Write-Host ""

# Afficher la clé API configurée
Write-Host "🔑 Configuration de l'API JCDecaux..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $apiKey = Get-Content .env | Select-String "JCDECAUX_API_KEY" | ForEach-Object { $_.ToString().Split('=')[1] }
    if ($apiKey -and $apiKey -ne "YOUR_API_KEY_HERE") {
        Write-Host "✅ Clé API configurée: $($apiKey.Substring(0,10))..." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Clé API non configurée dans le fichier .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Fichier .env non trouvé" -ForegroundColor Yellow
}
Write-Host ""

# Menu de démarrage
Write-Host "Que souhaitez-vous faire ?" -ForegroundColor Cyan
Write-Host "1. Démarrer tous les services (Docker Compose)" -ForegroundColor White
Write-Host "2. Démarrer uniquement MongoDB + Backend" -ForegroundColor White
Write-Host "3. Arrêter tous les services" -ForegroundColor White
Write-Host "4. Voir les logs" -ForegroundColor White
Write-Host "5. Initialiser HDFS" -ForegroundColor White
Write-Host "6. Tester l'API JCDecaux" -ForegroundColor White
Write-Host "0. Quitter" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Votre choix"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Démarrage de tous les services..." -ForegroundColor Green
        Set-Location docker
        docker-compose up -d
        Set-Location ..
        Write-Host ""
        Write-Host "✅ Services démarrés!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📍 Accès aux interfaces:" -ForegroundColor Cyan
        Write-Host "   - Frontend:        http://localhost:5173" -ForegroundColor White
        Write-Host "   - Backend API:     http://localhost:3000/api" -ForegroundColor White
        Write-Host "   - Spark Master UI: http://localhost:8080" -ForegroundColor White
        Write-Host "   - HDFS NameNode:   http://localhost:9870" -ForegroundColor White
        Write-Host "   - MongoDB:         localhost:27017" -ForegroundColor White
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Démarrage de MongoDB + Backend..." -ForegroundColor Green
        Set-Location docker
        docker-compose up mongo backend -d
        Set-Location ..
        Write-Host ""
        Write-Host "✅ Services démarrés!" -ForegroundColor Green
        Write-Host "   - Backend API: http://localhost:3000/api" -ForegroundColor White
        Write-Host "   - MongoDB:     localhost:27017" -ForegroundColor White
    }
    "3" {
        Write-Host ""
        Write-Host "🛑 Arrêt de tous les services..." -ForegroundColor Yellow
        Set-Location docker
        docker-compose down
        Set-Location ..
        Write-Host "✅ Services arrêtés!" -ForegroundColor Green
    }
    "4" {
        Write-Host ""
        Write-Host "📋 Logs des services..." -ForegroundColor Cyan
        Set-Location docker
        docker-compose logs -f
        Set-Location ..
    }
    "5" {
        Write-Host ""
        Write-Host "📁 Initialisation de la structure HDFS..." -ForegroundColor Green
        docker exec velib_namenode hdfs dfs -mkdir -p /velib
        docker exec velib_namenode hdfs dfs -mkdir -p /velib/raw
        docker exec velib_namenode hdfs dfs -mkdir -p /velib/processed
        docker exec velib_namenode hdfs dfs -chmod -R 777 /velib
        Write-Host "✅ Structure HDFS initialisée!" -ForegroundColor Green
    }
    "6" {
        Write-Host ""
        Write-Host "🧪 Test de l'API JCDecaux..." -ForegroundColor Cyan
        if (Test-Path ".env") {
            $apiKey = Get-Content .env | Select-String "JCDECAUX_API_KEY" | ForEach-Object { $_.ToString().Split('=')[1] }
            $url = "https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey=$apiKey"
            try {
                $response = Invoke-RestMethod -Uri $url -Method Get
                Write-Host "✅ API fonctionnelle!" -ForegroundColor Green
                Write-Host "   Nombre de stations: $($response.Count)" -ForegroundColor White
                Write-Host ""
                Write-Host "Exemple de station:" -ForegroundColor Cyan
                $response[0] | Format-List name, number, address, status
            } catch {
                Write-Host "❌ Erreur lors de l'appel à l'API" -ForegroundColor Red
                Write-Host $_.Exception.Message -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Fichier .env non trouvé" -ForegroundColor Red
        }
    }
    "0" {
        Write-Host ""
        Write-Host "👋 Au revoir!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host ""
        Write-Host "❌ Choix invalide" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
