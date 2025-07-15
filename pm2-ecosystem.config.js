module.exports = {
  apps: [{
    name: 'dans-duels-backend',
    script: './server/index.js',
    cwd: '/var/www/dans-duels',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/dans-duels-error.log',
    out_file: '/var/log/pm2/dans-duels-out.log',
    log_file: '/var/log/pm2/dans-duels-combined.log',
    time: true
  }]
}; 