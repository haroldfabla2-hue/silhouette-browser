#!/bin/bash

# =============================================================================
# INSTALADOR EJECUTABLE SILHOUETTE BROWSER - SCRIPT DE BUILD LOCAL
# Genera instaladores ejecutables profesionales
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_header() {
    echo -e "${BLUE}"
    echo "================================================================"
    echo "  SILHOUETTE BROWSER - INSTALADOR EJECUTABLE"
    echo "  Generador de instaladores profesionales"
    echo "================================================================"
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar sistema operativo
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        print_error "Sistema operativo no soportado: $OSTYPE"
        exit 1
    fi
    print_success "Detectado: $OS"
}

# Verificar dependencias del sistema
check_dependencies() {
    print_step "Verificando dependencias del sistema..."
    
    local missing_deps=()
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js: $NODE_VERSION"
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        NPM_VERSION=$(npm --version)
        print_success "npm: $NPM_VERSION"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("Git")
    else
        GIT_VERSION=$(git --version)
        print_success "Git: $GIT_VERSION"
    fi
    
    # Verificar electron-builder
    if ! command -v electron-builder &> /dev/null; then
        print_info "electron-builder no encontrado, se instalará localmente"
    else
        EB_VERSION=$(electron-builder --version)
        print_success "electron-builder: $EB_VERSION"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Dependencias faltantes: ${missing_deps[*]}"
        echo ""
        echo "Instalar dependencias faltantes:"
        echo "- Node.js: https://nodejs.org/"
        echo "- Git: https://git-scm.com/"
        exit 1
    fi
}

# Instalar dependencias npm
install_npm_deps() {
    print_step "Instalando dependencias npm..."
    
    if [ -f "package.json" ]; then
        npm install --no-audit --no-fund
        print_success "Dependencias instaladas"
    else
        print_error "package.json no encontrado"
        exit 1
    fi
}

# Crear iconos
create_icons() {
    print_step "Creando iconos de la aplicación..."
    
    if [ -f "create-icons.js" ]; then
        node create-icons.js
        print_success "Iconos creados"
    else
        print_error "create-icons.js no encontrado"
        exit 1
    fi
}

# Limpiar directorios
clean_directories() {
    print_step "Limpiando directorios de build..."
    
    # Limpiar dist
    if [ -d "dist" ]; then
        rm -rf dist
        print_success "Directorio dist limpiado"
    fi
    
    # Crear directorios
    mkdir -p dist
    print_success "Directorios de build creados"
}

# Construir instalador
build_executable() {
    print_step "Construyendo instalador ejecutable..."
    
    # Detectar plataforma
    detect_os
    
    case $OS in
        "linux")
            print_info "Construyendo para Linux"
            npm run dist:linux
            ;;
        "macos")
            print_info "Construyendo para macOS"
            npm run dist:mac
            ;;
        "windows")
            print_info "Construyendo para Windows"
            npm run dist:win
            ;;
        *)
            print_error "Plataforma no soportada"
            exit 1
            ;;
    esac
}

# Verificar resultados
verify_build() {
    print_step "Verificando resultados del build..."
    
    if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
        print_success "Build completado. Archivos generados:"
        echo ""
        ls -lh dist/
        echo ""
        
        # Calcular tamaño total
        local total_size=$(du -sh dist/ | cut -f1)
        print_info "Tamaño total: $total_size"
        
        # Mostrar archivos principales
        echo "Archivos principales:"
        find dist/ -type f -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" | while read file; do
            local size=$(du -h "$file" | cut -f1)
            echo "  • $(basename "$file") ($size)"
        done
        
    else
        print_error "No se generaron archivos en dist/"
        exit 1
    fi
}

# Generar reporte
generate_report() {
    print_step "Generando reporte de build..."
    
    local report_file="BUILD_REPORT_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
SILHOUETTE BROWSER - REPORTE DE BUILD
=====================================
Fecha: $(date)
Sistema: $OS
Node.js: $(node --version)
npm: $(npm --version)
electron-builder: $(electron-builder --version 2>/dev/null || echo "No instalado")

ARCHIVOS GENERADOS:
===================
$(ls -lh dist/ | tail -n +2)

TAMAÑO TOTAL:
=============
$(du -sh dist/)

TAMAÑOS POR ARCHIVO:
===================
$(du -h dist/*)

PRÓXIMOS PASOS:
===============
1. Probar los instaladores en máquinas virtuales
2. Subir a GitHub Releases (opcional):
   - Crear release en GitHub
   - Subir archivos de dist/
3. Distribuir a usuarios finales
4. Configurar auto-actualizaciones (opcional)

EOF
    
    print_success "Reporte generado: $report_file"
}

# Mostrar instrucciones finales
show_final_instructions() {
    echo ""
    echo -e "${GREEN}🎉 BUILD COMPLETADO EXITOSAMENTE!${NC}"
    echo "=========================================="
    echo ""
    echo "📁 Archivos generados en: ./dist/"
    echo ""
    echo "🚀 INSTALADORES LISTOS:"
    echo "   Los instaladores están listos para distribución"
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo "   1. Probar instaladores en máquinas virtuales"
    echo "   2. Crear releases en GitHub (opcional)"
    echo "   3. Distribuir a usuarios finales"
    echo ""
    echo "🔗 ENLACES ÚTILES:"
    echo "   • Repositorio: https://github.com/haroldfabla2-hue/silhouette-browser"
    echo "   • Releases: https://github.com/haroldfabla2-hue/silhouette-browser/releases"
    echo ""
    echo -e "${BLUE}¡Silhouette Browser listo para distribución!${NC}"
}

# Función principal
main() {
    print_header
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        print_error "package.json no encontrado. Ejecutar desde el directorio del proyecto."
        exit 1
    fi
    
    # Verificar que el repositorio está sincronizado
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "No se detectó un repositorio Git válido"
        exit 1
    fi
    
    # Pasos del build
    check_dependencies
    install_npm_deps
    create_icons
    clean_directories
    build_executable
    verify_build
    generate_report
    show_final_instructions
}

# Manejar señales
trap 'print_error "Build interrumpido por el usuario"; exit 1' INT
trap 'print_error "Error inesperado durante el build"; exit 1' ERR

# Ejecutar función principal
main "$@"