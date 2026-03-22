# Codex Review

Use este comando quando quiser uma segunda opiniao tecnica do Codex no mesmo workspace, sem API e sem mudar o fluxo do Claude Code.

## Objetivo

Pedir ao Codex um review de codigo focado em:

1. Bugs e regressions
2. Riscos de arquitetura ou comportamento
3. Falhas de seguranca relevantes
4. Lacunas de testes

## Modos de uso

### 1. Diff atual

Use quando o usuario quer revisar as mudancas locais em andamento.

Exemplo:

```text
/codex-review
Revise o diff atual deste projeto.
```

### 2. Arquivos especificos

Use quando o usuario quer revisar apenas uma area delimitada.

Exemplo:

```text
/codex-review
Revise apenas:
- src/auth/service.ts
- src/auth/controller.ts
- tests/auth.spec.ts
```

### 3. Pre-merge

Use quando o usuario quer um parecer final antes de merge ou deploy.

Exemplo:

```text
/codex-review
Faca um review pre-merge das mudancas desta branch, com foco em regressions, seguranca e testes faltantes.
```

## Como o Claude deve agir

1. Identificar o escopo do review:
   - diff atual
   - arquivos especificos
   - branch/commit/PR local, se o usuario informar

2. Montar um handoff curto para o Codex com:
   - objetivo do review
   - contexto funcional
   - caminhos/arquivos relevantes
   - instrucoes para priorizar findings reais

3. Pedir explicitamente ao Codex:
   - mindset de code review
   - findings primeiro, ordenados por severidade
   - referencias de arquivo/linha
   - perguntas abertas apenas se necessario
   - resumo curto no final

4. Consolidar a resposta do Codex para o usuario sem perder:
   - severidade
   - impacto
   - referencias tecnicas

## Template de handoff

Use este template e preencha apenas o necessario:

```text
Revise este escopo como code review.

Escopo:
- [diff atual | arquivos especificos | pre-merge]

Contexto:
- [feature, bugfix, refactor, hotfix]
- [impacto funcional esperado]

Arquivos relevantes:
- [caminhos]

Foco:
- bugs
- regressions
- riscos comportamentais
- seguranca
- testes faltantes

Formato esperado:
- findings primeiro
- ordenados por severidade
- com referencias de arquivo/linha
- perguntas abertas so se forem necessarias
- se nao houver findings, diga isso explicitamente
```

## Prompt sugerido para o Codex

```text
Revise este projeto/escopo como code review. Priorize bugs, regressions, riscos comportamentais, seguranca e testes faltantes. Nao faca resumo longo. Traga findings primeiro, ordenados por severidade, com referencias de arquivo/linha. Se nao houver findings, diga isso explicitamente e cite riscos residuais.
```

## Quando usar

- Antes de merge
- Depois de uma implementacao relevante
- Para validar uma mudanca sensivel em auth, pagamentos, dados ou infraestrutura
- Quando quiser uma segunda opiniao tecnica independente

## Resultado esperado

O Claude deve devolver ao usuario:

1. Findings do Codex, sem diluir severidade
2. Perguntas abertas, se existirem
3. Um resumo curto do risco geral da mudanca
