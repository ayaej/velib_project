# -*- coding: utf-8 -*-
"""
Pipeline Spark Batch pour le traitement des données brutes Vélib
Lit les données depuis HDFS, effectue des transformations et agrégations,
puis écrit les résultats dans MongoDB
"""

from __future__ import print_function, unicode_literals
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
from pymongo import MongoClient
from datetime import datetime
import sys
import traceback

# Configuration
HDFS_INPUT_PATH = "hdfs://namenode:8020/velib/raw/"
HDFS_OUTPUT_PATH = "hdfs://namenode:8020/velib/processed/"
MONGODB_URI = "mongodb://admin:admin123@mongo:27017/"
MONGODB_DB = "velib_db"
MONGODB_COLLECTION_AGGREGATED = "stations_aggregated"
MONGODB_COLLECTION_STATS = "daily_stats"
MONGODB_COLLECTION_INCIDENTS = "station_incidents"
MONGODB_COLLECTION_EMPTY_FULL = "stations_empty_full_tracking"


def initialize_spark():
    """
    Initialiser la session Spark pour le traitement Batch
    """
    spark = SparkSession.builder \
        .appName("VelibBatchProcessing") \
        .config("spark.mongodb.output.uri", MONGODB_URI + MONGODB_DB) \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.2.0") \
        .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:8020") \
        .getOrCreate()
    
    spark.sparkContext.setLogLevel("WARN")
    print("✅ Spark Batch session initialized")
    return spark


def read_raw_data_from_hdfs(spark, date=None):
    """
    Lire les données brutes depuis HDFS
    TODO: Adapter le format selon les données stockées (JSON, Parquet, CSV)
    """
    try:
        if date:
            path = HDFS_INPUT_PATH + date + "/*.json"
        else:
            path = HDFS_INPUT_PATH + "*/*.json"
        
        print("📂 Reading data from HDFS: " + path)
        
        # Lire les données JSON depuis HDFS
        df = spark.read.json(path)
        
        count = df.count()
        print("✅ Loaded " + str(count) + " records from HDFS")
        return df
    
    except Exception as e:
        print("❌ Error reading from HDFS: " + str(e))
        return None


def compute_daily_aggregations(df):
    """
    Calculer des agrégations quotidiennes
    TODO: Ajouter d'autres métriques pertinentes
    """
    print("📊 Computing daily aggregations...")
    
    # Ajouter une colonne date
    df = df.withColumn("date", to_date(col("timestamp")))
    
    # Agrégations par station et par jour
    daily_stats = df.groupBy("stationCode", "name", "date") \
        .agg(
            avg("numBikesAvailable").alias("avgBikesAvailable"),
            min("numBikesAvailable").alias("minBikesAvailable"),
            max("numBikesAvailable").alias("maxBikesAvailable"),
            avg("numDocksAvailable").alias("avgDocksAvailable"),
            count("*").alias("recordCount"),
            first("capacity").alias("capacity"),
            first("coordinates").alias("coordinates")
        )
    
    return daily_stats


def compute_hourly_patterns(df):
    """
    Analyser les patterns d'utilisation par heure
    TODO: Identifier les heures de pointe
    """
    print("⏰ Computing hourly patterns...")
    
    df = df.withColumn("hour", hour(col("timestamp")))
    
    hourly_stats = df.groupBy("stationCode", "name", "hour") \
        .agg(
            avg("numBikesAvailable").alias("avgBikes"),
            avg("numDocksAvailable").alias("avgDocks"),
            count("*").alias("observations")
        ) \
        .orderBy("stationCode", "hour")
    
    return hourly_stats


def detect_anomalies(df):
    """
    Détecter les anomalies dans les données
    TODO: Implémenter la détection d'anomalies (stations toujours vides/pleines)
    """
    print("🔍 Detecting anomalies...")
    
    # Stations avec très peu de changements
    window = Window.partitionBy("stationCode").orderBy("timestamp")
    
    df_with_lag = df.withColumn(
        "bikes_change", 
        abs(col("numBikesAvailable") - lag("numBikesAvailable", 1).over(window))
    )
    
    # Stations suspectes (pas de changement pendant longtemps)
    anomalies = df_with_lag.groupBy("stationCode", "name") \
        .agg(
            avg("bikes_change").alias("avgChange"),
            stddev("numBikesAvailable").alias("stdDevBikes")
        ) \
        .filter(col("avgChange") < 0.5)  # Peu de changements
    
    return anomalies


