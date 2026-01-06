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
    echo -e "${BLUE}  DevFlow Installer v0.5.0${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_ID=$ID
        OS_NAME=$NAME
    elif [ -f /etc/redhat-release ]; then
        OS_ID="rhel"
        OS_NAME=$(cat /etc/redhat-release)
    elif [ -f /etc/debian_version ]; then
        OS_ID="debian"
        OS_NAME="Debian"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS_ID="macos"
        OS_NAME="macOS"
    else
        OS_ID="unknown"
        OS_NAME=$(uname -s)
    fi
}

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}Verificando dependências...${NC}"
    echo ""

    local missing_cli=()
    local missing_web=()
    local has_errors=false

    # CLI Dependencies (required)
    if ! command -v git &> /dev/null; then
        missing_cli+=("git")
        echo -e "${RED}✗${NC} Git: não encontrado"
    else
        echo -e "${GREEN}✓${NC} Git: $(git --version | head -c 20)..."
    fi

    if command -v claude &> /dev/null; then
        echo -e "${GREEN}✓${NC} Claude Code: instalado"
    else
        echo -e "${YELLOW}⚠${NC} Claude Code: não encontrado (npm i -g @anthropic-ai/claude-code)"
        missing_cli+=("claude-code")
    fi

    # Web IDE Dependencies (optional but checked)
    if command -v node &> /dev/null; then
        local node_version=$(node --version | sed 's/v//')
        local node_major=$(echo $node_version | cut -d. -f1)
        if [ "$node_major" -ge 18 ]; then
            echo -e "${GREEN}✓${NC} Node.js: v$node_version"
        else
            echo -e "${YELLOW}⚠${NC} Node.js: v$node_version (recomendado 18+)"
            missing_web+=("nodejs-upgrade")
        fi
    else
        echo -e "${YELLOW}⚠${NC} Node.js: não encontrado (necessário para Web IDE)"
        missing_web+=("nodejs")
    fi

    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✓${NC} Python3: $(python3 --version 2>&1 | sed 's/Python //')"
    elif command -v python &> /dev/null; then
        local py_version=$(python --version 2>&1 | sed 's/Python //')
        local py_major=$(echo $py_version | cut -d. -f1)
        if [ "$py_major" -ge 3 ]; then
            echo -e "${GREEN}✓${NC} Python: $py_version"
        else
            echo -e "${YELLOW}⚠${NC} Python: $py_version (necessário Python 3)"
            missing_web+=("python3")
        fi
    else
        echo -e "${YELLOW}⚠${NC} Python3: não encontrado (necessário para Web IDE)"
        missing_web+=("python3")
    fi

    if command -v gcc &> /dev/null; then
        echo -e "${GREEN}✓${NC} GCC: instalado"
    else
        echo -e "${YELLOW}⚠${NC} GCC: não encontrado (necessário para Web IDE)"
        missing_web+=("gcc")
    fi

    if command -v make &> /dev/null; then
        echo -e "${GREEN}✓${NC} Make: instalado"
    else
        echo -e "${YELLOW}⚠${NC} Make: não encontrado (necessário para Web IDE)"
        missing_web+=("make")
    fi

    echo ""

    # Show installation commands if something is missing
    if [ ${#missing_cli[@]} -gt 0 ] || [ ${#missing_web[@]} -gt 0 ]; then
        echo -e "${YELLOW}Dependências faltando:${NC}"
        echo ""

        case $OS_ID in
            ubuntu|debian|linuxmint|pop)
                if [ ${#missing_web[@]} -gt 0 ]; then
                    echo "  # Instalar dependências (Debian/Ubuntu):"
                    echo "  sudo apt-get update"
                    echo "  sudo apt-get install -y build-essential python3 git"
                    echo ""
                fi
                if [[ " ${missing_web[*]} " =~ " nodejs " ]] || [[ " ${missing_cli[*]} " =~ " nodejs " ]]; then
                    echo "  # Node.js 20 LTS:"
                    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
                    echo "  sudo apt-get install -y nodejs"
                    echo ""
                fi
                ;;
            fedora)
                if [ ${#missing_web[@]} -gt 0 ]; then
                    echo "  # Instalar dependências (Fedora):"
                    echo "  sudo dnf groupinstall -y 'Development Tools'"
                    echo "  sudo dnf install -y python3 git nodejs npm"
                    echo ""
                fi
                ;;
            rhel|centos|rocky|almalinux)
                if [ ${#missing_web[@]} -gt 0 ]; then
                    echo "  # Instalar dependências (RHEL/CentOS):"
                    echo "  sudo dnf groupinstall -y 'Development Tools'"
                    echo "  sudo dnf install -y python3 git"
                    echo ""
                    echo "  # Node.js 20 LTS:"
                    echo "  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
                    echo "  sudo dnf install -y nodejs"
                    echo ""
                fi
                ;;
            arch|manjaro)
                if [ ${#missing_web[@]} -gt 0 ]; then
                    echo "  # Instalar dependências (Arch):"
                    echo "  sudo pacman -S base-devel python git nodejs npm"
                    echo ""
                fi
                ;;
            macos)
                if [ ${#missing_web[@]} -gt 0 ]; then
                    echo "  # Instalar dependências (macOS):"
                    echo "  xcode-select --install"
                    echo "  brew install node"
                    echo ""
                fi
                ;;
            *)
                echo "  # Instale manualmente: Node.js 18+, Python 3, GCC, Make, Git"
                echo ""
                ;;
        esac

        if [[ " ${missing_cli[*]} " =~ " claude-code " ]]; then
            echo "  # Claude Code:"
            echo "  npm install -g @anthropic-ai/claude-code"
            echo "  claude login"
            echo ""
        fi

        # Ask to continue
        if [ ${#missing_cli[@]} -gt 0 ]; then
            echo -e "${YELLOW}⚠ Dependências CLI faltando. A instalação dos agentes pode não funcionar.${NC}"
        fi

        echo ""
        read -p "Continuar mesmo assim? (s/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            echo ""
            print_info "Instale as dependências e execute novamente."
            exit 1
        fi
        echo ""
    else
        echo -e "${GREEN}Todas as dependências estão instaladas!${NC}"
        echo ""
    fi
}

# Show usage
show_usage() {
    echo "Uso: ./install.sh [opções] /caminho/para/seu-projeto"
    echo ""
    echo "Opções:"
    echo "  --skip-deps    Pular verificação de dependências"
    echo "  --help         Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./install.sh ~/meu-projeto"
    echo "  ./install.sh --skip-deps ~/meu-projeto"
    echo "  ./install.sh ."
    echo ""
}

# Parse arguments
SKIP_DEPS=false
TARGET_DIR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            TARGET_DIR="$1"
            shift
            ;;
    esac
done

# Check if target directory is provided
if [ -z "$TARGET_DIR" ]; then
    print_error "Erro: caminho do projeto não informado"
    echo ""
    show_usage
    exit 1
fi

# Resolve to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd || echo "$TARGET_DIR")"

print_header

# Detect OS
detect_os
echo -e "${BLUE}Sistema:${NC} $OS_NAME"
echo ""

# Check dependencies (unless skipped)
if [ "$SKIP_DEPS" = false ]; then
    check_dependencies
fi

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
echo "1) Apenas agentes (.claude/) - Mínimo necessário"
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

        # Copy .claude/commands (agents)
        mkdir -p "$TARGET_DIR/.claude/commands"
        cp -r "$SCRIPT_DIR/.claude/commands/agents" "$TARGET_DIR/.claude/commands/"
        print_success "Agentes instalados (.claude/commands/agents/)"

        # Copy .devflow structure (clean)
        mkdir -p "$TARGET_DIR/.devflow/agents"
        mkdir -p "$TARGET_DIR/.devflow/memory"
        mkdir -p "$TARGET_DIR/.devflow/sessions"
        mkdir -p "$TARGET_DIR/docs/snapshots"
        cp "$SCRIPT_DIR/.devflow/project.yaml" "$TARGET_DIR/.devflow/" 2>/dev/null || touch "$TARGET_DIR/.devflow/project.yaml"
        print_success "Estrutura .devflow/ criada"

        ;;
    2)
        print_info "Instalando agentes + estrutura de documentação..."
        echo ""

        # Copy .claude/commands (agents)
        mkdir -p "$TARGET_DIR/.claude/commands"
        cp -r "$SCRIPT_DIR/.claude/commands/agents" "$TARGET_DIR/.claude/commands/"
        print_success "Agentes instalados (.claude/commands/agents/)"

        # Copy .devflow structure (clean)
        mkdir -p "$TARGET_DIR/.devflow/agents"
        mkdir -p "$TARGET_DIR/.devflow/memory"
        mkdir -p "$TARGET_DIR/.devflow/sessions"
        mkdir -p "$TARGET_DIR/docs/snapshots"
        cp "$SCRIPT_DIR/.devflow/project.yaml" "$TARGET_DIR/.devflow/" 2>/dev/null || touch "$TARGET_DIR/.devflow/project.yaml"
        print_success "Estrutura .devflow/ criada"

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

        # Copy .claude/commands (agents)
        mkdir -p "$TARGET_DIR/.claude/commands"
        cp -r "$SCRIPT_DIR/.claude/commands/agents" "$TARGET_DIR/.claude/commands/"
        print_success "Agentes instalados (.claude/commands/agents/)"

        # Copy .devflow structure (clean)
        mkdir -p "$TARGET_DIR/.devflow/agents"
        mkdir -p "$TARGET_DIR/.devflow/memory"
        mkdir -p "$TARGET_DIR/.devflow/sessions"
        mkdir -p "$TARGET_DIR/docs/snapshots"
        cp "$SCRIPT_DIR/.devflow/project.yaml" "$TARGET_DIR/.devflow/" 2>/dev/null || touch "$TARGET_DIR/.devflow/project.yaml"
        print_success "Estrutura .devflow/ criada"

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
echo "   claude"
echo ""
echo "2. No terminal do Claude Code, teste:"
echo "   /agents:strategist Olá! Apresente-se"
echo ""
echo "3. Crie sua primeira feature:"
echo "   /agents:strategist Quero criar [sua feature]"
echo ""
print_info "Documentação completa em:"
echo "   $SCRIPT_DIR/docs/QUICKSTART.md"
echo "   $SCRIPT_DIR/docs/INSTALLATION.md"
echo ""
echo "Boa codificação! 🚀"
echo ""
