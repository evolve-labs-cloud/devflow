# Guia de Instalacao - DevFlow v1.0.0

Guia completo para instalar e configurar o DevFlow no seu projeto.

---

## Pre-requisitos

- **Node.js 18+** (recomendado 20 LTS)
- **Claude Code CLI** instalado e autenticado (`npm i -g @anthropic-ai/claude-code`)
- **Git** (recomendado)

Para a **Web IDE** (opcional), tambem precisa de:
- Python 3.x (para compilar node-pty via node-gyp)
- GCC/G++ (compiladores C/C++)
- Make

---

## Instalacao Rapida

```bash
# 1. Instalar DevFlow globalmente
npm install -g @evolve.labs/devflow

# 2. Inicializar no seu projeto
cd /caminho/para/seu-projeto
devflow init

# 3. Pronto! Use no Claude Code:
claude
/agents:strategist Quero criar uma nova feature...
```

---

## Opcoes de Instalacao

```bash
devflow init                    # Agentes + estrutura de docs (padrao)
devflow init --agents-only      # Apenas agentes (minimo)
devflow init --full             # Tudo incluindo .gitignore
devflow init --web              # Inclui Web IDE (opcional)
devflow init --full --web       # Tudo + Web IDE
```

### O que cada modo instala

| Componente | `--agents-only` | Padrao | `--full` |
|-----------|:-:|:-:|:-:|
| 6 agentes (.claude/commands/agents/) | x | x | x |
| Quick commands (.claude/commands/quick/) | x | x | x |
| .claude_project | x | x | x |
| .devflow/ (metadata, project.yaml) | x | x | x |
| docs/ (planning, architecture, decisions, etc.) | | x | x |
| .gitignore configurado | | | x |
| Web IDE (web/) | Com `--web` | Com `--web` | Com `--web` |

---

## Comandos CLI

```bash
devflow init [path]             # Inicializar DevFlow num projeto
devflow update [path]           # Atualizar instalacao existente
devflow web                     # Iniciar Web IDE (http://localhost:3000)
devflow autopilot <spec-file>   # Rodar autopilot nos agentes
```

---

## Instalacao de Dependencias por Sistema

### macOS

```bash
# Xcode Command Line Tools (inclui gcc, make)
xcode-select --install

# Node.js (via Homebrew)
brew install node

# Claude Code
npm install -g @anthropic-ai/claude-code

# DevFlow
npm install -g @evolve.labs/devflow

# Autenticar Claude
claude login
```

### Debian/Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 git

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Claude Code + DevFlow
npm install -g @anthropic-ai/claude-code
npm install -g @evolve.labs/devflow

claude login
```

### Fedora

```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3 git nodejs npm

npm install -g @anthropic-ai/claude-code
npm install -g @evolve.labs/devflow

claude login
```

### RHEL/CentOS/Rocky/AlmaLinux

```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3 git

# Node.js 20 LTS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

npm install -g @anthropic-ai/claude-code
npm install -g @evolve.labs/devflow

claude login
```

### Arch/Manjaro

```bash
sudo pacman -S base-devel python git nodejs npm

npm install -g @anthropic-ai/claude-code
npm install -g @evolve.labs/devflow

claude login
```

### Windows (via WSL)

```powershell
# No PowerShell como Admin
wsl --install
```

Apos reiniciar, no terminal WSL (Ubuntu):

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 git

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

npm install -g @anthropic-ai/claude-code
npm install -g @evolve.labs/devflow

claude login
```

---

## Verificando a Instalacao

```bash
# Verificar versao
devflow --version

# Verificar agentes instalados
ls -la .claude/commands/agents/

# Deve mostrar os 6 agentes:
# strategist.md
# architect.md
# system-designer.md
# builder.md
# guardian.md
# chronicler.md
```

---

## Primeiro Uso

### 1. Abra o Projeto no Claude Code

```bash
cd /caminho/para/seu-projeto
claude
```

### 2. Teste um Agente

```
/agents:strategist Ola! Pode me explicar como voce funciona?
```

### 3. Crie um Snapshot Inicial

```
/agents:chronicler Criar snapshot do estado atual do projeto
```

---

## Estrutura Final

Apos a instalacao completa:

