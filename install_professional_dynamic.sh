#!/bin/bash
# =============================================================================
# SILHOUETTE BROWSER - INSTALADOR PROFESIONAL DINÁMICO
# Instalación automática con detección de OS y dependencias dinámicas
# =============================================================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════╗
║                🚀 SILHOUETTE BROWSER V4.0 SUPREMA 🚀                   ║
║           Instalador Profesional Dinámico Multiplataforma             ║
║           Detección Automática + Dependencias Dinámicas               ║
║                   Instalación Sin Errores                             ║
╚════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Función de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Función de éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función de advertencia
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Función de error
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función de información
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Función de progreso
progress() {
    echo -e "${WHITE}🔄 $1${NC}"
}

# Detectar sistema operativo
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
            OS_NAME="Debian/Ubuntu"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
            OS_NAME="Red Hat/CentOS/Fedora"
        elif [ -f /etc/arch-release ]; then
            OS="arch"
            OS_NAME="Arch Linux"
        elif [ -f /etc/opensuse-release ]; then
            OS="opensuse"
            OS_NAME="openSUSE"
        else
            OS="linux"
            OS_NAME="Linux (genérico)"
        fi
        ARCH="x86_64"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        OS_NAME="macOS"
        ARCH=$(uname -m)
    else
        error "Sistema operativo no soportado: $OSTYPE"
        exit 1
    fi
    
    log "Sistema detectado: $OS_NAME ($ARCH)"
}

# Detectar versión específica
detect_version() {
    case $OS in
        "debian")
            VERSION=$(lsb_release -rs 2>/dev/null || cat /etc/debian_version | cut -d. -f1)
            ;;
        "redhat")
            VERSION=$(cat /etc/redhat-release | grep -oE '[0-9]+\.[0-9]+' | head -1)
            ;;
        "arch")
            VERSION=$(cat /etc/arch-release | grep -oE '[0-9]+\.[0-9]+' || echo "rolling")
            ;;
        "opensuse")
            VERSION=$(cat /etc/opensuse-release | grep -oE '[0-9]+\.[0-9]+' | head -1)
            ;;
        "macos")
            VERSION=$(sw_vers -productVersion)
            ;;
        *)
            VERSION="unknown"
            ;;
    esac
    
    log "Versión: $VERSION"
}

# Verificar dependencias del sistema
check_system_dependencies() {
    log "Verificando dependencias del sistema..."
    
    local missing_deps=()
    
    # Verificar herramientas básicas
    for tool in "curl" "wget" "git" "unzip"; do
        if ! command -v $tool &> /dev/null; then
            missing_deps+=($tool)
        fi
    done
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    else
        local node_version=$(node -v | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        if [ "$major_version" -lt 16 ]; then
            warning "Node.js versión $node_version detectada. Se recomienda 16+"
        fi
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        warning "Dependencias faltantes: ${missing_deps[*]}"
        return 1
    else
        success "Todas las dependencias del sistema están disponibles"
        return 0
    fi
}

# Instalar dependencias del sistema
install_system_dependencies() {
    log "Instalando dependencias del sistema..."
    
    case $OS in
        "debian")
            install_deps_debian
            ;;
        "redhat")
            install_deps_redhat
            ;;
        "arch")
            install_deps_arch
            ;;
        "opensuse")
            install_deps_opensuse
            ;;
        "macos")
            install_deps_macos
            ;;
        *)
            error "No se pueden instalar dependencias para $OS"
            exit 1
            ;;
    esac
}

# Instalar dependencias en Debian/Ubuntu
install_deps_debian() {
    progress "Actualizando repositorios..."
    sudo apt update -qq
    
    progress "Instalando dependencias básicas..."
    sudo apt install -y curl wget git unzip build-essential
    
    # Instalar Node.js si no está presente
    if ! command -v node &> /dev/null; then
        progress "Instalando Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    # Instalar herramientas adicionales
    sudo apt install -y python3 python3-pip
    
    success "Dependencias de Debian/Ubuntu instaladas"
}

