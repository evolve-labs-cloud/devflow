#!/bin/bash

# DevFlow Update Script
# Atualiza uma instalação existente do DevFlow para a versão mais recente

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Current version
CURRENT_VERSION="0.5.0"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  DevFlow Updater v${CURRENT_VERSION}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get script directory first (where DevFlow source is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check for updates in DevFlow repository
if [ -d "$SCRIPT_DIR/.git" ]; then
    echo -e "${BLUE}🔍 Verificando atualizações do DevFlow...${NC}"

    ORIGINAL_DIR="$(pwd)"
    cd "$SCRIPT_DIR"

    # Fetch latest changes
    git fetch origin main --quiet 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Não foi possível verificar atualizações (sem conexão?)${NC}"
    }

    # Check if we're behind
    LOCAL=$(git rev-parse HEAD 2>/dev/null)
    REMOTE=$(git rev-parse origin/main 2>/dev/null)

    if [ "$LOCAL" != "$REMOTE" ] && [ -n "$REMOTE" ]; then
        echo -e "${YELLOW}📥 Nova versão disponível! Atualizando DevFlow...${NC}"

        # Check for local changes
        if [ -n "$(git status --porcelain)" ]; then
            echo -e "${YELLOW}⚠️  Existem mudanças locais. Fazendo stash...${NC}"
            git stash --quiet
            STASHED=true
        fi

        # Pull latest changes
        if git pull origin main --quiet 2>/dev/null; then
            echo -e "${GREEN}✅ DevFlow atualizado para a última versão!${NC}"

            # Update CURRENT_VERSION from the new file
            NEW_VERSION=$(grep -E "^CURRENT_VERSION=" "$SCRIPT_DIR/update.sh" | cut -d'"' -f2)
            if [ -n "$NEW_VERSION" ]; then
                CURRENT_VERSION="$NEW_VERSION"
            fi
        else
            echo -e "${RED}❌ Falha ao atualizar. Continuando com versão local...${NC}"
        fi

        # Restore stashed changes
        if [ "$STASHED" = true ]; then
            git stash pop --quiet 2>/dev/null || true
        fi
    else
        echo -e "${GREEN}✅ DevFlow já está na última versão${NC}"
    fi

    # Return to original directory
    cd "$ORIGINAL_DIR"
    echo ""
fi

# Get target directory
TARGET_DIR="${1:-.}"

# Convert to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
    echo -e "${RED}❌ Diretório não encontrado: $1${NC}"
    exit 1
}

# Check if DevFlow is installed (check for .claude/commands/agents or .devflow)
if [ ! -d "$TARGET_DIR/.claude/commands/agents" ] && [ ! -d "$TARGET_DIR/.devflow" ]; then
    echo -e "${RED}❌ DevFlow não encontrado em: $TARGET_DIR${NC}"
    echo -e "${YELLOW}   Use install.sh para instalar pela primeira vez.${NC}"
    exit 1
fi

# Check installed version
INSTALLED_VERSION="unknown"
if [ -f "$TARGET_DIR/.devflow/project.yaml" ]; then
    INSTALLED_VERSION=$(grep -E "^\s*version:" "$TARGET_DIR/.devflow/project.yaml" | head -1 | sed 's/.*version:[[:space:]]*"\?\([^"]*\)"\?/\1/' | tr -d ' ')
fi

echo -e "${BLUE}📍 Projeto:${NC} $TARGET_DIR"
echo -e "${BLUE}📦 Versão instalada:${NC} $INSTALLED_VERSION"
echo -e "${BLUE}🆕 Nova versão:${NC} $CURRENT_VERSION"
echo ""

# Check if already up to date
if [ "$INSTALLED_VERSION" = "$CURRENT_VERSION" ]; then
    echo -e "${GREEN}✅ DevFlow já está na versão mais recente!${NC}"
    exit 0
fi

