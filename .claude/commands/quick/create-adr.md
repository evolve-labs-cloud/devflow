---
trigger: "criar adr|create adr|decisão técnica|architecture decision|registrar decisão|adr"
category: architecture
priority: medium
---

# Criar ADR

Cria um Architecture Decision Record (ADR) para a decisão descrita em `$ARGUMENTS`.

## O que fazer

1. Leia `$ARGUMENTS` como a decisão técnica a documentar.
2. Se `$ARGUMENTS` estiver vazio, peça: "Qual decisão técnica você quer documentar?"
3. Invoque imediatamente o `@architect` com as instruções abaixo.

## Instruções para o @architect

Crie um ADR formal para a seguinte decisão: **$ARGUMENTS**

Antes de criar:
- Liste os ADRs existentes em `docs/decisions/` para escolher o próximo número sequencial
- Leia o template em `docs/decisions/000-template.md` se existir

O ADR deve conter obrigatoriamente:
- **Status**: Proposed | Accepted | Deprecated
- **Contexto**: problema que motivou a decisão e constraints existentes
- **Decisão**: o que foi decidido, em linguagem direta
- **Alternativas consideradas**: pelo menos 2 opções com prós/contras
- **Consequências**: benefícios esperados e trade-offs aceitos
- **Notas de implementação**: orientações para o @builder executar

Salve em `docs/decisions/ADR-{NNN}-{titulo-kebab-case}.md`.

Após criar, atualize o status do ADR para `Accepted` se a decisão já foi tomada.

## Uso direto

```
/quick:create-adr Usar PostgreSQL ao invés de MongoDB para persistência principal
/quick:create-adr Adotar JWT com refresh token rotation para autenticação
/quick:create-adr Migrar de REST para GraphQL no gateway público
```

**Decisão:** $ARGUMENTS
