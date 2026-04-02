# Spec: formatDate Utility

## Objetivo
Adicionar função utilitária `formatDate(date)` ao projeto.

## Acceptance Criteria
- [ ] Função `formatDate(date: Date): string` exportada de `src/utils/date.ts`
- [ ] Retorna string no formato `YYYY-MM-DD` com zero-padding (ex: `2026-04-01`)
- [ ] Lança `TypeError` para input `null`, `undefined`, non-Date ou `Invalid Date`
- [ ] Teste unitário em `src/utils/__tests__/date.test.ts` cobrindo happy path + 3 error cases

## Escopo
**IN:** `src/utils/date.ts`, `src/utils/__tests__/date.test.ts`
**OUT:** outros formatos de data, timezone handling, internacionalização

## Estimativa
**Complexidade**: TRIVIAL
