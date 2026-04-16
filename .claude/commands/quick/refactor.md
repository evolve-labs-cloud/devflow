---
trigger: "refactor|refatorar|refatoração|clean up|limpar código|reorganizar|extrair função|rename|renomear"
category: quality
priority: medium
---

# Refactor

Invoca `@architect` + `@builder` para refatoração segura do escopo descrito em `$ARGUMENTS`.

## O que fazer

1. Leia `$ARGUMENTS` como o escopo do refactor (arquivo, módulo, padrão ou objetivo).
2. Se `$ARGUMENTS` estiver vazio, pergunte o escopo antes de prosseguir.
3. Siga o fluxo architect → builder sem pedir confirmação adicional.

## Fluxo de execução

**Passo 1 — @architect analisa e planeja:**

Use Skill tool com skill="agents:architect" e instrua:

```
Analise o escopo de refactor: $ARGUMENTS

Seu objetivo:
1. Leia os arquivos em escopo — entenda o código atual
2. Identifique problemas: duplicação, acoplamento, violações SOLID, naming, complexidade
3. Proponha o plano de refactor: quais mudanças, em que ordem, risco de cada uma
4. Documente como ADR apenas se a mudança afetar arquitetura (ex: extrair módulo, mudar padrão global)
5. NÃO implemente — apenas planeje e documente

Critérios de um bom refactor:
- Comportamento externo INALTERADO (testes passam antes e depois)
- Cada mudança é atômica e reversível
- Nomeação clara e consistente com o restante do projeto
- Zero novos TODOs ou tech debt introduzidos

Retorne: lista de mudanças priorizadas com justificativa e risco (ALTO/MÉDIO/BAIXO).
```

**Passo 2 — @builder implementa:**

Use Skill tool com skill="agents:builder" e instrua:

```
Implemente o refactor planejado pelo @architect: $ARGUMENTS

Regras obrigatórias:
1. Siga o plano do @architect — não invente mudanças extras
2. Uma mudança por vez — commit atômico por mudança significativa
3. NÃO altere comportamento externo — apenas estrutura interna
4. NÃO adicione features, logs, comentários ou docstrings além do necessário
5. NÃO refatore código fora do escopo definido

Ao finalizar:
- Rode os testes (se existirem) e confirme que passam
- Retorne lista de arquivos modificados com descrição de cada mudança
```

## Hard Stops

- ⛔ NÃO refatore + adicione feature ao mesmo tempo — são PRs separados
- ⛔ NÃO mude comportamento observável (APIs públicas, contratos de módulo)
- ⛔ NÃO pule a fase do @architect para refactors de escopo médio/grande

---

**Tarefa recebida:** $ARGUMENTS
