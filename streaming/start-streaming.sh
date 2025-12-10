#!/bin/bash
# Startup script for Spark Streaming job

echo "🚀 Starting Vélib Streaming Pipeline..."
echo "API Key: ${JCDECAUX_API_KEY:0:10}..."
echo "Contract: ${JCDECAUX_CONTRACT}"

# Run spark-submit with proper configuration
/opt/spark/bin/spark-submit \
  --master local[2] \
  --packages org.mongodb.spark:mongo-spark-connector_2.12:10.2.0 \
  --conf "spark.mongodb.output.uri=mongodb://admin:admin123@mongo:27017/velib_db.stations?authSource=admin" \
  --conf "spark.driver.memory=1g" \
  --conf "spark.executor.memory=1g" \
  /opt/spark-apps/streaming-velib.py 2>&1 | tee /opt/spark-apps/streaming.log