# Instalar dependencias en Red Hat/CentOS/Fedora
install_deps_redhat() {
    progress "Instalando dependencias básicas..."
    
    if command -v dnf &> /dev/null; then
        # Fedora
        sudo dnf install -y curl wget git unzip gcc gcc-c++ make
        if ! command -v node &> /dev/null; then
            sudo dnf install -y nodejs npm
        fi
    else
        # CentOS/RHEL
        sudo yum install -y curl wget git unzip gcc gcc-c++ make
        if ! command -v node &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs npm
        fi
    fi
    
    # Instalar Python
    sudo yum install -y python3 python3-pip || sudo dnf install -y python3 python3-pip
    
    success "Dependencias de Red Hat/CentOS/Fedora instaladas"
}

# Instalar dependencias en Arch Linux
install_deps_arch() {
    progress "Instalando dependencias básicas..."
    sudo pacman -S --noconfirm curl wget git unzip gcc make
    
    # Instalar Node.js si no está presente
    if ! command -v node &> /dev/null; then
        sudo pacman -S --noconfirm nodejs npm
    fi
    
    # Instalar Python
    sudo pacman -S --noconfirm python python-pip
    
    success "Dependencias de Arch Linux instaladas"
}

# Instalar dependencias en openSUSE
install_deps_opensuse() {
    progress "Instalando dependencias básicas..."
    sudo zypper install -y curl wget git unzip gcc gcc-c++ make
    
    # Instalar Node.js si no está presente
    if ! command -v node &> /dev/null; then
        sudo zypper install -y nodejs npm
    fi
    
    # Instalar Python
    sudo zypper install -y python3 python3-pip
    
    success "Dependencias de openSUSE instaladas"
}

# Instalar dependencias en macOS
install_deps_macos() {
    progress "Verificando Homebrew..."
    if ! command -v brew &> /dev/null; then
        warning "Homebrew no encontrado. Instalando..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    progress "Instalando dependencias con Homebrew..."
    brew install curl wget git unzip gcc make
    
    # Instalar Node.js si no está presente
    if ! command -v node &> /dev/null; then
        brew install node
    fi
    
    # Verificar herramientas de desarrollo
    if ! xcode-select -p &> /dev/null; then
        warning "Xcode Command Line Tools no instalado."
        echo "Ejecutar: xcode-select --install"
    fi
    
    success "Dependencias de macOS instaladas"
}

# Verificar espacio en disco
check_disk_space() {
    log "Verificando espacio en disco..."
    
    local required_space=2048  # 2GB en MB
    local available_space
    
    case $OS in
        "macos")
            available_space=$(df -h / | tail -1 | awk '{print $4}' | sed 's/G//' | head -c 4)
            ;;
        *)
            available_space=$(df -h . | tail -1 | awk '{print $4}' | sed 's/G//' | head -c 4)
            ;;
    esac
    
    if [ "$available_space" -lt "$required_space" ]; then
        error "Espacio insuficiente. Se requiere al menos 2GB, disponible: ${available_space}GB"
        exit 1
    else
        success "Espacio en disco suficiente: ${available_space}GB disponible"
    fi
}

# Clonar y configurar repositorio
setup_repository() {
    log "Configurando repositorio..."
    
    local repo_url="https://github.com/haroldfabla2-hue/silhouette-search.git"
    local target_dir="silhouette-browser-install"
    
    # Limpiar instalación anterior si existe
    if [ -d "$target_dir" ]; then
        progress "Limpiando instalación anterior..."
        rm -rf "$target_dir"
    fi
    
    progress "Clonando repositorio..."
    git clone "$repo_url" "$target_dir"
    cd "$target_dir"
    
    success "Repositorio configurado en: $(pwd)"
}

# Instalar dependencias de Node.js
install_node_dependencies() {
    log "Instalando dependencias de Node.js..."
    
    progress "Instalando dependencias globales..."
    npm install -g electron-builder
    npm install -g electron-updater
    
    progress "Instalando dependencias del proyecto..."
    cd silhouette-browser
    
    # Instalar dependencias con cache limpio
    npm cache clean --force
    npm install --no-optional
    
    success "Dependencias de Node.js instaladas"
}

# Configurar electron-builder
configure_electron_builder() {
    log "Configurando electron-builder..."
    
    # Copiar configuración profesional
    if [ -f "electron-builder.professional.yml" ]; then
        cp electron-builder.professional.yml electron-builder.yml
        success "Configuración profesional aplicada"
    else
        warning "Archivo de configuración profesional no encontrado"
    fi
}

