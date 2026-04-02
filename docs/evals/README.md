# DevFlow Evals

Conjunto de especificações de referência para testar regressões nos agentes do DevFlow.

## Como usar

Cada eval é um par `{spec}.md` + `{spec}.expected.md`:
- **`{spec}.md`** — a spec de entrada que seria passada ao autopilot
- **`{spec}.expected.md`** — o output esperado (artefatos, decisões, qualidade mínima)

### Rodar um eval

```bash
devflow autopilot docs/evals/01-formatdate/spec.md --phases strategist,architect,builder
```

Compare o output gerado com `01-formatdate/expected.md` para detectar regressões.

### Critérios de avaliação

| Critério | Como medir |
|---|---|
| Artefatos criados | Arquivos em docs/ foram criados? |
| Acceptance criteria cobertos | Todos os ACs da spec foram implementados? |
| Formato dos documentos | Segue os templates do projeto? |
| Sem escopo creep | Agente não fez trabalho além do pedido? |
| Sem TODOs | Código completo, sem placeholders? |

---

## Evals disponíveis

| # | Nome | Complexidade | Fases testadas |
|---|---|---|---|
| 01 | formatdate-utility | TRIVIAL | strategist, architect, builder |
| 02 | jwt-auth | MODERATE | todos os 6 agentes |
| 03 | rate-limiting | SIMPLE | architect, builder, guardian |
| 04 | system-design-notifications | COMPLEX | system-designer |
| 05 | security-audit | SIMPLE | guardian, challenger |