def detect_station_incidents(df):
    """
    Détecter les incidents en station :
    - Stations hors service (isInstalled = False)
    - Stations avec capacité anormale
    - Changements brutaux de disponibilité
    """
    print("🚨 Detecting station incidents...")
    
    # 1. Stations hors service
    df_with_date = df.withColumn("date", to_date(col("timestamp")))
    
    offline_stations = df_with_date.filter(col("isInstalled") == False) \
        .groupBy("stationCode", "name", "date") \
        .agg(
            count("*").alias("offlineCount"),
            min("timestamp").alias("firstOfflineTime"),
            max("timestamp").alias("lastOfflineTime")
        ) \
        .withColumn("incidentType", lit("OFFLINE"))
    
    # 2. Stations avec capacité anormale (capacité = 0 ou > 100)
    capacity_issues = df_with_date.filter(
        (col("capacity") == 0) | (col("capacity") > 100)
    ).groupBy("stationCode", "name", "date") \
        .agg(
            count("*").alias("anomalyCount"),
            first("capacity").alias("suspectCapacity")
        ) \
        .withColumn("incidentType", lit("CAPACITY_ANOMALY"))
    
    # 3. Changements brutaux (station passe de 0 à pleine ou l'inverse)
    window = Window.partitionBy("stationCode").orderBy("timestamp")
    
    df_with_changes = df_with_date.withColumn(
        "prevBikes", 
        lag("numBikesAvailable", 1).over(window)
    ).withColumn(
        "bikesDelta",
        abs(col("numBikesAvailable") - col("prevBikes"))
    )
    
    brutal_changes = df_with_changes.filter(
        (col("bikesDelta") > 20) & (col("prevBikes").isNotNull())
    ).groupBy("stationCode", "name", "date") \
        .agg(
            count("*").alias("brutalChangeCount"),
            max("bikesDelta").alias("maxChange"),
            avg("bikesDelta").alias("avgChange")
        ) \
        .withColumn("incidentType", lit("BRUTAL_CHANGE"))
    
    # Combiner tous les incidents
    all_incidents = offline_stations.select(
        "stationCode", "name", "date", "incidentType",
        col("offlineCount").alias("incidentCount")
    ).union(
        capacity_issues.select(
            "stationCode", "name", "date", "incidentType",
            col("anomalyCount").alias("incidentCount")
        )
    ).union(
        brutal_changes.select(
            "stationCode", "name", "date", "incidentType",
            col("brutalChangeCount").alias("incidentCount")
        )
    )
    
    print("✅ Incidents detected: " + str(all_incidents.count()) + " incidents")
    return all_incidents


