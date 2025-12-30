#!/bin/bash

# DevFlow Update Script v0.5.0
# Atualiza uma instalação existente do DevFlow para a versão mais recente

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Current version
CURRENT_VERSION="0.5.0"

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}  DevFlow Updater v${CURRENT_VERSION}${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get target directory
TARGET_DIR="${1:-.}"

# Convert to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
    echo -e "${RED}❌ Diretório não encontrado: $1${NC}"
    exit 1
}

# Check if DevFlow is installed (check for .claude or .devflow)
if [ ! -d "$TARGET_DIR/.claude" ] && [ ! -d "$TARGET_DIR/.devflow" ]; then
    echo -e "${RED}❌ DevFlow não encontrado em: $TARGET_DIR${NC}"
    echo -e "${YELLOW}   Use install.sh para instalar pela primeira vez.${NC}"
    exit 1
fi

# Get script directory (where the new version is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect installed version
INSTALLED_VERSION="unknown"
if [ -f "$TARGET_DIR/.devflow/project.yaml" ]; then
    INSTALLED_VERSION=$(grep -E "^\s*version:" "$TARGET_DIR/.devflow/project.yaml" 2>/dev/null | head -1 | sed 's/.*version:[[:space:]]*"\?\([^"]*\)"\?/\1/' | tr -d ' ') || true
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

# Backup existing configuration
BACKUP_DIR="$TARGET_DIR/.devflow/backup-$(date +%Y%m%d-%H%M%S)"
echo -e "  → Criando backup em ${BACKUP_DIR}"
mkdir -p "$BACKUP_DIR"

# Backup .claude if exists
if [ -d "$TARGET_DIR/.claude" ]; then
    cp -r "$TARGET_DIR/.claude" "$BACKUP_DIR/" 2>/dev/null || true
fi

# Backup .devflow config
cp "$TARGET_DIR/.devflow/project.yaml" "$BACKUP_DIR/" 2>/dev/null || true
cp "$TARGET_DIR/.devflow/knowledge-graph.json" "$BACKUP_DIR/" 2>/dev/null || true

# Update .claude (agents)
echo -e "  → Atualizando agentes (.claude/)..."
if [ -d "$SCRIPT_DIR/.claude" ]; then
    rm -rf "$TARGET_DIR/.claude"
    cp -r "$SCRIPT_DIR/.claude" "$TARGET_DIR/"
fi

# Update .devflow structure
echo -e "  → Atualizando estrutura (.devflow/)..."
if [ -d "$SCRIPT_DIR/.devflow" ]; then
    # Preserve user's snapshots and memory
    if [ -d "$TARGET_DIR/.devflow/snapshots" ]; then
        cp -r "$TARGET_DIR/.devflow/snapshots" "$BACKUP_DIR/"
    fi
    if [ -d "$TARGET_DIR/.devflow/memory" ]; then
        cp -r "$TARGET_DIR/.devflow/memory" "$BACKUP_DIR/"
    fi

    # Copy new .devflow
    cp "$SCRIPT_DIR/.devflow/knowledge-graph.json" "$TARGET_DIR/.devflow/" 2>/dev/null || true
    cp "$SCRIPT_DIR/.devflow/project.yaml" "$TARGET_DIR/.devflow/" 2>/dev/null || true

    # Restore user's snapshots and memory
    if [ -d "$BACKUP_DIR/snapshots" ]; then
        cp -r "$BACKUP_DIR/snapshots"/* "$TARGET_DIR/.devflow/snapshots/" 2>/dev/null || true
    fi
    if [ -d "$BACKUP_DIR/memory" ]; then
        mkdir -p "$TARGET_DIR/.devflow/memory"
        cp -r "$BACKUP_DIR/memory"/* "$TARGET_DIR/.devflow/memory/" 2>/dev/null || true
    fi
fi

# Update project.yaml version
echo -e "  → Atualizando versão..."
if [ -f "$TARGET_DIR/.devflow/project.yaml" ]; then
    sed -i.bak "s/version:.*/version: \"$CURRENT_VERSION\"/" "$TARGET_DIR/.devflow/project.yaml"
    rm -f "$TARGET_DIR/.devflow/project.yaml.bak"
fi

# Create new directories if they don't exist
echo -e "  → Criando novos diretórios..."
mkdir -p "$TARGET_DIR/docs/planning/stories"

# Update documentation files
echo -e "  → Atualizando documentação..."
if [ -d "$SCRIPT_DIR/docs" ]; then
    cp "$SCRIPT_DIR/docs/AI_OPTIMIZATION_GUIDE.md" "$TARGET_DIR/docs/" 2>/dev/null || true
    cp "$SCRIPT_DIR/docs/MEMORY_SYSTEM.md" "$TARGET_DIR/docs/" 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ DevFlow atualizado para v${CURRENT_VERSION}!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📦 O que foi atualizado:${NC}"
echo "  • Agentes movidos para .claude/commands/agents/"
echo "  • Terminal como interface principal (Chat removido)"
echo "  • Agentes atualizam tasks automaticamente"
echo "  • Quick Actions no terminal"
echo ""

echo -e "${BLUE}📁 Backup salvo em:${NC}"
echo "  $BACKUP_DIR"
echo ""

echo -e "${BLUE}🆕 Novidades v0.5.0:${NC}"
echo "  • Terminal substitui Chat (performance nativa)"
echo "  • Quick Actions: botões para agentes no terminal"
echo "  • Resize handle no terminal"
echo "  • Builder/Guardian atualizam tasks nas stories"
echo ""

echo -e "${YELLOW}💡 Como usar:${NC}"
echo "  cd $TARGET_DIR"
echo "  claude"
echo "  /agents:strategist Olá!"
echo ""