# Construir aplicación
build_application() {
    log "Construyendo aplicación..."
    
    local build_target="current"
    
    # Determinar target de build según el sistema
    case $OS in
        "macos")
            if [[ "$ARCH" == "arm64" ]]; then
                build_target="mac-arm64"
            else
                build_target="mac-x64"
            fi
            ;;
        "linux")
            build_target="linux-x64"
            ;;
        *)
            build_target="current"
            ;;
    esac
    
    progress "Ejecutando build para: $build_target"
    
    # Ejecutar pre-build scripts
    if [ -f "build/pre-build.js" ]; then
        progress "Ejecutando pre-build scripts..."
        node build/pre-build.js
    fi
    
    # Construir aplicación
    npm run build
    
    # Construir distribución
    progress "Construyendo distribución..."
    if [ "$OS" = "macos" ]; then
        npm run dist:mac
    elif [ "$OS" = "linux" ]; then
        npm run dist:linux
    else
        npm run dist
    fi
    
    # Ejecutar post-build scripts
    if [ -f "build/after-artifact.js" ]; then
        progress "Ejecutando post-build scripts..."
        node build/after-artifact.js
    fi
    
    success "Aplicación construida exitosamente"
}

# Instalar aplicación
install_application() {
    log "Instalando aplicación..."
    
    local install_dir="/opt/silhouette-browser"
    local desktop_dir="$HOME/.local/share/applications"
    local bin_dir="$HOME/.local/bin"
    
    # Crear directorios
    progress "Creando directorios de instalación..."
    sudo mkdir -p "$install_dir"
    mkdir -p "$desktop_dir"
    mkdir -p "$bin_dir"
    
    # Copiar archivos
    progress "Copiando archivos de aplicación..."
    if [ "$OS" = "macos" ]; then
        # macOS: usar DMG
        local dmg_file=$(find dist -name "*.dmg" | head -1)
        if [ -n "$dmg_file" ]; then
            sudo cp "$dmg_file" "/Applications/"
            success "DMG copiado a /Applications/"
        else
            error "Archivo DMG no encontrado"
            return 1
        fi
    else
        # Linux: extraer AppImage
        local appimage_file=$(find dist -name "*.AppImage" | head -1)
        if [ -n "$appimage_file" ]; then
            sudo cp "$appimage_file" "$install_dir/Silhouette-Browser.AppImage"
            sudo chmod +x "$install_dir/Silhouette-Browser.AppImage"
            
            # Crear wrapper script
            sudo tee "$bin_dir/silhouette-browser" > /dev/null << EOF
#!/bin/bash
exec "$install_dir/Silhouette-Browser.AppImage" "\$@"
EOF
            sudo chmod +x "$bin_dir/silhouette-browser"
            
            success "AppImage instalado en: $install_dir/"
        else
            error "Archivo AppImage no encontrado"
            return 1
        fi
    fi
    
    # Crear entrada de escritorio
    if [ "$OS" != "macos" ]; then
        create_desktop_entry
    fi
    
    # Crear accesos directos
    create_shortcuts
}

# Crear entrada de escritorio
create_desktop_entry() {
    log "Creando entrada de escritorio..."
    
    local desktop_file="$desktop_dir/silhouette-browser.desktop"
    
    cat > "$desktop_file" << EOF
[Desktop Entry]
Name=Silhouette Browser
Comment=Navegador con IA y 78 equipos especializados
Exec=$bin_dir/silhouette-browser %U
Icon=applications-internet
Terminal=false
Type=Application
Categories=Network;WebBrowser;
StartupWMClass=silhouette-browser
Keywords=browser;ai;automation;agent;
MimeType=text/html;text/xml;application/xhtml+xml;application/xml;x-scheme-handler/silhouette;
EOF
    
    chmod +x "$desktop_file"
    success "Entrada de escritorio creada"
}

