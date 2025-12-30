# Guia de Instalação - DevFlow

Guia completo para instalar e configurar o DevFlow no seu projeto.

---

## 📋 Pré-requisitos

- Claude Code instalado
- Git (opcional, mas recomendado)
- Projeto existente ou novo

---

## 🚀 Instalação

### Método 1: Script Automático (Recomendado)

O script de instalação copia automaticamente todos os arquivos necessários para o seu projeto.

```bash
# 1. Clone o repositório DevFlow
git clone https://github.com/evolve-labs-cloud/devflow.git
cd devflow

# 2. Execute o instalador
./install.sh /caminho/para/seu-projeto

# 3. Pronto! O script já copiou tudo necessário
```

**O que o script faz:**
- ✅ Copia `.devflow/` (agentes)
- ✅ Cria estrutura de `docs/` se não existir
- ✅ Copia `.gitignore` configurado
- ✅ Cria CHANGELOG.md inicial se não existir
- ✅ Verifica conflitos e pede confirmação

---

### Método 2: Instalação Manual

Se preferir fazer manualmente ou entender o que está sendo instalado:

#### Passo 1: Copie a Estrutura de Agentes (ESSENCIAL)

```bash
# Navegue até seu projeto
cd /caminho/para/seu-projeto

# Copie a pasta .devflow
cp -r /caminho/para/devflow/.devflow ./
```

Estrutura copiada:
```
seu-projeto/
└── .devflow/
    ├── agents/
    │   ├── strategist.md
    │   ├── architect.md
    │   ├── builder.md
    │   ├── guardian.md
    │   └── chronicler.md
    └── snapshots/
```

#### Passo 2: Configure Estrutura de Documentação (Recomendado)

```bash
# Crie as pastas de docs (se ainda não existirem)
mkdir -p docs/decisions docs/api docs/migration

# Copie templates de exemplo (opcional)
cp -r /caminho/para/devflow/docs/decisions/000-template.md docs/decisions/
```

#### Passo 3: Adicione CHANGELOG (Recomendado)

```bash
# Copie ou crie um CHANGELOG inicial
cat > CHANGELOG.md <<EOF
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- DevFlow multi-agent system installed
EOF
```

#### Passo 4: Configure .gitignore (Opcional)

```bash
# Adicione ao seu .gitignore
cat >> .gitignore <<EOF

# DevFlow
.devflow/snapshots/*.md
!.devflow/snapshots/.gitkeep
EOF
```

---

## ✅ Verificando a Instalação

Após instalar, verifique se tudo está no lugar:

```bash
# Verifique a estrutura
ls -la .devflow/agents/

# Deve mostrar os 5 agentes:
# strategist.md
# architect.md
# builder.md
# guardian.md
# chronicler.md
```

---

## 🎯 Primeiro Uso

### 1. Abra o Projeto no Claude Code

```bash
cd /caminho/para/seu-projeto
code .
```

### 2. Teste um Agente

No chat do Claude Code, teste o sistema:

```
@strategist Olá! Pode me explicar como você funciona?
```

### 3. Crie um Snapshot Inicial (Recomendado)

```
@chronicler /snapshot
```

Isso cria um registro inicial do estado do seu projeto.

---

## 📁 Estrutura Final

Após a instalação completa, seu projeto terá:

```
seu-projeto/
├── .devflow/
│   ├── agents/              # 5 agentes especializados
│   │   ├── strategist.md
│   │   ├── architect.md
│   │   ├── builder.md
│   │   ├── guardian.md
│   │   └── chronicler.md
│   └── snapshots/           # Histórico do projeto (gerado automaticamente)
│
├── docs/                    # Documentação técnica
│   ├── decisions/           # ADRs (Architecture Decision Records)
│   ├── api/                 # Documentação de APIs
│   ├── migration/           # Guias de migração
│   ├── architecture/        # Diagramas e docs técnicos
│   ├── planning/            # PRDs e user stories
│   ├── INSTALLATION.md      # Este guia
│   ├── QUICKSTART.md        # Guia rápido
│   ├── ARCHITECTURE.md      # Arquitetura do DevFlow
│   └── CHANGELOG.md         # Mantido automaticamente pelo Chronicler
│
├── .gitignore              # Configurado para DevFlow
│
└── seu-codigo/             # Seu código existente
    └── ...
```

---

## 🔧 Configuração Avançada

### Customizando Agentes

Você pode editar os arquivos em `.devflow/agents/` para customizar o comportamento:

```bash
# Exemplo: Adicionar contexto específico ao Builder
nano .devflow/agents/builder.md
```

### Estrutura de Docs Personalizada

Adicione suas próprias pastas em `docs/`:

```bash
mkdir -p docs/onboarding
mkdir -p docs/troubleshooting
mkdir -p docs/architecture/diagrams
```

