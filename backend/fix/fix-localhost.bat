@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    SCRIPT DE FIX PARA LOCALHOST
echo ========================================

REM Configurações do banco (ambiente de desenvolvimento)
set DB_NAME=smart_atendimento_db
set DB_USER=postgres
set DB_PASS=root
set DB_HOST=localhost
set DB_PORT=5432

echo.
echo 🔴 Matando conexões ativas no banco...
set PGPASSWORD=%DB_PASS%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%DB_NAME%' AND pid <> pg_backend_pid();"

if errorlevel 1 (
    echo ❌ Erro ao matar conexões do banco
    pause
    exit /b 1
)

echo.
echo Entrando no diretorio backend...
cd backend

echo.
echo Buildando backend...
call npm run build

if errorlevel 1 (
    echo Erro ao buildar backend
    pause
    exit /b 1
)

echo.
echo Dropando banco...
call npx sequelize db:drop

if errorlevel 1 (
    echo Erro ao dropar banco
    pause
    exit /b 1
)

echo.
echo Criando banco novamente...
call npx sequelize db:create

if errorlevel 1 (
    echo Erro ao criar banco
    pause
    exit /b 1
)

echo.
echo 📜 Executando migrations...
call npx sequelize db:migrate

if errorlevel 1 (
    echo ❌ Erro ao executar migrations
    pause
    exit /b 1
)

echo.
echo 🌱 Executando seeders...
call npx sequelize db:seed:all

if errorlevel 1 (
    echo ❌ Erro ao executar seeders
    pause
    exit /b 1
)

echo.
echo ✅ Fix concluído com sucesso!
echo.
echo 📝 Para iniciar o servidor de desenvolvimento, execute:
echo    cd backend
echo    npm run dev
echo.
echo 🌐 URLs do projeto:
echo    Backend:  http://localhost:8080
echo    Frontend: http://localhost:3000
echo.

cd ..
pause