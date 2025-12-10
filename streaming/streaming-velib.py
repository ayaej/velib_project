# -*- coding: utf-8 -*-
import requests
import time
import os
import json
from datetime import datetime
from pymongo import MongoClient
from pyspark.sql import SparkSession
from pyspark.sql.functions import col

JCDECAUX_API_KEY = os.getenv('JCDECAUX_API_KEY', 'YOUR_API_KEY_HERE')
JCDECAUX_API_URL = 'https://api.jcdecaux.com/vls/v3/stations?contract=lyon&apiKey=' + JCDECAUX_API_KEY
MONGODB_URI = 'mongodb://admin:admin123@mongo:27017/'
MONGODB_DB = 'velib_db'
MONGODB_COLLECTION = 'stations'
HDFS_ENABLED = os.getenv('HDFS_ENABLED', 'true').lower() == 'true'
HDFS_BASE_PATH = 'hdfs://namenode:8020/velib/raw'

def initialize_spark():
    spark = SparkSession.builder.appName('VelibStreaming') \
        .config('spark.mongodb.output.uri', MONGODB_URI + MONGODB_DB + '.' + MONGODB_COLLECTION) \
        .config('spark.jars.packages', 'org.mongodb.spark:mongo-spark-connector_2.12:10.2.0') \
        .config('spark.hadoop.fs.defaultFS', 'hdfs://namenode:8020') \
        .config('dfs.client.use.datanode.hostname', 'true') \
        .config('dfs.datanode.use.datanode.hostname', 'true') \
        .getOrCreate()
    spark.sparkContext.setLogLevel('WARN')
    return spark

def fetch_data():
    try:
        resp = requests.get(JCDECAUX_API_URL, timeout=15)
        resp.raise_for_status()
        return resp.json() if isinstance(resp.json(), list) else []
    except Exception as e:
        print('API error:', e)
        return []

def transform(record):
    try:
        num = record.get('number')
        pos = record.get('position', {})
        total = record.get('totalStands', {})
        avail = total.get('availabilities', {})
        return {
            'stationCode': str(num) if num else None,
            'name': record.get('name'),
            'capacity': int(total.get('capacity', 0)),
            'numBikesAvailable': int(avail.get('bikes', 0)),
            'numDocksAvailable': int(avail.get('stands', 0)),
            'isInstalled': record.get('status') == 'OPEN',
            'coordinates': [float(pos.get('longitude', 0)), float(pos.get('latitude', 0))],
            'timestamp': datetime.now().isoformat()
        }
    except:
        return None

def write_mongo(df):
    try:
        rows = [r.asDict() for r in df.collect()]
        if not rows:
            return
        client = MongoClient(MONGODB_URI)
        col = client[MONGODB_DB][MONGODB_COLLECTION]
        for doc in rows:
            if doc.get('stationCode'):
                col.update_one({'stationCode': doc['stationCode']}, {'$set': doc}, upsert=True)
        client.close()
        print('✅ Written to MongoDB:', len(rows), 'stations')
    except Exception as e:
        print('❌ MongoDB error:', e)

def write_hdfs(df, batch_num):
    """Archive les données brutes dans HDFS pour le traitement batch"""
    if not HDFS_ENABLED:
        return
    
    try:
        current_date = datetime.now().strftime('%Y-%m-%d')
        hdfs_path = HDFS_BASE_PATH + '/' + current_date
        
        print('💾 Archiving to HDFS: ' + hdfs_path)
        
        # Écrire en mode append dans un seul fichier JSON
        df.write.mode('append').format('json').save(hdfs_path)
        
        print('✅ Archived to HDFS successfully')
    except Exception as e:
        print('⚠️ HDFS archiving failed: ' + str(e))
        import traceback
        traceback.print_exc()

def main():
    if JCDECAUX_API_KEY == 'YOUR_API_KEY_HERE':
        print('ERROR: Set JCDECAUX_API_KEY environment variable')
        return
    
    print('=' * 60)
    print('🚀 Starting Velib Streaming Pipeline...')
    print('=' * 60)
    print('API URL:', JCDECAUX_API_URL[:80])
    print('MongoDB:', MONGODB_URI)
    print('HDFS Archiving:', 'Enabled' if HDFS_ENABLED else 'Disabled')
    print('=' * 60)
    print()
    
    spark = initialize_spark()
    batch = 0
    
    try:
        while True:
            print('\n📡 Fetching batch ' + str(batch) + ' from JCDecaux API...')
            records = fetch_data()
            
            if not records:
                print('⚠️ No data received, retrying in 30s')
                time.sleep(30)
                continue
            
            print('✅ Fetched ' + str(len(records)) + ' stations')
            
            # Transformer les données
            transformed = [transform(r) for r in records if transform(r)]
            df = spark.createDataFrame(transformed).filter(col('stationCode').isNotNull())
            
            # 1. Écrire dans MongoDB (temps réel)
            write_mongo(df)
            
            # 2. Archiver dans HDFS (données brutes pour batch)
            write_hdfs(df, batch)
            
            print('✅ Batch ' + str(batch) + ' completed: ' + str(df.count()) + ' stations processed')
            
            batch += 1
            time.sleep(30)
            
    except KeyboardInterrupt:
        print('\n\n🛑 Pipeline stopped by user')
    finally:
        spark.stop()
        print('✅ Spark session stopped')

if __name__ == '__main__':
    main()