```
seu-projeto/
├── .claude/
│   └── commands/
│       ├── agents/                 # 6 agentes especializados
│       │   ├── strategist.md
│       │   ├── architect.md
│       │   ├── system-designer.md
│       │   ├── builder.md
│       │   ├── guardian.md
│       │   └── chronicler.md
│       └── quick/                  # Quick start commands
│
├── .devflow/
│   ├── agents/                     # Metadados dos agentes
│   ├── memory/                     # Memoria do projeto
│   ├── sessions/                   # Sessoes de trabalho
│   └── project.yaml                # Estado do projeto
│
├── docs/
│   ├── planning/                   # PRDs e specs
│   │   └── stories/                # User stories
│   ├── architecture/               # Design docs
│   │   └── diagrams/
│   ├── decisions/                  # ADRs
│   ├── system-design/              # SDDs, RFCs, capacity plans
│   │   ├── sdd/
│   │   ├── rfc/
│   │   ├── capacity/
│   │   └── trade-offs/
│   ├── security/                   # Security audits
│   ├── performance/                # Performance reports
│   ├── snapshots/                  # Historico do projeto
│   └── CHANGELOG.md
│
└── web/                            # Web IDE (se --web)
```

---

## Web IDE (Opcional)

### Iniciar

```bash
devflow web                     # Abre http://localhost:3000
devflow web --port 8080         # Porta customizada
devflow web --project /path     # Projeto especifico
devflow web --dev               # Modo desenvolvimento
```

O comando `devflow web` instala dependencias automaticamente na primeira execucao.

---

## Autopilot

```bash
# Rodar todas as fases
devflow autopilot docs/specs/minha-spec.md

# Escolher fases especificas
devflow autopilot docs/specs/minha-spec.md --phases "strategist,architect,builder"

# Apontar para outro projeto
devflow autopilot docs/specs/minha-spec.md --project /path/to/project

# Sem auto-update de tasks
devflow autopilot docs/specs/minha-spec.md --no-update
```

---

## Atualizando DevFlow

```bash
# Atualizar o pacote npm
npm update -g @evolve.labs/devflow

# Atualizar agentes e metadata no projeto
devflow update /caminho/para/seu-projeto
```

---

## Desinstalacao

```bash
# Remover do projeto
rm -rf .claude/commands/agents/
rm -rf .claude/commands/quick/
rm -rf .devflow/

# (Opcional) Remover docs - CUIDADO: faca backup!
# rm -rf docs/

# Remover pacote global
npm uninstall -g @evolve.labs/devflow
```

---

## Solucao de Problemas

### Agentes nao aparecem

**Problema**: `/agents:strategist` nao funciona.

**Solucao**:
1. Verifique se `.claude/commands/agents/` existe
2. Confirme que os 6 arquivos .md estao na pasta
3. Reinicie o Claude Code

### node-pty nao compila (Linux)

**Problema**: Erro ao executar `npm install` na Web IDE.

**Solucao - Debian/Ubuntu**:
```bash
sudo apt-get install -y build-essential python3
```

**Solucao - Fedora**:
```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3
```

### Terminal nao conecta na Web IDE

**Problema**: "Failed to connect to terminal session"

**Solucao**: Geralmente causado por permissoes do spawn-helper do node-pty. O `devflow web` corrige automaticamente. Se persistir:
```bash
chmod +x ~/.devflow/_web/node_modules/node-pty/prebuilds/*/spawn-helper
```

### npm: command not found

**Solucao - Debian/Ubuntu**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Erro de permissao ao instalar pacotes globais

**Solucao** (configurar npm para diretorio local):
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

npm install -g @evolve.labs/devflow
```

### Python nao encontrado pelo node-gyp

**Solucao**:
```bash
sudo apt-get install -y python3
npm config set python /usr/bin/python3
```

---

## Proximos Passos

1. **Leia o [Quick Start](QUICKSTART.md)** - Aprenda os comandos basicos
2. **Crie seu primeiro snapshot** - `/agents:chronicler snapshot`
3. **Comece a desenvolver** - `/agents:strategist [sua ideia]`

---

## Precisa de Ajuda?

- [Documentacao](https://github.com/evolve-labs-cloud/devflow)
- [Issues](https://github.com/evolve-labs-cloud/devflow/issues)

---

**DevFlow v1.0.0** - Desenvolvido por [Evolve Labs](https://evolvelabs.cloud)
