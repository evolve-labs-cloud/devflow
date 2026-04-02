---
trigger: "security check|auditoria de segurança|verificar segurança|security audit|vulnerabilidades|owasp"
category: quality
priority: high
---

# Security Check

Executa auditoria de segurança no escopo descrito em `$ARGUMENTS` usando o `@guardian`.

## O que fazer

1. Leia `$ARGUMENTS` como o escopo do audit (módulo, arquivo, feature ou "projeto inteiro").
2. Se `$ARGUMENTS` estiver vazio, audite o projeto inteiro (todos os arquivos em `src/`).
3. Invoque imediatamente o `@guardian` com as instruções abaixo.

## Instruções para o @guardian

Execute security audit completo no escopo: **$ARGUMENTS**

Cobertura obrigatória:
- **OWASP Top 10**: injection (SQL/NoSQL/command), XSS, CSRF, broken auth, insecure deserialization
- **Secrets expostos**: API keys, tokens, passwords hardcoded ou em `.env` commitado
- **Dependências**: `npm audit` / `pip audit` — CVEs críticos e high
- **Configuração**: CORS permissivo, HTTPS não forçado, headers de segurança ausentes
- **Input validation**: sanitização de inputs do usuário em endpoints públicos
- **Auth/AuthZ**: tokens com expiração adequada, RBAC implementado corretamente

Severidade obrigatória por finding:
- 🔴 CRITICAL (CVSS 9+) — bloqueia produção, requer fix imediato
- 🟠 HIGH (CVSS 7-8.9) — fix antes do próximo deploy
- 🟡 MEDIUM (CVSS 4-6.9) — fix no próximo sprint
- 🟢 LOW (CVSS < 4) — melhoria recomendada

Salve o relatório em `docs/security/audit-{DATA}.md` com: finding | severidade | arquivo:linha | risco | fix sugerido.

## Uso direto

```
/quick:security-check
/quick:security-check src/auth/
/quick:security-check módulo de pagamentos
```

**Escopo:** $ARGUMENTS
