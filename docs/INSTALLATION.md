# Guia de Instalação - DevFlow

Guia completo para instalar e configurar o DevFlow no seu projeto.

---

## Pré-requisitos

### CLI (Agentes) - Mínimo
- Claude Code CLI instalado e autenticado (`claude`)
- Bash shell
- Git (opcional, mas recomendado)

### Web IDE - Requer compilação nativa
- Node.js 18+ (recomendado 20 LTS)
- Python 3.x (para node-gyp)
- GCC/G++ (compiladores C/C++)
- Make

---

## Verificar Dependências

Execute o script de verificação:

```bash
./check-deps.sh
```

---

## Instalação por Sistema Operacional

### Linux - Debian/Ubuntu

```bash
# Atualizar repositórios
sudo apt-get update

# Build essentials (gcc, g++, make)
sudo apt-get install -y build-essential

# Python 3 (para node-gyp)
sudo apt-get install -y python3

# Git
sudo apt-get install -y git

# Node.js 20 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Claude Code
npm install -g @anthropic-ai/claude-code

# Autenticar
claude login
```

### Linux - Fedora

```bash
# Atualizar
sudo dnf update -y

# Development Tools (gcc, g++, make)
sudo dnf groupinstall -y "Development Tools"

# Python 3 (geralmente já instalado)
sudo dnf install -y python3

# Git
sudo dnf install -y git

# Node.js (Fedora tem versões atualizadas)
sudo dnf install -y nodejs npm

# Claude Code
npm install -g @anthropic-ai/claude-code

# Autenticar
claude login
```

### Linux - RHEL/CentOS/Rocky/AlmaLinux

```bash
# Atualizar
sudo dnf update -y  # ou yum em versões antigas

# Development Tools
sudo dnf groupinstall -y "Development Tools"
# ou individualmente:
# sudo dnf install -y gcc gcc-c++ make

# Python 3
sudo dnf install -y python3

# Git
sudo dnf install -y git

# Node.js 20 LTS (via NodeSource)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Claude Code
npm install -g @anthropic-ai/claude-code

# Autenticar
claude login
```

### Linux - Arch/Manjaro

```bash
# Atualizar
sudo pacman -Syu

# Build tools + Node.js
sudo pacman -S base-devel python git nodejs npm

# Claude Code
npm install -g @anthropic-ai/claude-code

# Autenticar
claude login
```

### Linux - openSUSE

```bash
# Development pattern
sudo zypper install -t pattern devel_basis

# Dependências
sudo zypper install python3 git nodejs npm

# Claude Code
npm install -g @anthropic-ai/claude-code

# Autenticar
claude login
```

### macOS

```bash
# Xcode Command Line Tools (inclui gcc, make)
xcode-select --install

# Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js
brew install node

# Claude Code
npm install -g @anthropic-ai/claude-code

# Autenticar
claude login
```

### Windows (via WSL)

```powershell
# No PowerShell como Admin
wsl --install
```

Após reiniciar, no terminal WSL (Ubuntu):

```bash
# Dependências
sudo apt-get update
sudo apt-get install -y build-essential python3 git

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Claude Code
npm install -g @anthropic-ai/claude-code

# Autenticar
claude login
```

---

## Instalação

### Método 1: Script Automático (Recomendado)

```bash
# 1. Clone o repositório DevFlow
git clone https://github.com/evolve-labs-cloud/devflow.git
cd devflow

# 2. Execute o instalador
./install.sh /caminho/para/seu-projeto

# 3. Pronto!
```

**O que o script faz:**
- Copia `.claude/commands/agents/` (os 5 agentes)
- Cria estrutura `.devflow/` para o projeto
- Cria estrutura `docs/` se não existir
- Copia `.gitignore` configurado (opcional)

---

### Método 2: Instalação Manual

Se preferir fazer manualmente:

#### Passo 1: Copie os Agentes (ESSENCIAL)

```bash
cd /caminho/para/seu-projeto

# Copie a pasta de agentes
mkdir -p .claude/commands
cp -r /caminho/para/devflow/.claude/commands/agents .claude/commands/
```

#### Passo 2: Crie a Estrutura DevFlow

```bash
# Crie as pastas necessárias
mkdir -p .devflow/agents
mkdir -p .devflow/memory
mkdir -p .devflow/sessions
mkdir -p docs/snapshots
```

#### Passo 3: Configure Estrutura de Documentação

```bash
# Crie as pastas de docs
mkdir -p docs/planning/stories
mkdir -p docs/architecture/diagrams
mkdir -p docs/decisions
mkdir -p docs/security
mkdir -p docs/performance

# Adicione .gitkeep para manter pastas vazias
touch docs/planning/.gitkeep
touch docs/planning/stories/.gitkeep
touch docs/architecture/.gitkeep
touch docs/decisions/.gitkeep
```

---

## Verificando a Instalação

