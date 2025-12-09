# 🚴 Vélib Real-Time Pipeline

Pipeline Big Data temps réel pour le suivi des stations Vélib à Paris.

## 🚀 Quick Start

```bash
# 1. Démarrer tous les services avec Docker
cd docker
docker-compose up -d

# 2. Accéder au dashboard
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# Spark UI: http://localhost:8080
```

## 📚 Documentation Complète

Consultez la documentation détaillée dans le dossier `docs/` :

- [📖 README Complet](docs/readme.md) - Guide d'installation et utilisation
- [🏗️ Architecture](docs/architecture.md) - Schéma et détails techniques

## 🛠️ Stack Technique

- **Streaming**: Apache Spark (PySpark)
- **Database**: MongoDB
- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Infrastructure**: Docker Compose

## 📦 Structure du Projet

```
velib/
├── docker/              # Configuration Docker Compose
├── backend/             # API Node.js + Express
├── streaming/           # Pipeline Spark Streaming
├── frontend/            # Dashboard React
└── docs/                # Documentation
```

## 🎯 Fonctionnalités

✅ Ingestion temps réel depuis l'API Vélib  
✅ Traitement avec Spark Structured Streaming  
✅ Stockage MongoDB  
✅ API REST avec Node.js  
✅ Dashboard React avec statistiques en direct  
🚧 Carte interactive (TODO)  
🚧 Graphiques temps réel (TODO)  

---

**Pour plus d'informations, consultez [docs/readme.md](docs/readme.md)**
