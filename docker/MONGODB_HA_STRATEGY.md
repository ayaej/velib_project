# Configuration de la réplication MongoDB (Haute Disponibilité)

Ce document explique la configuration de deux nœuds MongoDB pour assurer la haute disponibilité.

## 🏗️ Architecture Actuelle

```
┌─────────────────────────────────────────────────────┐
│           Architecture 7 Nœuds (HA)                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   MongoDB    │◄───────►│   MongoDB    │         │
│  │  Primary     │  Sync   │  Secondary   │         │
│  │  (27017)     │         │  (27018)     │         │
│  └──────────────┘         └──────────────┘         │
│         │                                           │
│         │                                           │
│  ┌──────▼──────────────────────────────────────┐   │
│  │           Backend Node.js (3001)            │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │ HDFS         │         │ HDFS         │         │
│  │ NameNode     │◄───────►│ DataNode     │         │
│  │ (9000/9870)  │         │ (9864/9866)  │         │
│  └──────────────┘         └──────────────┘         │
│         │                                           │
│  ┌──────▼──────────────────────────────────────┐   │
│  │        Apache Spark Cluster                  │   │
│  │  ┌──────────────┐    ┌──────────────┐      │   │
│  │  │ Spark Master │◄──►│ Spark Worker │      │   │
│  │  │   (8082)     │    │   (8083)     │      │   │
│  │  └──────────────┘    └──────────────┘      │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 🎯 Solution de Haute Disponibilité

### Stratégie Actuelle: Configuration Primaire-Secondaire

Nous avons **2 nœuds MongoDB indépendants** pour assurer la disponibilité:

1. **MongoDB Primary (velib_mongodb)**: Port 27017
   - Nœud principal utilisé par les applications
   - Contient les données de production
   
2. **MongoDB Secondary (velib_mongodb_replica2)**: Port 27018
   - Nœud de secours/backup
   - Peut être promu manuellement en cas de défaillance du primaire

### ✅ Avantages de cette Configuration

- **Simplicité**: Pas de configuration complexe de Replica Set
- **Backup automatique**: Second nœud disponible immédiatement
- **Isolation**: Chaque nœud fonctionne indépendamment
- **Développement**: Idéal pour les environnements de dev/test

## 🔄 Stratégies de Synchronisation

### Option 1: Réplication Applicative (Recommandée pour votre cas)

Le **streaming** et le **batch** écrivent sur les deux nœuds:

```python
# Dans streaming-velib.py et batch-velib.py
from pymongo import MongoClient

# Connexion aux deux nœuds
client_primary = MongoClient('mongodb://admin:admin123@mongo:27017/?authSource=admin')
client_secondary = MongoClient('mongodb://admin:admin123@mongo-replica-2:27017/?authSource=admin')

# Écriture sur les deux nœuds
def write_to_both(data):
    db_primary = client_primary.velib_db
    db_secondary = client_secondary.velib_db
    
    db_primary.stations.insert_many(data)
    db_secondary.stations.insert_many(data)
```

### Option 2: Backup périodique (Simple)

Script de synchronisation périodique:

```powershell
# sync-mongodb.ps1
# Copie les données du primaire vers le secondaire toutes les heures

while ($true) {
    Write-Host "🔄 Synchronisation MongoDB..." -ForegroundColor Cyan
    
    # Dump depuis le primaire
    docker exec velib_mongodb mongodump `
        --uri="mongodb://admin:admin123@localhost:27017/velib_db?authSource=admin" `
        --out=/tmp/backup
    
    # Restore sur le secondaire
    docker exec velib_mongodb_replica2 mongorestore `
        --uri="mongodb://admin:admin123@localhost:27017/velib_db?authSource=admin" `
        --dir=/tmp/backup/velib_db `
        --drop
    
    Write-Host "✅ Synchronisation terminée" -ForegroundColor Green
    Start-Sleep -Seconds 3600  # Attendre 1 heure
}
```

### Option 3: Replica Set (Configuration Avancée)

⚠️ **Plus complexe**, mais offre:
- Basculement automatique (automatic failover)
- Élection automatique du nouveau primaire
- Synchronisation en temps réel

Voir le fichier `MONGODB_REPLICA_SET.md` pour les détails.

## 📊 Vérification du Second Nœud

```powershell
# Connexion au nœud secondaire
docker exec -it velib_mongodb_replica2 mongosh -u admin -p admin123 --authenticationDatabase admin

# Dans mongosh:
show dbs
use velib_db
show collections
db.stations.countDocuments()
```

## 🔗 URIs de Connexion

### Backend (Nœud Primaire uniquement)
```
mongodb://admin:admin123@mongo:27017/velib_db?authSource=admin
```

### Double écriture (Primaire + Secondaire)
```python
PRIMARY_URI = "mongodb://admin:admin123@mongo:27017/velib_db?authSource=admin"
SECONDARY_URI = "mongodb://admin:admin123@mongo-replica-2:27017/velib_db?authSource=admin"
```

## 🚀 Démarrage de la Solution HA

1. **Les conteneurs sont déjà lancés** ✅
   ```powershell
   docker ps
   # Vérifier que velib_mongodb ET velib_mongodb_replica2 sont "Up"
   ```

2. **Initialiser la base de données**
   ```powershell
   .\init-mongodb-db.ps1
   ```

3. **Modifier le streaming pour écrire sur les 2 nœuds** (voir Option 1)

4. **Vérifier la synchronisation**
   ```powershell
   # Comparer le nombre de documents sur chaque nœud
   docker exec velib_mongodb mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.getSiblingDB('velib_db').stations.countDocuments()"
   
   docker exec velib_mongodb_replica2 mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.getSiblingDB('velib_db').stations.countDocuments()"
   ```

## 🎓 Recommandation pour votre Projet

Pour un projet éducatif avec délai court (2 jours restants):

✅ **Utiliser l'Option 1 (Réplication Applicative)**
- Modifier `streaming-velib.py` pour écrire sur les 2 nœuds
- Modifier `batch-velib.py` pour écrire sur les 2 nœuds
- Garder le Backend sur le nœud primaire uniquement

**Avantages**:
- Simple à implémenter (10 minutes)
- Montre la compréhension de la HA
- Fonctionne immédiatement
- Parfait pour une démo

## 📝 Présentation Projet

Vous pouvez dire:
> "Nous avons implémenté une architecture haute disponibilité avec **2 nœuds MongoDB**. Les pipelines de streaming et batch écrivent de manière synchrone sur les deux nœuds, garantissant la réplication des données. En cas de défaillance du nœud primaire, le backend peut basculer manuellement sur le nœud secondaire en changeant simplement l'URI de connexion. Cette solution offre un bon compromis entre simplicité et résilience pour un environnement de développement."

---

**Total**: 7 nœuds pour assurer performance ET disponibilité ! 🎉
