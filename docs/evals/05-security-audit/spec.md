# Spec: Security Audit — API de Autenticação

## Objetivo
Realizar audit de segurança no módulo de autenticação antes do deploy em produção.

## Escopo
Arquivos em `src/auth/`:
- `src/auth/controller.ts`
- `src/auth/service.ts`
- `src/auth/middleware.ts`

## Acceptance Criteria
- [ ] OWASP Top 10 verificado para os arquivos em escopo
- [ ] Dependências auditadas (`npm audit`)
- [ ] Relatório gerado em `docs/security/audit-{data}.md`
- [ ] Findings classificados por severidade (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] Cada finding com: arquivo:linha, risco, fix sugerido

## Estimativa
**Complexidade**: SIMPLE
**Agentes**: guardian, challenger
