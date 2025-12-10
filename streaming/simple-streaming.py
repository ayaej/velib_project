#!/usr/bin/env python3
"""
Simple streaming script to ingest Lyon Vélo'V data into MongoDB
Runs continuously every 30 seconds
"""

import requests
import time
from datetime import datetime
from pymongo import MongoClient, UpdateOne
import os

# Configuration
JCDECAUX_API_KEY = os.getenv('JCDECAUX_API_KEY', '2819f955f8f63dff63f10da9b3f02a088c8187c4')
JCDECAUX_CONTRACT = os.getenv('JCDECAUX_CONTRACT', 'lyon')
JCDECAUX_API_URL = f"https://api.jcdecaux.com/vls/v3/stations?contract={JCDECAUX_CONTRACT}&apiKey={JCDECAUX_API_KEY}"

MONGODB_URI = "mongodb://admin:admin123@mongo:27017/"
MONGODB_DB = "velib_db"
MONGODB_COLLECTION = "stations"

def fetch_data():
    """Fetch data from JCDecaux API"""
    try:
        print(f"📡 Fetching data from {JCDECAUX_CONTRACT} API...")
        response = requests.get(JCDECAUX_API_URL, timeout=15)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Fetched {len(data)} stations")
        return data
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return []

def transform_record(record):
    """Transform API record to MongoDB document"""
    try:
        total_stands = record.get('totalStands', {})
        availabilities = total_stands.get('availabilities', {})
        position = record.get('position', {})
        
        return {
            'stationCode': str(record.get('number', '')),
            'name': record.get('name', ''),
            'contractName': record.get('contractName', ''),
            'address': record.get('address', ''),
            'capacity': total_stands.get('capacity', 0),
            'numBikesAvailable': availabilities.get('bikes', 0),
            'numDocksAvailable': availabilities.get('stands', 0),
            'numMechanicalBikes': availabilities.get('mechanicalBikes', 0),
            'numElectricalBikes': availabilities.get('electricalBikes', 0),
            'isInstalled': record.get('status') == 'OPEN',
            'isReturning': record.get('status') == 'OPEN',
            'isRenting': record.get('status') == 'OPEN',
            'status': record.get('status', 'UNKNOWN'),
            'coordinates': [position.get('longitude', 0), position.get('latitude', 0)],
            'latitude': position.get('latitude', 0),
            'longitude': position.get('longitude', 0),
            'banking': record.get('banking', False),
            'bonus': record.get('bonus', False),
            'connected': record.get('connected', True),
            'lastUpdate': record.get('lastUpdate', ''),
            'lastSync': datetime.now().isoformat(),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        print(f"⚠️ Error transforming record: {e}")
        return None

def write_to_mongodb(records):
    """Write records to MongoDB using bulk upsert"""
    try:
        client = MongoClient(MONGODB_URI)
        db = client[MONGODB_DB]
        collection = db[MONGODB_COLLECTION]
        
        # Prepare bulk operations
        operations = []
        for record in records:
            transformed = transform_record(record)
            if transformed:
                operations.append(
                    UpdateOne(
                        {'stationCode': transformed['stationCode']},
                        {'$set': transformed},
                        upsert=True
                    )
                )
        
        if operations:
            result = collection.bulk_write(operations)
            print(f"✅ MongoDB: {result.upserted_count} inserted, {result.modified_count} updated")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error writing to MongoDB: {e}")
        return False

def main():
    """Main streaming loop"""
    print("\n" + "="*70)
    print("🚴 VÉLO'V REAL-TIME STREAMING")
    print(f"   Contract: {JCDECAUX_CONTRACT}")
    print(f"   Target: MongoDB ({MONGODB_DB}.{MONGODB_COLLECTION})")
    print("="*70 + "\n")
    
    batch_count = 0
    
    while True:
        try:
            print(f"\n{'='*70}")
            print(f"📊 Batch #{batch_count} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*70}")
            
            # Fetch data
            data = fetch_data()
            
            if data:
                # Write to MongoDB
                write_to_mongodb(data)
                
                # Stats
                total_bikes = sum(r.get('totalStands', {}).get('availabilities', {}).get('bikes', 0) for r in data)
                total_stands = sum(r.get('totalStands', {}).get('availabilities', {}).get('stands', 0) for r in data)
                print(f"📈 Stats: {total_bikes} bikes, {total_stands} free slots")
            
            batch_count += 1
            
            # Wait 30 seconds
            print(f"⏳ Waiting 30 seconds...")
            time.sleep(30)
            
        except KeyboardInterrupt:
            print("\n⚠️ Stopped by user")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(10)
    
    print("\n👋 Streaming stopped")

if __name__ == "__main__":
    main()
