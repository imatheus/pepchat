# Scripts de Fix para Localhost

Este diretório contém scripts para resetar completamente o ambiente de desenvolvimento local do PepChat.

## 📋 O que os scripts fazem

1. **Mata conexões ativas** no banco PostgreSQL
2. **Dropa o banco** existente
3. **Cria um novo banco** limpo
4. **Builda o backend**
5. **Executa as migrations** (estrutura do banco)
6. **Executa os seeders** (dados iniciais)

## 🗂️ Arquivos disponíveis

- `fix-localhost.bat` - Script para Windows (Command Prompt)
- `fix-localhost.ps1` - Script para Windows (PowerShell)
- `fix-localhost.sh` - Script para Linux/macOS/WSL/Git Bash

## 🔧 Configurações do banco (desenvolvimento)

```
Host: localhost
Porta: 5432
Banco: smart_atendimento_db
Usuário: postgres
Senha: root
```

## 🚀 Como usar

### Windows (Command Prompt)
```cmd
fix-localhost.bat
```

### Windows (PowerShell)
```powershell
# Pode ser necessário permitir execução de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Executar o script
.\fix-localhost.ps1
```

### Linux/macOS/WSL/Git Bash
```bash
# Dar permissão de execução
chmod +x fix-localhost.sh

# Executar o script
./fix-localhost.sh
```

## ⚠️ Pré-requisitos

1. **PostgreSQL** instalado e rodando na porta 5432
2. **Node.js** e **npm** instalados
3. **psql** disponível no PATH do sistema
4. Estar no **diretório raiz** do projeto PepChat

## 🔍 Verificações antes de executar

1. Certifique-se de que o PostgreSQL está rodando:
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Linux/macOS
   sudo systemctl start postgresql
   ```

2. Verifique se consegue conectar no banco:
   ```bash
   psql -h localhost -U postgres -d postgres
   ```

3. Certifique-se de estar no diretório correto:
   ```bash
   # Deve existir a pasta 'backend'
   ls -la | grep backend
   ```

## 🎯 Após executar o script

1. Entre no diretório backend:
   ```bash
   cd backend
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse as URLs:
   - **Backend**: http://localhost:8080
   - **Frontend**: http://localhost:3000

## 🐛 Solução de problemas

### Erro de conexão com PostgreSQL
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão manual com `psql`

### Erro de permissão (PowerShell)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro "comando não encontrado"
- Verifique se Node.js está instalado: `node --version`
- Verifique se npm está instalado: `npm --version`
- Verifique se psql está no PATH: `psql --version`

### Erro de dependências
```bash
cd backend
npm install
```

## 📝 Notas importantes

- ⚠️ **ATENÇÃO**: Este script **apaga todos os dados** do banco local
- 🔄 Use apenas em ambiente de **desenvolvimento**
- 💾 Faça backup de dados importantes antes de executar
- 🚫 **NUNCA** execute em produção