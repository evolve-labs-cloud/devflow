---
trigger: "nova feature|new feature|implementar feature|criar feature|quero implementar|preciso de uma feature"
category: planning
priority: high
---

# Nova Feature

Invoca o pipeline completo de planejamento para a feature descrita em `$ARGUMENTS`.

## O que fazer

1. Leia `$ARGUMENTS` como a descrição da feature a implementar.
2. Se `$ARGUMENTS` estiver vazio, peça ao usuário: "Descreva a feature em 1-2 frases."
3. Invoque imediatamente o `@strategist` passando a descrição como tarefa.

O `@strategist` irá:
- Criar `docs/planning/stories/{feature}-story.md` com acceptance criteria mensuráveis
- Mapear escopo IN/OUT, dependências e riscos
- Classificar complexidade (TRIVIAL/SIMPLE/MODERATE/COMPLEX)
- Indicar quais agentes são necessários

Após o `@strategist` concluir, o fluxo natural continua com `@architect` (design técnico) → `@builder` (implementação) → `@guardian` (review).

## Uso direto

```
/quick:new-feature Adicionar autenticação JWT com refresh token rotation
/quick:new-feature Exportar relatórios em PDF no painel de eventos
```

**Tarefa recebida:** $ARGUMENTS
