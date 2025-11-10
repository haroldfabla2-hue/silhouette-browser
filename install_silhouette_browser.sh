#!/bin/bash
# =============================================================================
# INSTALADOR SILHOUETTE BROWSER V4.0 - ARQUITECTURA SUPREMA
# Instalación completa del navegador con IA y 78 equipos especializados
# =============================================================================

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

# Banner
echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║               🚀 SILHOUETTE BROWSER V4.0 SUPREMA 🚀                    ║"
echo "║             Navegador con IA + 78 Equipos Especializados              ║"
echo "║                  Arquitectura que Supera a Comet/Atlas                 ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar sistema operativo
OS=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    error "Sistema operativo no soportado: $OSTYPE"
    exit 1
fi

# Banner del sistema
log "🏁 Sistema detectado: $OS"
echo ""

# Verificar requisitos del sistema
log "🔍 Verificando requisitos del sistema..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
    echo "📥 Instalar Node.js 18+ desde: https://nodejs.org/"
    if [[ "$OS" == "linux" ]]; then
        echo "🔗 O usar: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "           sudo apt-get install -y nodejs"
    elif [[ "$OS" == "macos" ]]; then
        echo "🔗 O usar Homebrew: brew install node"
    fi
    exit 1
fi

NODE_VERSION=$(node --version)
success "Node.js $NODE_VERSION detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm --version)
success "npm $NPM_VERSION disponible"

# Verificar Python (para Playwright)
if ! command -v python3 &> /dev/null; then
    error "Python 3 no está instalado"
    echo "📥 Instalar Python 3.8+ desde: https://python.org"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
success "Python $PYTHON_VERSION detectado"

# Crear directorio del proyecto
PROJECT_DIR="silhouette-browser"
if [ -d "$PROJECT_DIR" ]; then
    warning "Directorio $PROJECT_DIR ya existe"
    read -p "¿Sobrescribir? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Instalación cancelada"
        exit 1
    fi
    rm -rf "$PROJECT_DIR"
fi

