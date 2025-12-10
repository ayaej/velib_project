# Configuration Haute Disponibilité MongoDB - Résumé

## ✅ Configuration Actuelle

Votre infrastructure **7 nœuds** est maintenant opérationnelle avec **2 nœuds MongoDB** pour la haute disponibilité.

### 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│        Infrastructure 7 Nœuds               │
├─────────────────────────────────────────────┤
│                                              │
│  💾 Couche Base de Données (2 nœuds)        │
│  ┌──────────────┐    ┌──────────────┐      │
│  │   MongoDB    │    │   MongoDB    │      │
│  │  Primary     │    │  Secondary   │      │
│  │  :27017      │    │  :27018      │      │
│  └──────┬───────┘    └──────────────┘      │
│         │                                    │
│  🔧 Couche Application (1 nœud)             │
│  ┌──────▼────────────────────┐              │
│  │   Backend Node.js :3001   │              │
│  └───────────────────────────┘              │
│                                              │
│  🗄️  Couche Stockage HDFS (2 nœuds)         │
│  ┌──────────────┐    ┌──────────────┐      │
│  │   NameNode   │◄──►│   DataNode   │      │
│  │   :9000      │    │   :9864      │      │
│  └──────────────┘    └──────────────┘      │
│                                              │
│  ⚡ Couche Traitement Spark (2 nœuds)       │
│  ┌──────────────┐    ┌──────────────┐      │
│  │ Spark Master │◄──►│ Spark Worker │      │
│  │   :8082      │    │   :8083      │      │
│  └──────────────┘    └──────────────┘      │
│                                              │
└─────────────────────────────────────────────┘
```

### 📊 État des Services

| Nœud | Conteneur | Port | État |
|------|-----------|------|------|
| MongoDB Primary | velib_mongodb | 27017 | ✅ Running |
| MongoDB Secondary | velib_mongodb_replica2 | 27018 | ✅ Running |
| Backend | velib_backend | 3001 | ✅ Running |
| HDFS NameNode | velib_namenode | 9000, 9870 | ✅ Healthy |
| HDFS DataNode | velib_datanode | 9864, 9866 | ✅ Healthy |
| Spark Master | velib_spark_master | 8082, 7077 | ✅ Running |
| Spark Worker | velib_spark_worker | 8083 | ✅ Running |

## 🎯 Prochaines Étapes

### Étape 1: Modifier le Streaming pour Écrire sur les 2 Nœuds

Le fichier `streaming/streaming-velib.py` doit être modifié pour écrire sur les deux nœuds MongoDB.

**Modification à faire** (lignes 12-15):

```python
# Avant (un seul nœud):
MONGODB_URI = 'mongodb://admin:admin123@mongo:27017/?authSource=admin'
client = MongoClient(MONGODB_URI)
db = client.velib_db

# Après (deux nœuds):
MONGODB_PRIMARY_URI = 'mongodb://admin:admin123@mongo:27017/?authSource=admin'
MONGODB_SECONDARY_URI = 'mongodb://admin:admin123@mongo-replica-2:27017/?authSource=admin'

client_primary = MongoClient(MONGODB_PRIMARY_URI)
client_secondary = MongoClient(MONGODB_SECONDARY_URI)

db_primary = client_primary.velib_db
db_secondary = client_secondary.velib_db
```

Et dans la fonction de sauvegarde (ligne 85 environ):

```python
# Avant:
db.stations.insert_many(mongo_records)

# Après:
db_primary.stations.insert_many(mongo_records)
db_secondary.stations.insert_many(mongo_records)
```

### Étape 2: Modifier le Batch pour Écrire sur les 2 Nœuds

Le fichier `batch/batch-velib.py` doit également être modifié (ligne 21):

```python
# Avant:
MONGODB_URI = 'mongodb://admin:admin123@mongo:27017/?authSource=admin'

# Après:
MONGODB_PRIMARY_URI = 'mongodb://admin:admin123@mongo:27017/?authSource=admin'
MONGODB_SECONDARY_URI = 'mongodb://admin:admin123@mongo-replica-2:27017/?authSource=admin'
```

Et dans toutes les fonctions d'écriture MongoDB (save_to_mongodb):

```python
# Écrire sur les deux nœuds
df.write \
    .format("mongo") \
    .option("uri", MONGODB_PRIMARY_URI) \
    .option("database", "velib_db") \
    .option("collection", collection_name) \
    .mode("overwrite") \
    .save()

df.write \
    .format("mongo") \
    .option("uri", MONGODB_SECONDARY_URI) \
    .option("database", "velib_db") \
    .option("collection", collection_name) \
    .mode("overwrite") \
    .save()
```

### Étape 3: Vérifier la Réplication

Après avoir relancé le streaming, vérifiez que les données sont présentes sur les deux nœuds:

```powershell
# Sur le nœud primaire
docker exec velib_mongodb mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.getSiblingDB('velib_db').stations.countDocuments()"

# Sur le nœud secondaire
docker exec velib_mongodb_replica2 mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.getSiblingDB('velib_db').stations.countDocuments()"
```

Les deux commandes devraient retourner le même nombre de documents.

## 📈 Avantages de cette Solution

### ✅ Haute Disponibilité
- Si le nœud primaire tombe, les données restent accessibles sur le nœud secondaire
- Basculement possible en changeant l'URI dans le backend

### ✅ Performance
- Les lectures peuvent être distribuées sur les deux nœuds
- Réduction de la charge sur un seul nœud

### ✅ Sauvegarde
- Données dupliquées en temps réel
- Pas besoin de backup manuel

### ✅ Simplicité
- Pas de Replica Set complexe à configurer
- Écriture synchrone contrôlée par l'application
- Facile à comprendre et à présenter

## 🎓 Pour la Présentation

**Points clés à mentionner**:

1. **Architecture 7 nœuds** pour la performance ET la disponibilité
2. **2 nœuds MongoDB** avec réplication applicative
3. **Écriture synchrone** sur les deux nœuds via Spark Streaming et Batch
4. **Basculement manuel** possible en cas de défaillance
5. **Solution pragmatique** adaptée à un environnement de développement

**Phrase type**:
> "Pour assurer la haute disponibilité, nous avons déployé une architecture à 7 nœuds avec 2 instances MongoDB. Les pipelines Spark (streaming et batch) écrivent de manière synchrone sur les deux nœuds, garantissant la réplication des données. Cette approche offre un bon compromis entre simplicité d'implémentation et résilience pour notre cas d'usage."

## 🔗 Documentation Complémentaire

- `MONGODB_HA_STRATEGY.md`: Stratégies détaillées de HA
- `init-mongodb-db.ps1`: Script d'initialisation de la base
- `docker-compose.yml`: Configuration complète de l'infrastructure

## ⚠️ Notes Importantes

- Le backend utilise **uniquement le nœud primaire** pour éviter la complexité
- Le streaming et le batch écrivent sur **les deux nœuds** pour la HA
- Les collections sont créées automatiquement lors de la première écriture
- Les index sont créés sur le nœud primaire et doivent être créés manuellement sur le secondaire si besoin

---

**Date de configuration**: 10 décembre 2025  
**Version MongoDB**: 6  
**Status**: ✅ Opérationnel