def track_empty_full_stations(df):
    """
    Suivre les stations fréquemment vides ou pleines :
    - Stations avec 0 vélos disponibles pendant longtemps
    - Stations avec 0 places disponibles (pleines) pendant longtemps
    - Calcul du taux d'occupation (vide/pleine)
    """
    print("📊 Tracking empty and full stations...")
    
    df_with_date = df.withColumn("date", to_date(col("timestamp")))
    
    # Marquer les états vide/plein
    df_states = df_with_date.withColumn(
        "isEmpty",
        when(col("numBikesAvailable") == 0, 1).otherwise(0)
    ).withColumn(
        "isFull",
        when(col("numDocksAvailable") == 0, 1).otherwise(0)
    ).withColumn(
        "occupancyRate",
        (col("numBikesAvailable") / col("capacity") * 100)
    )
    
    # Agrégation par station et par jour
    empty_full_stats = df_states.groupBy("stationCode", "name", "date") \
        .agg(
            count("*").alias("totalObservations"),
            sum("isEmpty").alias("emptyCount"),
            sum("isFull").alias("fullCount"),
            avg("occupancyRate").alias("avgOccupancyRate"),
            min("occupancyRate").alias("minOccupancyRate"),
            max("occupancyRate").alias("maxOccupancyRate"),
            first("capacity").alias("capacity"),
            first("coordinates").alias("coordinates")
        ) \
        .withColumn(
            "emptyPercentage",
            (col("emptyCount") / col("totalObservations") * 100)
        ) \
        .withColumn(
            "fullPercentage",
            (col("fullCount") / col("totalObservations") * 100)
        )
    
    # Identifier les stations problématiques
    problematic_stations = empty_full_stats.filter(
        (col("emptyPercentage") > 50) | (col("fullPercentage") > 50)
    ).withColumn(
        "issueType",
        when(col("emptyPercentage") > 50, lit("FREQUENTLY_EMPTY"))
        .when(col("fullPercentage") > 50, lit("FREQUENTLY_FULL"))
        .otherwise(lit("BOTH"))
    ).orderBy(desc("emptyPercentage"))
    
    print("✅ Problematic stations found: " + str(problematic_stations.count()))
    
    # Afficher les 10 pires stations
    print("\n⚠️  Top 10 stations fréquemment vides:")
    problematic_stations.filter(col("issueType") == "FREQUENTLY_EMPTY") \
        .select("name", "emptyPercentage", "avgOccupancyRate") \
        .show(10, truncate=False)
    
    print("\n⚠️  Top 10 stations fréquemment pleines:")
    problematic_stations.filter(col("issueType") == "FREQUENTLY_FULL") \
        .select("name", "fullPercentage", "avgOccupancyRate") \
        .show(10, truncate=False)
    
    return empty_full_stats, problematic_stations


def compute_global_statistics(df):
    """
    Calculer des statistiques globales
    """
    print("📈 Computing global statistics...")
    
    stats = df.groupBy() \
        .agg(
            countDistinct("stationCode").alias("totalStations"),
            sum("numBikesAvailable").alias("totalBikes"),
            sum("numDocksAvailable").alias("totalDocks"),
            avg("numBikesAvailable").alias("avgBikesPerStation"),
            avg("numDocksAvailable").alias("avgDocksPerStation")
        )
    
    return stats


def write_to_hdfs(df, output_path, format="parquet"):
    """
    Écrire les données transformées dans HDFS
    """
    try:
        print("💾 Writing to HDFS: " + output_path)
        
        df.write \
            .mode("overwrite") \
            .format(format) \
            .save(output_path)
        
        print("✅ Data written to HDFS successfully")
    
    except Exception as e:
        print("❌ Error writing to HDFS: " + str(e))


def write_to_mongodb(df, collection_name):
    """
    Écrire les résultats dans MongoDB avec gestion correcte de l'encodage
    """
    try:
        print("💾 Writing to MongoDB collection: " + collection_name)
        
        # Convertir en documents et insérer dans MongoDB
        records = df.collect()
        
        if not records:
            print("⚠️ No data to write")
            return
        
        client = MongoClient(MONGODB_URI)
        db = client[MONGODB_DB]
        collection = db[collection_name]
        
        # Convertir les Row Spark en dictionnaires Python avec types compatibles MongoDB
        documents = []
        for row in records:
            doc = {}
            for field in row.asDict():
                value = row[field]
                
                # Gérer les types spéciaux
                if value is None:
                    doc[field] = None
                elif isinstance(value, bool):
                    doc[field] = value
                elif isinstance(value, int):
                    doc[field] = value
                elif isinstance(value, float):
                    # Convertir NaN en None
                    doc[field] = None if (value != value) else value  # NaN check
                elif isinstance(value, datetime):
                    doc[field] = value.isoformat()
                elif isinstance(value, list):
                    # Convertir les listes (comme coordinates)
                    doc[field] = [float(x) if isinstance(x, (int, float)) else x for x in value]
                else:
                    # Autres types : gérer l'encodage Unicode correctement
                    try:
                        # Si c'est déjà une string unicode, la garder telle quelle
                        if sys.version_info[0] >= 3:
                            doc[field] = str(value)
                        else:
                            # Python 2 : encoder en UTF-8
                            if isinstance(value, unicode):
                                doc[field] = value
                            else:
                                doc[field] = unicode(str(value), 'utf-8', errors='ignore')
                    except:
                        # En cas d'erreur, convertir en représentation sûre
                        doc[field] = repr(value)
            
            documents.append(doc)
        
        # Supprimer les anciennes données et insérer les nouvelles
        collection.delete_many({})
        
        if documents:
            collection.insert_many(documents)
            print("✅ " + str(len(documents)) + " documents written to MongoDB")
        else:
            print("⚠️ No valid documents to insert")
        
        client.close()
    
    except Exception as e:
        print("❌ Error writing to MongoDB: " + str(e))
        traceback.print_exc()


