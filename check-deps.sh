#!/bin/bash

# DevFlow Dependency Checker
# Verifica se todas as dependências estão instaladas

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  DevFlow - Verificador de Dependências${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        OS_ID=$ID
        VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS=$(cat /etc/redhat-release)
        OS_ID="rhel"
    elif [ -f /etc/debian_version ]; then
        OS="Debian $(cat /etc/debian_version)"
        OS_ID="debian"
    else
        OS=$(uname -s)
        OS_ID="unknown"
    fi
    echo -e "${BLUE}Sistema:${NC} $OS"
    echo ""
}

# Check command exists
check_cmd() {
    local cmd=$1
    local name=$2
    local min_version=$3

    if command -v $cmd &> /dev/null; then
        version=$($cmd --version 2>/dev/null | head -n1 || echo "unknown")
        echo -e "${GREEN}✓${NC} $name: $version"
        return 0
    else
        echo -e "${RED}✗${NC} $name: NÃO ENCONTRADO"
        return 1
    fi
}

# Check Node.js version
check_node() {
    if command -v node &> /dev/null; then
        version=$(node --version | sed 's/v//')
        major=$(echo $version | cut -d. -f1)
        if [ "$major" -ge 18 ]; then
            echo -e "${GREEN}✓${NC} Node.js: v$version (OK - requer 18+)"
            return 0
        else
            echo -e "${YELLOW}⚠${NC} Node.js: v$version (ATUALIZAR - requer 18+)"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Node.js: NÃO ENCONTRADO"
        return 1
    fi
}

# Check Python version
check_python() {
    local py_cmd=""
    if command -v python3 &> /dev/null; then
        py_cmd="python3"
    elif command -v python &> /dev/null; then
        py_cmd="python"
    fi

    if [ -n "$py_cmd" ]; then
        version=$($py_cmd --version 2>&1 | sed 's/Python //')
        major=$(echo $version | cut -d. -f1)
        if [ "$major" -ge 3 ]; then
            echo -e "${GREEN}✓${NC} Python: $version (OK)"
            return 0
        else
            echo -e "${YELLOW}⚠${NC} Python: $version (ATUALIZAR - requer 3.x)"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Python: NÃO ENCONTRADO"
        return 1
    fi
}

# Check GCC
check_gcc() {
    if command -v gcc &> /dev/null; then
        version=$(gcc --version | head -n1)
        echo -e "${GREEN}✓${NC} GCC: $version"
        return 0
    else
        echo -e "${RED}✗${NC} GCC: NÃO ENCONTRADO"
        return 1
    fi
}

# Check G++
check_gpp() {
    if command -v g++ &> /dev/null; then
        version=$(g++ --version | head -n1)
        echo -e "${GREEN}✓${NC} G++: $version"
        return 0
    else
        echo -e "${RED}✗${NC} G++: NÃO ENCONTRADO"
        return 1
    fi
}

# Check make
check_make() {
    if command -v make &> /dev/null; then
        version=$(make --version | head -n1)
        echo -e "${GREEN}✓${NC} Make: $version"
        return 0
    else
        echo -e "${RED}✗${NC} Make: NÃO ENCONTRADO"
        return 1
    fi
}

# Main checks
detect_os

echo -e "${BLUE}Dependências CLI (Agentes):${NC}"
echo "─────────────────────────────"
CLI_OK=true
check_cmd "git" "Git" || CLI_OK=false
check_cmd "bash" "Bash" || CLI_OK=false
if command -v claude &> /dev/null; then
    echo -e "${GREEN}✓${NC} Claude Code: $(claude --version 2>/dev/null || echo 'instalado')"
else
    echo -e "${YELLOW}⚠${NC} Claude Code: NÃO ENCONTRADO (npm i -g @anthropic-ai/claude-code)"
fi
echo ""

echo -e "${BLUE}Dependências Web IDE:${NC}"
echo "─────────────────────────────"
WEB_OK=true
check_node || WEB_OK=false
check_cmd "npm" "npm" || WEB_OK=false
check_python || WEB_OK=false
check_gcc || WEB_OK=false
check_gpp || WEB_OK=false
check_make || WEB_OK=false
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if $CLI_OK && $WEB_OK; then
    echo -e "${GREEN}  ✓ Todas as dependências estão instaladas!${NC}"
else
    echo -e "${YELLOW}  ⚠ Algumas dependências estão faltando${NC}"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Installation hints based on OS
if ! $CLI_OK || ! $WEB_OK; then
    echo -e "${BLUE}Comandos para instalar dependências faltantes:${NC}"
    echo ""

    case $OS_ID in
        ubuntu|debian|linuxmint|pop)
            echo "# Debian/Ubuntu:"
            echo "sudo apt-get update"
            echo "sudo apt-get install -y build-essential python3 git"
            echo ""
            echo "# Node.js 20 LTS:"
            echo "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "sudo apt-get install -y nodejs"
            ;;
        fedora)
            echo "# Fedora:"
            echo "sudo dnf groupinstall -y 'Development Tools'"
            echo "sudo dnf install -y python3 git nodejs npm"
            ;;
        rhel|centos|rocky|almalinux)
            echo "# RHEL/CentOS/Rocky:"
            echo "sudo dnf groupinstall -y 'Development Tools'"
            echo "sudo dnf install -y python3 git"
            echo ""
            echo "# Node.js 20 LTS:"
            echo "curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
            echo "sudo dnf install -y nodejs"
            ;;
        arch|manjaro)
            echo "# Arch/Manjaro:"
            echo "sudo pacman -S base-devel python git nodejs npm"
            ;;
        opensuse*)
            echo "# openSUSE:"
            echo "sudo zypper install -t pattern devel_basis"
            echo "sudo zypper install python3 git nodejs npm"
            ;;
        *)
            echo "# Instale manualmente:"
            echo "- Node.js 18+ (https://nodejs.org)"
            echo "- Python 3"
            echo "- GCC/G++ (compiladores C/C++)"
            echo "- Make"
            echo "- Git"
            ;;
    esac
    echo ""
    echo "# Claude Code:"
    echo "npm install -g @anthropic-ai/claude-code"
    echo ""
fi

# node-pty specific note
echo -e "${YELLOW}Nota:${NC} A Web IDE usa node-pty que requer compilação nativa."
echo "Se npm install falhar, verifique se GCC, G++ e Python estão instalados."
echo ""
