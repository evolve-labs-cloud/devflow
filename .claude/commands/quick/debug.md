---
trigger: "debug|debugar|investigar bug|rastrear erro|por que falha|error|exception|crash|não funciona|broken"
category: quality
priority: high
---

# Debug

Invoca `@builder` para investigação estruturada do bug descrito em `$ARGUMENTS`.

## O que fazer

1. Leia `$ARGUMENTS` como a descrição do bug (mensagem de erro, comportamento inesperado, stack trace).
2. Se `$ARGUMENTS` estiver vazio, pergunte o problema antes de prosseguir.
3. Execute a investigação diretamente — não peça confirmação.

## Fluxo de execução

Use Skill tool com skill="agents:builder" e instrua:

```
Investigue e corrija o seguinte bug: $ARGUMENTS

## Fase 1 — Reprodução (OBRIGATÓRIO antes de qualquer fix)
1. Entenda o comportamento esperado vs. o comportamento atual
2. Identifique o caminho de código ativado quando o bug ocorre
3. Trace a execução: onde o estado diverge do esperado?
4. Se possível, escreva um teste que reproduza o bug (red test)

## Fase 2 — Root Cause Analysis
Investigue as hipóteses mais prováveis na ordem:
1. Estado mutado inesperadamente (side effects, referências compartilhadas)
2. Condição de corrida (async/await, callbacks, eventos)
3. Null/undefined propagado silenciosamente
4. Lógica de boundary incorreta (off-by-one, comparações ===  vs ==)
5. Dados de entrada inválidos que não são validados na borda do sistema
6. Dependência com comportamento diferente do esperado (versão, configuração)

Para cada hipótese: CONFIRME com evidência no código ou logs antes de concluir.

## Fase 3 — Fix
1. Corrija a causa raiz — não o sintoma
2. O fix deve ser mínimo: apenas o necessário para corrigir o bug
3. NÃO refatore código adjacente (refactoring → /quick:refactor separado)
4. NÃO adicione features ou melhorias junto ao fix
5. Se havia teste reproduzindo o bug (Fase 1): confirme que agora passa (green)

## Fase 4 — Prevenção
Identifique: este bug pode ocorrer em outros lugares do codebase com o mesmo padrão?
Se sim: liste os outros locais e sugira o fix (mas NÃO aplique sem aprovação).

## Retorno obrigatório
- Root cause encontrada: [arquivo:linha — descrição]
- Fix aplicado: [descrição em 1-2 linhas]
- Teste adicionado/corrigido: [sim/não — path]
- Outros locais com padrão similar: [lista ou "nenhum"]
```

## Hard Stops

- ⛔ NÃO aplique fix sem entender a root cause — "mascarar" o erro não é fix
- ⛔ NÃO misture refactor + fix no mesmo commit
- ⛔ NÃO assuma que o bug está no código mais recente — trace a execução primeiro

---

**Tarefa recebida:** $ARGUMENTS
