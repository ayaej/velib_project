# 📊 Batch Processing - Spark Batch

Ce module gère le traitement batch des données brutes Vélib stockées dans HDFS.

## 🎯 Objectif

Le pipeline batch lit les données brutes depuis HDFS, effectue des transformations et agrégations complexes, puis écrit les résultats dans MongoDB pour l'analyse et le reporting.

## 📂 Architecture

```
Données brutes (HDFS) 
    → Spark Batch Processing 
    → Agrégations & Transformations 
    → HDFS (données transformées) + MongoDB (résultats)
```

## 🔧 Fonctionnalités

- **Agrégations quotidiennes** : Calcul des moyennes, min, max par station et par jour
- **Patterns horaires** : Analyse des tendances d'utilisation par heure
- **Détection d'anomalies** : Identification des stations avec comportements suspects
- **Statistiques globales** : Métriques système (total stations, vélos, places, etc.)

## 🚀 Utilisation

### Exécution locale

```bash
cd batch
python batch-velib.py
```

### Exécution avec Spark Submit

```bash
spark-submit --master spark://spark:7077 batch-velib.py
```

### Traiter une date spécifique

```bash
python batch-velib.py 2024-01-15
```

## 📊 Sorties

### HDFS
- `/velib/processed/daily_stats/` - Statistiques quotidiennes (Parquet)
- `/velib/processed/hourly_patterns/` - Patterns horaires (Parquet)
- `/velib/processed/anomalies/` - Détection d'anomalies (Parquet)

### MongoDB
- Collection `stations_aggregated` - Données agrégées
- Collection `daily_stats` - Statistiques quotidiennes

## 📝 TODO

- [ ] Ajouter la prédiction de disponibilité (ML)
- [ ] Implémenter le partitionnement par date
- [ ] Optimiser les performances avec cache
- [ ] Ajouter des tests unitaires
