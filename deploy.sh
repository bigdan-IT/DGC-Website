#!/bin/bash

# Dans Duels Deployment Script
# Run this script to update the website from GitHub

echo "Starting deployment..."

# Navigate to project directory
cd /var/www/dans-duels

# Pull latest changes
echo "Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm run install-all

# Build frontend
echo "Building frontend..."
cd client
npm run build
cd ..

# Restart backend
echo "Restarting backend..."
cd server
pm2 restart dans-duels-api
cd ..

# Reload Apache
echo "Reloading Apache..."
sudo systemctl reload apache2

echo "Deployment completed successfully!" 