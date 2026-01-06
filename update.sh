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
CURRENT_VERSION="0.3.0"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  DevFlow Updater v${CURRENT_VERSION}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get target directory
TARGET_DIR="${1:-.}"

# Convert to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
    echo -e "${RED}❌ Diretório não encontrado: $1${NC}"
    exit 1
}

# Check if DevFlow is installed
if [ ! -d "$TARGET_DIR/.devflow" ]; then
    echo -e "${RED}❌ DevFlow não encontrado em: $TARGET_DIR${NC}"
    echo -e "${YELLOW}   Use install.sh para instalar pela primeira vez.${NC}"
    exit 1
fi

# Get script directory (where the new version is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
echo -e "${YELLOW}   Customizações em .devflow/agents/ serão perdidas.${NC}"
echo ""
read -p "Continuar com o update? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Update cancelado.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Atualizando DevFlow...${NC}"

# Backup existing agents (optional)
BACKUP_DIR="$TARGET_DIR/.devflow/backup-$(date +%Y%m%d-%H%M%S)"
echo -e "  → Criando backup em ${BACKUP_DIR}"
mkdir -p "$BACKUP_DIR"
cp -r "$TARGET_DIR/.devflow/agents" "$BACKUP_DIR/" 2>/dev/null || true
cp "$TARGET_DIR/.devflow/project.yaml" "$BACKUP_DIR/" 2>/dev/null || true

# Update agents
echo -e "  → Atualizando agentes..."
cp "$SCRIPT_DIR/.devflow/agents/"*.md "$TARGET_DIR/.devflow/agents/"
cp "$SCRIPT_DIR/.devflow/agents/"*.meta.yaml "$TARGET_DIR/.devflow/agents/"

# Update knowledge graph structure (preserve user data if possible)
echo -e "  → Atualizando knowledge graph..."
cp "$SCRIPT_DIR/.devflow/knowledge-graph.json" "$TARGET_DIR/.devflow/"

# Update project.yaml version (preserve user customizations)
echo -e "  → Atualizando project.yaml..."
if [ -f "$TARGET_DIR/.devflow/project.yaml" ]; then
    # Update version in existing file
    sed -i.bak "s/version:.*/version: \"$CURRENT_VERSION\"/" "$TARGET_DIR/.devflow/project.yaml"
    rm -f "$TARGET_DIR/.devflow/project.yaml.bak"
else
    cp "$SCRIPT_DIR/.devflow/project.yaml" "$TARGET_DIR/.devflow/"
fi

# Update .claude_project if exists
if [ -f "$SCRIPT_DIR/.claude_project" ]; then
    echo -e "  → Atualizando .claude_project..."
    cp "$SCRIPT_DIR/.claude_project" "$TARGET_DIR/"
fi

# Create new directories if they don't exist (v0.3.0)
echo -e "  → Criando novos diretórios..."
mkdir -p "$TARGET_DIR/docs/security"
mkdir -p "$TARGET_DIR/docs/performance"
mkdir -p "$TARGET_DIR/docs/planning/stories"
touch "$TARGET_DIR/docs/security/.gitkeep" 2>/dev/null || true
touch "$TARGET_DIR/docs/performance/.gitkeep" 2>/dev/null || true
touch "$TARGET_DIR/docs/planning/stories/.gitkeep" 2>/dev/null || true

# Copy new documentation files
echo -e "  → Atualizando documentação..."
cp "$SCRIPT_DIR/docs/AI_OPTIMIZATION_GUIDE.md" "$TARGET_DIR/docs/" 2>/dev/null || true
cp "$SCRIPT_DIR/docs/CHANGELOG.md" "$TARGET_DIR/docs/" 2>/dev/null || true

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ DevFlow atualizado para v${CURRENT_VERSION}!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📦 O que foi atualizado:${NC}"
echo "  • Agentes com Hard Stops (v0.3.0)"
echo "  • Delegação obrigatória entre agentes"
echo "  • Geração automática de stories"
echo "  • AI_OPTIMIZATION_GUIDE.md"
echo "  • Novos diretórios: docs/security/, docs/performance/"
echo ""

echo -e "${BLUE}📁 Backup salvo em:${NC}"
echo "  $BACKUP_DIR"
echo ""

echo -e "${BLUE}🆕 Novidades v0.3.0:${NC}"
echo "  • Hard Stops: Agentes não fazem trabalho de outros"
echo "  • Delegação: Fluxo obrigatório entre agentes"
echo "  • Auto Stories: @chronicler gera se @strategist não criar"
echo ""

echo -e "${YELLOW}💡 Dica:${NC} Leia docs/AI_OPTIMIZATION_GUIDE.md para maximizar"
echo "   as capacidades do DevFlow com IA."
echo ""
