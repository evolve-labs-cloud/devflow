# ADR-024: Separação @guardian (Qualidade) e @sentinel (Segurança)

**Status:** Accepted ✅  
**Decision Date:** 2026-05-02  
**Decided by:** Architect Agent  
**PRD de referência:** docs/planning/prd-sentinel-agent.md  
**Versão alvo:** 1.4.0  

---

## Context

DevFlow v1.3.x mantém qualidade, testes E segurança no `@guardian`. Isso cria sobrecarga de responsabilidade e torna a segurança opt-in — só é executada quando explicitamente chamada ou via `--challenger`.

Projetos com dados sensíveis precisam de auditoria de segurança sistemática, com domínio de OWASP, CVEs, STRIDE, CVSS — que é incompatível com ser simultaneamente especialista em testes de regressão, coverage e performance.

---

## Decision

**Criar `@sentinel`** como agente especializado em segurança e **refocalizar `@guardian`** exclusivamente em qualidade e testes.

Pipeline atualizado:
```
strategist → architect → system-designer → builder → guardian → sentinel → challenger → chronicler
```

`@sentinel` entra **after** `@guardian` (não antes) porque:
1. Audita código funcional que já passou pelos testes
2. Pode solicitar testes de segurança adicionais ao @guardian
3. @challenger (OpenAI) valida o trabalho de @sentinel com perspectiva independente

`@sentinel` é **parte do pipeline padrão** (não opt-in), alinhado com o ethos de "segurança by default."

---

## Rationale

### Por que separar?

1. **Single Responsibility**: @guardian com 5 responsabilidades (unit tests, integration, E2E, performance, security) é um agente fraco em todas. Dois agentes especializados são mais eficazes.

2. **Segurança by default**: Colocar @sentinel no pipeline padrão garante que nenhum código vai para produção sem auditoria de segurança — mesmo que o dev não saiba pedir.

3. **Domínio profundo**: OWASP ASVS, STRIDE, CVSS v4.0, CWE Top 25 e 0-day mindset requerem especialização que não cabe junto de test coverage e performance profiling.

4. **Regression explícita**: Ao liberar @guardian de segurança, ele pode focar em Regression Map explícito — "o que funciona antes não pode quebrar com nova implementação."

### Por que @sentinel após @guardian (não antes)?

- @guardian prova que o código funciona → @sentinel audita código funcional
- @sentinel pode identificar gaps de testes de segurança → @guardian pode cobrir na próxima iteração
- @challenger (OpenAI o3) já atua como revisor adversarial independente → @sentinel alimenta @challenger com contexto de segurança estruturado

### Alternativas consideradas

**Opção A: Manter no @guardian, adicionar sub-especialização**
- Pros: Menor impacto em arquivos
- Cons: @guardian continuaria sobrecarregado; segurança ainda opt-in
- Rejeitado: não resolve o problema raiz

**Opção B: @sentinel paralelo ao @guardian**
- Pros: Pipeline mais rápido
- Cons: @sentinel pode pedir testes de segurança que @guardian já concluiu; ordering confuso
- Rejeitado: dependência de sequência é clara

**Opção C: @sentinel substituindo @challenger**
- Pros: Não adiciona fase ao pipeline
- Cons: @challenger usa OpenAI o3 (perspectiva externa independente); @sentinel usa Claude (mesmo modelo); são complementares, não substitutos
- Rejeitado: perspectivas diferentes, ambos têm valor

---

## Consequences

### Positive
- ✅ Segurança auditada em 100% dos pipelines por padrão
- ✅ @guardian produz Regression Map explícito em todo output
- ✅ Boundary claro: @sentinel = segurança, @guardian = qualidade
- ✅ @sentinel pode solicitar novos testes de segurança ao @guardian
- ✅ @challenger recebe contexto de segurança estruturado de @sentinel

### Negative
- ⚠️ Pipeline fica 1 fase mais longo (8 agentes vs 7)
  - Mitigação: `--adaptive` mode pode omitir @sentinel em tasks triviais
- ⚠️ `VALID_AGENTS`, `DEFAULT_PHASES`, `AGENT_PROMPTS`, `AGENT_TIMEOUTS`, `AGENT_CONTRACTS` em `autopilotConstants.js` precisam de atualização

