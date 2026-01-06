#!/bin/bash

# DevFlow Installer
# Instala DevFlow em qualquer projeto existente ou novo

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  DevFlow Installer${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} 
$1"
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
echo "1) Apenas agentes (.devflow/) - Mínimo necessário"
echo "2) Agentes + Estrutura de documentação - Recomendado"
echo "3) Instalação completa - Tudo"
echo ""
read -p "Escolha (1-3): " -n 1 -r INSTALL_OPTION
echo ""
echo ""

# Check if .devflow already exists
if [ -d "$TARGET_DIR/.devflow" ]; then
    print_warning "Pasta .devflow já existe no diretório de destino!"
    echo ""
    read -p "Deseja sobrescrever? (s/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_error "Instalação cancelada."
        exit 1
    fi
    rm -rf "$TARGET_DIR/.devflow"
fi

# Install based on option
case $INSTALL_OPTION in
    1)
        print_info "Instalando apenas agentes..."
        echo ""
        
        # Copy .devflow
        cp -r "$SCRIPT_DIR/.devflow" "$TARGET_DIR/"
        print_success "Agentes instalados (.devflow/)"
        
        ;;
    2)
        print_info "Instalando agentes + estrutura de documentação..."
        echo ""

        # Copy .devflow
        cp -r "$SCRIPT_DIR/.devflow" "$TARGET_DIR/"
        print_success "Agentes instalados (.devflow/)"

        # Copy documentation structure
        if [ ! -d "$TARGET_DIR/docs" ]; then
            cp -r "$SCRIPT_DIR/docs" "$TARGET_DIR/"
            print_success "Pasta docs/ criada com toda estrutura"
        else
            print_warning "Pasta docs/ já existe - mantendo a existente"
        fi

        ;;
    3)
        print_info "Instalação completa..."
        echo ""

        # Copy .devflow
        cp -r "$SCRIPT_DIR/.devflow" "$TARGET_DIR/"
        print_success "Agentes instalados (.devflow/)"

        # Copy documentation structure
        if [ ! -d "$TARGET_DIR/docs" ]; then
            cp -r "$SCRIPT_DIR/docs" "$TARGET_DIR/"
            print_success "Pasta docs/ criada com toda estrutura"
        else
            print_warning "Pasta docs/ já existe - mantendo a existente"
        fi

        # Copy .gitignore (merge if exists)
        if [ -f "$TARGET_DIR/.gitignore" ]; then
            print_warning ".gitignore já existe - adicionando entradas do DevFlow"
            cat "$SCRIPT_DIR/.gitignore" >> "$TARGET_DIR/.gitignore"
            print_success ".gitignore atualizado"
        else
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
echo -e "${GREEN}  ✓ DevFlow instalado com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_info "Próximos passos:"
echo ""
echo "1. Abra o projeto no Claude Code:"
echo "   cd $TARGET_DIR"
echo "   code ."
echo ""
echo "2. No chat do Claude Code, teste:"
echo "   @strategist Olá! Apresente-se"
echo ""
echo "3. Crie sua primeira feature:"
echo "   @strategist Quero criar [sua feature]"
echo ""
print_info "Documentação completa em:"
echo "   $SCRIPT_DIR/README.md"
echo "   $SCRIPT_DIR/docs/QUICKSTART.md"
echo "   $SCRIPT_DIR/docs/INSTALLATION.md"
echo ""
echo "Boa codificação! 🚀"
echo ""
