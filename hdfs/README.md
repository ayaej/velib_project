# 🗂️ HDFS - Hadoop Distributed File System

Configuration et gestion de HDFS pour le projet Vélib.

## 📦 Architecture HDFS

```
HDFS Cluster
├── NameNode (port 9870, 9000)
│   └── Gestion des métadonnées
└── DataNode (port 9864)
    └── Stockage physique des données
```

## 📁 Structure des Dossiers HDFS

```
/velib/
├── raw/                          # Données brutes de l'API
│   └── YYYY-MM-DD/              # Organisé par date
│       └── batch_*.json
├── processed/                    # Données traitées par Batch
│   ├── daily_stats/             # Stats quotidiennes (Parquet)
│   ├── hourly_patterns/         # Patterns horaires (Parquet)
│   └── anomalies/               # Détections d'anomalies (Parquet)
```

## 🚀 Démarrage

### 1. Démarrer les services HDFS

```bash
cd docker
docker-compose up namenode datanode -d
```

### 2. Vérifier le statut

```bash
# Vérifier les conteneurs
docker ps | grep velib

# Accéder à l'interface web NameNode
# http://localhost:9870
```

### 3. Initialiser la structure HDFS

```bash
# Sous Linux/Mac
cd docker
chmod +x hdfs-utils.sh
./hdfs-utils.sh init

# Sous Windows (Git Bash ou WSL)
bash hdfs-utils.sh init
```

## 🛠️ Commandes Utiles

### Avec le script hdfs-utils.sh

```bash
# Lister tous les fichiers
./hdfs-utils.sh list

# Voir le statut du cluster
./hdfs-utils.sh status

# Voir l'utilisation disque
./hdfs-utils.sh usage

# Upload un fichier
./hdfs-utils.sh upload data.json /velib/raw/

# Download un fichier
./hdfs-utils.sh download /velib/raw/data.json ./

# Supprimer un fichier
./hdfs-utils.sh delete /velib/raw/old_data.json

# Nettoyer toutes les données
./hdfs-utils.sh clean
```

### Commandes HDFS Directes

```bash
# Exécuter des commandes HDFS dans le conteneur
docker exec velib_namenode hdfs dfs -ls /velib

# Créer un dossier
docker exec velib_namenode hdfs dfs -mkdir -p /velib/test

# Upload
docker exec velib_namenode hdfs dfs -put /local/file.txt /velib/

# Download
docker exec velib_namenode hdfs dfs -get /velib/file.txt /local/

# Lire un fichier
docker exec velib_namenode hdfs dfs -cat /velib/file.txt

# Supprimer
docker exec velib_namenode hdfs dfs -rm -r /velib/test

# Voir l'espace disque
docker exec velib_namenode hdfs dfs -df -h

# Vérifier la santé du cluster
docker exec velib_namenode hdfs dfsadmin -report
```

## 🔧 Configuration

Les configurations HDFS sont dans `hadoop.env` :

- **Replication Factor** : 1 (pour dev, 3 pour prod)
- **Block Size** : 128 MB
- **NameNode Port** : 9000 (API), 9870 (Web UI)
- **DataNode Port** : 9864

## 📊 Monitoring

### Interface Web NameNode

- **URL** : http://localhost:9870
- **Fonctionnalités** :
  - Vue d'ensemble du cluster
  - Browse du système de fichiers
  - Logs et métriques
  - Informations sur les DataNodes

### Commandes de Monitoring

```bash
# Rapport complet du cluster
docker exec velib_namenode hdfs dfsadmin -report

# Santé du NameNode
docker exec velib_namenode hdfs dfsadmin -safemode get

# Lister les fichiers corrompus
docker exec velib_namenode hdfs fsck / -files -blocks
```

## 🔄 Intégration avec Spark

### Streaming → HDFS

Le pipeline Streaming peut sauvegarder les données brutes dans HDFS :

```python
# Dans streaming-velib.py
df.write \
    .mode("append") \
    .format("json") \
    .save(f"hdfs://namenode:9000/velib/raw/{current_date}/")
```

### Batch ← HDFS

Le pipeline Batch lit depuis HDFS :

```python
# Dans batch-velib.py
df = spark.read.json("hdfs://namenode:9000/velib/raw/*/")
```

## 🐛 Dépannage

### NameNode ne démarre pas

```bash
# Vérifier les logs
docker logs velib_namenode

# Réinitialiser le NameNode (ATTENTION: perd les données)
docker-compose down -v
docker-compose up namenode -d
```

### Espace disque plein

```bash
# Vérifier l'utilisation
./hdfs-utils.sh usage

# Nettoyer les vieux fichiers
docker exec velib_namenode hdfs dfs -rm -r /velib/raw/2023-*
```

### Problème de permissions

```bash
# Changer les permissions
docker exec velib_namenode hdfs dfs -chmod -R 777 /velib
```

### DataNode ne se connecte pas au NameNode

```bash
# Redémarrer le DataNode
docker-compose restart datanode

# Vérifier les logs
docker logs velib_datanode
```

## 📝 Bonnes Pratiques

1. **Organisation par date** : Stocker les données raw par date (YYYY-MM-DD)
2. **Format Parquet** : Utiliser Parquet pour les données processed (plus efficace)
3. **Compression** : Activer la compression (Snappy, Gzip)
4. **Rétention** : Nettoyer les anciennes données régulièrement
5. **Backup** : Sauvegarder les données critiques hors HDFS

## 🔐 Sécurité

### Configuration Actuelle (Dev)

- Permissions désactivées (`dfs.permissions.enabled=false`)
- Pas d'authentification Kerberos

### Pour Production

```bash
# Activer les permissions
HDFS_CONF_dfs_permissions_enabled=true

# Configurer Kerberos
# TODO: Ajouter la configuration Kerberos
```

## 📈 Performance

### Optimisations

1. **Augmenter les ressources DataNode**
   ```yaml
   # Dans docker-compose.yml
   datanode:
     deploy:
       resources:
         limits:
           memory: 4G
   ```

2. **Ajuster le block size** selon la taille des fichiers
3. **Augmenter le replication factor** en production (3)

## 🆘 Aide

Pour plus d'informations :

```bash
./hdfs-utils.sh help
```

---

**Note** : Cette configuration est optimisée pour le développement. Pour la production, il faudra ajuster les paramètres de sécurité et de performance.
