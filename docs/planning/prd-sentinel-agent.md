# PRD: @sentinel — Agente de Segurança DevFlow v1.4.0

**Autor**: @strategist  
**Data**: 2026-05-02  
**Status**: Draft  
**Versão alvo**: 1.4.0  

---

## 1. Visão Geral

### Problema

O DevFlow v1.3.x concentra qualidade, testes E segurança num único agente (`@guardian`). Isso cria dois problemas:

1. **Sobrecarga de responsabilidade**: @guardian não pode ser especialista profundo em segurança (0-day, CVEs, threat modeling, OWASP ASVS) e ao mesmo tempo especialista em testes de regressão, coverage e performance. O agente faz tudo medianamente.

2. **Segurança como opt-in**: Hoje segurança profunda só acontece quando o usuário explicitamente pede um security audit ou chama `@challenger`. Para projetos que lidam com dados sensíveis, pagamentos ou autenticação, isso é risco real.

### Solução

Separar as responsabilidades em dois agentes especializados:

- **`@sentinel`** (novo): Especialista em segurança ofensiva/defensiva — vulnerabilidades, CVEs, threat modeling, 0-day research, frameworks de segurança, análise de supply chain
- **`@guardian`** (refocado): Especialista em qualidade — testes unitários, integração, E2E, regressão, performance, coverage

Segurança vira **obrigatória no pipeline por padrão**: `builder → guardian → sentinel → challenger`

### Alinhamento com o Ethos da Anthropic

`@sentinel` segue os princípios de segurança responsável do Claude:
- **Foco defensivo**: descobre e documenta vulnerabilidades para correção, não para exploração
- **Não destrutivo**: nunca executa exploits ativos, não cria payloads maliciosos, não compromete sistemas reais
- **Responsible disclosure**: findings ficam nos docs do projeto, não são expostos externamente
- **Educativo**: cada finding explica o risco, o impacto e o fix — não apenas o que está errado

---

## 2. Objetivos

| Objetivo | Métrica de Sucesso |
|---|---|
| Segurança por padrão no pipeline | @sentinel roda em 100% dos pipelines sem flag adicional |
| Guardian focado em qualidade | @guardian não menciona segurança ofensiva em seu output |
| Cobertura de regressão explícita | @guardian produz "Regression Map" mostrando o que existia e ainda funciona |
| Detecção de vulnerabilidades common | @sentinel cobre OWASP Top 10 + CWE Top 25 em cada audit |
| Sem breaking changes | Projetos em 1.3.x atualizam via `devflow update --force` sem reconfigurar |

---

## 3. Personas

### Dev / Tech Lead (usuário principal)
- Quer segurança sem precisar ser especialista
- Não quer falsos positivos que bloqueiam o pipeline
- Quer evidências claras para justificar bugs de segurança ao time

### Security Engineer (usuário avançado)
- Usa @sentinel para audits mais profundos
- Precisa de findings com CVSS score, CWE-ID, referências
- Exporta relatório para ferramentas de gestão (Jira, Linear)

### Desenvolvedor iniciante
- Não sabe o que é OWASP
- Precisa que @sentinel explique o risco em linguagem simples
- Precisa de fix sugerido que possa aplicar sem expertise em segurança

---

## 4. Requisitos Funcionais

### 4.1 @sentinel — O Agente

#### Identidade
- **Nome**: Sentinel Agent
- **Papel**: Security Specialist (ofensivo-defensivo, postura defensiva)
- **Hard Stops**: NUNCA implementar fixes de produção, NUNCA executar exploits ativos, NUNCA acessar sistemas externos sem autorização explícita, NUNCA criar malware ou payloads destrutivos

#### Capacidades Obrigatórias

**Frameworks de Segurança (deve dominar todos):**
- OWASP Top 10 (Web Application Security)
- OWASP ASVS (Application Security Verification Standard)
- CWE Top 25 (Common Weakness Enumeration)
- CVSS v3.1/v4.0 (scoring de severidade)
- NIST Cybersecurity Framework
- STRIDE (Threat Modeling)
- MITRE ATT&CK (padrões de ataque para contexto)

**Tipos de Análise:**
- Static analysis (code review para vulnerabilidades)
- Dependency audit (CVEs em packages, supply chain)
- Authentication & authorization review (JWT, OAuth, RBAC, session management)
- Input validation (injection, XSS, deserialization)
- Cryptography review (algoritmos fracos, key management)
- Secrets detection (tokens, API keys, credenciais expostas)
- Infrastructure-as-Code security (Docker, K8s, cloud configs)
- API security (rate limiting, auth, data exposure)
- 0-day mindset: analisar código como atacante, não só checar listas conhecidas

