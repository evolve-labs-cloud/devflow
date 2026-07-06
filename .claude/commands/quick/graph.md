---
trigger: "knowledge graph|grafo|regenerar grafo|atualizar grafo|reconcile grafo|graph check"
category: documentation
priority: medium
---

# Knowledge Graph

Regenera ou reconcilia o **knowledge graph** do projeto (`.devflow/knowledge-graph.json`) — o mapa
de agentes, decisões (ADRs), features e documentos. O modo (`regenerate` ou `check`) vem de `$ARGUMENTS`.

## O que fazer

1. Leia `$ARGUMENTS`:
   - `regenerate` → reconstruir o grafo a partir das fontes
   - `check`      → só reconcile (reportar drift, não escrever)
   - vazio/ambíguo → rode `check` primeiro; se houver drift, pergunte se deve `regenerate`
2. Invoque o `@chronicler` com `/graph <modo>`, seguindo a capability
   **🕸️ KNOWLEDGE GRAPH — Aterrado e Regenerável** em `.claude/commands/agents/chronicler.md`.

## Instruções para o @chronicler

Fontes autoritativas (derive a ESTRUTURA delas — NÃO invente nós/edges):
- `.devflow/project.yaml` — agents, features, decisions, metrics (fonte de verdade)
- `docs/decisions/*.md` — ADRs reais no disco (id + título do 1º heading)
- `.claude/commands/agents/*.md` — arquivos de agente (paths canônicos)
- `.claude/commands/devflow-help.md` — fluxo do pipeline (edges `flows_to`)

Regras (NÃO enfraquecer):
- **Grounding:** todo nó tem `file` que EXISTE; todo edge liga nós reais; sem edges especulativos.
- **Segurança:** nunca embuta segredos ou valores de env no grafo.
- **Manifesto:** grave `sources[]` com os arquivos usados + `generated` (data).
- **Reconcile (`check`):** compare grafo vs fontes (contagem de agentes vs `metrics.total_agents`,
  `node.file` inexistente, ADRs/features faltando) e reporte divergências — não corrija em silêncio.

## Uso direto

```
/quick:graph check        # reporta drift entre grafo e fontes (não escreve)
/quick:graph regenerate   # reconstrói o grafo a partir das fontes (grounded)
```

**Tarefa recebida:** $ARGUMENTS
