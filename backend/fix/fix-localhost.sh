#!/bin/bash
set -e

echo "========================================"
echo "    SCRIPT DE FIX PARA LOCALHOST"
echo "========================================"

# Configurações do banco (ambiente de desenvolvimento)
DB_NAME="smart_atendimento_db"
DB_USER="postgres"
DB_PASS="root"
DB_HOST="localhost"
DB_PORT="5432"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para executar comandos com verificação de erro
run_command() {
    local description="$1"
    local command="$2"
    
    echo -e "\n${YELLOW}$description...${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $description concluído${NC}"
    else
        echo -e "${RED}❌ Erro em: $description${NC}"
        exit 1
    fi
}

# Verificar se estamos no diretório correto
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Diretório 'backend' não encontrado. Execute o script na raiz do projeto.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}🔴 Matando conexões ativas no banco...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c \
"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" || echo -e "${YELLOW}⚠️ Aviso: Não foi possível terminar algumas conexões (pode ser normal)${NC}"

# Mudar para o diretório backend
cd backend

# Executar comandos sequenciais (build primeiro!)
run_command "Buildando backend" "npm run build"
run_command "Dropando banco" "npx sequelize db:drop"
run_command "Criando banco novamente" "npx sequelize db:create"
run_command "Executando migrations" "npx sequelize db:migrate"
run_command "Executando seeders" "npx sequelize db:seed:all"

# Voltar para o diretório raiz
cd ..

echo -e "\n========================================"
echo -e "${GREEN}✅ Fix concluído com sucesso!${NC}"
echo -e "========================================"

echo -e "\n${CYAN}📝 Para iniciar o servidor de desenvolvimento:${NC}"
echo -e "   cd backend"
echo -e "   npm run dev"

echo -e "\n${CYAN}🌐 URLs do projeto:${NC}"
echo -e "   Backend:  http://localhost:8080"
echo -e "   Frontend: http://localhost:3000"

echo -e "\n${CYAN}📊 Credenciais do banco:${NC}"
echo -e "   Host: $DB_HOST"
echo -e "   Porta: $DB_PORT"
echo -e "   Banco: $DB_NAME"
echo -e "   Usuário: $DB_USER"
echo -e "   Senha: $DB_PASS"

echo -e "\n${YELLOW}Pressione Enter para sair...${NC}"
read