### Risks
- **Risk**: @challenger estava recebendo output do @guardian como "security review" para o buildChallengerPrompt. Com a separação, @challenger deve receber output do @sentinel.
  - **Likelihood**: High (certeza)
  - **Impact**: High (@challenger perderia contexto de segurança se não ajustado)
  - **Mitigation**: Atualizar `buildChallengerPrompt` em `autopilot.js` para usar output do @sentinel como contexto de segurança

---

## Implementation — Arquivos Impactados

### lib/autopilotConstants.js — EDITAR (5 mudanças)

```js
// 1. VALID_AGENTS: adicionar 'sentinel' após 'guardian'
const VALID_AGENTS = [
  'strategist', 'architect', 'system-designer', 'builder', 
  'guardian', 'sentinel', 'challenger', 'chronicler',
];

// 2. AGENT_SKILLS: adicionar sentinel
const AGENT_SKILLS = {
  ...
  sentinel: '/agents:sentinel',
  ...
};

// 3. AGENT_PROMPTS: adicionar prompt para sentinel
sentinel: `Você é o Sentinel — Security Specialist (análise defensiva).
Spec/Tarefa: {spec_content}
PASSO 1 — AUDIT DE SEGURANÇA: [...]
`,

// 4. AGENT_TIMEOUTS: adicionar timeout sentinel
sentinel: 600,

// 5. DEFAULT_PHASES: inserir sentinel entre guardian e challenger
{ id: 'sentinel', name: 'Security Audit' },

// 6. AGENT_CONTRACTS: adicionar contract
sentinel: {
  requiredSections: ['Sentinel Security Report', 'CVSS', 'Findings'],
  minLength: 300,
  forbiddenPatterns: [],
},
```

### lib/autopilot.js — EDITAR (2 mudanças)

```js
// 1. Color mapping: adicionar sentinel
sentinel: c.red,  // red = security/danger

// 2. buildChallengerPrompt context: usar output do sentinel (não guardian)
// Challenger deve receber output do sentinel como "security context"
// Lógica atual: usa previousOutputs[previousOutputs.length - 1]
// Novo: busca output do sentinel especificamente
```

**ATENÇÃO CRÍTICA**: `buildChallengerPrompt` em `autopilotConstants.js` linha ~575 constrói o prompt do @challenger usando `guardianOutput` como "security & quality assessment". Com @sentinel após @guardian, o @challenger deve receber o output do @sentinel como contexto de segurança — e o output do @guardian como contexto de qualidade separado. Isso requer ajuste na assinatura de `buildChallengerPrompt`.

### .claude/commands/agents/sentinel.md — CRIAR (novo agente)
### .claude/commands/agents/sentinel.meta.yaml — CRIAR
### .claude/commands/agents/guardian.md — EDITAR (remover segurança, adicionar Regression Map)
### .claude/commands/agents/guardian.meta.yaml — EDITAR
### .claude/commands/agents/team.md — EDITAR (adicionar @sentinel)
### .claude/commands/devflow-help.md — EDITAR (8 agentes, pipeline)
### .claude_project — EDITAR (pipeline line 23)
### README.md — EDITAR (tabela 7→8 agentes, versão 1.4.0)
### docs/CHANGELOG.md — EDITAR (entry [1.4.0])
### package.json — EDITAR (version, description)
### devflow_pro/ — SYNC tudo

### constants.js — NÃO precisa de mudança
`constants.js` usa `AGENTS_COPY` que copia diretórios inteiros (`.claude/commands/agents`), não lista nomes de agentes individuais. O novo `sentinel.md` será automaticamente copiado.

---

## Implementation Status

- [ ] sentinel.md criado
- [ ] sentinel.meta.yaml criado  
- [ ] guardian.md refocado
- [ ] autopilotConstants.js atualizado (6 pontos)
- [ ] autopilot.js atualizado (2 pontos — color + challenger prompt)
- [ ] devflow-help.md atualizado
- [ ] .claude_project atualizado
- [ ] README.md atualizado
- [ ] package.json version bump 1.4.0
- [ ] CHANGELOG.md entry
- [ ] devflow_pro sync

---

## References

- PRD: docs/planning/prd-sentinel-agent.md
- ADR-023: docs/decisions/ADR-023-agent-scaling-mechanism.md
- OWASP Top 10 2021: https://owasp.org/Top10/
- CWE Top 25: https://cwe.mitre.org/top25/
- CVSS v3.1: https://www.first.org/cvss/v3.1/specification-document
