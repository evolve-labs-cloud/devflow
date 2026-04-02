# Spec: JWT Authentication

## Objetivo
Implementar autenticação JWT com access token (15min) e refresh token rotation (7 dias).

## Acceptance Criteria
- [ ] `POST /auth/login` — recebe `{email, password}`, retorna `{accessToken, refreshToken}`
- [ ] `POST /auth/refresh` — recebe `{refreshToken}`, retorna novo par de tokens (rotation)
- [ ] `POST /auth/logout` — invalida o refresh token
- [ ] Middleware `requireAuth` que valida o access token e injeta `req.user`
- [ ] Refresh tokens armazenados em banco (não apenas em memória)
- [ ] Tokens inválidos/expirados retornam `401` com mensagem clara
- [ ] Rate limiting em `/auth/login`: máx 5 tentativas/minuto por IP

## Escopo
**IN:** `src/auth/` (controller, service, middleware), migrations de banco, testes de integração
**OUT:** OAuth2, social login, 2FA, password reset

## Estimativa
**Complexidade**: MODERATE
