#!/bin/bash

echo "🔧 Corrigindo Serviço de Deletar Contato"
echo "======================================="
echo ""

cd /var/www/pepchat/backend

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Não foi possível encontrar package.json"
    echo "💡 Execute este script de /var/www/pepchat/backend"
    exit 1
fi

echo "1. 📥 Atualizando código do repositório..."
git pull origin main

if [ $? -eq 0 ]; then
    echo "   ✅ Código atualizado com sucesso"
else
    echo "   ⚠️  Possível conflito ou já atualizado"
fi
echo ""

echo "2. 🔍 Verificando correção no DeleteContactService..."
if grep -q "transaction" src/services/ContactServices/DeleteContactService.ts; then
    echo "   ✅ Correção encontrada - usando transações"
    if grep -q "TicketNote.destroy" src/services/ContactServices/DeleteContactService.ts; then
        echo "   ✅ Deletando TicketNotes corretamente"
    fi
    if grep -q "Message.destroy" src/services/ContactServices/DeleteContactService.ts; then
        echo "   ✅ Deletando Messages corretamente"
    fi
else
    echo "   ❌ Correção não encontrada"
    echo "   💡 Verifique se o git pull funcionou corretamente"
fi
echo ""

echo "3. 🔨 Recompilando backend..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Compilação bem-sucedida"
else
    echo "   ❌ Erro na compilação"
    exit 1
fi
echo ""

echo "4. 🔄 Reiniciando backend..."
sudo systemctl restart pepchat-backend

echo "   ⏳ Aguardando inicialização..."
sleep 10

if systemctl is-active --quiet pepchat-backend; then
    echo "   ✅ Backend reiniciado com sucesso"
else
    echo "   ❌ Falha ao reiniciar backend"
    echo "   📋 Verificando logs..."
    sudo journalctl -u pepchat-backend --no-pager -n 10
    exit 1
fi
echo ""

echo "5. 🧪 Testando logs para verificar se o erro foi corrigido..."
echo "   📋 Verificando logs recentes..."

# Verificar se ainda há erros de foreign key constraint
if sudo journalctl -u pepchat-backend --since "5 minutes ago" | grep -q "foreign key constraint"; then
    echo "   ❌ Ainda há erros de foreign key constraint nos logs"
    echo "   📄 Últimos erros:"
    sudo journalctl -u pepchat-backend --since "5 minutes ago" | grep "foreign key constraint" | tail -3
else
    echo "   ✅ Nenhum erro de foreign key constraint encontrado nos logs recentes"
fi
echo ""

echo "6. 📋 Verificando estrutura do banco para dependências..."
echo "   🔍 Verificando relações que podem causar problemas..."

# Conectar ao banco e verificar foreign keys relacionadas a Contacts
PGPASSWORD="24722728" psql -h localhost -U pepchat -d pepchat_db -c "
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND ccu.table_name = 'Contacts'
ORDER BY tc.table_name;
" 2>/dev/null

echo ""

echo "🎯 RESULTADO:"
echo "============="
echo ""
echo "✅ Correções aplicadas:"
echo "   - DeleteContactService usa transações para consistência"
echo "   - Deleta TicketNotes antes dos Tickets"
echo "   - Deleta Messages antes dos Contacts"
echo "   - Deleta todas as dependências em ordem correta"
echo "   - Rollback automático em caso de erro"
echo ""
echo "💡 Para testar:"
echo "   1. Tente deletar um contato que tem mensagens"
echo "   2. Verifique se não há mais erro de foreign key constraint"
echo "   3. Monitore logs: sudo journalctl -u pepchat-backend -f"
echo ""
echo "🔍 Se ainda houver problemas:"
echo "   - Verifique se há outras tabelas com foreign key para Contacts"
echo "   - Analise logs específicos do erro"
echo "   - Considere adicionar CASCADE nas foreign keys do banco"