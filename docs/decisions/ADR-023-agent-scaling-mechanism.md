# ADR-023: Agent Scaling Mechanism — Parallel Subagents vs Claude Agent Teams

**Status:** Accepted ✅
**Decision Date:** 2026-03-20
**Decided by:** Architect Agent
**Trigger:** Guardian Agent finding — discrepância entre implementação (Agent tool) e label ("Claude Agent Teams") no Team Lead Mode de todos os 6 agentes.
**Guardian Report:** Sessão 2026-03-20, Finding #1 HIGH severity

---

## Context

O Guardian Agent identificou que o **Team Lead Mode** implementado nos 6 agentes DevFlow usa `Agent tool` com `subagent_type: "general-purpose"` — o mecanismo de subagents padrão — mas o código o rotulava como "Claude Agent Teams", que é um mecanismo experimental diferente.

### Os dois mecanismos existentes

**Agent tool (subagents):**
- Claude chama a ferramenta `Agent` durante sua resposta
- Spawna workers isolados que executam uma tarefa e retornam resultado
- Comunicação apenas pai → filho
- Sem task list compartilhada entre irmãos
- **Funciona hoje, sem flags experimentais**

**Claude Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`):**
- Claude Code (REPL) spawna instâncias Claude peer
- Comunicação direta entre teammates via mailbox compartilhado
- Shared task list entre todos os membros do time
- Navegação com `Shift+Down` entre teammates
- Split-pane (tmux/iTerm2)
- Tokens 3-5x maiores por ser N instâncias Claude
- **Requer flag experimental e Claude Code v2.1.32+**

### Casos de uso de cada mecanismo

| Cenário | Mecanismo correto | Por quê |
|---|---|---|
| Architect spawna schema-specialist + api-designer | **Agent tool** | Sub-tarefas independentes, pai sintetiza |
| Guardian spawna owasp-scanner + perf-tester | **Agent tool** | Análises paralelas independentes |
| Builder spawna backend-dev + frontend-dev | **Agent tool** | Tracks independentes, integração no final |
| Architect + Guardian debatem ADR de segurança | **Agent Teams** | Peer discussion, cross-agent, não parent-child |
| Code review multi-perspectiva em tempo real | **Agent Teams** | Múltiplos agentes precisam interagir entre si |
| Debug com múltiplas hipóteses competindo | **Agent Teams** | Hipóteses requerem confrontação entre pares |

---

## Decision

**Team Lead Mode nos 6 agentes usa Parallel Subagents (Agent tool), não Claude Agent Teams.**

A nomenclatura e framing são atualizados em todos os 6 arquivos de agente para refletir isso com precisão.

### Arquitetura definida

```
┌─────────────────────────────────────────────────────────────┐
│  WITHIN-DOMAIN SCALING (intra-agente)                       │
│  Mecanismo: Agent tool (subagents)                          │
│                                                             │
│  @architect → @schema-specialist                            │
│            → @api-contract-designer    (paralelo)          │
│            → @adr-researcher                                │
│            → sintetiza no agente pai                        │
│                                                             │
│  Funciona HOJE. Sem flags. Sem requisitos extras.           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CROSS-DOMAIN COLLABORATION (inter-agente)                  │
│  Mecanismo: Claude Agent Teams (REPL experimental)          │
│                                                             │
│  @architect ←──(debate)──→ @guardian                       │
│  @builder   ←──(review)──→ @strategist   (peer)           │
│                                                             │
│  Via: /agents:team skill                                    │
│  Requer: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1            │
└─────────────────────────────────────────────────────────────┘
```

---

## Rationale

### Por que Agent tool para Team Lead Mode?

1. **Os casos de uso não exigem comunicação peer-to-peer.** Quando o @architect spawna um @schema-specialist e um @api-designer, eles trabalham em partes INDEPENDENTES do design. Não precisam debater entre si — o pai define as sub-tarefas, eles as executam, o pai sintetiza. Model parent-child é o correto.

2. **Funciona hoje sem requisitos.** Nenhum usuário precisa habilitar flags experimentais ou ter uma versão específica do Claude Code para que os agentes possam escalar. Qualidade não deve depender de flags experimentais.

3. **Custo controlado.** Agent Teams aumenta tokens 3-5x por ser N instâncias Claude paralelas com contexto completo. Subagents são mais eficientes para trabalho independente.

4. **Separação de responsabilidades clara.** Within-domain scaling (um agente dividindo seu próprio trabalho) ≠ Cross-domain collaboration (agentes peer discutindo entre si). São needs diferentes que justificam mecanismos diferentes.

### Por que manter Agent Teams no `/agents:team`?

`/agents:team` serve o caso de uso onde múltiplos agentes *peer* precisam colaborar em tempo real — code review simultâneo de segurança + performance + design, debug com hipóteses competindo, system design colaborativo. Esses cenários requerem comunicação entre pares, que é exatamente o que Agent Teams provê.

---

## Alternatives Considered

### Alternativa 1: Usar Claude Agent Teams em ambos os mecanismos
**Rejeitada porque:**
- Team Lead Mode para within-domain scaling não precisa de peer communication
- Aumentaria custo de tokens sem benefício real para esses casos
- Dependência desnecessária do flag experimental

### Alternativa 2: Manter Agent tool mas não mudar labels
**Rejeitada porque:**
- Induz usuários a esperar comunicação peer-to-peer que não existe
- Viola o princípio de documentação honesta do DevFlow

### Alternativa 3: Detectar o flag e usar mecanismo certo automaticamente
**Rejeitada porque:**
- Skills são markdown — Claude não pode detectar env vars de forma confiável
- Complexidade sem ganho claro
- Dois code paths para manter

---

## Consequences

### Positivo
- ✅ Implementação honesta e precisa
- ✅ Team Lead Mode funciona sem flags experimentais
- ✅ Separação clara de responsabilidades: within-domain vs cross-domain
- ✅ Custo de tokens menor para escalonamento de agente único
- ✅ Sem dependência de Claude Code experimental version

### Negativo
- ⚠️ Teammates no Team Lead Mode não podem se comunicar diretamente entre si
  - **Mitigação:** Para os casos de uso previstos (sub-tarefas independentes), isso não é necessário
- ⚠️ Usuários que esperavam peer communication nos agentes individuais ficarão surpresos
  - **Mitigação:** Documentação clara na seção Team Lead Mode de cada agente

---

## Implementation

### Mudanças necessárias nos 6 agentes

Em cada arquivo `.claude/commands/agents/*.md`, na seção `## 🔀 TEAM LEAD MODE`:

1. Renomear "TEAM LEAD MODE — SCALING AUTÔNOMO" → "SCALING AUTÔNOMO — PARALLEL SUBAGENTS"
2. Substituir linguagem que implica Agent Teams por linguagem de subagents
3. Adicionar nota explicando a distinção com `/agents:team`

### Arquivos a atualizar
- `.claude/commands/agents/architect.md`
- `.claude/commands/agents/builder.md`
- `.claude/commands/agents/guardian.md`
- `.claude/commands/agents/strategist.md`
- `.claude/commands/agents/chronicler.md`
- `.claude/commands/agents/system-designer.md`

---

## Modo Team por Agente

Cada agente DevFlow agora suporta **dois modos de scaling**:

### Modo Padrão — Parallel Subagents (Agent tool)
Ativado automaticamente quando o agente detecta trabalho paralelo. Sem argumentos especiais.

### Modo Team — Claude Agent Teams
Ativado quando o agente é invocado com o argumento `team`:
```
/agents:strategist team <tarefa>
/agents:architect team <tarefa>
/agents:builder team <tarefa>
/agents:guardian team <tarefa>
/agents:chronicler team <tarefa>
/agents:system-designer team <tarefa>
```

**Pré-requisito:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` em `.claude/settings.json` + Claude Code v2.1.32+

**Backward compatibility:** Sem o argumento `team`, todos os agentes continuam usando Parallel Subagents (comportamento anterior inalterado).

### Teammates por Agente no Modo Team

| Agente | Teammates no Modo Team |
|---|---|
| `@strategist` | @user-story-writer, @competitive-analyst, @acceptance-criteria-expert, @roadmap-planner |
| `@architect` | @schema-specialist, @api-contract-designer, @adr-researcher, @diagram-builder |
| `@builder` | @backend-dev, @frontend-dev, @test-writer, @migration-writer, @api-integrator |
| `@guardian` | @owasp-scanner, @dependency-auditor, @performance-tester, @test-generator, @coverage-analyst |
| `@chronicler` | @changelog-writer, @docs-synchronizer, @snapshot-creator, @adr-linker, @status-auditor |
| `@system-designer` | @capacity-calculator, @failure-mode-analyst, @infrastructure-planner, @slo-architect, @data-flow-designer |

### Quando usar Modo Team vs Modo Padrão

| Cenário | Modo recomendado |
|---|---|
| Sub-tarefas independentes dentro de um domínio | Modo Padrão (subagents) |
| Debate e revisão entre especialistas do mesmo domínio | Modo Team (Agent Teams) |
| Custo é prioridade | Modo Padrão (1x tokens) |
| Qualidade máxima com peers interagindo | Modo Team (3-5x tokens) |

---

## References

- Guardian Agent report — Finding #1 HIGH: "Implementação usa subagents, não Claude Agent Teams" (2026-03-20)
- `team.md` linha 41: "Para pesquisa rápida: use o Agent tool (subagents) em vez de Agent Teams"
- Claude Code Agent Teams documentation: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Adição do Modo Team em cada agente: 2026-03-20
