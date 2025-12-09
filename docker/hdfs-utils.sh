#!/bin/bash

# Script utilitaire pour gérer HDFS
# Utilisation: ./hdfs-utils.sh [command]

NAMENODE_CONTAINER="velib_namenode"
HDFS_BASE_PATH="/velib"

echo "================================================"
echo "🗂️  HDFS Utility Script for Vélib Project"
echo "================================================"
echo ""

# Fonction pour vérifier si les conteneurs sont en cours d'exécution
check_containers() {
    if ! docker ps | grep -q $NAMENODE_CONTAINER; then
        echo "❌ NameNode container is not running!"
        echo "Please start Docker Compose first: cd docker && docker-compose up -d"
        exit 1
    fi
}

# Créer la structure de dossiers HDFS
init_hdfs_structure() {
    echo "📁 Creating HDFS directory structure..."
    
    docker exec $NAMENODE_CONTAINER hdfs dfs -mkdir -p /velib
    docker exec $NAMENODE_CONTAINER hdfs dfs -mkdir -p /velib/raw
    docker exec $NAMENODE_CONTAINER hdfs dfs -mkdir -p /velib/processed
    docker exec $NAMENODE_CONTAINER hdfs dfs -mkdir -p /velib/processed/daily_stats
    docker exec $NAMENODE_CONTAINER hdfs dfs -mkdir -p /velib/processed/hourly_patterns
    docker exec $NAMENODE_CONTAINER hdfs dfs -mkdir -p /velib/processed/anomalies
    
    docker exec $NAMENODE_CONTAINER hdfs dfs -chmod -R 777 /velib
    
    echo "✅ HDFS structure created successfully!"
}

# Lister les fichiers HDFS
list_hdfs() {
    echo "📂 Listing HDFS files..."
    docker exec $NAMENODE_CONTAINER hdfs dfs -ls -R /velib
}

# Afficher le statut HDFS
status_hdfs() {
    echo "📊 HDFS Status:"
    docker exec $NAMENODE_CONTAINER hdfs dfsadmin -report
}

# Afficher l'espace disque utilisé
disk_usage() {
    echo "💾 HDFS Disk Usage:"
    docker exec $NAMENODE_CONTAINER hdfs dfs -du -h /velib
}

# Uploader un fichier vers HDFS
upload_file() {
    if [ -z "$1" ]; then
        echo "❌ Usage: ./hdfs-utils.sh upload <local_file> <hdfs_destination>"
        exit 1
    fi
    
    LOCAL_FILE=$1
    HDFS_DEST=${2:-/velib/raw/}
    
    echo "📤 Uploading $LOCAL_FILE to HDFS $HDFS_DEST..."
    docker cp $LOCAL_FILE $NAMENODE_CONTAINER:/tmp/upload_file
    docker exec $NAMENODE_CONTAINER hdfs dfs -put /tmp/upload_file $HDFS_DEST
    docker exec $NAMENODE_CONTAINER rm /tmp/upload_file
    
    echo "✅ File uploaded successfully!"
}

# Télécharger un fichier depuis HDFS
download_file() {
    if [ -z "$1" ]; then
        echo "❌ Usage: ./hdfs-utils.sh download <hdfs_file> <local_destination>"
        exit 1
    fi
    
    HDFS_FILE=$1
    LOCAL_DEST=${2:-./}
    
    echo "📥 Downloading $HDFS_FILE from HDFS..."
    docker exec $NAMENODE_CONTAINER hdfs dfs -get $HDFS_FILE /tmp/download_file
    docker cp $NAMENODE_CONTAINER:/tmp/download_file $LOCAL_DEST
    docker exec $NAMENODE_CONTAINER rm /tmp/download_file
    
    echo "✅ File downloaded successfully!"
}

# Supprimer un fichier/dossier HDFS
delete_hdfs() {
    if [ -z "$1" ]; then
        echo "❌ Usage: ./hdfs-utils.sh delete <hdfs_path>"
        exit 1
    fi
    
    HDFS_PATH=$1
    
    echo "⚠️  Are you sure you want to delete $HDFS_PATH? (y/n)"
    read -r response
    
    if [[ "$response" == "y" || "$response" == "Y" ]]; then
        docker exec $NAMENODE_CONTAINER hdfs dfs -rm -r $HDFS_PATH
        echo "✅ Deleted successfully!"
    else
        echo "❌ Deletion cancelled"
    fi
}

# Nettoyer toutes les données HDFS
clean_all() {
    echo "⚠️  WARNING: This will delete ALL data in /velib!"
    echo "Are you sure? (yes/no)"
    read -r response
    
    if [[ "$response" == "yes" ]]; then
        docker exec $NAMENODE_CONTAINER hdfs dfs -rm -r /velib/*
        echo "✅ All data cleaned!"
        init_hdfs_structure
    else
        echo "❌ Cleaning cancelled"
    fi
}

# Afficher l'aide
show_help() {
    echo "Available commands:"
    echo ""
    echo "  init          - Initialize HDFS directory structure"
    echo "  list          - List all files in HDFS"
    echo "  status        - Show HDFS cluster status"
    echo "  usage         - Show disk usage"
    echo "  upload        - Upload file to HDFS"
    echo "  download      - Download file from HDFS"
    echo "  delete        - Delete file/folder from HDFS"
    echo "  clean         - Clean all data in HDFS"
    echo "  help          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./hdfs-utils.sh init"
    echo "  ./hdfs-utils.sh list"
    echo "  ./hdfs-utils.sh upload data.json /velib/raw/"
    echo "  ./hdfs-utils.sh download /velib/raw/data.json ./"
}

# Menu principal
case "$1" in
    init)
        check_containers
        init_hdfs_structure
        ;;
    list)
        check_containers
        list_hdfs
        ;;
    status)
        check_containers
        status_hdfs
        ;;
    usage)
        check_containers
        disk_usage
        ;;
    upload)
        check_containers
        upload_file "$2" "$3"
        ;;
    download)
        check_containers
        download_file "$2" "$3"
        ;;
    delete)
        check_containers
        delete_hdfs "$2"
        ;;
    clean)
        check_containers
        clean_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
echo "================================================"