### Configurando Auto-Snapshot

O Chronicler pode criar snapshots automáticos. Configure no arquivo:

```bash
nano .devflow/agents/chronicler.md

# Adicione ou ajuste:
# SNAPSHOT_FREQUENCY: daily|weekly|on-demand
```

---

## 🚨 Solução de Problemas

### Agentes não aparecem no Claude Code

**Problema**: Ao digitar `@strategist`, nada acontece.

**Solução**:
1. Verifique se `.devflow/agents/` existe
2. Recarregue o Claude Code: `Cmd/Ctrl + Shift + P` → "Reload Window"
3. Confirme que os arquivos .md estão na pasta correta

### Script de instalação falha

**Problema**: `./install.sh: permission denied`

**Solução**:
```bash
chmod +x install.sh
./install.sh /caminho/para/seu-projeto
```

### Conflitos com arquivos existentes

**Problema**: Já existe um CHANGELOG.md ou docs/

**Solução**:
- O script pergunta se deseja sobrescrever
- Escolha "No" e faça merge manual
- Ou renomeie seus arquivos antes da instalação

### Snapshots não são criados

**Problema**: `@chronicler /snapshot` não funciona

**Solução**:
1. Verifique se `.devflow/snapshots/` existe
2. Crie manualmente: `mkdir -p .devflow/snapshots`
3. Verifique permissões de escrita

---

## 📦 Instalação em Diferentes Cenários

### Projeto Novo (do Zero)

```bash
# 1. Crie o projeto
mkdir meu-novo-projeto
cd meu-novo-projeto
git init

# 2. Instale DevFlow
/caminho/para/devflow/install.sh .

# 3. Comece a usar
code .
# @strategist Quero criar uma API REST...
```

### Projeto Existente (Pequeno)

```bash
# 1. Navegue até seu projeto
cd meu-projeto-existente

# 2. Instale DevFlow
/caminho/para/devflow/install.sh .

# 3. Crie snapshot do estado atual
code .
# @chronicler /snapshot
```

### Projeto Existente (Grande/Complexo)

```bash
# 1. Crie uma branch para testar
cd meu-projeto-grande
git checkout -b feature/add-devflow

# 2. Instale DevFlow
/caminho/para/devflow/install.sh .

# 3. Documente o que já existe
code .
# @chronicler Analise este projeto e crie um snapshot inicial detalhado

# 4. Teste por alguns dias
# Se gostar, merge para main
git checkout main
git merge feature/add-devflow
```

### Projeto em Equipe (Monorepo)

```bash
# Instale na raiz do monorepo
cd monorepo-root
/caminho/para/devflow/install.sh .

# Ou instale em cada sub-projeto
/caminho/para/devflow/install.sh apps/backend
/caminho/para/devflow/install.sh apps/frontend
/caminho/para/devflow/install.sh packages/shared
```

---

## 🔄 Atualizando DevFlow

Quando uma nova versão do DevFlow for lançada:

```bash
# 1. Navegue até o repo DevFlow
cd /caminho/para/devflow
git pull origin main

# 2. Reinstale no seu projeto
./install.sh /caminho/para/seu-projeto

# O script detecta arquivos existentes e pergunta se deseja atualizar
```

---

## 🗑️ Desinstalação

Se por algum motivo quiser remover o DevFlow:

```bash
# 1. Remova a pasta de agentes
rm -rf .devflow/

# 2. (Opcional) Remova docs criadas pelo DevFlow
# ATENÇÃO: Faça backup antes!
rm -rf docs/decisions/
rm CHANGELOG.md
```

**Nota**: Seus snapshots e documentação ficarão preservados, mas os agentes não estarão mais disponíveis.

---

## 📚 Próximos Passos

Após instalar com sucesso:

1. **Leia o [Quick Start](QUICKSTART.md)** - Aprenda os comandos básicos
2. **Explore os [Agentes](.devflow/agents/)** - Veja o que cada um faz
3. **Crie seu primeiro snapshot** - `@chronicler /snapshot`
4. **Comece a desenvolver** - `@strategist [sua ideia]`

---

## 💡 Dicas

### ✅ Faça

- Commit a pasta `.devflow/` no git
- Crie um snapshot após instalar
- Customize os agentes para seu contexto
- Use `.gitignore` para snapshots grandes

### ❌ Evite

- Deletar `.devflow/agents/` acidentalmente
- Editar snapshots manualmente
- Commitar snapshots temporários muito grandes

---

## 🆘 Precisa de Ajuda?

- 📖 Veja a [Documentação Completa](../README.md)
- 💬 Abra uma [Issue](https://github.com/evolve-labs-cloud/devflow/issues)
- 📧 Entre em contato: suporte@devflow.dev

---

**Instalação completa! Agora você está pronto para desenvolver com DevFlow. 🚀**
