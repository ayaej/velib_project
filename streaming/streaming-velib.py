"""
Pipeline Spark Structured Streaming pour récupérer les données Vélib en temps réel
Récupère l'API JCDecaux officielle, transforme les données et les insère dans MongoDB
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import requests
import json
import time
import os
import traceback
from datetime import datetime
from pymongo import MongoClient

# Configuration de l'API JCDecaux
JCDECAUX_API_KEY = os.getenv('JCDECAUX_API_KEY', 'YOUR_API_KEY_HERE')  # TODO: Remplacer par votre clé API
JCDECAUX_API_URL = f"https://api.jcdecaux.com/vls/v3/stations?apiKey={JCDECAUX_API_KEY}"
# Alternative pour Paris uniquement:
# JCDECAUX_API_URL = f"https://api.jcdecaux.com/vls/v3/stations?contract=paris&apiKey={JCDECAUX_API_KEY}"

# Configuration MongoDB
MONGODB_URI = "mongodb://admin:admin123@mongo:27017/"
MONGODB_DB = "velib_db"
MONGODB_COLLECTION = "stations"

# Configuration HDFS (optionnel pour archivage)
HDFS_ENABLED = os.getenv('HDFS_ENABLED', 'false').lower() == 'true'
HDFS_BASE_PATH = "hdfs://namenode:9000/velib/raw/"


def initialize_spark():
    """
    Initialiser la session Spark avec les configurations nécessaires
    """
    builder = SparkSession.builder \
        .appName("VelibRealtimeStreaming_JCDecaux") \
        .config("spark.mongodb.output.uri", f"{MONGODB_URI}{MONGODB_DB}.{MONGODB_COLLECTION}") \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.2.0")
    
    if HDFS_ENABLED:
        builder = builder.config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000")
    
    spark = builder.getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    
    print("✅ Spark session initialized")
    print(f"📡 API Source: JCDecaux Vélib API")
    print(f"💾 HDFS Archiving: {'Enabled' if HDFS_ENABLED else 'Disabled'}")
    
    return spark


def fetch_velib_data():
    """
    Récupérer les données de l'API JCDecaux en temps réel
    """
    try:
        print(f"📡 Fetching data from JCDecaux API...")
        
        response = requests.get(JCDECAUX_API_URL, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        
        if isinstance(data, list):
            print(f"✅ Fetched {len(data)} stations from JCDecaux API")
            return data
        else:
            print(f"⚠️ Unexpected response format")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching JCDecaux data: {e}")
        if "401" in str(e):
            print("⚠️ API Key invalide ou manquante!")
            print("👉 Obtenez votre clé API gratuite sur: https://developer.jcdecaux.com")
        return []
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return []


def transform_jcdecaux_record(record):
    """
    Transformer un enregistrement de l'API JCDecaux
    Structure de l'API JCDecaux:
    {
        "number": 16107,
        "contractName": "Paris",
        "name": "16107 - BENJAMIN GODARD - VICTOR HUGO",
        "address": "2 RUE BENJAMIN GODARD - 75016 PARIS",
        "position": {"latitude": 48.865983, "longitude": 2.275725},
        "banking": true,
        "bonus": false,
        "status": "OPEN",
        "lastUpdate": "2024-01-15T14:29:45.000Z",
        "connected": true,
        "overflow": false,
        "shape": null,
        "totalStands": {"availabilities": {...}, "capacity": 35},
        "mainStands": {"availabilities": {...}, "capacity": 35},
        "overflowStands": null
    }
    """
    try:
        # Extraction des données de base
        number = record.get('number', '')
        name = record.get('name', '')
        contract = record.get('contractName', 'Paris')
        address = record.get('address', '')
        status = record.get('status', 'UNKNOWN')
        
        # Position GPS
        position = record.get('position', {})
        latitude = position.get('latitude', 0)
        longitude = position.get('longitude', 0)
        
        # Disponibilités
        total_stands = record.get('totalStands', {})
        availabilities = total_stands.get('availabilities', {})
        capacity = total_stands.get('capacity', 0)
        
        bikes = availabilities.get('bikes', 0)
        stands = availabilities.get('stands', 0)
        mechanical_bikes = availabilities.get('mechanicalBikes', 0)
        electrical_bikes = availabilities.get('electricalBikes', 0)
        
        # Informations supplémentaires
        banking = record.get('banking', False)
        bonus = record.get('bonus', False)
        connected = record.get('connected', True)
        overflow = record.get('overflow', False)
        last_update = record.get('lastUpdate', '')
        
        transformed = {
            'stationCode': str(number),
            'name': name,
            'contractName': contract,
            'address': address,
            'capacity': int(capacity),
            'numBikesAvailable': int(bikes),
            'numDocksAvailable': int(stands),
            'numMechanicalBikes': int(mechanical_bikes),
            'numElectricalBikes': int(electrical_bikes),
            'isInstalled': status == 'OPEN',
            'isReturning': status == 'OPEN',
            'isRenting': status == 'OPEN',
            'status': status,
            'coordinates': [float(longitude), float(latitude)],
            'latitude': float(latitude),
            'longitude': float(longitude),
            'banking': banking,
            'bonus': bonus,
            'connected': connected,
            'overflow': overflow,
            'timestamp': datetime.now().isoformat(),
            'lastUpdate': last_update
        }
        
        return transformed
        
    except Exception as e:
        print(f"❌ Error transforming record: {e}")
        print(f"Record: {record}")
        return None


def write_to_mongodb(batch_df, batch_id):
    """
    Écrire un batch de données dans MongoDB
    Utilise upsert pour éviter les doublons
    """
    try:
        records = batch_df.collect()
        
        if not records:
            print(f"⚠️ Batch {batch_id} is empty, skipping...")
            return
        
        # Connexion MongoDB
        client = MongoClient(MONGODB_URI)
        db = client[MONGODB_DB]
        collection = db[MONGODB_COLLECTION]
        
        # Convertir en documents
        documents = [row.asDict() for row in records]
        
        # Upsert basé sur stationCode pour éviter les doublons
        updated_count = 0
        inserted_count = 0
        
        for doc in documents:
            result = collection.update_one(
                {'stationCode': doc['stationCode']},
                {'$set': doc},
                upsert=True
            )
            
            if result.upserted_id:
                inserted_count += 1
            elif result.modified_count > 0:
                updated_count += 1
        
        print(f"✅ Batch {batch_id}: {inserted_count} inserted, {updated_count} updated in MongoDB")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error writing batch {batch_id} to MongoDB: {e}")


def write_to_hdfs(spark, batch_df, batch_id):
    """
    Archiver les données dans HDFS (optionnel)
    Organisé par date: /velib/raw/YYYY-MM-DD/batch_XXX.json
    """
    if not HDFS_ENABLED:
        return
    
    try:
        current_date = datetime.now().strftime('%Y-%m-%d')
        hdfs_path = f"{HDFS_BASE_PATH}{current_date}/batch_{batch_id}.json"
        
        print(f"💾 Archiving to HDFS: {hdfs_path}")
        
        batch_df.write \
            .mode("overwrite") \
            .format("json") \
            .save(hdfs_path)
        
        print(f"✅ Batch {batch_id} archived to HDFS")
        
    except Exception as e:
        print(f"⚠️ Error writing to HDFS: {e}")
        print("   (Continuing without HDFS archiving)")


def run_streaming_pipeline(spark):
    """
    Pipeline principal de streaming
    Récupère les données toutes les 30 secondes et les stocke dans MongoDB + HDFS
    """
    print("=" * 70)
    print("🚀 Starting Vélib Streaming Pipeline (JCDecaux API)")
    print("=" * 70)
    
    batch_counter = 0
    
    while True:
        try:
            print(f"\n{'='*70}")
            print(f"📊 Processing batch #{batch_counter} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*70}")
            
            # 1. Récupérer les données de l'API
            records = fetch_velib_data()
            
            if not records:
                print("⚠️ No data fetched, waiting 30 seconds before retry...")
                time.sleep(30)
                continue
            
            # 2. Transformer les données
            print(f"🔄 Transforming {len(records)} records...")
            transformed_records = [transform_jcdecaux_record(r) for r in records]
            transformed_records = [r for r in transformed_records if r is not None]
            
            print(f"✅ Transformed {len(transformed_records)} valid records")
            
            # 3. Créer un DataFrame Spark
            if transformed_records:
                df = spark.createDataFrame(transformed_records)
                
                # Afficher le schéma (première fois seulement)
                if batch_counter == 0:
                    print("\n📋 DataFrame Schema:")
                    df.printSchema()
                    print("\n📊 Sample Data:")
                    df.show(5, truncate=False)
                
                # 4. Écrire dans MongoDB
                write_to_mongodb(df, batch_counter)
                
                # 5. Archiver dans HDFS (optionnel)
                if HDFS_ENABLED:
                    write_to_hdfs(spark, df, batch_counter)
                
                # Statistiques du batch
                print(f"\n📈 Batch Statistics:")
                print(f"   - Total stations: {df.count()}")
                print(f"   - Bikes available: {df.agg({'numBikesAvailable': 'sum'}).collect()[0][0]}")
                print(f"   - Docks available: {df.agg({'numDocksAvailable': 'sum'}).collect()[0][0]}")
            
            batch_counter += 1
            
            # 6. Attendre avant le prochain batch
            print(f"\n⏳ Waiting 30 seconds before next batch...")
            time.sleep(30)
            
        except KeyboardInterrupt:
            print("\n" + "="*70)
            print("⚠️ Streaming pipeline interrupted by user")
            print("="*70)
            break
        except Exception as e:
            print(f"❌ Error in streaming pipeline: {e}")
            import traceback
            traceback.print_exc()
            print("⏳ Waiting 10 seconds before retry...")
            time.sleep(10)
    
    print("\n🛑 Streaming pipeline stopped")


def main():
    """
    Point d'entrée principal
    """
    print("\n" + "=" * 70)
    print("🚴 VÉLIB REAL-TIME STREAMING PIPELINE")
    print("   Data Source: JCDecaux API")
    print("=" * 70)
    
    # Vérifier la clé API
    if JCDECAUX_API_KEY == 'YOUR_API_KEY_HERE':
        print("\n⚠️  ATTENTION: Clé API manquante!")
        print("="*70)
        print("Pour utiliser ce pipeline, vous devez:")
        print("1. Obtenir une clé API gratuite sur:")
        print("   👉 https://developer.jcdecaux.com/#/opendata/vls?page=getstarted")
        print("2. Définir la variable d'environnement:")
        print("   export JCDECAUX_API_KEY='votre_cle_api'")
        print("   OU")
        print("   Modifier JCDECAUX_API_KEY dans le fichier streaming-velib.py")
        print("="*70)
        return
    
    print(f"🔑 API Key: {JCDECAUX_API_KEY[:10]}...")
    
    # Initialiser Spark
    spark = initialize_spark()
    
    try:
        # Lancer le pipeline de streaming
        run_streaming_pipeline(spark)
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Arrêter Spark
        spark.stop()
        print("\n✅ Spark session stopped")
        print("👋 Goodbye!")


if __name__ == "__main__":
    main()
```
