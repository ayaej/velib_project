# 🚴 Vélib Real-Time Big Data Pipeline - Lyon

![Apache Spark](https://img.shields.io/badge/Apache%20Spark-3.5.0-E25A1C?logo=apachespark&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

Pipeline Big Data temps réel pour le suivi des stations Vélib à **Lyon** (421 stations) utilisant **Apache Spark**, **HDFS**, **MongoDB**, **Node.js** et **React**.

---

## 🎯 Fonctionnalités

✅ **Streaming en temps réel** - Ingestion depuis l'API JCDecaux (Lyon) toutes les 30 secondes  
✅ **Traitement Batch** - Agrégations et analyses sur données HDFS  
✅ **Stockage distribué** - HDFS (Hadoop) pour données brutes  
✅ **Base de données NoSQL** - MongoDB pour données temps réel  
✅ **API REST** - Backend Node.js + Express  
✅ **Dashboard interactif** - Frontend React + Vite avec design raffiné  
✅ **Recherche de stations** - Recherche en temps réel avec auto-centrage sur la carte  
✅ **Carte interactive** - Leaflet avec marqueurs dynamiques et popups détaillés  
✅ **Infrastructure complète** - Docker Compose (plug & play)  

---

## 🚀 Quick Start (Pour les Collègues)

### Prérequis
- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Git

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/YOUR_USERNAME/velib-bigdata-pipeline.git
cd velib-bigdata-pipeline

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Ajouter votre clé API JCDecaux dans .env
# Obtenez votre clé gratuite sur: https://developer.jcdecaux.com
# Éditez .env et remplacez YOUR_API_KEY_HERE par votre clé

# 4. Démarrer tous les services avec Docker
cd docker
docker-compose up -d

# 5. Initialiser HDFS (première fois seulement)
docker exec velib_namenode hdfs dfs -mkdir -p /velib/raw
docker exec velib_namenode hdfs dfs -mkdir -p /velib/processed
docker exec velib_namenode hdfs dfs -chmod -R 777 /velib
```

### Démarrage Rapide (Windows)
```powershell
# Utiliser le script PowerShell interactif
.\start.ps1
```

---

## 🎯 Services Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Dashboard React |
| **Backend API** | http://localhost:3000/api | API REST |
| **Spark UI** | http://localhost:8080 | Interface Spark Master |
| **HDFS NameNode** | http://localhost:9870 | Interface HDFS |
| **MongoDB** | localhost:27017 | Base de données |

---

## 📊 Architecture

```
API JCDecaux (Lyon) → Spark Streaming → MongoDB (temps réel)
                             ↓
                           HDFS (archivage)
                             ↓
                     Spark Batch → MongoDB (agrégations)
                             ↓
                       Backend API (Node.js)
                             ↓
                     Frontend React (Dashboard)
```

📖 **Documentation complète** : [docs/architecture.md](docs/architecture.md)

---

## 📁 Structure du Projet

```
velib/
├── backend/              # API Node.js + Express
├── frontend/             # Dashboard React + Vite
├── streaming/            # Pipeline Spark Streaming (temps réel)
├── batch/                # Pipeline Spark Batch (traitement quotidien)
├── docker/               # Configuration Docker Compose
├── hdfs/                 # Documentation HDFS
└── docs/                 # Documentation complète
```

---

## 🛠️ Stack Technique

- **Streaming** : Apache Spark 3.5.0 (PySpark)
- **Batch Processing** : Apache Spark 3.5.0
- **Stockage Distribué** : HDFS (Hadoop 3.2.1)
- **Base de Données** : MongoDB (Latest)
- **Backend** : Node.js 18.x + Express
- **Frontend** : React 18.x + Vite
- **Infrastructure** : Docker Compose
- **API Source** : JCDecaux Open Data API (Lyon - 421 stations)

---

## 📚 Documentation

- 📖 [Guide de Démarrage Complet](GETTING_STARTED.md)
- 🏗️ [Architecture Détaillée](docs/architecture.md)
- 🔑 [Guide API JCDecaux](docs/API_JCDECAUX_GUIDE.md)
- 🗂️ [Documentation HDFS](hdfs/README.md)
- 📊 [Batch Processing](batch/README.md)
- 📡 [Documentation API REST](docs/readme.md)

---

## 🧪 Tester le Projet

### 1. Vérifier que les services sont actifs
```bash
docker ps
# Vous devriez voir 6 conteneurs: mongo, namenode, datanode, spark-master, spark-worker, backend
```

### 2. Tester l'API Backend
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/stations
curl http://localhost:3000/api/stats
```

### 3. Lancer le Pipeline Streaming
```bash
docker exec -it velib_spark_master bash
cd /opt/spark-apps/streaming
export JCDECAUX_API_KEY=your_api_key_here
python streaming-velib.py
```

### 4. Installer et lancer le Frontend
```bash
cd frontend
npm install
npm run dev
# Ouvrir http://localhost:5173
```

---

## 👥 Pour les Collègues du Projet

### Configuration Rapide

1. **Cloner le repo** : `git clone ...`
2. **Créer votre clé API JCDecaux** : https://developer.jcdecaux.com
3. **Copier `.env.example` vers `.env`** et ajouter votre clé
4. **Lancer Docker Compose** : `cd docker && docker-compose up -d`
5. **Lire GETTING_STARTED.md** pour les détails

### Workflow de Développement

```bash
# Créer une branche pour votre feature
git checkout -b feature/ma-fonctionnalite

# Faire vos modifications
# ...

# Commit et push
git add .
git commit -m "✨ Ajout de ma fonctionnalité"
git push origin feature/ma-fonctionnalite

# Créer une Pull Request sur GitHub
```

---

## 🐛 Dépannage

### Problème : Docker ne démarre pas
```bash
# Vérifier que Docker Desktop est lancé (Windows/Mac)
docker info
```

### Problème : Port déjà utilisé
```bash
# Vérifier les ports utilisés
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Changer le port dans docker/docker-compose.yml
```

### Problème : API Key invalide
```bash
# Vérifier votre clé dans .env
cat .env | grep JCDECAUX_API_KEY

# Tester l'API directement
curl "https://api.jcdecaux.com/vls/v3/stations?contract=lyon&apiKey=VOTRE_CLE"
```

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m '✨ Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## ✨ Nouvelles Fonctionnalités

### 🔍 Recherche de Stations
- **Recherche instantanée** : Trouvez des stations par nom ou code
- **Auto-centrage sur carte** : La carte se centre automatiquement sur la station sélectionnée
- **Infos détaillées** : Panneau d'informations avec disponibilité en temps réel
- **Vélos mécaniques/électriques** : Visualisation séparée des types de vélos

### 🎨 Design Raffiné
- **Palette de couleurs premium** : Indigo (#4F46E5) et Émeraude (#059669)
- **8 dégradés sophistiqués** : Animations fluides avec cubic-bezier
- **Ombres colorées** : Effets 3D sur les cartes et boutons
- **Responsive design** : Interface adaptée mobile/tablette/desktop

### �️ Carte Interactive
- **421 stations de Lyon** : Toutes les stations Vélib affichées
- **Marqueurs dynamiques** : Couleurs selon disponibilité (vert/orange/rouge)
- **Zoom automatique** : Zoom à 17 lors de la sélection d'une station
- **Légende claire** : Indicateurs de disponibilité et types de vélos

---

## �📝 TODO / Roadmap

- [x] ~~Ajouter carte interactive avec React Leaflet~~ ✅ **Fait**
- [x] ~~Recherche de stations~~ ✅ **Fait**
- [x] ~~Design raffiné avec palette de couleurs premium~~ ✅ **Fait**
- [ ] Implémenter graphiques temps réel (Recharts)
- [ ] Ajouter WebSocket pour push notifications
- [ ] Implémenter tests unitaires et d'intégration
- [ ] Ajouter authentification JWT
- [ ] Monitoring avec Prometheus + Grafana
- [ ] Machine Learning pour prédiction de disponibilité
- [ ] Documentation API avec Swagger/OpenAPI

---

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails

---

## 👥 Équipe

**Big Data Team - IPSSI**

---

## 🙏 Remerciements

- JCDecaux pour l'API Open Data
- Apache Spark Community
- MongoDB Community
- Open Source Community

---

**🚀 Prêt à démarrer ? Consultez [GETTING_STARTED.md](GETTING_STARTED.md) !**
