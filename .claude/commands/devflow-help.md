# DevFlow - Guia Completo dos Agentes

Você está usando **DevFlow v1.1.1** - Sistema multi-agentes para desenvolvimento.

## 🤖 Os 6 Agentes

### @strategist - Planejamento & Produto
**Use quando:** Iniciar nova feature, criar requisitos, definir prioridades
**Output:** PRDs, User Stories, Product Specs
**Exemplo:** `@strategist Criar dashboard de analytics`

### @architect - Design & Arquitetura
**Use quando:** Decisões técnicas, escolha de tech stack, design de sistemas
**Output:** ADRs, Database schemas, API design
**Exemplo:** `@architect Design sistema de autenticação`

### @system-designer - System Design & Infraestrutura
**Use quando:** Projetar sistemas em escala, capacity planning, SLOs, infra, reliability
**Output:** SDDs, RFCs, Capacity Plans, Trade-off Analysis
**Exemplo:** `@system-designer /system-design Chat system para 10M usuários`

### @builder - Implementação
**Use quando:** Escrever código, implementar features, refactoring
**Output:** Código, testes unitários, reviews
**Exemplo:** `@builder Implementar login com JWT`

### @guardian - Qualidade & Segurança
**Use quando:** Testes, security audit, performance review
**Output:** Testes E2E, security reports, performance audits
**Exemplo:** `@guardian Revisar segurança da API`

### @chronicler - Documentação & Memória
**Use quando:** Documentar feature, criar changelog, snapshots
**Output:** CHANGELOG, Snapshots, Documentation
**Exemplo:** `@chronicler Documentar nova feature`

---

## 🔄 Fluxo de Trabalho

```
@strategist → @architect → @system-designer → @builder → @guardian → @chronicler
```

1. **Planejamento** (@strategist): Define o QUÊ fazer
2. **Design** (@architect): Define COMO fazer tecnicamente (patterns, ADRs)
3. **System Design** (@system-designer): Projeta COMO funciona em escala/produção
4. **Implementação** (@builder): Faz acontecer
5. **Qualidade** (@guardian): Garante que está correto
6. **Documentação** (@chronicler): Registra para sempre

---

## 🚀 Dois Modos de Scaling por Agente

Cada agente pode operar em dois modos:

### Modo Padrão — Parallel Subagents
Ativado automaticamente. O agente spawna workers isolados para sub-tarefas independentes.
```
/agents:strategist Criar PRD para sistema de pagamentos
```

### Modo Team — Claude Agent Teams *(experimental)*
Ativado com o argumento **`team`**. O agente coordena peers que se comunicam diretamente.
```
/agents:strategist team Criar PRD para sistema de pagamentos
/agents:architect team Design de microservices para e-commerce
/agents:builder team Implementar autenticação JWT completa
/agents:guardian team Audit completo de segurança e qualidade
/agents:chronicler team Documentar release v2.0
/agents:system-designer team Design de sistema para 50M usuários
```

**Pré-requisito para Modo Team:**
```json
// .claude/settings.json
{
  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" },
  "teammateMode": "auto"
}
```
Requer Claude Code v2.1.32+. Verifique: `claude --version`

**Quando usar cada modo:**

| | Modo Padrão | Modo Team |
|---|---|---|
| **Comunicação** | Pai → Filho | Peers direto |
| **Custo** | 1x tokens | 3-5x tokens |
| **Uso ideal** | Sub-tarefas independentes | Debate/revisão entre especialistas |
| **Setup** | Automático | Requer flag experimental |

**Teammates de cada agente no Modo Team:**
- `@strategist team`: @user-story-writer, @competitive-analyst, @acceptance-criteria-expert, @roadmap-planner
- `@architect team`: @schema-specialist, @api-contract-designer, @adr-researcher, @diagram-builder
- `@builder team`: @backend-dev, @frontend-dev, @test-writer, @migration-writer, @api-integrator
- `@guardian team`: @owasp-scanner, @dependency-auditor, @performance-tester, @test-generator, @coverage-analyst
- `@chronicler team`: @changelog-writer, @docs-synchronizer, @snapshot-creator, @adr-linker, @status-auditor
- `@system-designer team`: @capacity-calculator, @failure-mode-analyst, @infrastructure-planner, @slo-architect, @data-flow-designer

> Referência completa: ADR-023 em `docs/decisions/ADR-023-agent-scaling-mechanism.md`

---

## ⚡ Slash Commands Rápidos

- `/devflow-status` - Ver estado atual do projeto
- `/devflow-workflow` - Visualizar fluxo e próximos passos
- `/new-feature` - Iniciar nova feature (wizard guiado)
- `/create-adr` - Criar Architecture Decision Record
- `/security-check` - Audit de segurança rápido
- `/system-design` - Criar System Design Document guiado

---

## 📁 Estrutura do Projeto

```
.devflow/
├── agents/              # 6 agentes especializados
├── snapshots/           # Histórico do projeto
├── project.yaml         # Estado atual
└── knowledge-graph.json # Conexões entre decisões

docs/
├── decisions/           # ADRs (Architecture Decision Records)
├── planning/stories/    # User stories
├── security/            # Security audits
└── performance/         # Performance reports
```

---

## 💡 Dicas

- **Hard Stops**: Cada agente tem limites rígidos - não pode fazer trabalho de outro
- **Delegação Obrigatória**: Sempre seguir o fluxo correto
- **Memória Automática**: @chronicler mantém tudo documentado
- **Dual Scaling**: Use Modo Team (`team`) para tarefas que exigem debate real entre especialistas
- **Zero Config**: Modo Padrão funciona sem configuração adicional

---

**Pronto para começar?**
`@strategist Olá! Quero criar [sua feature]`

**Com Modo Team:**
`/agents:strategist team Criar PRD completo para [sua feature]`