Após instalar, verifique se tudo está no lugar:

```bash
# Verifique os agentes
ls -la .claude/commands/agents/

# Deve mostrar os 5 agentes:
# strategist.md
# architect.md
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

No terminal do Claude Code:

```
/agents:strategist Olá! Pode me explicar como você funciona?
```

### 3. Crie um Snapshot Inicial

```
/agents:chronicler Criar snapshot do estado atual do projeto
```

---

## Estrutura Final

Após a instalação completa:

```
seu-projeto/
├── .claude/
│   └── commands/
│       └── agents/              # 5 agentes especializados
│           ├── strategist.md
│           ├── architect.md
│           ├── builder.md
│           ├── guardian.md
│           └── chronicler.md
│
├── .devflow/
│   ├── agents/                  # Metadados dos agentes
│   ├── memory/                  # Memória do projeto
│   ├── sessions/                # Sessões de trabalho
│   └── snapshots/               # Histórico do projeto
│
├── docs/
│   ├── planning/                # PRDs e specs
│   │   └── stories/             # User stories
│   ├── architecture/            # Design docs
│   │   └── diagrams/
│   ├── decisions/               # ADRs
│   ├── security/                # Security audits
│   └── performance/             # Performance reports
│
└── seu-codigo/
```

---

## Configuração Avançada

### Customizando Agentes

Você pode editar os arquivos em `.claude/commands/agents/`:

```bash
# Exemplo: Adicionar contexto específico ao Builder
nano .claude/commands/agents/builder.md
```

### Web IDE (Opcional)

Para usar a interface web:

```bash
cd devflow/web
npm install
npm run dev
# Acesse http://localhost:3000
```

---

## Solução de Problemas

### Agentes não aparecem

**Problema**: `/agents:strategist` não funciona.

**Solução**:
1. Verifique se `.claude/commands/agents/` existe
2. Confirme que os arquivos .md estão na pasta
3. Reinicie o Claude Code

### Script de instalação falha

**Problema**: `./install.sh: permission denied`

**Solução**:
```bash
chmod +x install.sh
./install.sh /caminho/para/seu-projeto
```

### node-pty não compila (Linux)

**Problema**: Erro ao executar `npm install` na Web IDE.

```
gyp ERR! build error
gyp ERR! stack Error: `make` failed with exit code: 2
```

**Solução - Debian/Ubuntu**:
```bash
sudo apt-get install -y build-essential python3
```

**Solução - Fedora**:
```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3
```

**Solução - RHEL/CentOS**:
```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3
```

### npm: command not found

**Problema**: npm não está instalado ou não está no PATH.

**Solução - Debian/Ubuntu**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Solução - Fedora/RHEL**:
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

### Python não encontrado pelo node-gyp

**Problema**:
```
gyp ERR! find Python
```

**Solução**:
```bash
# Debian/Ubuntu
sudo apt-get install -y python3

# Fedora/RHEL
sudo dnf install -y python3

# Configurar npm para usar python3
npm config set python /usr/bin/python3
```

### GCC versão muito antiga (RHEL 7/CentOS 7)

**Problema**: GCC 4.x não suporta padrões C++ modernos.

**Solução** (habilitar devtoolset):
```bash
# CentOS 7 / RHEL 7
sudo yum install -y centos-release-scl
sudo yum install -y devtoolset-11
scl enable devtoolset-11 bash

# Depois execute npm install
cd web && npm install
```

### Erro de permissão ao instalar pacotes globais

**Problema**: `EACCES: permission denied` ao instalar Claude Code.

**Solução** (configurar npm para usar diretório local):
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Agora instale
npm install -g @anthropic-ai/claude-code
```

### Windows: node-pty não compila

**Problema**: Erro ao instalar dependências da Web IDE no Windows.

**Solução**: Use WSL (veja seção de pré-requisitos).

---

## Atualizando DevFlow

Use o script de atualização:

```bash
cd /caminho/para/devflow
git pull origin main

./update.sh /caminho/para/seu-projeto
```

---

## Desinstalação

Se quiser remover o DevFlow:

```bash
# Remova os agentes
rm -rf .claude/commands/agents/

# Remova a estrutura DevFlow
rm -rf .devflow/

# (Opcional) Remova docs - ATENÇÃO: faça backup!
# rm -rf docs/
```

---

## Próximos Passos

1. **Leia o [Quick Start](QUICKSTART.md)** - Aprenda os comandos básicos
2. **Crie seu primeiro snapshot** - `/agents:chronicler snapshot`
3. **Comece a desenvolver** - `/agents:strategist [sua ideia]`

---

## Precisa de Ajuda?

- [Documentação](https://github.com/evolve-labs-cloud/devflow)
- [Issues](https://github.com/evolve-labs-cloud/devflow/issues)

---

**Instalação completa! Agora você está pronto para desenvolver com DevFlow.**
