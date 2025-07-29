# Correção do Problema de Cookies HttpOnly no Nginx

## Problema Identificado
O erro `ERR_SESSION_EXPIRED` ocorre porque o nginx não estava passando corretamente os cookies httpOnly para o backend, especialmente o cookie `jrt` (refresh token).

## Principais Correções Aplicadas no Nginx

### 1. Configuração Específica para API
```nginx
location /api/ {
    # CRÍTICO: Preservar cookies httpOnly
    proxy_pass_request_headers on;
    proxy_set_header Cookie $http_cookie;
    
    # Garantir que cookies sejam passados corretamente
    proxy_cookie_domain localhost pepchat.com.br;
    proxy_cookie_path / /;
    
    # Buffering desabilitado para melhor performance com cookies
    proxy_buffering off;
    proxy_request_buffering off;
}
```

### 2. Configuração Especial para Rotas de Autenticação
```nginx
location /api/auth/ {
    # ESSENCIAL: Preservar todos os headers de cookie
    proxy_pass_request_headers on;
    proxy_set_header Cookie $http_cookie;
    
    # Configuração específica para cookies de autenticação
    proxy_cookie_domain localhost pepchat.com.br;
    proxy_cookie_domain 127.0.0.1 pepchat.com.br;
    
    # Desabilitar cache para rotas de auth
    proxy_no_cache 1;
    proxy_cache_bypass 1;
}
```

## Configurações Adicionais Necessárias

### 1. Adicionar no Backend (.env.production)
```bash
# Adicionar esta linha no arquivo .env.production
COOKIE_DOMAIN=pepchat.com.br
```

### 2. Verificar Configuração do CORS no Backend
O arquivo `app.ts` já está correto, mas certifique-se de que está assim:
```typescript
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Não permitido pelo CORS"));
    }
  })
);
```

### 3. Comandos para Aplicar as Correções

#### No servidor de produção:
```bash
# 1. Fazer backup da configuração atual
sudo cp /etc/nginx/sites-available/pepchat.com.br /etc/nginx/sites-available/pepchat.com.br.backup

# 2. Copiar a nova configuração
sudo cp /caminho/para/nginx.conf /etc/nginx/sites-available/pepchat.com.br

# 3. Testar a configuração
sudo nginx -t

# 4. Se o teste passou, recarregar o nginx
sudo systemctl reload nginx

# 5. Adicionar COOKIE_DOMAIN no backend
echo "COOKIE_DOMAIN=pepchat.com.br" >> /var/www/pepchat/backend/.env.production

# 6. Reiniciar o backend (assumindo que usa PM2)
pm2 restart pepchat-backend
```

## Por que essas correções resolvem o problema?

### 1. `proxy_pass_request_headers on`
- Garante que TODOS os headers da requisição original sejam passados para o backend
- Inclui especificamente o header `Cookie`

### 2. `proxy_set_header Cookie $http_cookie`
- Explicitamente passa o header Cookie para o backend
- Essencial para cookies httpOnly

### 3. `proxy_cookie_domain`
- Reescreve o domínio dos cookies para o domínio correto
- Resolve problemas de cookies definidos para localhost/127.0.0.1

### 4. `proxy_buffering off`
- Desabilita o buffering que pode interferir com cookies
- Melhora a performance para requisições com cookies

### 5. Configuração especial para `/api/auth/`
- Rotas de autenticação recebem tratamento especial
- Cache desabilitado para evitar problemas com tokens

### 6. `COOKIE_DOMAIN=pepchat.com.br`
- Define explicitamente o domínio dos cookies no backend
- Garante que os cookies sejam válidos para o domínio correto

## Teste da Correção

Após aplicar as correções:

1. Faça login no sistema
2. Navegue para `/tickets` ou `/contacts`
3. Faça refresh da página (F5)
4. Verifique se não aparece mais o erro `ERR_SESSION_EXPIRED`

## Logs para Debug

Se ainda houver problemas, verifique os logs:

```bash
# Logs do nginx
sudo tail -f /var/log/nginx/pepchat_error.log

# Logs do backend
pm2 logs pepchat-backend

# Verificar cookies no browser
# F12 > Application > Cookies > https://pepchat.com.br
# Deve mostrar o cookie 'jrt' com httpOnly=true
```

## Observações Importantes

1. **Backup**: Sempre faça backup antes de alterar configurações
2. **Teste**: Use `nginx -t` antes de recarregar
3. **Monitoramento**: Monitore os logs após a aplicação
4. **Rollback**: Mantenha a configuração anterior para rollback se necessário

Esta configuração resolve especificamente o problema de cookies httpOnly em produção com nginx como proxy reverso.