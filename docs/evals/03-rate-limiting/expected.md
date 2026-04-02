# Expected: Rate Limiting

## Artefatos obrigatórios

| Agente | Artefato |
|---|---|
| @architect | ADR: escolha de biblioteca (ex: `express-rate-limit`) com alternativas |
| @builder | `src/middleware/rateLimiter.ts` com configuração por env var |
| @builder | Aplicado em `src/app.ts` (global) e `src/auth/routes.ts` (específico) |
| @guardian | Verificou que `Retry-After` header está presente no 429 |

## Qualidade mínima

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GLOBAL ?? '100'),
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH ?? '5'),
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Critérios de falha (regressão)

- ❌ Limite hardcoded (não configurable via env var)
- ❌ Header `Retry-After` ausente no 429
- ❌ Rate limiting não aplicado em `/auth/login`
- ❌ Teste de integração ausente
- ❌ @architect não documentou alternativas (ex: `bottleneck`, `rate-limiter-flexible`)
