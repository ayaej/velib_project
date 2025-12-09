# 🏗️ Architecture du Projet Vélib Temps Réel

## Vue d'ensemble

Ce projet implémente un pipeline Big Data temps réel ET batch pour le suivi des stations Vélib à Paris.

```
┌─────────────────┐
│   API Vélib     │  (Source de données en temps réel)
│   Open Data     │
└────────┬────────┘
         │
         ▼
    ┌────────────────────────────────────┐
    │           DOCKER                   │
    │                                    │
    │  ┌──────────────────────────┐    │
    │  │        HDFS              │    │
    │  │  (Données brutes)        │◄───┼─── Données brutes
    │  └────┬──────────────┬──────┘    │
    │       │              │            │
    │       ▼              ▼            │
    │  ┌─────────┐   ┌──────────┐     │
    │  │ Batch   │   │ Streaming │     │
    │  │ Spark   │   │  Spark    │     │
    │  └────┬────┘   └─────┬─────┘     │
    │       │              │            │
    │       ▼              ▼            │
    │  ┌──────────────────────────┐    │
    │  │       MongoDB            │    │
    │  └────────────┬─────────────┘    │
    └───────────────┼──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   Backend API    │
         │  (Node.js)       │
         └─────────┬────────┘
                   │
                   ▼
         ┌──────────────────┐
         │    Frontend      │
         │   (React)        │
         └──────────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │    Power BI      │  (Optionnel)
         └──────────────────┘
```

---

## 📦 Composants du Système

### 1. **Source de Données : API Vélib**
- **URL** : `https://opendata.paris.fr/api/records/1.0/search/?dataset=velib-disponibilite-en-temps-reel`
- **Format** : JSON
- **Fréquence** : Données mises à jour en temps réel
- **Contenu** : Disponibilité des vélos et places pour chaque station

### 2. **HDFS (Hadoop Distributed File System)**
- **Rôle** : Stockage des données brutes
- **Composants** :
  - **NameNode** (port 9870) - Gestion des métadonnées
  - **DataNode** (port 9864) - Stockage physique
- **Structure** :
  - `/velib/raw/` - Données brutes de l'API
  - `/velib/processed/` - Données transformées par Batch

### 3. **Streaming : Apache Spark Structured Streaming**
- **Rôle** : Ingestion et transformation en temps réel
- **Technologie** : PySpark
- **Fonctionnalités** :
  - Récupération de l'API Vélib toutes les 30 secondes
  - Transformation et nettoyage des données JSON
  - Écriture dans MongoDB via `foreachBatch`
  - Optionnel : Sauvegarde dans HDFS pour archivage

### 4. **Batch : Apache Spark Batch Processing**
- **Rôle** : Traitement et agrégation des données historiques
- **Fonctionnalités** :
  - Lecture des données brutes depuis HDFS
  - Agrégations quotidiennes (moyennes, min, max)
  - Analyse des patterns horaires
  - Détection d'anomalies
  - Statistiques globales
- **Sorties** :
  - HDFS (format Parquet) - Données transformées
  - MongoDB - Résultats agrégés pour le reporting

### 5. **Stockage : MongoDB**
- **Type** : Base de données NoSQL orientée documents
- **Collections** :
  - `stations` - Données temps réel (streaming)
  - `stations_aggregated` - Données agrégées (batch)
  - `daily_stats` - Statistiques quotidiennes (batch)
- **Index** :
  - `stationCode` (unique)
  - `timestamp` (pour les requêtes temporelles)
  - `name` (recherche full-text)

### 6. **Backend : Node.js + Express**
- **Rôle** : API REST pour exposer les données
- **Endpoints** :
  - `GET /api/stations` - Liste toutes les stations (avec pagination)
  - `GET /api/stations/top` - Stations avec le plus de vélos
  - `GET /api/stations/critical` - Stations critiques
  - `GET /api/stations/:id` - Détails d'une station
  - `GET /api/stats` - Statistiques globales
- **Port** : 3000

### 7. **Frontend : React + Vite**
- **Rôle** : Interface utilisateur temps réel
- **Composants** :
  - `RealtimeDashboard` - Statistiques globales
  - `StationTable` - Tableau avec filtres et tri
- **Bibliothèques** :
  - React Leaflet (cartes) - TODO
  - Recharts (graphiques) - TODO
  - Axios (requêtes HTTP)
- **Port** : 5173

### 8. **Power BI** (Optionnel)
- **Rôle** : Visualisation avancée et reporting
- **Source** : MongoDB (connexion directe)
- **Dashboards** : Analyse des tendances historiques

---

## 🐳 Infrastructure Docker

### Services Docker Compose

```yaml
- mongo:27017          # MongoDB
- namenode:9870        # HDFS NameNode UI
- namenode:9000        # HDFS NameNode API
- datanode:9864        # HDFS DataNode
- spark-master:8080    # Spark Master UI
- spark-master:7077    # Spark Master
- spark-worker         # Spark Worker
- backend:3000         # API Node.js
```