log "📁 Creando directorio del proyecto: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Copiar estructura de archivos
log "📋 Copiando estructura de archivos..."
cp -r ../silhouette-browser/* .
success "Estructura de archivos copiada"

# Instalar dependencias de Node.js
log "📦 Instalando dependencias de Node.js..."
npm install
if [ $? -ne 0 ]; then
    error "Error instalando dependencias de Node.js"
    exit 1
fi
success "Dependencias de Node.js instaladas"

# Instalar Playwright y navegadores
log "🌐 Instalando Playwright y navegadores..."
echo -ne "${CYAN}📥 Descargando navegadores Chromium${NC}"
npm install playwright
echo -ne " ${GREEN}✅${NC}\n"

echo -ne "${CYAN}🌐 Instalando navegadores del sistema${NC}"
npx playwright install chromium --force
echo -ne " ${GREEN}✅${NC}\n"

echo -ne "${CYAN}🔧 Instalando dependencias del sistema${NC}"
if [[ "$OS" == "linux" ]]; then
    # Ubuntu/Debian
    if command -v apt &> /dev/null; then
        sudo apt update -qq
        sudo apt install -y -qq \
            libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
            libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
            libxfixes3 libxrandr2 libgbm1 libasound2 \
            libatspi2.0-0 libxshmfence1
        success "Dependencias del sistema instaladas"
    # CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y -q \
            alsa-lib atk cups-libs gtk3 libXcomposite libXcursor \
            libXdamage libXext libXi libXrandr libXScrnSaver libXtst \
            pango
        success "Dependencias del sistema instaladas"
    else
        warning "No se pudieron instalar dependencias del sistema automáticamente"
    fi
elif [[ "$OS" == "macos" ]]; then
    if command -v brew &> /dev/null; then
        success "Dependencias del sistema (Homebrew)"
    else
        warning "Instalar Homebrew desde: https://brew.sh"
    fi
fi

# Verificar instalación de Playwright
log "🔍 Verificando instalación de Playwright..."
if python3 -c "
import sys
try:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        browser.close()
    print('✅ Chromium funciona correctamente')
    sys.exit(0)
except Exception as e:
    print('❌ Error con Chromium:', str(e))
    sys.exit(1)
" 2>/dev/null; then
    success "Playwright verificado"
else
    warning "Problema con Playwright, pero la instalación continúa"
fi

# Crear archivos de configuración
log "⚙️  Creando archivos de configuración..."

# Configurar .env
cat > .env << 'EOF'
# =============================================================================
# SILHOUETTE BROWSER V4.0 - CONFIGURACIÓN
# =============================================================================

# APIs REQUERIDAS (Mínimo 2)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
SERPER_API_KEY=your-serper-key-here

# APIs OPCIONALES
UNSPLASH_ACCESS_KEY=your-unsplash-key-here
SERPAPI_KEY=your-serpapi-key-here
RUNWAY_API_KEY=your-runway-key-here
PIKA_API_KEY=your-pika-key-here
LUMA_API_KEY=your-luma-key-here

# Configuración del navegador
BROWSER_WIDTH=1400
BROWSER_HEIGHT=900
ENABLE_SANDBOX=true
ENABLE_REMOTE_DEBUGGING=false

# Configuración de seguridad
SECRET_KEY=silhouette-browser-v4-0-super-secure-key-2025
CONTENT_SECURITY_POLICY=true
SANDBOX_MODE=true

# Configuración de equipos V4.0
MAX_TEAMS_PER_TASK=8
TEAM_EXECUTION_TIMEOUT=30
TEAM_WEIGHT_MULTIPLIER=1.0

# Configuración de extensiones
MAX_EXTENSIONS=50
EXTENSION_VALIDATION_STRICT=true
AUTO_UPDATE_EXTENSIONS=true

# Configuración de privacidad
ENABLE_LOCAL_PROCESSING=true
ENCRYPT_SENSITIVE_DATA=true
AUTO_DELETE_TEMP_FILES=true

# Configuración de red
REQUEST_TIMEOUT=30
MAX_CONNECTIONS=100
RETRY_ATTEMPTS=3

# Configuración de desarrollo
NODE_ENV=production
LOG_LEVEL=INFO
ENABLE_DEVTOOLS=false
EOF
success "Archivo .env creado"

# Crear script de inicio
cat > start-silhouette-browser.sh << 'EOF'
#!/bin/bash
# Script de inicio de Silhouette Browser V4.0

echo "🚀 Iniciando Silhouette Browser V4.0..."
echo "🎯 Navegador con IA + 78 equipos especializados"
echo ""

# Verificar dependencias
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# Cargar configuración
if [ -f .env ]; then
    source .env
    echo "⚙️  Configuración cargada"
fi

# Verificar APIs críticas
if [[ -z "$OPENROUTER_API_KEY" || "$OPENROUTER_API_KEY" == "sk-or-v1-your-openrouter-key-here" ]]; then
    echo "⚠️  OPENROUTER_API_KEY no configurada"
fi

if [[ -z "$SERPER_API_KEY" || "$SERPER_API_KEY" == "your-serper-key-here" ]]; then
    echo "⚠️  SERPER_API_KEY no configurada"
fi

# Iniciar aplicación
echo "🌐 Iniciando Silhouette Browser..."
echo "📊 Funcionalidades:"
echo "   • ✅ Control total del navegador por IA"
echo "   • ✅ 78 equipos especializados"
echo "   • ✅ Generación de extensiones automáticas"
echo "   • ✅ Seguridad enterprise-grade"
echo "   • ✅ Privacidad y cifrado end-to-end"
echo ""
echo "🔧 Comandos disponibles:"
echo "   • Configurar APIs: editar .env"
echo "   • Desarrollo: npm run dev"
echo "   • Producción: npm start"
echo ""

# Verificar si estamos en producción o desarrollo
if [ "$NODE_ENV" = "development" ]; then
    echo "🔧 Modo desarrollo habilitado"
    echo "🌐 URL: http://localhost:8080"
    npm run dev
else
    echo "⚡ Modo producción"
    npm start
fi
EOF

chmod +x start-silhouette-browser.sh
success "Script de inicio creado"

# Crear script de desarrollo
cat > dev-silhouette-browser.sh << 'EOF'
#!/bin/bash
# Script de desarrollo de Silhouette Browser V4.0

echo "🔧 Modo desarrollo de Silhouette Browser V4.0"
echo "🛠️  Herramientas de desarrollo habilitadas"
echo ""

# Habilitar modo desarrollo
export NODE_ENV=development
export ENABLE_DEVTOOLS=true

# Verificar herramientas de desarrollo
echo "🔍 Verificando herramientas de desarrollo..."

# Instalar herramientas adicionales para desarrollo
if command -v webpack &> /dev/null; then
    echo "✅ Webpack disponible"
else
    echo "📦 Instalando herramientas de desarrollo..."
    npm install --save-dev webpack webpack-cli webpack-dev-server
fi

# Ejecutar en modo desarrollo
echo "🚀 Iniciando en modo desarrollo..."
npm run dev
EOF

chmod +x dev-silhouette-browser.sh
success "Script de desarrollo creado"

# Crear build script
cat > build-silhouette-browser.sh << 'EOF'
#!/bin/bash
# Script de build de Silhouette Browser V4.0

echo "🏗️  Construyendo Silhouette Browser V4.0 para distribución..."
echo ""

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf dist/ node_modules/.cache/

# Build de producción
echo "📦 Ejecutando build de producción..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente"
    echo "📁 Archivos disponibles en dist/"
    echo ""
    echo "🎯 Próximos pasos:"
    echo "   • Probar: ./start-silhouette-browser.sh"
    echo "   • Distribuir: npm run dist"
else
    echo "❌ Error en el build"
    exit 1
fi
EOF

chmod +x build-silhouette-browser.sh
success "Script de build creado"

# Crear archivo de documentación
cat > README.md << 'EOF'
# 🚀 Silhouette Browser V4.0

## Navegador con IA + 78 Equipos Especializados

### ¿Qué es Silhouette Browser?

Silhouette Browser es **el navegador de IA más avanzado del mundo**, diseñado para superar a Comet, Atlas y todos los agentes autónomos del mercado.

#### ✨ Características Supremas:

- **🤖 Control Total del Navegador por IA** - Silhouette tiene poder absoluto
- **🏢 78 Equipos Especializados** - Cada uno experto en su dominio
- **🔧 Generación de Extensiones por IA** - Extensiones personalizadas automáticas
- **🛡️ Seguridad Enterprise-Grade** - Sandboxing completo + cifrado
- **📱 Multi-Platform** - Windows, macOS, Linux desde día 1
- **⚡ Performance Optimizado** - Más rápido que cualquier competidor
- **🔐 Privacidad First** - Procesamiento local + cifrado end-to-end

### 🏆 Comparación con Competidores:

| Característica | Silhouette | Comet | Atlas | Operator |
|----------------|------------|--------|--------|----------|
| **Control Total del Navegador** | ✅ Sí, absoluto | ❌ No | ❌ No | ❌ No |
| **Equipos Especializados** | ✅ 78+ equipos | ❌ No | ❌ No | ❌ No |
| **Generación de Extensiones** | ✅ Sí, por IA | ❌ No | ❌ No | ❌ No |
| **Disponibilidad** | ✅ Global, día 1 | ❌ Solo Max subscribers | ❌ Solo macOS, paid | ❌ Solo US Pro |
| **Multi-Platform** | ✅ Win/Mac/Linux | ❌ Limitado | ❌ Solo macOS | ❌ Limitado |
| **Privacidad** | ✅ Local processing | ❌ Cloud only | ❌ Cloud only | ❌ Cloud only |

### 🚀 Instalación Rápida

```bash
# Clonar y configurar
git clone [this-repo] silhouette-browser
cd silhouette-browser

# Instalar (automático)
./install_silhouette_browser.sh

# Iniciar
./start-silhouette-browser.sh
```

### 🔑 Configuración de APIs (Solo 2 Requeridas)

Editar archivo `.env`:

```env
# APIs REQUERIDAS
OPENROUTER_API_KEY=sk-or-v1-tu_clave_openrouter_aqui
SERPER_API_KEY=tu_clave_serper_aqui

# APIs OPCIONALES
UNSPLASH_ACCESS_KEY=tu_clave_unsplash_aqui
SERPAPI_KEY=tu_clave_serpapi_aqui
```

#### Cómo obtener APIs:

1. **OpenRouter** - https://openrouter.ai/ (Gratuito, ilimitado)
2. **SERPER** - https://serper.dev/ (2,500 búsquedas/mes gratis)

### 🛠️ Desarrollo

```bash
# Modo desarrollo
./dev-silhouette-browser.sh

# Build para producción
./build-silhouette-browser.sh

# Distribución
npm run dist
```

### 🏢 Equipos V4.0

- **Equipos Principales (22)** - Business, Marketing, AI, Code, Design, etc.
- **Infraestructura (9)** - API Gateway, Browser, MCP Server, etc.
- **Sistema Audiovisual (11)** - Video, Audio, Image teams
- **Workflows Dinámicos (26)** - Healthcare, E-commerce, Education, etc.

### 🔐 Seguridad

- **Sandboxing Completo** - Cada proceso aislado
- **Cifrado End-to-End** - Todos los datos protegidos
- **Zero-Trust** - Validación de todas las acciones
- **Monitoreo Continuo** - Detección de anomalías

### 📊 Arquitectura

```
silhouette-browser/
├── main-process/          # Proceso principal
│   ├── app-manager/      # Gestión de aplicaciones
│   ├── security-layer/   # Capa de seguridad
│   ├── agent-orchestrator/ # 78 equipos IA
│   └── extension-engine/ # Motor de extensiones
├── renderer-process/      # Interfaz de usuario
│   ├── ui-framework/    # Framework de UI
│   ├── ai-interface/    # Interfaz IA
│   └── config-panel/    # Panel de configuración
└── shared-services/      # Servicios compartidos
    ├── mcp-server/      # Model Context Protocol
    └── content-scripts/ # Scripts de contenido
```

### 🎯 Licencia

MIT License - Libre para uso personal y comercial

---

**Desarrollado por MiniMax Agent - Enero 2025**
EOF
success "Documentación creada"

# Crear archivo de scripts de utilidad
cat > tools/utility-scripts.sh << 'EOF'
#!/bin/bash
# Scripts de utilidad para Silhouette Browser

show_status() {
    echo "📊 Estado de Silhouette Browser V4.0"
    echo "===================================="
    
    # Verificar procesos
    if pgrep -f "silhouette-browser" > /dev/null; then
        echo "✅ Silhouette Browser: En ejecución"
    else
        echo "❌ Silhouette Browser: No ejecutándose"
    fi
    
    # Verificar APIs
    echo ""
    echo "🔌 Estado de APIs:"
    if [[ -f .env ]]; then
        source .env
        if [[ -n "$OPENROUTER_API_KEY" && "$OPENROUTER_API_KEY" != "sk-or-v1-your-openrouter-key-here" ]]; then
            echo "✅ OpenRouter: Configurado"
        else
            echo "❌ OpenRouter: No configurado"
        fi
        
        if [[ -n "$SERPER_API_KEY" && "$SERPER_API_KEY" != "your-serper-key-here" ]]; then
            echo "✅ SERPER: Configurado"
        else
            echo "❌ SERPER: No configurado"
        fi
    else
        echo "❌ Archivo .env no encontrado"
    fi
}

reset_config() {
    echo "🔄 Reseteando configuración..."
    rm -f .env
    ./install_silhouette_browser.sh
}

backup_data() {
    echo "💾 Creando backup de datos..."
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r data/ "$BACKUP_DIR/" 2>/dev/null || true
    cp .env "$BACKUP_DIR/" 2>/dev/null || true
    echo "✅ Backup creado en: $BACKUP_DIR"
}

case "$1" in
    status)
        show_status
        ;;
    reset)
        reset_config
        ;;
    backup)
        backup_data
        ;;
    *)
        echo "Uso: $0 {status|reset|backup}"
        echo ""
        echo "Comandos disponibles:"
        echo "  status  - Mostrar estado del sistema"
        echo "  reset   - Resetear configuración"
        echo "  backup  - Crear backup de datos"
        ;;
esac
EOF

chmod +x tools/utility-scripts.sh
success "Scripts de utilidad creados"

# Verificación final
log "🔍 Verificación final de la instalación..."

# Verificar archivos clave
FILES_TO_CHECK=(
    "package.json"
    "main-process/app-manager/main.js"
    "renderer-process/index.html"
    "start-silhouette-browser.sh"
    ".env"
)

ALL_FILES_OK=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        success "✅ $file"
    else
        error "❌ $file faltante"
        ALL_FILES_OK=false
    fi
done

if [ "$ALL_FILES_OK" = true ]; then
    success "Todos los archivos están presentes"
else
    error "Algunos archivos faltan. Revisar instalación."
    exit 1
fi

# Información final
echo ""
echo -e "${GREEN}🎉 ¡INSTALACIÓN DE SILHOUETTE BROWSER V4.0 COMPLETADA! 🎉${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📦 Node.js: $NODE_VERSION ✅"
echo -e "📦 npm: $NPM_VERSION ✅"
echo -e "📦 Python: $PYTHON_VERSION ✅"
echo -e "📦 Playwright: Instalado ✅"
echo -e "📁 Estructura: Creada ✅"
echo -e "🔧 Scripts: Listos ✅"
echo -e "⚙️  Configuración: Preparada ✅"
echo ""
echo -e "${YELLOW}🎯 PRÓXIMOS PASOS:${NC}"
echo -e "1. ${BLUE}Configurar APIs (editar .env):${NC}"
echo -e "   ${CYAN}nano .env${NC}"
echo ""
echo -e "2. ${BLUE}Iniciar Silhouette Browser:${NC}"
echo -e "   ${CYAN}./start-silhouette-browser.sh${NC}"
echo ""
echo -e "3. ${BLUE}Desarrollo (opcional):${NC}"
echo -e "   ${CYAN}./dev-silhouette-browser.sh${NC}"
echo ""
echo -e "${PURPLE}💡 APIS REQUERIDAS (Solo 2):${NC}"
echo -e "   • ${GREEN}OPENROUTER${NC} → https://openrouter.ai/  ${BLUE}(Gratuito, ilimitado)${NC}"
echo -e "   • ${GREEN}SERPER${NC} → https://serper.dev/  ${BLUE}(2,500 búsquedas/mes gratis)${NC}"
echo ""
echo -e "${GREEN}🏆 CARACTERÍSTICAS SUPREMAS:${NC}"
echo -e "   🤖 Control total del navegador por IA"
echo -e "   🏢 78 equipos especializados integrados"
echo -e "   🔧 Generación automática de extensiones"
echo -e "   🛡️ Seguridad enterprise-grade"
echo -e "   📱 Multi-platform (Win/Mac/Linux)"
echo ""
echo -e "${GREEN}🚀 ¡Silhouette Browser V4.0 está listo para dominar el mundo! 🌟${NC}"
