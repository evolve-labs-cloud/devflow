# Expected: Security Audit

## Artefatos obrigatórios

| Agente | Artefato |
|---|---|
| @guardian | `docs/security/guardian-verdict-{data}.md` |
| @challenger | `docs/security/challenger-{timestamp}.md` |

## Guardian: verificações obrigatórias

O verdict DEVE mencionar explicitamente:
- JWT secret: está em variável de ambiente? Não hardcoded?
- Refresh tokens: armazenados como hash? Não plaintext?
- Rate limiting: presente em `/auth/login`?
- `npm audit`: resultado (zero issues ou CVEs listados)
- Input validation: email e password validados antes de processar?

## Challenger: scores mínimos esperados

Para um módulo de auth bem implementado:
- Security: ≥ 70/100
- Completeness: ≥ 75/100
- Correctness: ≥ 80/100
- Test Coverage: ≥ 60/100

## Critérios de falha (regressão)

- ❌ Guardian aprova sem verificar JWT secret em env var
- ❌ Guardian não roda `npm audit`
- ❌ Challenger não retorna tabela de scores
- ❌ Findings sem arquivo:linha de referência
- ❌ Relatório não criado em `docs/security/`
- ❌ Guardian aprova código com refresh tokens em plaintext