### Réseau
Tous les services partagent le réseau `velib_network` pour communiquer entre eux.

### Volumes
- `mongo_data` - Persistance MongoDB
- `spark_data` - Données temporaires Spark
- `namenode_data` - Métadonnées HDFS
- `datanode_data` - Données HDFS

---

## 🔄 Flux de Données

### Pipeline Temps Réel (Streaming)

1. **Ingestion** (toutes les 30s)
   ```
   API Vélib → Spark Streaming → Transformation
   ```

2. **Stockage**
   ```
   Spark → MongoDB (upsert) + HDFS (optionnel)
   ```

3. **Exposition**
   ```
   MongoDB → Backend API → Frontend React
   ```

### Pipeline Batch (Traitement quotidien)

1. **Lecture**
   ```
   HDFS (données brutes) → Spark Batch
   ```

2. **Transformation**
   ```
   Spark Batch → Agrégations + Nettoyage + Analyse
   ```

3. **Écriture**
   ```
   Spark → HDFS (Parquet) + MongoDB (résultats)
   ```

4. **Visualisation**
   ```
   MongoDB → Power BI / Frontend
   ```

---

## 📊 Schéma de Données

### Collection MongoDB : `stations` (Temps Réel)

```json
{
  "_id": ObjectId("..."),
  "stationCode": "16107",
  "name": "Benjamin Godard - Victor Hugo",
  "capacity": 35,
  "numBikesAvailable": 12,
  "numDocksAvailable": 23,
  "isInstalled": true,
  "isReturning": true,
  "isRenting": true,
  "coordinates": [2.275725, 48.865983],
  "timestamp": "2024-01-15T14:30:00.000Z",
  "lastUpdate": "2024-01-15T14:29:45.000Z"
}
```

### Collection MongoDB : `stations_aggregated` (Batch)

```json
{
  "stationCode": "16107",
  "name": "Benjamin Godard - Victor Hugo",
  "date": "2024-01-15",
  "avgBikesAvailable": 15.3,
  "minBikesAvailable": 2,
  "maxBikesAvailable": 28,
  "avgDocksAvailable": 19.7,
  "recordCount": 2880
}
```

---

## 🚀 Évolutions Futures

### Phase 1 (Actuelle)
- [x] Pipeline streaming fonctionnel
- [x] Pipeline batch fonctionnel
- [x] HDFS intégré
- [x] Backend API REST
- [x] Frontend avec statistiques
- [ ] Tests et validation

### Phase 2 (Prochaine)
- [ ] Carte interactive avec React Leaflet
- [ ] Graphiques temps réel avec Recharts
- [ ] WebSocket pour push temps réel
- [ ] Dashboards Power BI
- [ ] Notifications pour stations critiques

### Phase 3 (Future)
- [ ] Machine Learning (prédiction de disponibilité)
- [ ] Historisation avancée (Time Series)
- [ ] Analytics avancés (patterns d'utilisation)
- [ ] API GraphQL
- [ ] Optimisation avec Apache Kafka

---

## 🔧 Technologies Utilisées

| Couche | Technologie | Version |
|--------|-------------|---------|
| Stockage distribué | HDFS (Hadoop) | 3.2.1 |
| Streaming | Apache Spark | 3.5.0 |
| Batch | Apache Spark | 3.5.0 |
| Base de données | MongoDB | Latest |
| Backend | Node.js + Express | 18.x |
| Frontend | React + Vite | 18.x |
| Conteneurisation | Docker Compose | 3.8 |
| Langages | Python, JavaScript | 3.x, ES6+ |

---

## 📈 Métriques et Monitoring

### KPIs à suivre
- Latence d'ingestion (API → MongoDB)
- Débit de traitement (records/seconde)
- Utilisation HDFS (espace disque)
- Performance Spark (jobs batch)
- Disponibilité du système
- Temps de réponse API REST

### TODO : Ajouter
- Prometheus pour les métriques
- Grafana pour les dashboards
- Alerting sur incidents

---

## 🔐 Sécurité

### Actuel
- Authentification MongoDB (admin/password)
- CORS configuré sur le backend
- Helmet.js pour sécurité HTTP

### TODO
- Authentification JWT pour l'API
- Kerberos pour HDFS
- Rate limiting
- HTTPS/SSL
- Variables d'environnement sécurisées

---

## 🎯 Différences Streaming vs Batch

| Critère | Streaming | Batch |
|---------|-----------|-------|
| **Fréquence** | Temps réel (30s) | Quotidien/Horaire |
| **Latence** | Faible (<1 min) | Haute (heures) |
| **Source** | API Vélib | HDFS |
| **Cible** | MongoDB + HDFS | MongoDB + HDFS |
| **Use Case** | Monitoring temps réel | Analyse historique |
| **Complexité** | Simple (upsert) | Complexe (agrégations) |

---

**Auteur** : Équipe Big Data  
**Dernière mise à jour** : 2024