# Confirm update
echo -e "${YELLOW}⚠️  O update vai sobrescrever os arquivos de agentes.${NC}"
echo -e "${YELLOW}   Customizações em .claude/commands/agents/ serão perdidas.${NC}"
echo ""
read -p "Continuar com o update? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Update cancelado.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Atualizando DevFlow...${NC}"

# Backup existing agents
BACKUP_DIR="$TARGET_DIR/.devflow/backup-$(date +%Y%m%d-%H%M%S)"
echo -e "  → Criando backup em ${BACKUP_DIR}"
mkdir -p "$BACKUP_DIR"
cp -r "$TARGET_DIR/.claude/commands/agents" "$BACKUP_DIR/" 2>/dev/null || true
cp "$TARGET_DIR/.devflow/project.yaml" "$BACKUP_DIR/" 2>/dev/null || true

# Update .claude/commands/agents
echo -e "  → Atualizando agentes..."
mkdir -p "$TARGET_DIR/.claude/commands/agents"
cp "$SCRIPT_DIR/.claude/commands/agents/"*.md "$TARGET_DIR/.claude/commands/agents/"
cp "$SCRIPT_DIR/.claude/commands/agents/"*.meta.yaml "$TARGET_DIR/.claude/commands/agents/" 2>/dev/null || true

# Migrate from old structure if needed
if [ -d "$TARGET_DIR/.devflow/agents" ] && [ -f "$TARGET_DIR/.devflow/agents/strategist.md" ]; then
    echo -e "  → Migrando estrutura antiga..."
    rm -rf "$TARGET_DIR/.devflow/agents"
fi

# Update .devflow structure
echo -e "  → Atualizando estrutura .devflow/..."
mkdir -p "$TARGET_DIR/.devflow/agents"
mkdir -p "$TARGET_DIR/.devflow/memory"
mkdir -p "$TARGET_DIR/.devflow/sessions"
mkdir -p "$TARGET_DIR/.devflow/snapshots"

# Update project.yaml version
echo -e "  → Atualizando project.yaml..."
if [ -f "$TARGET_DIR/.devflow/project.yaml" ]; then
    sed -i.bak "s/version:.*/version: \"$CURRENT_VERSION\"/" "$TARGET_DIR/.devflow/project.yaml"
    rm -f "$TARGET_DIR/.devflow/project.yaml.bak"
else
    cp "$SCRIPT_DIR/.devflow/project.yaml" "$TARGET_DIR/.devflow/"
fi

# Create docs directories if they don't exist
echo -e "  → Verificando estrutura de documentação..."
mkdir -p "$TARGET_DIR/docs/planning/stories"
mkdir -p "$TARGET_DIR/docs/architecture/diagrams"
mkdir -p "$TARGET_DIR/docs/decisions"
mkdir -p "$TARGET_DIR/docs/security"
mkdir -p "$TARGET_DIR/docs/performance"
touch "$TARGET_DIR/docs/planning/.gitkeep" 2>/dev/null || true
touch "$TARGET_DIR/docs/planning/stories/.gitkeep" 2>/dev/null || true
touch "$TARGET_DIR/docs/architecture/.gitkeep" 2>/dev/null || true
touch "$TARGET_DIR/docs/decisions/.gitkeep" 2>/dev/null || true

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ DevFlow atualizado para v${CURRENT_VERSION}!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📦 O que foi atualizado:${NC}"
echo "  • Agentes em .claude/commands/agents/"
echo "  • Instruções de atualização de badges/status"
echo "  • Estrutura de documentação"
echo ""

echo -e "${BLUE}📁 Backup salvo em:${NC}"
echo "  $BACKUP_DIR"
echo ""

echo -e "${BLUE}🆕 Novidades v0.5.0:${NC}"
echo "  • Agentes usam /agents:nome ao invés de @nome"
echo "  • Atualização automática de badges e status"
echo "  • Suporte a Windows via WSL"
echo "  • Web IDE com terminal integrado"
echo ""

echo -e "${YELLOW}💡 Dica:${NC} Use /agents:strategist para iniciar uma nova feature"
echo ""
