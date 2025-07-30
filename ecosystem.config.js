module.exports = {
  apps: [
    {
      name: 'backend',
      script: './backend/dist/server.js',
      cwd: '/var/www/pepchat',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      env_file: './backend/.env',
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'frontend',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: '/var/www/pepchat/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/frontend.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s'
    }
  ]
};