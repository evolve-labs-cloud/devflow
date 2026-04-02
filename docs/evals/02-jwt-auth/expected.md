# Expected: JWT Authentication

## Artefatos obrigatórios

| Agente | Artefato |
|---|---|
| @strategist | `docs/planning/stories/jwt-auth-story.md` com ACs mensuráveis |
| @architect | `docs/decisions/ADR-XXX-jwt-authentication.md` — decision: JWT + refresh rotation |
| @builder | `src/auth/controller.ts`, `src/auth/service.ts`, `src/auth/middleware.ts` |
| @builder | Migration criando tabela `refresh_tokens` |
| @guardian | `docs/security/guardian-verdict-{data}.md` — deve reportar rate limiting |
| @chronicler | `docs/CHANGELOG.md` atualizado + snapshot |

## Qualidade mínima

**ADR obrigatório deve conter:**
- Decisão: JWT com refresh token rotation (não session-based)
- Alternativa considerada: session tokens
- Trade-off documentado: stateless vs revogação imediata

**Service obrigatório deve conter:**
- `generateTokenPair(userId)` → `{accessToken, refreshToken}`
- `rotateRefreshToken(token)` → invalida o antigo, gera novo par
- `revokeRefreshToken(token)` → soft delete no banco

**Segurança obrigatória:**
- Access token: `exp: 15min`, signed com `RS256` ou `HS256`
- Refresh token: armazenado como hash no banco (não plaintext)
- Rate limiting em login: 5 req/min por IP

## Critérios de falha (regressão)

- ❌ Refresh tokens armazenados apenas em memória
- ❌ Tokens sem expiração configurada
- ❌ Rate limiting ausente em `/auth/login`
- ❌ @guardian aprova sem mencionar rate limiting
- ❌ Migration não criada (schema apenas comentado)
- ❌ Refresh tokens em plaintext no banco
