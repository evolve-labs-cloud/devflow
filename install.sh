#!/bin/bash

# DevFlow Installer v0.5.0
# Instala DevFlow em qualquer projeto existente ou novo

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VERSION="0.5.0"

# Functions
print_header() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  DevFlow Installer v${VERSION}${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if target directory is provided
if [ -z "$1" ]; then
    print_error "Uso: ./install.sh /caminho/para/seu-projeto"
    echo ""
    echo "Exemplos:"
    echo "  ./install.sh ~/meu-projeto"
    echo "  ./install.sh ."
    echo ""
    exit 1
fi

TARGET_DIR="$1"

# Resolve to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd || echo "$TARGET_DIR")"

print_header

# Validate target directory
if [ ! -d "$TARGET_DIR" ]; then
    print_error "Diretório não encontrado: $TARGET_DIR"
    echo ""
    read -p "Deseja criar este diretório? (s/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        mkdir -p "$TARGET_DIR"
        print_success "Diretório criado: $TARGET_DIR"
    else
        print_error "Instalação cancelada."
        exit 1
    fi
fi

echo ""
print_info "Instalando DevFlow em: $TARGET_DIR"
echo ""

# Ask what to install
echo "O que você quer instalar?"
echo ""
echo "1) Apenas CLI (.claude/) - Mínimo necessário"
echo "2) CLI + Memória (.claude/ + .devflow/) - Recomendado"
echo "3) CLI + Memória + Docs - Completo sem Web IDE"
echo "4) Instalação completa + Web IDE - Tudo incluindo web/"
echo ""
read -p "Escolha (1-4): " -n 1 -r INSTALL_OPTION
echo ""
echo ""

# Check if .claude already exists
if [ -d "$TARGET_DIR/.claude" ]; then
    print_warning "Pasta .claude já existe no diretório de destino!"
    echo ""
    read -p "Deseja sobrescrever? (s/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_error "Instalação cancelada."
        exit 1
    fi
    rm -rf "$TARGET_DIR/.claude"
fi

# Install based on option
case $INSTALL_OPTION in
    1)
        print_info "Instalando apenas CLI (agentes)..."
        echo ""

        # Copy .claude
        cp -r "$SCRIPT_DIR/.claude" "$TARGET_DIR/"
        print_success "Agentes instalados (.claude/commands/agents/)"

        ;;
    2)
        print_info "Instalando CLI + Memória..."
        echo ""

        # Copy .claude
        cp -r "$SCRIPT_DIR/.claude" "$TARGET_DIR/"
        print_success "Agentes instalados (.claude/commands/agents/)"

        # Copy .devflow
        if [ ! -d "$TARGET_DIR/.devflow" ]; then
            cp -r "$SCRIPT_DIR/.devflow" "$TARGET_DIR/"
            print_success "Sistema de memória instalado (.devflow/)"
        else
            print_warning "Pasta .devflow já existe - mantendo a existente"
        fi

        ;;
    3)
        print_info "Instalação completa..."
        echo ""

        # Copy .claude
        cp -r "$SCRIPT_DIR/.claude" "$TARGET_DIR/"
        print_success "Agentes instalados (.claude/commands/agents/)"

        # Copy .devflow
        if [ ! -d "$TARGET_DIR/.devflow" ]; then
            cp -r "$SCRIPT_DIR/.devflow" "$TARGET_DIR/"
            print_success "Sistema de memória instalado (.devflow/)"
        else
            print_warning "Pasta .devflow já existe - mantendo a existente"
        fi

        # Copy documentation structure
        if [ ! -d "$TARGET_DIR/docs" ]; then
            cp -r "$SCRIPT_DIR/docs" "$TARGET_DIR/"
            print_success "Documentação instalada (docs/)"
        else
            print_warning "Pasta docs/ já existe - mantendo a existente"
        fi

        # Copy .gitignore (merge if exists)
        if [ -f "$TARGET_DIR/.gitignore" ]; then
            print_warning ".gitignore já existe - adicionando entradas do DevFlow"
            echo "" >> "$TARGET_DIR/.gitignore"
            echo "# DevFlow" >> "$TARGET_DIR/.gitignore"
            echo ".devflow/memory/" >> "$TARGET_DIR/.gitignore"
            print_success ".gitignore atualizado"
        elif [ -f "$SCRIPT_DIR/.gitignore" ]; then
            cp "$SCRIPT_DIR/.gitignore" "$TARGET_DIR/"
            print_success ".gitignore criado"
        fi

        ;;
    4)
        print_info "Instalação completa + Web IDE..."
        echo ""

        # Copy .claude
        cp -r "$SCRIPT_DIR/.claude" "$TARGET_DIR/"
        print_success "Agentes instalados (.claude/commands/agents/)"

        # Copy .devflow
        if [ ! -d "$TARGET_DIR/.devflow" ]; then
            cp -r "$SCRIPT_DIR/.devflow" "$TARGET_DIR/"
            print_success "Sistema de memória instalado (.devflow/)"
        else
            print_warning "Pasta .devflow já existe - mantendo a existente"
        fi

        # Copy documentation structure
        if [ ! -d "$TARGET_DIR/docs" ]; then
            cp -r "$SCRIPT_DIR/docs" "$TARGET_DIR/"
            print_success "Documentação instalada (docs/)"
        else
            print_warning "Pasta docs/ já existe - mantendo a existente"
        fi

        # Copy web folder (excluding node_modules and .next)
        if [ ! -d "$TARGET_DIR/web" ]; then
            print_info "Copiando Web IDE (isso pode demorar um pouco)..."
            mkdir -p "$TARGET_DIR/web"
            rsync -a --exclude 'node_modules' --exclude '.next' "$SCRIPT_DIR/web/" "$TARGET_DIR/web/"
            print_success "Web IDE instalada (web/)"
            echo ""
            print_info "Para iniciar a Web IDE:"
            echo "   cd $TARGET_DIR/web"
            echo "   npm install"
            echo "   npm run dev"
        else
            print_warning "Pasta web/ já existe - mantendo a existente"
        fi

        # Copy .gitignore (merge if exists)
        if [ -f "$TARGET_DIR/.gitignore" ]; then
            print_warning ".gitignore já existe - adicionando entradas do DevFlow"
            echo "" >> "$TARGET_DIR/.gitignore"
            echo "# DevFlow" >> "$TARGET_DIR/.gitignore"
            echo ".devflow/memory/" >> "$TARGET_DIR/.gitignore"
            echo "web/node_modules/" >> "$TARGET_DIR/.gitignore"
            echo "web/.next/" >> "$TARGET_DIR/.gitignore"
            print_success ".gitignore atualizado"
        elif [ -f "$SCRIPT_DIR/.gitignore" ]; then
            cp "$SCRIPT_DIR/.gitignore" "$TARGET_DIR/"
            print_success ".gitignore criado"
        fi

        ;;
    *)
        print_error "Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ DevFlow v${VERSION} instalado com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_info "Próximos passos:"
echo ""
echo "1. Abra o projeto com Claude Code:"
echo "   cd $TARGET_DIR"
echo "   claude"
echo ""
echo "2. No terminal, teste os agentes:"
echo "   /agents:strategist Olá! Apresente-se"
echo ""
echo "3. Crie sua primeira feature:"
echo "   /agents:strategist Quero criar [sua feature]"
echo ""
echo "Agentes disponíveis:"
echo "   /agents:strategist  - Planejamento & Produto"
echo "   /agents:architect   - Design & Arquitetura"
echo "   /agents:builder     - Implementação"
echo "   /agents:guardian    - Qualidade & Testes"
echo "   /agents:chronicler  - Documentação"
echo ""
print_info "Documentação:"
echo "   $SCRIPT_DIR/README.md"
echo "   $SCRIPT_DIR/docs/QUICKSTART.md"
echo ""
echo "Boa codificação! 🚀"
echo ""