def run_batch_pipeline(spark, date=None):
    """
    Pipeline principal de traitement Batch
    TODO: Ajouter d'autres étapes de transformation
    """
    print("=" * 60)
    print("🚀 Starting Batch Processing Pipeline")
    print("=" * 60)
    
    # 1. Lire les données depuis HDFS
    raw_df = read_raw_data_from_hdfs(spark, date)
    
    if raw_df is None or raw_df.count() == 0:
        print("⚠️ No data to process")
        return
    
    print("\n📋 Raw Data Schema:")
    raw_df.printSchema()
    
    # 2. Nettoyer les données
    print("\n🧹 Cleaning data...")
    clean_df = raw_df.filter(
        (col("stationCode").isNotNull()) &
        (col("numBikesAvailable").isNotNull())
    )
    
    # 3. Agrégations quotidiennes
    daily_stats = compute_daily_aggregations(clean_df)
    write_to_hdfs(daily_stats, HDFS_OUTPUT_PATH + "daily_stats/", "parquet")
    write_to_mongodb(daily_stats, MONGODB_COLLECTION_AGGREGATED)
    
    # 4. Patterns horaires
    hourly_patterns = compute_hourly_patterns(clean_df)
    write_to_hdfs(hourly_patterns, HDFS_OUTPUT_PATH + "hourly_patterns/", "parquet")
    
    # 5. Détection d'anomalies
    anomalies = detect_anomalies(clean_df)
    write_to_hdfs(anomalies, HDFS_OUTPUT_PATH + "anomalies/", "parquet")
    
    # 6. 🆕 Détection des incidents en station
    incidents = detect_station_incidents(raw_df)
    write_to_hdfs(incidents, HDFS_OUTPUT_PATH + "station_incidents/", "parquet")
    write_to_mongodb(incidents, MONGODB_COLLECTION_INCIDENTS)
    
    # 7. 🆕 Suivi des stations vides/pleines
    empty_full_stats, problematic = track_empty_full_stations(clean_df)
    write_to_hdfs(empty_full_stats, HDFS_OUTPUT_PATH + "empty_full_tracking/", "parquet")
    write_to_mongodb(empty_full_stats, MONGODB_COLLECTION_EMPTY_FULL)
    
    # Sauvegarder aussi les stations problématiques
    write_to_hdfs(problematic, HDFS_OUTPUT_PATH + "problematic_stations/", "parquet")
    
    # 8. Statistiques globales
    global_stats = compute_global_statistics(clean_df)
    global_stats.show()
    write_to_mongodb(global_stats, MONGODB_COLLECTION_STATS)
    
    print("\n" + "=" * 60)
    print("✅ Batch Processing Pipeline Completed")
    print("=" * 60)


def main():
    """
    Point d'entrée principal
    """
    # Récupérer la date depuis les arguments (optionnel)
    date = sys.argv[1] if len(sys.argv) > 1 else None
    
    print("📅 Processing date: " + (date if date else 'ALL'))
    
    # Initialiser Spark
    spark = initialize_spark()
    
    try:
        # Lancer le pipeline batch
        run_batch_pipeline(spark, date)
    except Exception as e:
        print("❌ Fatal error: " + str(e))
    finally:
        # Arrêter Spark
        spark.stop()
        print("✅ Spark Batch session stopped")


if __name__ == "__main__":
    main()
