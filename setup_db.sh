#!/bin/bash

# Script to set up PostgreSQL database for CollabEdge

echo "CollabEdge Database Setup Script"
echo "==============================="
echo

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed or not in your PATH."
    echo "Please install PostgreSQL 14 or higher and try again."
    exit 1
fi

echo "PostgreSQL is installed."
echo

# Get PostgreSQL connection info
read -p "PostgreSQL host [localhost]: " PG_HOST
PG_HOST=${PG_HOST:-localhost}

read -p "PostgreSQL port [5432]: " PG_PORT
PG_PORT=${PG_PORT:-5432}

read -p "PostgreSQL username [postgres]: " PG_USER
PG_USER=${PG_USER:-postgres}

read -p "PostgreSQL password: " PG_PASSWORD

echo
echo "Creating database..."

# Create the database
PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -c "CREATE DATABASE collabedge;" || {
    echo "Failed to create database. It might already exist.";
    read -p "Continue setup with existing database? [y/N] " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

echo "Running database setup script..."
PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "collabedge" -f "backend/db/setup.sql" || {
    echo "Failed to run setup script.";
    exit 1;
}

echo
echo "✅ Database setup complete!"
echo 
echo "Update your application.properties with these settings:"
echo "----------------------------------------------------"
echo "spring.datasource.url=jdbc:postgresql://$PG_HOST:$PG_PORT/collabedge"
echo "spring.datasource.username=$PG_USER"
echo "spring.datasource.password=********"  # Don't print the actual password
echo

# Update application.properties if desired
read -p "Update application.properties with these settings? [y/N] " UPDATE_CONFIG
if [[ "$UPDATE_CONFIG" =~ ^[Yy]$ ]]; then
    CONFIG_FILE="backend/src/main/resources/application.properties"
    
    # Create backup
    cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
    
    # Update settings
    sed -i -e "s|spring.datasource.url=.*|spring.datasource.url=jdbc:postgresql://$PG_HOST:$PG_PORT/collabedge|" "$CONFIG_FILE"
    sed -i -e "s|spring.datasource.username=.*|spring.datasource.username=$PG_USER|" "$CONFIG_FILE"
    sed -i -e "s|spring.datasource.password=.*|spring.datasource.password=$PG_PASSWORD|" "$CONFIG_FILE"
    
    echo "Updated $CONFIG_FILE"
fi

echo
echo "🚀 You can now start the application!" 