**Output de cada finding:**
```
| Campo | Valor |
|---|---|
| ID | SENT-001 |
| Título | SQL Injection em user search endpoint |
| Severidade | CRITICAL (CVSS 9.8) |
| CWE | CWE-89: SQL Injection |
| OWASP | A03:2021 – Injection |
| Arquivo | src/api/users.ts:142 |
| Evidência | `db.query("SELECT * FROM users WHERE id=" + userId)` |
| Risco | Atacante pode extrair/modificar qualquer dado do banco |
| Fix | Usar prepared statements: `db.query("SELECT * FROM users WHERE id=?", [userId])` |
| Referências | https://owasp.org/Top10/A03_2021-Injection/ |
```

#### Parallel Subagents do @sentinel

| Teammate | Responsabilidade |
|---|---|
| `@vuln-scanner` | OWASP Top 10, injection, XSS, auth flaws — análise estática do código |
| `@dependency-auditor` | CVEs em dependências, packages desatualizados, supply chain |
| `@secrets-detector` | Tokens, API keys, credenciais, segredos hardcoded |
| `@threat-modeler` | STRIDE threat modeling, attack surface analysis, trust boundaries |
| `@crypto-reviewer` | Criptografia fraca, key management, algoritmos deprecated |

#### Modo Team (@sentinel team)

Peers: `@red-teamer`, `@blue-teamer`, `@compliance-analyst`, `@pentest-strategist`

- `@red-teamer`: abordagem ofensiva — como atacante exploraria o código
- `@blue-teamer`: abordagem defensiva — como detectar e responder ao ataque
- `@compliance-analyst`: verifica LGPD, PCI-DSS, SOC2, ISO 27001 (conforme contexto)
- `@pentest-strategist`: estratégia de pentest para o módulo, prioriza vetores de ataque

#### Posição no Pipeline

```
strategist → architect → system-designer → builder → guardian → sentinel → challenger → chronicler
```

@sentinel roda **após @guardian** porque:
1. Os testes do @guardian provam que o código funciona — @sentinel audita código funcional
2. @sentinel pode sugerir testes de segurança adicionais que @guardian ainda não tem
3. @challenger (OpenAI) valida o trabalho de @sentinel com perspectiva independente

#### Integração com outros agentes

- **@builder**: quando @sentinel encontra vulnerabilidade → builder corrige
- **@guardian**: @sentinel pode requisitar novos testes de segurança (ex: test para SQL injection fix)
- **@challenger**: @sentinel sempre chama @challenger para módulos CRITICAL/HIGH
- **@architect**: se vulnerabilidade tem raiz arquitetural → @sentinel escalona para @architect

### 4.2 @guardian — Refoco em Qualidade

#### Remoção de responsabilidades de segurança
- Remove: OWASP scanning, CVE detection, vulnerability severity (CRITICAL/HIGH/MEDIUM/LOW por CVSS)
- Remove: `@owasp-scanner` como teammate (vai para @sentinel)
- Remove: `@dependency-auditor` como teammate (vai para @sentinel)
- Mantém: `@performance-tester`, `@test-generator`, `@coverage-analyst`
- Adiciona: `@regression-analyst` (explica o que existia antes e ainda funciona)

#### Regression Map (novo output obrigatório)

Guardian deve produzir explicitamente para cada review:

```markdown
## Regression Map

### O que existia antes desta implementação
| Feature | Testes cobrindo | Status após mudança |
|---|---|---|
| Login com email/senha | 8 testes | ✅ Todos passando |
| Reset de senha | 3 testes | ✅ Todos passando |
| OAuth Google | 5 testes | ✅ Todos passando |

### Novas implementações testadas
| Feature | Novos testes | Coverage |
|---|---|---|
| Login com magic link | 6 testes | 87% |

### Risco de regressão
- NENHUM — todas as funcionalidades existentes mantidas
```

Isso torna explícito: "o que já funciona, não quebrou."

#### Hard Stop atualizado para @guardian
```
@guardian NÃO faz:
- Security audit de vulnerabilidades (→ @sentinel)
- CVE/OWASP scanning (→ @sentinel)
- Dependency security audit (→ @sentinel)
- Threat modeling (→ @sentinel)

@guardian FAZ:
- Unit tests, integration tests, E2E tests
- Regression testing (com Regression Map explícito)
- Performance testing (load, latency, throughput)
- Code coverage analysis
- Quality gates (linting, type safety)
```

---

## 5. Requisitos Não-Funcionais

- **Sem breaking changes**: `devflow update --force` aplica tudo — usuários existentes não reconfiguram nada
- **Performance do pipeline**: @sentinel roda em paralelo onde possível (subagents)
- **Relatórios persistidos**: findings em `docs/security/sentinel-{feature}-YYYY-MM-DD.md`
- **Scoring padronizado**: CVSS v3.1 para todos os findings, sem pontuação inventada
- **Ethos defensivo**: nenhum output de @sentinel pode ser usado diretamente como exploit — sempre contextualizado para fix

---

## 6. Out of Scope (v1.4.0)

