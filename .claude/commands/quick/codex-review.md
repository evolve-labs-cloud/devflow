---
trigger: "codex review|code review|revisar código|segunda opinião|pre-merge review|review antes do merge"
category: quality
priority: high
---

# Codex Review

Solicita review técnico independente do escopo descrito em `$ARGUMENTS`.

## O que fazer

1. Leia `$ARGUMENTS` como o escopo do review (diff atual, arquivos específicos ou "pre-merge").
2. Se `$ARGUMENTS` estiver vazio, use o diff atual do projeto.
3. Execute o review diretamente — não peça confirmação.

## Como executar o review

**Passo 1 — Identificar o escopo:**
- Sem argumento ou "diff": rode `git diff` para capturar mudanças locais
- Arquivos específicos: leia os arquivos listados em `$ARGUMENTS`
- "pre-merge": rode `git diff main...HEAD` para ver tudo na branch atual

**Passo 2 — Analisar com mindset de code reviewer adversarial:**

Priorize nesta ordem:
1. **Bugs e regressions** — lógica incorreta, edge cases não tratados, condições de corrida
2. **Segurança** — injection, XSS, auth bypass, secrets expostos, input não sanitizado
3. **Comportamento inesperado** — side effects, mutação de estado global, dependências implícitas
4. **Testes faltantes** — paths críticos sem cobertura, mocks que mascaram bugs reais
5. **Riscos arquiteturais** — acoplamento excessivo, violação de contratos de interface

**Passo 3 — Formato obrigatório de resposta:**

```
## Code Review

### Findings (ordenados por severidade)

🔴 CRITICAL: [título]
- Arquivo: path/to/file.ts:linha
- Problema: [descrição direta do bug/risco]
- Fix: [como corrigir]

🟠 HIGH: [título]
...

🟡 MEDIUM / 🟢 LOW: [título]
...

### Testes faltantes
- [path crítico sem cobertura]: [por que importa]

### Riscos residuais
- [risco aceito]: [mitigação sugerida]

### Veredito
APPROVE / REQUEST_CHANGES — [1 frase justificando]
```

Se não houver findings, diga explicitamente: "Nenhum finding encontrado. APPROVE."

## Uso direto

```
/quick:codex-review
/quick:codex-review src/auth/service.ts src/auth/controller.ts
/quick:codex-review pre-merge
```

**Escopo:** $ARGUMENTS
