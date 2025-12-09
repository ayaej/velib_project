# ✅ PROJET VÉLIB - CONFIGURATION TERMINÉE

## 🎉 Félicitations ! Votre projet est prêt

Tous les fichiers ont été créés et votre clé API JCDecaux est configurée.

---

## 📁 Structure Complète du Projet

```
velib/
├── 📄 .env                          ✅ Clé API configurée
├── 📄 .env.example                  
├── 📄 .gitignore                    
├── 📄 README.md                     
├── 📄 start.ps1                     ⭐ Script de démarrage rapide
│
├── 📁 docker/
│   ├── docker-compose.yml           ⭐ Configuration complète (HDFS + Spark + Mongo)
│   ├── hadoop.env                   
│   ├── init-mongo.js                
│   └── hdfs-utils.sh                
│
├── 📁 backend/
│   ├── Dockerfile                   
│   ├── package.json                 
│   ├── server.js                    
│   ├── .dockerignore                
│   └── src/
│       ├── db.js                    
│       └── routes.js                
│
├── 📁 streaming/
│   ├── streaming-velib.py           ⭐ Pipeline Spark Streaming (API JCDecaux)
│   └── requirements.txt             
│
├── 📁 batch/
│   ├── batch-velib.py               ⭐ Pipeline Spark Batch (HDFS)
│   ├── requirements.txt             
│   └── README.md                    
│
├── 📁 frontend/
│   ├── index.html                   
│   ├── package.json                 
│   ├── vite.config.js               
│   ├── public/
│   └── src/
│       ├── App.jsx                  
│       ├── App.css                  
│       ├── main.jsx                 
│       ├── index.css                
│       ├── components/
│       │   ├── RealtimeDashboard.jsx
│       │   ├── RealtimeDashboard.css
│       │   ├── StationTable.jsx     
│       │   └── StationTable.css     
│       └── services/
│           └── api.js               
│
├── 📁 hdfs/
│   └── README.md                    
│
└── 📁 docs/
    ├── architecture.md              ⭐ Architecture complète
    ├── readme.md                    ⭐ Documentation complète
    └── API_JCDECAUX_GUIDE.md        ⭐ Guide API JCDecaux
```

---

## 🚀 DÉMARRAGE RAPIDE (3 étapes)

### Option 1 : Avec le script PowerShell (Recommandé)

```powershell
# Lancer le script interactif
.\start.ps1

# Choisissez l'option 1 pour démarrer tous les services
# Choisissez l'option 6 pour tester votre clé API
```

### Option 2 : Manuellement

```powershell
# 1. Démarrer tous les services Docker
cd docker
docker-compose up -d

# 2. Attendre 30 secondes que les services démarrent

# 3. Initialiser HDFS (première fois seulement)
docker exec velib_namenode hdfs dfs -mkdir -p /velib/raw
docker exec velib_namenode hdfs dfs -mkdir -p /velib/processed
docker exec velib_namenode hdfs dfs -chmod -R 777 /velib

# 4. Tester l'API JCDecaux
curl "https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey=a7fe3382cf1e224fb3e9defc41d2501db4737b40"
```

---

## 🎯 Services Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Dashboard React (à installer) |
| **Backend API** | http://localhost:3000/api | API REST Node.js |
| **Spark Master** | http://localhost:8080 | Interface Spark |
| **HDFS NameNode** | http://localhost:9870 | Interface HDFS |
| **MongoDB** | localhost:27017 | Base de données |

---

## 📊 Pipelines Disponibles

### 1️⃣ **Streaming Spark** (Temps Réel)
```bash
# Lancer le pipeline streaming
docker exec -it velib_spark_master bash
cd /opt/spark-apps/streaming
export JCDECAUX_API_KEY=a7fe3382cf1e224fb3e9defc41d2501db4737b40
python streaming-velib.py
```

**Ce qu'il fait :**
- ✅ Récupère l'API JCDecaux toutes les 30 secondes
- ✅ Transforme les données JSON
- ✅ Insère dans MongoDB (upsert)
- ⚙️ Optionnel : Archive dans HDFS

### 2️⃣ **Batch Spark** (Traitement Quotidien)
```bash
# Lancer le pipeline batch
docker exec -it velib_spark_master bash
cd /opt/spark-apps/batch
python batch-velib.py
```

**Ce qu'il fait :**
- ✅ Lit les données depuis HDFS
- ✅ Calcule des agrégations quotidiennes
- ✅ Analyse les patterns horaires
- ✅ Détecte les anomalies
- ✅ Écrit les résultats dans MongoDB + HDFS