- Integração com ferramentas externas de SAST (Snyk, Semgrep, SonarQube) — v1.5.0
- Scan automático de repositório git completo (apenas código novo/modificado) — v1.5.0
- Dashboard de postura de segurança — v2.0.0
- Integração com bug bounty platforms — futuro

---

## 7. User Stories

### Epic: EPIC-SENTINEL-001 — Novo Agente @sentinel

| ID | Story | Prioridade |
|---|---|---|
| US-SENT-001 | Como dev, quero que @sentinel audite código após @guardian automaticamente | Must Have |
| US-SENT-002 | Como dev, quero findings com CVSS score, CWE-ID e fix sugerido | Must Have |
| US-SENT-003 | Como dev, quero que @sentinel rode subagents em paralelo para audits grandes | Must Have |
| US-SENT-004 | Como security eng, quero @sentinel team com red/blue teamers | Should Have |
| US-SENT-005 | Como dev, quero que @sentinel não execute exploits — apenas documente | Must Have (ético) |

### Epic: EPIC-GUARDIAN-002 — Refoco do @guardian

| ID | Story | Prioridade |
|---|---|---|
| US-GUARD-001 | Como dev, quero Regression Map explícito em todo output do @guardian | Must Have |
| US-GUARD-002 | Como dev, quero que @guardian remova responsabilidades de segurança ofensiva | Must Have |
| US-GUARD-003 | Como dev, quero @regression-analyst como novo teammate do @guardian | Should Have |

### Epic: EPIC-PIPELINE-003 — Pipeline Atualizado

| ID | Story | Prioridade |
|---|---|---|
| US-PIPE-001 | Como dev, quero pipeline: builder → guardian → sentinel → challenger → chronicler | Must Have |
| US-PIPE-002 | Como dev, quero devflow-help.md atualizado com 8 agentes | Must Have |
| US-PIPE-003 | Como dev, quero devflow update --force sem reconfiguração manual | Must Have |

---

## 8. Priorização (MoSCoW)

**Must Have (v1.4.0):**
- sentinel.md com estrutura completa (HARD STOP, SEMPRE FAÇA, EXIT CHECKLIST, subagents, modo team)
- sentinel.meta.yaml
- guardian.md refocado (remove OWASP/CVE, adiciona Regression Map, adiciona @regression-analyst)
- Pipeline order atualizado em: devflow-help.md, README.md, CHANGELOG.md, .claude_project
- autopilot.js: @sentinel na sequência de fases
- Sync devflow_pro

**Should Have (v1.4.0):**
- ADR documentando a separação de responsabilidades
- Quick command `/security-check` atualizado para chamar @sentinel

**Could Have (v1.4.0):**
- team.md atualizado com @sentinel nos peers
- Atualizar todos os outros agentes (architect, builder, etc.) nas seções "Como trabalho com outros agentes"

---

## 9. Impacto em Arquivos Existentes

| Arquivo | Mudança |
|---|---|
| `.claude/commands/agents/sentinel.md` | CRIAR (novo) |
| `.claude/commands/agents/sentinel.meta.yaml` | CRIAR (novo) |
| `.claude/commands/agents/guardian.md` | EDITAR (remover segurança, adicionar Regression Map) |
| `.claude/commands/agents/guardian.meta.yaml` | EDITAR (atualizar description) |
| `.claude/commands/agents/team.md` | EDITAR (adicionar @sentinel) |
| `.claude/commands/devflow-help.md` | EDITAR (8 agentes, pipeline atualizado) |
| `.claude_project` | EDITAR (pipeline atualizado) |
| `lib/autopilot.js` | EDITAR (adicionar sentinel na fase order) |
| `lib/constants.js` | VERIFICAR (se há lista de agentes hardcoded) |
| `README.md` | EDITAR (tabela de 7→8 agentes, pipeline, versão 1.4.0) |
| `docs/CHANGELOG.md` | EDITAR (entry [1.4.0]) |
| `package.json` | EDITAR (version 1.4.0, description) |
| `devflow_pro/` | SYNC tudo acima |

---

## 10. Success Metrics

- [ ] `@sentinel` roda após `@guardian` em toda pipeline autopilot
- [ ] Cada finding de @sentinel tem: ID, título, severidade CVSS, CWE-ID, arquivo:linha, evidência, fix, referência
- [ ] `@guardian` não produz mais OWASP findings ou CVE analysis
- [ ] `@guardian` produz Regression Map em todo output
- [ ] `devflow update --force` em projeto 1.3.x funciona sem erros
- [ ] 0 breaking changes reportados em projetos existentes

---

## 11. Referências

- OWASP Top 10 2021: https://owasp.org/Top10/
- CWE Top 25 2023: https://cwe.mitre.org/top25/
- CVSS v3.1: https://www.first.org/cvss/v3.1/specification-document
- NIST CSF: https://www.nist.gov/cyberframework
- Claude Usage Policy (security): https://www.anthropic.com/legal/usage-policy
- ADR-023 (Scaling): docs/decisions/ADR-023-agent-scaling-mechanism.md
