---
trigger: "security check|auditoria de segurança|verificar segurança|security audit|vulnerabilidades|owasp"
category: quality
priority: high
---

# Security Check

Executa auditoria de segurança no escopo descrito em `$ARGUMENTS` usando o `@sentinel`.

## O que fazer

1. Leia `$ARGUMENTS` como o escopo do audit (módulo, arquivo, feature ou "projeto inteiro").
2. Se `$ARGUMENTS` estiver vazio, audite o projeto inteiro (todos os arquivos em `src/`).
3. Invoque imediatamente o `@sentinel` com as instruções abaixo.

## Instruções para o @sentinel

Execute security audit completo no escopo: **$ARGUMENTS**

Cobertura obrigatória:
- **OWASP Top 10**: injection (SQL/NoSQL/command), XSS, CSRF, broken auth, insecure deserialization, security misconfiguration, SSRF
- **CWE Top 25**: buffer overflow, use-after-free, improper input validation, missing authorization
- **Secrets expostos**: API keys, tokens, passwords hardcoded ou em `.env` commitado
- **Dependências**: `npm audit` / `pip audit` — CVEs críticos e high com CVSS
- **Configuração**: CORS permissivo, HTTPS não forçado, headers de segurança ausentes
- **Input validation**: sanitização de inputs do usuário em endpoints públicos
- **Auth/AuthZ**: tokens com expiração adequada, RBAC implementado corretamente
- **Threat modeling STRIDE**: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation
- **Crypto**: algoritmos fracos (MD5, SHA1, DES), keys hardcoded, entropy insuficiente

Severidade obrigatória por finding (CVSS v3.1):
- 🔴 CRITICAL (CVSS 9.0–10.0) — bloqueia produção, requer fix imediato
- 🟠 HIGH (CVSS 7.0–8.9) — fix antes do próximo deploy
- 🟡 MEDIUM (CVSS 4.0–6.9) — fix no próximo sprint
- 🟢 LOW (CVSS 0.1–3.9) — melhoria recomendada
- ⚪ INFO — sem risco imediato, melhoria de postura

Salve o relatório em `docs/security/sentinel-audit-{DATA}.md` com: ID | finding | severidade | CVSS | CWE | arquivo:linha | risco | fix sugerido.

## Uso direto

```
/quick:security-check
/quick:security-check src/auth/
/quick:security-check módulo de pagamentos
```

**Escopo:** $ARGUMENTS
