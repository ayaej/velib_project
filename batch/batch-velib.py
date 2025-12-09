"""
Pipeline Spark Batch pour le traitement des données brutes Vélib
Lit les données depuis HDFS, effectue des transformations et agrégations,
puis écrit les résultats dans MongoDB
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
from pymongo import MongoClient
from datetime import datetime
import sys
import traceback

# Configuration
HDFS_INPUT_PATH = "hdfs://namenode:9000/velib/raw/"
HDFS_OUTPUT_PATH = "hdfs://namenode:9000/velib/processed/"
MONGODB_URI = "mongodb://admin:admin123@mongo:27017/"
MONGODB_DB = "velib_db"
MONGODB_COLLECTION_AGGREGATED = "stations_aggregated"
MONGODB_COLLECTION_STATS = "daily_stats"


def initialize_spark():
    """
    Initialiser la session Spark pour le traitement Batch
    """
    spark = SparkSession.builder \
        .appName("VelibBatchProcessing") \
        .config("spark.mongodb.output.uri", f"{MONGODB_URI}{MONGODB_DB}") \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.2.0") \
        .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
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
            path = f"{HDFS_INPUT_PATH}{date}/*.json"
        else:
            path = f"{HDFS_INPUT_PATH}*/*.json"
        
        print(f"📂 Reading data from HDFS: {path}")
        
        # Lire les données JSON depuis HDFS
        df = spark.read.json(path)
        
        print(f"✅ Loaded {df.count()} records from HDFS")
        return df
    
    except Exception as e:
        print(f"❌ Error reading from HDFS: {e}")
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
        print(f"💾 Writing to HDFS: {output_path}")
        
        df.write \
            .mode("overwrite") \
            .format(format) \
            .save(output_path)
        
        print(f"✅ Data written to HDFS successfully")
    
    except Exception as e:
        print(f"❌ Error writing to HDFS: {e}")


def write_to_mongodb(df, collection_name):
    """
    Écrire les résultats dans MongoDB
    """
    try:
        print(f"💾 Writing to MongoDB collection: {collection_name}")
        
        # Convertir en documents et insérer dans MongoDB
        records = df.collect()
        
        if not records:
            print("⚠️ No data to write")
            return
        
        client = MongoClient(MONGODB_URI)
        db = client[MONGODB_DB]
        collection = db[collection_name]
        
        documents = [row.asDict() for row in records]
        
        # Supprimer les anciennes données et insérer les nouvelles
        collection.delete_many({})
        collection.insert_many(documents)
        
        print(f"✅ {len(documents)} documents written to MongoDB")
        
        client.close()
    
    except Exception as e:
        print(f"❌ Error writing to MongoDB: {e}")


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
    write_to_hdfs(daily_stats, f"{HDFS_OUTPUT_PATH}daily_stats/", "parquet")
    write_to_mongodb(daily_stats, MONGODB_COLLECTION_AGGREGATED)
    
    # 4. Patterns horaires
    hourly_patterns = compute_hourly_patterns(clean_df)
    write_to_hdfs(hourly_patterns, f"{HDFS_OUTPUT_PATH}hourly_patterns/", "parquet")
    
    # 5. Détection d'anomalies
    anomalies = detect_anomalies(clean_df)
    write_to_hdfs(anomalies, f"{HDFS_OUTPUT_PATH}anomalies/", "parquet")
    
    # 6. Statistiques globales
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
    
    print(f"📅 Processing date: {date if date else 'ALL'}")
    
    # Initialiser Spark
    spark = initialize_spark()
    
    try:
        # Lancer le pipeline batch
        run_batch_pipeline(spark, date)
    except Exception as e:
        print(f"❌ Fatal error: {e}")
    finally:
        # Arrêter Spark
        spark.stop()
        print("✅ Spark Batch session stopped")


if __name__ == "__main__":
    main()
