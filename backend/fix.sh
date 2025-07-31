#!/bin/bash
set -e

# Configurações do banco
DB_NAME="pepchat_db"
DB_USER="pepchat"
DB_PASS="24722728"
DB_HOST="localhost"

echo "🔴 Matando conexões ativas no banco..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d postgres -c \
"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

echo "🗑️ Dropando banco..."
NODE_ENV=production npx sequelize db:drop

echo "📦 Criando banco novamente..."
NODE_ENV=production npx sequelize db:create

echo "⚙️ Buildando backend..."
npm run build

echo "📜 Executando migrations..."
NODE_ENV=production npx sequelize db:migrate

echo "🌱 Executando seeders..."
NODE_ENV=production npx sequelize db:seed:all

echo "🚀 Reiniciando PM2..."
pm2 restart all

echo "✅ Fix concluído com sucesso!"

pm2 flush

pm2 logs backend
