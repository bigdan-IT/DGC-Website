# 🚀 Ubuntu VPS Deployment Guide

This guide will help you deploy your Dans Duels gaming community website on an Ubuntu VPS with Apache2.

## 📋 Prerequisites

- Ubuntu 20.04+ VPS
- Root or sudo access
- Domain name (optional but recommended)
- SSH access to your server

## 🎯 Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Upload your project to the server:**
   ```bash
   # From your local machine
   scp -r . user@your-server-ip:/home/user/dans-duels
   ```

2. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

3. **Run the deployment script:**
   ```bash
   cd /home/user/dans-duels
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Option 2: Manual Deployment

Follow the step-by-step instructions below.

## 🔧 Manual Deployment Steps

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install Apache2
```bash
sudo apt install apache2 -y
sudo systemctl enable apache2
sudo systemctl start apache2
```

### 4. Install PM2
```bash
sudo npm install -g pm2
```

### 5. Create Application Directory
```bash
sudo mkdir -p /var/www/dans-duels
sudo chown $USER:$USER /var/www/dans-duels
```

### 6. Upload Application Files
```bash
# Copy your project files to the server directory
cp -r . /var/www/dans-duels/
cd /var/www/dans-duels
```

### 7. Install Dependencies
```bash
npm run install-all
```

### 8. Build Frontend
```bash
cd client
npm run build
cd ..
```

### 9. Create Environment File
```bash
cat > server/.env << EOF
PORT=5000
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF
```

### 10. Configure PM2
```bash
# Copy the PM2 configuration
cp pm2-ecosystem.config.js ecosystem.config.js

# Start the backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 11. Configure Apache2

#### Enable Required Modules
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite
```

#### Create Virtual Host Configuration
```bash
# Copy the Apache configuration
sudo cp apache-config.conf /etc/apache2/sites-available/dans-duels.conf

# Edit the configuration to match your domain
sudo nano /etc/apache2/sites-available/dans-duels.conf
```

**Important:** Replace `your-domain.com` with your actual domain name.

#### Enable the Site
```bash
sudo a2ensite dans-duels.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

### 12. Configure Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable
```

## 🔒 SSL Certificate Setup

### Install Certbot
```bash
sudo apt install certbot python3-certbot-apache -y
```

### Get SSL Certificate
```bash
sudo certbot --apache -d your-domain.com
```

### Auto-renewal
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring and Maintenance

### Check Application Status
```bash
# Backend status
pm2 status

# Apache status
sudo systemctl status apache2

# View logs
pm2 logs dans-duels-backend
sudo tail -f /var/log/apache2/dans-duels-*.log
```

### Update Application
```bash
cd /var/www/dans-duels

# Pull latest changes (if using git)
# git pull origin main

# Install dependencies
npm run install-all

# Build frontend
cd client && npm run build && cd ..

# Restart backend
pm2 restart dans-duels-backend

# Reload Apache
sudo systemctl reload apache2
```

### Backup Database
```bash
# Backup SQLite database
cp /var/www/dans-duels/server/database.sqlite /backup/database-$(date +%Y%m%d).sqlite
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Apache Configuration Error
```bash
sudo apache2ctl configtest
```

#### 2. PM2 Process Not Starting
```bash
pm2 delete dans-duels-backend
pm2 start ecosystem.config.js
pm2 save
```

#### 3. Permission Issues
```bash
sudo chown -R www-data:www-data /var/www/dans-duels/client/build
sudo chmod -R 755 /var/www/dans-duels/client/build
```

#### 4. Port Already in Use
```bash
# Check what's using port 5000
sudo netstat -tulpn | grep :5000

# Kill the process if needed
sudo kill -9 <PID>
```

### Log Locations
- **Apache logs**: `/var/log/apache2/dans-duels-*.log`
- **PM2 logs**: `pm2 logs dans-duels-backend`
- **Application logs**: `/var/log/pm2/dans-duels-*.log`

## 🔧 Performance Optimization

### Enable Apache Compression
```bash
sudo a2enmod deflate
sudo systemctl restart apache2
```

### Enable Browser Caching
Add to Apache configuration:
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>
```

### Database Optimization
```bash
# Optimize SQLite database
sqlite3 /var/www/dans-duels/server/database.sqlite "VACUUM;"
```

## 📈 Scaling Considerations

### For Higher Traffic
1. **Load Balancer**: Use nginx as reverse proxy
2. **Database**: Migrate to PostgreSQL or MySQL
3. **Caching**: Implement Redis for session storage
4. **CDN**: Use Cloudflare or similar for static assets
5. **Monitoring**: Set up monitoring with tools like New Relic

### Backup Strategy
```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/dans-duels"

mkdir -p $BACKUP_DIR

# Backup database
cp /var/www/dans-duels/server/database.sqlite $BACKUP_DIR/database-$DATE.sqlite

# Backup application files
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /var/www/dans-duels

# Keep only last 7 days
find $BACKUP_DIR -name "*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🎯 Final Checklist

- [ ] Application is running on http://your-domain.com
- [ ] SSL certificate is installed (https://your-domain.com)
- [ ] Backend API is responding (/api/auth/me)
- [ ] Database is accessible and working
- [ ] Logs are being written correctly
- [ ] Firewall is configured
- [ ] Backups are set up
- [ ] Monitoring is in place

## 🆘 Support

If you encounter issues:

1. Check the logs: `pm2 logs dans-duels-backend`
2. Verify Apache configuration: `sudo apache2ctl configtest`
3. Check file permissions
4. Ensure all services are running
5. Verify firewall settings

Your Dans Duels gaming community is now live and ready for players! 🎮 