### 3️⃣ **Backend API**
```bash
# Déjà démarré avec docker-compose
# Tester les endpoints :
curl http://localhost:3000/health
curl http://localhost:3000/api/stations
curl http://localhost:3000/api/stats
```

### 4️⃣ **Frontend React** (À installer)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Tester votre Configuration

### 1. Vérifier que Docker fonctionne
```powershell
docker ps
# Vous devriez voir : mongo, namenode, datanode, spark-master, spark-worker, backend
```

### 2. Tester l'API JCDecaux
```powershell
.\start.ps1
# Choisir l'option 6
```

### 3. Tester MongoDB
```powershell
docker exec -it velib_mongodb mongosh -u admin -p admin123
use velib_db
show collections
db.stations.countDocuments()
exit
```

### 4. Tester HDFS
```powershell
docker exec velib_namenode hdfs dfs -ls /velib
```

### 5. Tester le Backend
```powershell
curl http://localhost:3000/health
```

---

## 📚 Documentation Complète

- **Architecture** : `docs/architecture.md`
- **Guide Complet** : `docs/readme.md`
- **API JCDecaux** : `docs/API_JCDECAUX_GUIDE.md`
- **HDFS Guide** : `hdfs/README.md`
- **Batch Processing** : `batch/README.md`

---

## 🔑 Votre Clé API JCDecaux

```
a7fe3382cf1e224fb3e9defc41d2501db4737b40
```

✅ **Déjà configurée dans le fichier `.env`**

---

## 🎓 Workflow de Développement

### Scénario 1 : Développement Local (Sans Docker)

```powershell
# 1. Backend
cd backend
npm install
npm run dev

# 2. Frontend (autre terminal)
cd frontend
npm install
npm run dev

# 3. Streaming (autre terminal)
cd streaming
pip install -r requirements.txt
$env:JCDECAUX_API_KEY="a7fe3382cf1e224fb3e9defc41d2501db4737b40"
python streaming-velib.py
```

### Scénario 2 : Production avec Docker (Recommandé)

```powershell
# 1. Démarrer tout
cd docker
docker-compose up -d

# 2. Voir les logs
docker-compose logs -f

# 3. Arrêter tout
docker-compose down
```

---

## 🐛 Dépannage Rapide

### MongoDB ne démarre pas
```powershell
docker-compose down -v
docker-compose up mongo -d
```

### Spark ne trouve pas MongoDB
```powershell
# Vérifier le réseau
docker network ls
docker network inspect velib_velib_network
```

### HDFS ne démarre pas
```powershell
docker logs velib_namenode
docker logs velib_datanode
```

### L'API JCDecaux retourne une erreur 401
```powershell
# Vérifier votre clé dans .env
cat .env | Select-String "JCDECAUX"
```

---

## ✅ Checklist Finale

Avant de commencer à travailler :

- [x] ✅ Structure du projet créée
- [x] ✅ Clé API JCDecaux configurée
- [x] ✅ Fichier .env créé
- [x] ✅ Docker Compose prêt (MongoDB + HDFS + Spark + Backend)
- [x] ✅ Pipeline Streaming configuré
- [x] ✅ Pipeline Batch configuré
- [x] ✅ Backend Node.js prêt
- [x] ✅ Frontend React prêt
- [x] ✅ Documentation complète

---

## 🎯 Prochaines Étapes

1. **Démarrer les services**
   ```powershell
   .\start.ps1
   ```

2. **Lancer le pipeline streaming**
   ```powershell
   docker exec -it velib_spark_master bash
   export JCDECAUX_API_KEY=a7fe3382cf1e224fb3e9defc41d2501db4737b40
   cd /opt/spark-apps/streaming
   python streaming-velib.py
   ```

3. **Installer et démarrer le frontend**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

4. **Tester les APIs**
   ```powershell
   curl http://localhost:3000/api/stations
   ```

---

## 🆘 Support

Si vous avez des questions :
1. Consultez `docs/readme.md` pour la documentation complète
2. Consultez `docs/API_JCDECAUX_GUIDE.md` pour l'API
3. Vérifiez les logs : `docker-compose logs -f`

---

## 🎉 Vous êtes prêt à commencer !

```powershell
# Commencez maintenant :
.\start.ps1
```

**Bon développement ! 🚀**

---

**Note :** Ce projet est conçu pour être une base complète et modulaire. Vous pouvez activer/désactiver les composants selon vos besoins (HDFS, Batch, Frontend, etc.).
