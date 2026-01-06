# DevFlow - Arquitetura

Documentação técnica da arquitetura do sistema DevFlow.

---

## Visão Geral

DevFlow é um sistema de multi-agentes especializados para desenvolvimento de software, integrado ao Claude Code CLI.

```
┌─────────────────────────────────────────────────────────┐
│                     Claude Code CLI                      │
├─────────────────────────────────────────────────────────┤
│  /agents:strategist  →  /agents:architect  →            │
│  /agents:builder     →  /agents:guardian   →            │
│  /agents:chronicler                                      │
├─────────────────────────────────────────────────────────┤
│                    .claude/commands/agents/              │
│                    .devflow/ (estado do projeto)         │
│                    docs/ (documentação)                  │
└─────────────────────────────────────────────────────────┘
```

---

## Os 5 Agentes

### Strategist (Planejamento)
- **Função**: Análise de requisitos, PRDs, user stories
- **Input**: Ideias, problemas, features
- **Output**: `docs/planning/`, `docs/planning/stories/`
- **Hard Stop**: NUNCA escreve código

### Architect (Design)
- **Função**: Design técnico, ADRs, diagramas
- **Input**: PRDs, requisitos técnicos
- **Output**: `docs/architecture/`, `docs/decisions/`
- **Hard Stop**: NUNCA implementa

### Builder (Implementação)
- **Função**: Código, refactoring, code review
- **Input**: Stories, specs, bugs
- **Output**: Código fonte, testes
- **Hard Stop**: NUNCA cria requisitos

### Guardian (Qualidade)
- **Função**: Testes, segurança, performance
- **Input**: Código, endpoints, arquivos
- **Output**: `docs/security/`, `docs/performance/`
- **Hard Stop**: NUNCA adiciona features

### Chronicler (Documentação)
- **Função**: CHANGELOG, snapshots, sync de docs
- **Input**: Mudanças no projeto
- **Output**: `docs/CHANGELOG.md`, `.devflow/snapshots/`
- **Hard Stop**: NUNCA escreve código

---

## Estrutura de Arquivos

```
projeto/
├── .claude/
│   └── commands/
│       └── agents/              # Definições dos agentes
│           ├── strategist.md
│           ├── architect.md
│           ├── builder.md
│           ├── guardian.md
│           └── chronicler.md
│
├── .devflow/
│   ├── agents/                  # Metadados
│   ├── memory/                  # Memória do projeto
│   ├── sessions/                # Sessões de trabalho
│   └── snapshots/               # Histórico
│
└── docs/
    ├── planning/                # PRDs (Strategist)
    │   └── stories/             # User stories
    ├── architecture/            # Design (Architect)
    │   └── diagrams/
    ├── decisions/               # ADRs (Architect)
    ├── security/                # Audits (Guardian)
    ├── performance/             # Reports (Guardian)
    └── CHANGELOG.md             # Mantido pelo Chronicler
```

---

## Fluxo de Trabalho

### Feature Nova

```
1. /agents:strategist "Criar feature X"
   └→ Cria PRD em docs/planning/
   └→ Cria stories em docs/planning/stories/

2. /agents:architect "Design da feature X"
   └→ Cria design em docs/architecture/
   └→ Cria ADR em docs/decisions/

3. /agents:builder "Implementar story Y"
   └→ Escreve código
   └→ Escreve testes

4. /agents:guardian "Review de segurança"
   └→ Analisa código
   └→ Aprova ou rejeita

5. Chronicler (automático)
   └→ Atualiza CHANGELOG
   └→ Cria snapshot
```

### Bug Fix

```
1. /agents:builder "Fix: descrição do bug"
   └→ Investiga
   └→ Corrige
   └→ Testa

2. Chronicler (automático)
   └→ Documenta fix
```

---

## Delegação entre Agentes

Cada agente DEVE delegar para o próximo no fluxo:

```
Strategist → Architect → Builder → Guardian → (Chronicler automático)
```

### Regras de Delegação

1. **Strategist** sempre chama Architect após criar specs
2. **Architect** sempre chama Builder após design
3. **Builder** sempre chama Guardian após implementar
4. **Guardian** aprova ou rejeita (Builder corrige se rejeitado)
5. **Chronicler** documenta automaticamente todas as mudanças

---

## Hard Stops

Cada agente tem limites rígidos que não podem ser violados:

| Agente | Pode Fazer | Não Pode Fazer |
|--------|------------|----------------|
| Strategist | PRDs, stories, análise | Código, design técnico |
| Architect | Design, ADRs, diagramas | Código, implementação |
| Builder | Código, testes, refactor | Requisitos, specs |
| Guardian | Testes, security, perf | Features, código novo |
| Chronicler | Docs, changelog, snapshots | Código, decisões |

---

## Web IDE (Opcional)

Interface web para gerenciar projetos DevFlow:

```
web/
├── app/                    # Next.js pages
├── components/
│   ├── editor/            # Monaco Editor
│   ├── terminal/          # xterm.js + node-pty
│   ├── specs/             # Painel de specs
│   └── dashboard/         # Métricas
└── lib/
    └── stores/            # Zustand state
```

### Tech Stack
- Next.js 16
- TypeScript
- Tailwind CSS
- Monaco Editor
- xterm.js + node-pty
- Zustand

---

## Versionamento

| Versão | Mudanças |
|--------|----------|
| 0.1.0 | Sistema multi-agente inicial |
| 0.2.0 | Metadata estruturado |
| 0.3.0 | Hard stops, delegação obrigatória |
| 0.4.0 | Web IDE |
| 0.5.0 | Terminal como interface principal, WSL support |

---

## Referências

- [Quick Start](QUICKSTART.md)
- [Instalação](INSTALLATION.md)
- [Changelog](CHANGELOG.md)

---

**DevFlow v0.5.0** - Desenvolvido por [Evolve Labs](https://evolvelabs.cloud)
