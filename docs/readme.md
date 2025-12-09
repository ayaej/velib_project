# 🚴 Projet Vélib - Pipeline Big Data Temps Réel

![Pipeline](https://img.shields.io/badge/Pipeline-Big%20Data-blue)
![Streaming](https://img.shields.io/badge/Streaming-Spark-orange)
![Backend](https://img.shields.io/badge/Backend-Node.js-green)
![Frontend](https://img.shields.io/badge/Frontend-React-61dafb)

Pipeline temps réel pour le suivi des stations Vélib à Paris utilisant **Apache Spark**, **MongoDB**, **Node.js** et **React**.

---

## 📋 Table des Matières

- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage](#-démarrage)
- [Utilisation](#-utilisation)
- [Structure du Projet](#-structure-du-projet)
- [Développement](#-développement)
- [API Documentation](#-api-documentation)

---

## 🏗️ Architecture

```
API Vélib → Spark Streaming → MongoDB → Backend API → Frontend React
```

Consultez [docs/architecture.md](docs/architecture.md) pour plus de détails.

---

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Docker** (version 20.x ou supérieure)
- **Docker Compose** (version 2.x ou supérieure)
- **Node.js** (version 18.x ou supérieure) - pour développement local
- **Python 3.x** - pour développement local

---

## 📦 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd velib
```

### 2. Configuration des variables d'environnement

Créer un fichier `.env` à la racine :

```env
# MongoDB
MONGODB_URI=mongodb://admin:admin123@mongo:27017/velib_db?authSource=admin

# Backend
PORT=3000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3000/api
```

### 3. Installer les dépendances locales (optionnel)

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

#### Streaming
```bash
cd streaming
pip install -r requirements.txt
```

---

## 🚀 Démarrage

### Option 1 : Démarrage avec Docker Compose (Recommandé)

```bash
# Démarrer tous les services
cd docker
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Option 2 : Démarrage manuel pour développement

#### 1. Démarrer MongoDB
```bash
cd docker
docker-compose up mongo -d
```

#### 2. Démarrer le Backend
```bash
cd backend
npm run dev
```

#### 3. Démarrer le Frontend
```bash
cd frontend
npm run dev
```

#### 4. Lancer le Streaming Spark
```bash
cd streaming
python streaming-velib.py
```

---

## 💻 Utilisation

Une fois tous les services démarrés :

### Accéder aux interfaces

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Dashboard React |
| **Backend API** | http://localhost:3000/api | API REST |
| **Spark UI** | http://localhost:8080 | Interface Spark |
| **MongoDB** | localhost:27017 | Base de données |

### Tester l'API

```bash
# Santé du backend
curl http://localhost:3000/health

# Liste des stations
curl http://localhost:3000/api/stations

# Statistiques globales
curl http://localhost:3000/api/stats

# Stations critiques
curl http://localhost:3000/api/stations/critical

# Top stations
curl http://localhost:3000/api/stations/top?limit=10
```

---

## 📁 Structure du Projet

```
velib/
├── docker/
│   └── docker-compose.yml          # Configuration Docker
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js                   # Point d'entrée Express
│   └── src/
│       ├── db.js                   # Connexion MongoDB
│       └── routes.js               # Routes API REST
├── streaming/
│   ├── streaming-velib.py          # Pipeline Spark
│   └── requirements.txt            # Dépendances Python
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                 # Composant principal
│       ├── components/             # Composants React
│       └── services/
│           └── api.js              # Service HTTP
└── docs/
    ├── architecture.md             # Documentation architecture
    └── readme.md                   # Ce fichier
```

---

## 🛠️ Développement

### Commandes utiles

#### Docker

```bash
# Reconstruire les images
docker-compose build

# Voir les conteneurs actifs
docker-compose ps

# Accéder aux logs d'un service
docker-compose logs -f backend

# Nettoyer les volumes
docker-compose down -v
```

#### Backend

```bash
cd backend

# Mode développement avec hot-reload
npm run dev

# Démarrage production
npm start

# Linter
npm run lint
```

#### Frontend

```bash
cd frontend

# Mode développement
npm run dev

# Build production
npm run build

# Preview du build
npm run preview
```

#### Streaming

```bash
cd streaming

# Exécuter le pipeline
python streaming-velib.py

# Avec configuration Spark personnalisée
spark-submit --master local[*] streaming-velib.py
```

---

## 📡 API Documentation

### Endpoints disponibles

#### `GET /api/stations`
Récupère toutes les stations avec pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1450,
    "pages": 29
  }
}
```

#### `GET /api/stations/top`
Récupère les stations avec le plus de vélos disponibles.

**Query Parameters:**
- `limit` (number, default: 10)

#### `GET /api/stations/critical`
Récupère les stations critiques (peu de vélos ou places).

**Query Parameters:**
- `threshold` (number, default: 3)

#### `GET /api/stations/:id`
Récupère une station spécifique.

**URL Parameters:**
- `id` (string) - Code de la station

#### `GET /api/stats`
Récupère les statistiques globales.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStations": 1450,
    "totalBikes": 8234,
    "totalDocks": 12456,
    "avgOccupancy": 65.3
  }
}
```

---

## 🧪 Tests

### TODO: Ajouter les tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

---

## 🐛 Dépannage

### Problème : MongoDB ne démarre pas
```bash
# Supprimer les volumes et redémarrer
docker-compose down -v
docker-compose up mongo -d
```

### Problème : Port déjà utilisé
```bash
# Trouver le processus qui utilise le port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Changer le port dans docker-compose.yml ou .env
```

### Problème : Spark ne peut pas écrire dans MongoDB
- Vérifier que MongoDB est accessible depuis le conteneur Spark
- Vérifier les credentials dans `streaming-velib.py`

---

## 📝 TODO

- [ ] Ajouter des tests unitaires et d'intégration
- [ ] Implémenter une carte interactive (Leaflet)
- [ ] Ajouter des graphiques temps réel (Recharts)
- [ ] Mettre en place un système d'alerting
- [ ] Ajouter l'authentification JWT
- [ ] Optimiser les performances du pipeline
- [ ] Ajouter du monitoring (Prometheus/Grafana)
- [ ] Documenter l'API avec Swagger

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit les changements (`git commit -m 'Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT.

---

## 👥 Auteurs

**Équipe Big Data**

---

## 📞 Contact

Pour toute question ou suggestion : [email@example.com](mailto:email@example.com)

---

## 🙏 Remerciements

- Open Data Paris pour l'API Vélib
- Apache Spark pour le framework de streaming
- MongoDB pour la base de données
- React et Vite pour le frontend

---

**Bon développement ! 🚀**
