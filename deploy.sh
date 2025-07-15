#!/bin/bash

# Dans Duels Gaming Community - Ubuntu VPS Deployment Script
# This script sets up the website on Ubuntu with Apache2

set -e  # Exit on any error

echo "🎮 Starting Dans Duels deployment on Ubuntu VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="your-domain.com"  # Change this to your domain
APP_NAME="dans-duels"
APP_DIR="/var/www/$APP_NAME"
BACKEND_PORT="5000"
FRONTEND_PORT="3000"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "App Directory: $APP_DIR"
echo "Backend Port: $BACKEND_PORT"

# Update system
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
echo -e "${YELLOW}📦 Installing Node.js and npm...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Apache2
echo -e "${YELLOW}🌐 Installing Apache2...${NC}"
sudo apt install apache2 -y
sudo systemctl enable apache2
sudo systemctl start apache2

# Install PM2 for process management
echo -e "${YELLOW}⚡ Installing PM2...${NC}"
sudo npm install -g pm2

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files (assuming you're running this from the project directory)
echo -e "${YELLOW}📋 Copying application files...${NC}"
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm run install-all

# Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
cd client
npm run build
cd ..

# Create environment file for backend
echo -e "${YELLOW}⚙️ Creating environment configuration...${NC}"
cat > server/.env << EOF
PORT=$BACKEND_PORT
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# Create PM2 ecosystem file
echo -e "${YELLOW}⚡ Creating PM2 configuration...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME-backend',
    script: './server/index.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $BACKEND_PORT
    }
  }]
};
EOF

# Start backend with PM2
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Apache2
echo -e "${YELLOW}🌐 Configuring Apache2...${NC}"

# Create Apache virtual host configuration
sudo tee /etc/apache2/sites-available/$APP_NAME.conf > /dev/null << EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    DocumentRoot $APP_DIR/client/build
    
    # Serve static files
    <Directory $APP_DIR/client/build>
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:$BACKEND_PORT/api
    ProxyPassReverse /api http://localhost:$BACKEND_PORT/api
    
    # Enable CORS headers
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
    
    # Logs
    ErrorLog \${APACHE_LOG_DIR}/$APP_NAME-error.log
    CustomLog \${APACHE_LOG_DIR}/$APP_NAME-access.log combined
</VirtualHost>
EOF

# Enable required Apache modules
echo -e "${YELLOW}🔧 Enabling Apache modules...${NC}"
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite

# Enable the site
sudo a2ensite $APP_NAME.conf
sudo a2dissite 000-default.conf

# Test Apache configuration
echo -e "${YELLOW}🔍 Testing Apache configuration...${NC}"
sudo apache2ctl configtest

# Restart Apache
echo -e "${YELLOW}🔄 Restarting Apache2...${NC}"
sudo systemctl restart apache2

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

# Create SSL certificate (optional - requires certbot)
echo -e "${YELLOW}🔒 SSL Certificate Setup${NC}"
echo "To enable HTTPS, install certbot and run:"
echo "sudo apt install certbot python3-certbot-apache"
echo "sudo certbot --apache -d $DOMAIN"

# Create update script
echo -e "${YELLOW}📝 Creating update script...${NC}"
cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating Dans Duels application..."

# Pull latest changes (if using git)
# git pull origin main

# Install dependencies
npm run install-all

# Build frontend
cd client
npm run build
cd ..

# Restart backend
pm2 restart dans-duels-backend

# Reload Apache
sudo systemctl reload apache2

echo "✅ Update complete!"
EOF

chmod +x update.sh

# Create status script
echo -e "${YELLOW}📊 Creating status script...${NC}"
cat > status.sh << 'EOF'
#!/bin/bash
echo "🎮 Dans Duels Status:"
echo ""
echo "Backend Status:"
pm2 status
echo ""
echo "Apache Status:"
sudo systemctl status apache2 --no-pager -l
echo ""
echo "Application Logs:"
echo "Backend logs: pm2 logs dans-duels-backend"
echo "Apache logs: sudo tail -f /var/log/apache2/dans-duels-*.log"
EOF

chmod +x status.sh

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}🎯 Next steps:${NC}"
echo "1. Update your domain DNS to point to this server"
echo "2. Replace 'your-domain.com' in the Apache config with your actual domain"
echo "3. Install SSL certificate: sudo certbot --apache -d your-domain.com"
echo "4. Access your website at: http://$DOMAIN"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo "Check status: ./status.sh"
echo "Update application: ./update.sh"
echo "View backend logs: pm2 logs dans-duels-backend"
echo "View Apache logs: sudo tail -f /var/log/apache2/dans-duels-*.log"
echo ""
echo -e "${GREEN}🎮 Your Dans Duels gaming community is now live!${NC}" 