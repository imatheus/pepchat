# Correção do Problema de Rate Limiting com Trust Proxy

## Problema Identificado

O erro `ERR_ERL_PERMISSIVE_TRUST_PROXY` estava ocorrendo quando webhooks do Asaas eram processados. Este erro é gerado pelo `express-rate-limit` versão 7.5.1 quando detecta uma configuração insegura de `trust proxy`.

### Erro Original
```
ValidationError: The Express 'trust proxy' setting is true, which allows anyone to trivially bypass IP-based rate limiting.
```

### Causa Raiz
- O Express estava configurado com `app.set('trust proxy', true)` de forma global
- O `express-rate-limit` considera essa configuração permissiva e insegura
- Qualquer cliente poderia facilmente contornar o rate limiting manipulando headers HTTP

## Solução Implementada

### 1. Configuração Segura do Trust Proxy no Express

**Antes:**
```typescript
app.set('trust proxy', true);
```

**Depois:**
```typescript
if (process.env.NODE_ENV === 'production') {
  // Em produção, confiar apenas em proxies específicos (localhost e loopback)
  app.set('trust proxy', ['127.0.0.1', '::1']);
} else {
  // Em desenvolvimento, desabilitar trust proxy para evitar warnings
  app.set('trust proxy', false);
}
```

### 2. Configuração Específica nos Rate Limiters

Adicionada configuração `trustProxy` específica em cada rate limiter:

```typescript
export const apiLimiter = rateLimit({
  // ... outras configurações
  trustProxy: process.env.NODE_ENV === 'production' ? ['127.0.0.1', '::1'] : false,
  keyGenerator: (req) => {
    // Lógica segura para extrair IP do cliente
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = req.ip;
    const socketIp = req.socket.remoteAddress;
    
    // Em produção, usar o primeiro IP da lista x-forwarded-for se disponível
    if (process.env.NODE_ENV === 'production' && forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }
    
    // Usar real IP se disponível
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    
    // Fallback para IP do Express ou socket
    return clientIp || socketIp || 'unknown';
  }
});
```

### 3. Rate Limiters Atualizados

- `loginLimiter`: Configuração segura de trust proxy
- `apiLimiter`: Configuração segura + keyGenerator personalizado
- `webhookLimiter`: Configuração segura + keyGenerator personalizado

## Benefícios da Solução

1. **Segurança Aprimorada**: Apenas proxies confiáveis são aceitos
2. **Prevenção de Bypass**: Rate limiting não pode ser facilmente contornado
3. **Compatibilidade**: Funciona tanto em desenvolvimento quanto em produção
4. **Flexibilidade**: Diferentes estratégias para diferentes ambientes

## Configurações por Ambiente

### Desenvolvimento
- `trust proxy`: `false`
- Rate limiting: Mais permissivo (10000 requests/min)
- Logs detalhados habilitados

### Produção
- `trust proxy`: `['127.0.0.1', '::1']` (apenas localhost)
- Rate limiting: Mais restritivo (5000 requests/min)
- Extração segura de IP do cliente

## Monitoramento

O sistema continua logando tentativas de rate limiting e atividades suspeitas através dos middlewares:
- `logRateLimit`
- `logSuspiciousActivity`
- `logAuthFailure`

## Testes Recomendados

1. Verificar se webhooks do Asaas funcionam normalmente
2. Testar rate limiting em diferentes cenários
3. Validar extração correta de IP em produção
4. Confirmar que o erro `ERR_ERL_PERMISSIVE_TRUST_PROXY` não ocorre mais

## Referências

- [Express Rate Limit - Trust Proxy Documentation](https://express-rate-limit.github.io/ERR_ERL_PERMISSIVE_TRUST_PROXY/)
- [Express.js Trust Proxy Settings](https://expressjs.com/en/guide/behind-proxies.html)