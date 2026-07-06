---
trigger: "wiki|repo wiki|gerar wiki|atualizar wiki|documentação navegável|agent wiki"
category: documentation
priority: medium
---

# Repo Wiki

Gera ou atualiza o **Repo Wiki** — a documentação navegável do código, otimizada para agentes,
mantida em `docs/wiki/`. O modo (`init` ou `update`) vem de `$ARGUMENTS`.

## O que fazer

1. Leia `$ARGUMENTS` para determinar o modo:
   - `init`   → gerar o wiki do zero
   - `update` → atualização incremental desde o último git ref documentado
   - vazio/ambíguo → detecte automaticamente: se `docs/wiki/quickstart.md` NÃO existe → `init`; se existe → `update`
2. Invoque imediatamente o `@chronicler` com o comando `/wiki <modo>`, seguindo a capability
   **📖 REPO WIKI** definida em `.claude/commands/agents/chronicler.md`.

## Instruções para o @chronicler

Execute a capability **Repo Wiki** no modo indicado. Regras obrigatórias (NÃO enfraquecer):

- **Grounding:** fundamente TODA afirmação em código-fonte, docs existentes ou git. Não invente arquivos ou comportamento.
- **Plano primeiro:** no `init`, crie `docs/wiki/_plan.md` (páginas + evidência) e DELETE antes de finalizar.
- **Orçamento:** máx. 8 páginas no `init`; `update` cirúrgico (< 5 arquivos alterados → máx. 1-2 páginas); pode ser no-op.
- **Segurança (first):** NUNCA embuta valores de env, tokens ou credenciais no wiki — referencie segredos por nome.
- **Estado:** atualize `.devflow/wiki-state.json` (`last_git_ref`, `content_hash`, `pages[].sources`/`hash`).
- **Âncora:** garanta a seção fixa `## Repo Wiki` em `CLAUDE.md`/`AGENTS.md` apontando para `docs/wiki/quickstart.md`.

Taxonomia fixa: `docs/wiki/quickstart.md` (índice que linka todas as seções) + um diretório por área REAL
(`architecture/`, `workflows/`, `domain/`, `api/`, `data-models/`, `operations/`, `integrations/`, `testing/`).
Não crie um diretório a menos que ele represente uma área real de documentação.

## Uso direto

```
/quick:wiki init      # gera docs/wiki/ do zero
/quick:wiki update    # atualização incremental (diff desde last_git_ref)
/quick:wiki           # detecta init vs update automaticamente
```

**Tarefa recebida:** $ARGUMENTS
