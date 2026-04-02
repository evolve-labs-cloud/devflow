# Spec: Rate Limiting

## Objetivo
Adicionar rate limiting global e por endpoint na API Express existente.

## Acceptance Criteria
- [ ] Rate limiting global: 100 req/min por IP em todos os endpoints
- [ ] Rate limiting específico: 5 req/min por IP em `POST /auth/login`
- [ ] Response `429 Too Many Requests` com header `Retry-After` quando limite excedido
- [ ] Configuração via variáveis de ambiente (`RATE_LIMIT_GLOBAL`, `RATE_LIMIT_AUTH`)
- [ ] Teste de integração validando que o limite é aplicado corretamente

## Escopo
**IN:** middleware de rate limiting, configuração, testes
**OUT:** rate limiting por usuário autenticado, Redis distributed rate limiting

## Estimativa
**Complexidade**: SIMPLE
