# DevFlow v1.3.0 - Sistema Multi-Agentes para Desenvolvimento de Software

Sistema de **7 agentes especializados** para desenvolvimento de software com Claude Code, com **Autopilot** para execução automatizada do pipeline completo.

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](docs/CHANGELOG.md)
[![npm](https://img.shields.io/npm/v/@evolve.labs/devflow.svg)](https://www.npmjs.com/package/@evolve.labs/devflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Instalacao

### Via npm (Recomendado)

```bash
# Instalar globalmente
npm install -g @evolve.labs/devflow

# Inicializar no seu projeto
devflow init /caminho/para/seu-projeto

# Ou usar npx (sem instalar)
npx @evolve.labs/devflow init
```

### Opcoes de instalacao

```bash
devflow init                    # Agentes + estrutura de docs (padrao)
devflow init --agents-only      # Apenas agentes (minimo)
devflow init --full             # Tudo incluindo .gitignore
```

### Comandos

```bash
devflow init [path]             # Inicializar DevFlow num projeto
devflow update [path]           # Atualizar instalacao existente
devflow autopilot <spec-file>   # Rodar autopilot nos agentes
devflow challenge [review-file] # Review adversarial com OpenAI (standalone)
```

### Requisitos

- **Claude Code CLI** (`npm i -g @anthropic-ai/claude-code`)
- **Node.js 18+**
- **Git** (recomendado)

---

## Os 7 Agentes

| #   | Agente                      | Funcao                      | Uso                                      |
| --- | --------------------------- | --------------------------- | ---------------------------------------- |
| 1   | **/agents:strategist**      | Planejamento & Produto      | Requisitos, PRDs, user stories           |
| 2   | **/agents:architect**       | Design & Arquitetura        | Decisoes tecnicas, ADRs, APIs            |
| 3   | **/agents:system-designer** | System Design & Escala      | SDDs, RFCs, capacity planning, SLOs      |
| 4   | **/agents:builder**         | Implementacao               | Codigo, reviews, refactoring             |
| 5   | **/agents:guardian**        | Qualidade & Seguranca       | Testes, security, performance            |
| 6   | **/agents:challenger**      | Review Adversarial (OpenAI) | Desafia o Guardian, encontra blind spots |
| 7   | **/agents:chronicler**      | Documentacao & Memoria      | CHANGELOG, snapshots, stories            |

Cada agente tem **hard stops** — limites rigidos que impedem de fazer trabalho de outros agentes.

> **Challenger requer** `OPENAI_API_KEY` — usa OpenAI o3 como perspectiva independente do Guardian.

### Fluxo de Trabalho

```
strategist → architect → system-designer → builder → guardian → challenger → chronicler
```

---

## Dois Modos de Scaling por Agente

### Modo Padrao — Parallel Subagents

Ativado automaticamente (sem argumento extra). Usa o `Agent tool` do Claude para criar workers isolados em paralelo.

```bash
/agents:builder implemente autenticacao JWT
```

### Modo Team — Claude Agent Teams

Ativado com o argumento `team`. Usa Claude Agent Teams (peers que se comunicam diretamente entre si).

```bash
/agents:builder team implemente autenticacao JWT
```

> **`devflow init` configura isso automaticamente.** Para instalaçoes existentes: `devflow update`.

|             | Modo Padrao               | Modo Team                  |
| ----------- | ------------------------- | -------------------------- |
| Trigger     | sem argumento             | argumento `team`           |
| Comunicacao | Pai → Filho               | Peers direto               |
| Setup       | Automatico                | Flag experimental          |
| Custo       | 1x tokens                 | 3-5x tokens                |
| Quando usar | Sub-tarefas independentes | Debate/revisao entre peers |

Use `/agents:team` para orquestracao cross-domain com todos os 6 agentes em paralelo.

---

## Autopilot

O autopilot executa os agentes em sequencia automaticamente com **Persistent Memory**, **Adaptive Planning** e **Context Isolation**.

```bash
# Rodar todas as fases
devflow autopilot docs/specs/minha-spec.md

# Adaptive: LLM decide quais fases rodar (TRIVIAL/SIMPLE/MODERATE/COMPLEX)
devflow autopilot docs/specs/minha-spec.md --adaptive

# Com Challenger (review adversarial OpenAI apos guardian)
devflow autopilot docs/specs/minha-spec.md --challenger

# Fases especificas
devflow autopilot docs/specs/minha-spec.md --phases "strategist,architect,builder"

# Desativar context isolation (usa todo o historico)
devflow autopilot docs/specs/minha-spec.md --full-context
```

### Flags do autopilot

```bash
--phases <list>             # Fases especificas (default: todos os 6 agentes)
--adaptive                  # LLM escolhe fases por complexidade
--full-context              # Desativa context isolation (N-1 output por padrao)
--challenger                # Review OpenAI apos guardian (requer OPENAI_API_KEY)
--challenger-model <model>  # gpt-5.4 (default), o3-mini, o3
--no-update                 # Nao marcar tasks como concluidas automaticamente
--verbose                   # Tokens por fase + memory stats
--project <path>            # Projeto alvo (default: cwd)
```

### Challenge Standalone

```bash
# Review adversarial do guardian output (requer OPENAI_API_KEY)
devflow challenge

# Passando arquivo especifico
devflow challenge docs/security/guardian-review.md

# Com spec para contexto
devflow challenge docs/security/guardian-review.md --spec docs/specs/feature.md

# Modelo (gpt-5.4 padrao, o3 para casos criticos)
devflow challenge --model o3
```

| Modelo    | Custo/review | Quando usar                               |
| --------- | ------------ | ----------------------------------------- |
| `gpt-5.4` | ~$0.01       | Padrao — rapido, code-focused             |
| `o3-mini` | ~$0.03       | Reasoning alternativo                     |
| `o3`      | ~$0.28       | Seguranca critica, compliance, pagamentos |

---

## Estrutura gerada no projeto

```
seu-projeto/
├── .claude/
│   ├── settings.json   # Agent Teams habilitado (automatico)
│   └── commands/
│       ├── agents/     # Definicoes dos 7 agentes + team
│       └── quick/      # Quick start commands
│
├── .devflow/
│   ├── agents/         # Metadata dos agentes
│   └── project.yaml    # Estado + versao do projeto
│
└── docs/
    ├── decisions/      # ADRs
    ├── planning/       # Stories e specs
    ├── snapshots/      # Historico do projeto
    └── system-design/  # SDDs, RFCs, capacity plans
        ├── sdd/
        ├── rfc/
        ├── capacity/
        └── trade-offs/
```

---

## Versoes

| Versao        | Features                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------- |
| v0.1.0        | Multi-agent system, Documentation automation                                             |
| v0.2.0        | Structured metadata, Knowledge graph                                                     |
| v0.3.0        | Hard stops, Mandatory delegation                                                         |
| v0.4.0–v0.7.0 | Web IDE, System Designer agent, npm package                                              |
| v0.8.0        | Autopilot terminal-based, CLI commands                                                   |
| v1.0.0        | Security hardening, npm global install fix                                               |
| v1.1.1        | Dual Scaling Modes: Parallel Subagents + Claude Agent Teams                              |
| v1.2.0        | Remocao da Web IDE, Persistent Memory, Adaptive Autopilot, Context Isolation, Challenger |
| v1.2.5        | Agent Teams habilitado por padrao no init/update                                         |
| v1.2.8        | Spawn templates com contexto obrigatorio para teammates                                  |
| v1.2.9        | Cores por agente, scores do challenger, artefatos persistidos, complexidade adaptativa     |
| **v1.3.0**    | **Security fix SEG-01, /quick:refactor + /quick:debug, challenger.md reescrito, bug fixes** |

---

## Documentacao

- **[Quick Start](docs/QUICKSTART.md)** - Comece em 5 minutos
- **[Instalacao](docs/INSTALLATION.md)** - Guia detalhado
- **[Arquitetura](docs/ARCHITECTURE.md)** - Como funciona
- **[Changelog](docs/CHANGELOG.md)** - Historico de mudancas

---

## Licenca

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**DevFlow v1.3.0** - Desenvolvido por [Evolve Labs](https://plataforma.evolvelabs.cloud)
