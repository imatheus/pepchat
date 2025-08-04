
s# Script de Fix para Localhost - PepChat
# Executa todo o processo de reset do banco e rebuild do projeto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SCRIPT DE FIX PARA LOCALHOST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Configurações do banco (ambiente de desenvolvimento)
$DB_NAME = "smart_atendimento_db"
$DB_USER = "postgres"
$DB_PASS = "root"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Função para executar comandos e verificar erros
function Invoke-CommandWithCheck {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "`n$Description..." -ForegroundColor Yellow
    
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Comando falhou com código de saída: $LASTEXITCODE"
        }
        Write-Host "OK - $Description concluído" -ForegroundColor Green
    }
    catch {
        Write-Host "ERRO em: $Description" -ForegroundColor Red
        Write-Host "Erro: $_" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

# Verificar se estamos no diretório correto
if (!(Test-Path "backend")) {
    Write-Host "ERRO: Diretório 'backend' não encontrado. Execute o script na raiz do projeto." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Configurar variável de ambiente para PostgreSQL
$env:PGPASSWORD = $DB_PASS

# Matar conexões ativas no banco
Write-Host "`nMatando conexões ativas no banco..." -ForegroundColor Yellow
$killConnectionsQuery = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

try {
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c $killConnectionsQuery
    Write-Host "OK - Conexões terminadas" -ForegroundColor Green
}
catch {
    Write-Host "AVISO: Não foi possível terminar algumas conexões (pode ser normal)" -ForegroundColor Yellow
}

# Mudar para o diretório backend
Set-Location backend


# Build do backend PRIMEIRO (necessário para o Sequelize)
Invoke-CommandWithCheck "npm run build" "Buildando backend"

# Dropar banco
Invoke-CommandWithCheck "npx sequelize db:drop" "Dropando banco"

# Criar banco
Invoke-CommandWithCheck "npx sequelize db:create" "Criando banco novamente"

# Executar migrations
Invoke-CommandWithCheck "npx sequelize db:migrate" "Executando migrations"

# Executar seeders
Invoke-CommandWithCheck "npx sequelize db:seed:all" "Executando seeders"

# Voltar para o diretório raiz
Set-Location ..

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "OK - Fix concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nPara iniciar o servidor de desenvolvimento:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White

Write-Host "`nURLs do projeto:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8080" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White

Write-Host "`nCredenciais do banco:" -ForegroundColor Cyan
Write-Host "   Host: $DB_HOST" -ForegroundColor White
Write-Host "   Porta: $DB_PORT" -ForegroundColor White
Write-Host "   Banco: $DB_NAME" -ForegroundColor White
Write-Host "   Usuário: $DB_USER" -ForegroundColor White
Write-Host "   Senha: $DB_PASS" -ForegroundColor White

Read-Host "`nPressione Enter para sair"