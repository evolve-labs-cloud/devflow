# Quick Security Check

Vou invocar @guardian para fazer uma auditoria de segurança rápida.

## O que será analisado:

1. **Código**:
   - SQL injection vulnerabilities
   - XSS vulnerabilities
   - CSRF protection
   - Input validation
   - Authentication/Authorization

2. **Dependências**:
   - Packages vulneráveis
   - Versões desatualizadas

3. **Configuração**:
   - Secrets expostos
   - Environment variables
   - CORS configuration
   - HTTPS enforcement

4. **Best Practices**:
   - Password hashing
   - Token management
   - Rate limiting
   - Error handling

---

## Invocando @guardian

```
@guardian

Por favor, realizar security audit completo:

1. Scan código para vulnerabilidades comuns (OWASP Top 10)
2. Verificar dependências (npm audit / pip audit)
3. Revisar configurações de segurança
4. Verificar se há secrets expostos no código
5. Gerar relatório em docs/security/audit-[data].md

Focar em:
- Autenticação e autorização
- Validação de inputs
- Proteção contra ataques comuns
- Gestão de secrets
```

---

**Executando security audit...**
