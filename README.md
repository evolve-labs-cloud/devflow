# DevFlow v0.5.0

Sistema multi-agentes para desenvolvimento spec-driven, otimizado para Claude Code.

[![Version](https://img.shields.io/badge/version-0.5.0-blue.svg)](web/CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-evolve--labs--cloud-purple.svg)](https://github.com/evolve-labs-cloud/devflow)

<p align="center">
  <img src="docs/images/hero.png" alt="DevFlow Home" width="800"/>
</p>

---

## O que é DevFlow?

DevFlow é um sistema de 5 agentes especializados que trabalham juntos para transformar ideias em código de qualidade:

| Agente | Papel | Responsabilidade |
|--------|-------|------------------|
| **@strategist** | Product Owner | PRDs, user stories, priorização |
| **@architect** | Tech Lead | Design, ADRs, decisões técnicas |
| **@builder** | Developer | Implementação, código, refactoring |
| **@guardian** | QA/Security | Testes, segurança, code review |
| **@chronicler** | Tech Writer | Documentação, changelog, snapshots |

---

## Modos de Uso

### 1. CLI (Padrão) - Recomendado

Use DevFlow diretamente no terminal com Claude Code:

```bash
# Copie esta pasta para seu projeto
cp -r devflow/* /caminho/para/seu-projeto/

# Entre no projeto e use Claude Code
cd /caminho/para/seu-projeto
claude

# Exemplos de uso
> @strategist Preciso de um sistema de autenticação
> @architect Faça o design técnico
> @builder Implemente a feature
```

**Vantagens:**
- Setup instantâneo
- Sem dependências extras
- Integração nativa com Claude Code

### 2. Web IDE (Opcional)

Interface visual completa para gerenciar seu projeto DevFlow:

```bash
cd web
npm install
npm run dev
# Acesse http://localhost:3000
```

<p align="center">
  <img src="docs/images/terminal.png" alt="Terminal com Quick Actions" width="800"/>
</p>

**Features da Web IDE v0.5.0:**
- **Terminal Integrado** - Interface principal para Claude CLI
  - Quick Actions: botões para agentes e comandos
  - Performance nativa (sem overhead)
  - Session resume, tools, MCP servers
- **Dashboard** com métricas e health check
- **File Explorer** com navegação por teclado
- **Editor Monaco** (VS Code engine)
- **Specs Panel** com progress por spec
- **Git Integration** visual

<details>
<summary>📸 Mais Screenshots</summary>

| Feature | Screenshot |
|---------|------------|
| Editor Monaco | <img src="docs/images/editor.png" alt="Editor" width="400"/> |
| Specs Panel | <img src="docs/images/specs.png" alt="Specs" width="400"/> |
| Dashboard | <img src="docs/images/dashboard.png" alt="Dashboard" width="400"/> |

</details>

---

## Estrutura do Projeto

```
seu-projeto/
├── .claude/commands/        # Comandos dos agentes (CLI)
│   ├── agents/              # Definições dos 5 agentes
│   └── quick/               # Comandos rápidos
├── .devflow/                # Memória e estado do projeto
│   ├── memory/              # Contexto ativo
│   ├── snapshots/           # Histórico
│   └── project.yaml         # Configuração
├── docs/                    # Documentação
│   ├── planning/            # PRDs, specs, stories
│   ├── decisions/           # ADRs
│   └── architecture/        # Design docs
├── web/                     # [OPCIONAL] IDE Web
└── install.sh               # Script de instalação
```

---

## Requisitos

### CLI (Mínimo)
- Claude Code CLI instalado e autenticado

### Web IDE (Adicional)
- Node.js 18+
- npm ou yarn

---

## Documentação

| Doc | Descrição |
|-----|-----------|
| [QUICKSTART.md](docs/QUICKSTART.md) | Guia rápido (5 min) |
| [INSTALLATION.md](docs/INSTALLATION.md) | Instalação detalhada |
| [AI_OPTIMIZATION_GUIDE.md](docs/AI_OPTIMIZATION_GUIDE.md) | Maximizar uso com IA |
| [MEMORY_SYSTEM.md](docs/MEMORY_SYSTEM.md) | Sistema de memória |
| [web/README.md](web/README.md) | Documentação da Web IDE |

---

## Changelog

### v0.5.0 (2025-12-29)
- **Terminal como Interface Principal** - Substituição do Chat
  - Quick Actions para agentes e comandos
  - Resize handle para ajustar altura
  - Performance nativa do Claude CLI
- **Agent Task Updates** - Agentes atualizam tasks automaticamente
- **UX Improvements** - Toasts, debouncing, feedback visual

### v0.4.0 (2025-12-26)
- Navegação avançada (breadcrumbs, tab history, pinned tabs)
- Acessibilidade (keyboard nav, ARIA, focus trap)
- Settings Panel com configurações persistentes

### v0.2.0 (2025-12-22)
- Dashboard com métricas
- Terminal integrado
- Git Integration

[Ver changelog completo](web/CHANGELOG.md)

---

## Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido por [Evolve Labs](https://evolvelabs.cloud)**