# Crear accesos directos
create_shortcuts() {
    log "Creando accesos directos..."
    
    # Acceso directo en el menú de aplicaciones
    if [ "$OS" != "macos" ]; then
        # Ya creado con desktop entry
        info "Acceso directo creado en el menú de aplicaciones"
    fi
    
    # Instrucciones para acceso directo en escritorio
    echo ""
    info "Para crear un acceso directo en el escritorio:"
    echo "  cp $desktop_dir/silhouette-browser.desktop $HOME/Desktop/"
    echo "  chmod +x $HOME/Desktop/silhouette-browser.desktop"
}

# Verificar instalación
verify_installation() {
    log "Verificando instalación..."
    
    local installed=false
    
    if [ "$OS" = "macos" ]; then
        if [ -d "/Applications/Silhouette Browser.app" ]; then
            installed=true
        fi
    else
        if [ -f "/opt/silhouette-browser/Silhouette-Browser.AppImage" ] && \
           [ -f "$bin_dir/silhouette-browser" ]; then
            installed=true
        fi
    fi
    
    if [ "$installed" = true ]; then
        success "Instalación verificada exitosamente"
        return 0
    else
        error "No se pudo verificar la instalación"
        return 1
    fi
}

# Mostrar información final
show_final_info() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 INSTALACIÓN COMPLETADA 🎉                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${WHITE}📱 SILHOUETTE BROWSER V4.0 INSTALADO EXITOSAMENTE${NC}"
    echo ""
    
    if [ "$OS" = "macos" ]; then
        echo -e "${CYAN}🍎 macOS:${NC}"
        echo "   📁 Aplicación disponible en: /Applications/Silhouette Browser.app"
        echo "   🔍 Buscar: 'Silhouette Browser' en Spotlight"
    else
        echo -e "${CYAN}🐧 Linux:${NC}"
        echo "   📁 Aplicación: /opt/silhouette-browser/Silhouette-Browser.AppImage"
        echo "   🚀 Ejecutar: silhouette-browser"
        echo "   📱 Menú: Aplicaciones > Internet > Silhouette Browser"
    fi
    
    echo ""
    echo -e "${YELLOW}✨ CARACTERÍSTICAS INSTALADAS:${NC}"
    echo "   🤖 IA con 78 equipos especializados"
    echo "   🌐 Control total del navegador"
    echo "   🔧 Generación automática de extensiones"
    echo "   ⚙️ Configuración visual de APIs"
    echo "   🛡️ Arquitectura de seguridad avanzada"
    
    echo ""
    echo -e "${BLUE}📖 PRÓXIMOS PASOS:${NC}"
    echo "   1. 🔑 Configurar APIs en la aplicación"
    echo "   2. 🎮 Probar el control de navegador por IA"
    echo "   3. 🔧 Generar extensiones automáticas"
    echo "   4. 🚀 Disfrutar del poder de Silhouette"
    
    echo ""
    echo -e "${PURPLE}🌟 ¡Gracias por elegir Silhouette Browser! 🌟${NC}"
}

# Función principal
main() {
    log "Iniciando instalación profesional de Silhouette Browser..."
    
    # Verificar permisos
    if [ "$EUID" -ne 0 ] && [ "$OS" != "macos" ]; then
        warning "Se requieren permisos de administrador para la instalación"
        warning "El proceso solicitará contraseña cuando sea necesario"
    fi
    
    # Detectar sistema
    detect_os
    detect_version
    
    # Verificaciones del sistema
    if ! check_system_dependencies; then
        warning "¿Desea instalar las dependencias faltantes automáticamente? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            install_system_dependencies
        else
            error "Instalación cancelada. Dependencias faltantes."
            exit 1
        fi
    fi
    
    # Verificar espacio
    check_disk_space
    
    # Configurar repositorio
    setup_repository
    
    # Instalar dependencias de Node.js
    install_node_dependencies
    
    # Configurar electron-builder
    configure_electron_builder
    
    # Construir aplicación
    build_application
    
    # Instalar aplicación
    install_application
    
    # Verificar instalación
    if verify_installation; then
        show_final_info
        success "Instalación completada exitosamente"
    else
        error "Error en la verificación de instalación"
        exit 1
    fi
}

# Manejo de señales
trap 'error "Instalación interrumpida"; exit 1' INT TERM

# Ejecutar función principal
main "$@"
