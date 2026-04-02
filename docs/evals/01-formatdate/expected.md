# Expected: formatDate Utility

## Artefatos obrigatórios

- `src/utils/date.ts` — exporta `formatDate(date: Date): string`
- `src/utils/__tests__/date.test.ts` — testes unitários
- `docs/planning/stories/formatdate-story.md` — criado pelo @strategist

## Qualidade mínima do código

```typescript
// src/utils/date.ts
export function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new TypeError('formatDate: invalid Date');
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

## Testes mínimos esperados

- `formatDate(new Date('2026-04-01'))` → `'2026-04-01'`
- `formatDate(new Date('2026-01-05'))` → `'2026-01-05'` (zero-padding)
- `formatDate(null)` → `TypeError`
- `formatDate(new Date('invalid'))` → `TypeError`
- `formatDate('2026-04-01')` → `TypeError` (string não é Date)

## Critérios de falha (regressão)

- ❌ Função retorna formato diferente de `YYYY-MM-DD`
- ❌ Mês/dia sem zero-padding
- ❌ Não lança erro para inputs inválidos
- ❌ Arquivo de teste não criado
- ❌ Código com TODO ou placeholder
- ❌ @builder criou ADR (scope creep — isso é trabalho do @architect)
