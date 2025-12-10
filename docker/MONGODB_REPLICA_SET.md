# 🚀 Guide de Démarrage - MongoDB Replica Set

## 📋 Modifications apportées

Votre cluster MongoDB a été mis à niveau avec **2 nœuds** en **Replica Set** pour la haute disponibilité !

### Nouvelle Architecture MongoDB

| Nœud | Container | Port | Rôle |
|------|-----------|------|------|
| **Primary** | velib_mongodb_primary | 27017 | Lecture + Écriture |
| **Secondary** | velib_mongodb_secondary | 27018 | Réplication + Backup |

---

## 🔧 Installation et Configuration

### Étape 1 : Arrêter l'ancien cluster

```powershell
cd docker
docker-compose down
```

### Étape 2 : Démarrer le nouveau cluster avec 2 nœuds MongoDB

```powershell
docker-compose up -d
```

Attendez que tous les conteneurs soient `healthy` (environ 30 secondes) :

```powershell
docker ps
```

### Étape 3 : Initialiser le Replica Set

**Sur Windows (PowerShell) :**
```powershell
.\init-replica-set.ps1
```

**Sur Linux/Mac :**
```bash
chmod +x init-replica-set.sh
./init-replica-set.sh
```

Vous devriez voir :
```
✅ Replica Set initialisé!
📋 Résumé:
  - Primary:   mongo:27017
  - Secondary: mongo-replica-2:27017
```

---

## ✅ Vérification

### 1. Vérifier le statut du Replica Set

```powershell
docker exec velib_mongodb_primary mongosh --eval "rs.status()" --username admin --password admin123 --authenticationDatabase admin
```

Vous devriez voir :
- **mongo:27017** → `"stateStr" : "PRIMARY"`
- **mongo-replica-2:27017** → `"stateStr" : "SECONDARY"`

### 2. Tester la connexion

```powershell
docker exec velib_mongodb_primary mongosh "mongodb://admin:admin123@mongo:27017,mongo-replica-2:27017/velib_db?replicaSet=rs0&authSource=admin" --eval "db.stats()"
```

### 3. Vérifier les collections

```powershell
docker exec velib_mongodb_primary mongosh "mongodb://admin:admin123@mongo:27017,mongo-replica-2:27017/velib_db?replicaSet=rs0&authSource=admin" --eval "db.getCollectionNames()"
```

---

## 🔗 Nouvelle URI de Connexion

**Avant (1 nœud) :**
```
mongodb://admin:admin123@mongo:27017/velib_db?authSource=admin
```

**Après (Replica Set - 2 nœuds) :**
```
mongodb://admin:admin123@mongo:27017,mongo-replica-2:27017/velib_db?replicaSet=rs0&authSource=admin
```

---

## 📝 Mises à jour nécessaires

Les fichiers suivants ont été **automatiquement mis à jour** :

- ✅ `docker-compose.yml` : Ajout du 2e nœud MongoDB
- ✅ Backend : URI mise à jour avec Replica Set

**À mettre à jour manuellement** :

### 1. Streaming (`streaming/streaming-velib.py`)

Ligne ~13, remplacer :
```python
MONGODB_URI = 'mongodb://admin:admin123@mongo:27017/'
```

Par :
```python
MONGODB_URI = 'mongodb://admin:admin123@mongo:27017,mongo-replica-2:27017/?replicaSet=rs0&authSource=admin'
```

### 2. Batch (`batch/batch-velib.py`)

Ligne ~21, remplacer :
```python
MONGODB_URI = "mongodb://admin:admin123@mongo:27017/"
```

Par :
```python
MONGODB_URI = "mongodb://admin:admin123@mongo:27017,mongo-replica-2:27017/?replicaSet=rs0&authSource=admin"
```

---

## 🎯 Avantages du Replica Set

### ✅ Haute Disponibilité
- Si le **Primary** tombe, le **Secondary** devient automatiquement Primary
- Aucune perte de données

### ✅ Performance
- Les lectures peuvent être distribuées sur les 2 nœuds
- Réduction de la charge sur le Primary

### ✅ Backup Automatique
- Le Secondary maintient une copie synchronisée en temps réel

### ✅ Professionnalisme
- Architecture **production-ready**
- Démontre la maîtrise de MongoDB en cluster

---

## 🧪 Test de Failover (Optionnel)

Pour tester la résilience, arrêter le Primary :

```powershell
docker stop velib_mongodb_primary
```

Vérifier que le Secondary devient Primary :

```powershell
docker exec velib_mongodb_secondary mongosh --eval "rs.status()" --username admin --password admin123 --authenticationDatabase admin
```

Redémarrer le Primary :

```powershell
docker start velib_mongodb_primary
```

---

## 📊 Nouvelle Architecture Complète

```
┌─────────────────── CLUSTER VELIB (7 NODES) ────────────────────┐
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │ MongoDB (RS) │     │  HDFS Cluster│     │ Spark Cluster│   │
│  │   (2 nodes)  │     │   (2 nodes)  │     │   (2 nodes)  │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│                                                                  │
│  🗄️  mongo (PRIMARY)  📂 namenode         ⚡ spark_master     │
│  Port: 27017          Ports: 9000, 9870    Ports: 7077, 8081   │
│                                                                  │
│  🗄️  mongo-replica-2  📁 datanode         🔧 spark_worker     │
│     (SECONDARY)       Port: 9864           Cores: 2, RAM: 2GB  │
│  Port: 27018                                                    │
│                                                                  │
│  ┌──────────────┐                                              │
│  │   Backend    │                                              │
│  │   (1 node)   │                                              │
│  └──────────────┘                                              │
│                                                                  │
│  🌐 backend                                                     │
│  Port: 3001                                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────┘

TOTAL: 7 NŒUDS (2 MongoDB + 2 HDFS + 2 Spark + 1 Backend)
```

---

## 🚨 Dépannage

### Le Replica Set ne s'initialise pas

```powershell
# Vérifier les logs du Primary
docker logs velib_mongodb_primary

# Vérifier les logs du Secondary
docker logs velib_mongodb_secondary
```

### Erreur "not master and slaveOk=false"

Réinitialiser le Replica Set :

```powershell
docker exec velib_mongodb_primary mongosh --eval "rs.reconfig(rs.conf(), {force: true})" --username admin --password admin123 --authenticationDatabase admin
```

### Les données ne se synchronisent pas

Vérifier le lag de réplication :

```powershell
docker exec velib_mongodb_primary mongosh --eval "rs.printSlaveReplicationInfo()" --username admin --password admin123 --authenticationDatabase admin
```

---

## 📚 Ressources

- [MongoDB Replica Set Documentation](https://docs.mongodb.com/manual/replication/)
- [MongoDB Connection String](https://docs.mongodb.com/manual/reference/connection-string/)

---

**🎉 Félicitations ! Vous avez maintenant 7 nœuds dans votre cluster Big Data !**
