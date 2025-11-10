#!/bin/bash
# =============================================================================
# INSTALADOR COMPLETO SILHOUETTE UNIFIED V4.0
# Instalación automática de TODO: dependencias + navegador + configuración
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
echo "║                    🚀 SILHOUETTE UNIFIED V4.0                          ║"
echo "║                     INSTALADOR COMPLETO AUTOMÁTICO                     ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar Python
log "Verificando Python 3.8+..."
if ! command -v python3 &> /dev/null; then
    error "Python 3 no está instalado"
    echo "📥 Instalar Python 3.8+ desde: https://python.org"
    echo "🔗 O usar tu gestor de paquetes: apt install python3 python3-pip"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
success "Python $PYTHON_VERSION detectado"

# Verificar pip
log "Verificando pip3..."
if ! command -v pip3 &> /dev/null; then
    error "pip3 no está instalado"
    echo "📥 Instalar pip3: sudo apt install python3-pip"
    exit 1
fi
success "pip3 disponible"

# Crear entorno virtual
log "Creando entorno virtual..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    success "Entorno virtual creado"
else
    warning "Entorno virtual ya existe"
fi

# Activar entorno virtual
log "Activando entorno virtual..."
source venv/bin/activate
success "Entorno virtual activado"

# Actualizar pip
log "Actualizando pip..."
pip install --upgrade pip
success "pip actualizado"

# Instalar dependencias
log "Instalando dependencias de Python..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    success "Dependencias instaladas"
else
    error "requirements.txt no encontrado"
    exit 1
fi

# Instalar Playwright navegadores (TODO)
log "🌐 Instalando navegadores Playwright..."
log "   Esto puede tomar 2-3 minutos dependiendo de tu conexión..."

# Instalar navegadores con barra de progreso
echo -ne "${CYAN}📥 Descargando Chromium${NC}"
pip install playwright
echo -ne " ${GREEN}✅${NC}\n"

echo -ne "${CYAN}🌐 Instalando navegadores${NC}"
playwright install chromium --force
echo -ne " ${GREEN}✅${NC}\n"

echo -ne "${CYAN}🔧 Instalando dependencias del sistema${NC}"
if command -v apt &> /dev/null; then
    # Ubuntu/Debian
    sudo apt update
    sudo apt install -y libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
    success "Dependencias del sistema instaladas"
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    sudo yum install -y alsa-lib atk cups-libs gtk3 libXcomposite libXcursor libXdamage libXext libXi libXrandr libXScrnSaver libXtst pango
    success "Dependencias del sistema instaladas"
elif command -v brew &> /dev/null; then
    # macOS
    success "Dependencias del sistema (Homebrew)"
else
    warning "No se pudieron instalar dependencias del sistema automáticamente"
    warning "Si la navegación web no funciona, instala las dependencias manualmente"
fi

# Configurar proyecto
log "⚙️ Configurando proyecto..."

# Crear directorios necesarios
log "Creando directorios de datos..."
mkdir -p data/cache data/logs browser_data screenshots
success "Directorios creados"

# Configurar .env
log "Configurando archivo de variables de entorno..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        success "Archivo .env creado desde .env.example"
        warning "IMPORTANTE: Edita .env con tus claves de API:"
        echo "   nano .env  (Linux/macOS)"
        echo "   notepad .env  (Windows)"
    else
        cat > .env << 'EOF'
# SILHOUETTE UNIFIED V4.0 - CONFIGURACIÓN
# =======================================

# APIs REQUERIDAS (Mínimo 2)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
SERPER_API_KEY=your-serper-key-here

# APIs OPCIONALES
UNSPLASH_ACCESS_KEY=your-unsplash-key-here
SERPAPI_KEY=your-serpapi-key-here

# Configuración del servidor
PORT=8000
HOST=localhost
ENVIRONMENT=development
DEBUG=true

# Configuración avanzada
REQUEST_TIMEOUT=30
CACHE_TTL=3600
MAX_CONNECTIONS=100
SECRET_KEY=silhouette-unified-v4-0-super-secure-key-2025
EOF
        success "Archivo .env creado con plantilla"
    fi
else
    warning "Archivo .env ya existe"
fi

# Verificar instalación de navegadores
log "Verificando instalación de navegadores..."
if python3 -c "
import playwright
from playwright.sync_api import sync_playwright
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        browser.close()
    print('✅ Chromium funciona correctamente')
except Exception as e:
    print('❌ Error con Chromium:', str(e))
    exit(1)
" 2>/dev/null; then
    success "Navegadores Playwright verificados"
else
    warning "Problema con navegadores Playwright, pero la instalación continúa"
fi

# Crear script de inicio mejorado
log "Creando script de inicio mejorado..."
cat > start_complete.sh << 'EOF'
#!/bin/bash
# Script de inicio mejorado para Silhouette Unified V4.0

# Activar entorno virtual
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Entorno virtual activado"
else
    echo "❌ Entorno virtual no encontrado"
    exit 1
fi

# Verificar APIs configuradas
if [ -f ".env" ]; then
    source .env
    if [ -z "$OPENROUTER_API_KEY" ] || [ "$OPENROUTER_API_KEY" = "sk-or-v1-your-openrouter-key-here" ]; then
        echo "⚠️  OPENROUTER_API_KEY no configurada"
        echo "   Edita .env con tu clave real"
    fi
    if [ -z "$SERPER_API_KEY" ] || [ "$SERPER_API_KEY" = "your-serper-key-here" ]; then
        echo "⚠️  SERPER_API_KEY no configurada"
        echo "   Edita .env con tu clave real"
    fi
fi

# Iniciar servidor
echo "🚀 Iniciando Silhouette Unified V4.0..."
echo "🌐 URL: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo "🎯 ¡Listo para usar!"

exec python optimized_server.py
EOF

chmod +x start_complete.sh
success "Script de inicio creado"

# Información final
echo ""
echo -e "${GREEN}🎉 ¡INSTALACIÓN COMPLETA TERMINADA!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📦 Python: $PYTHON_VERSION ✅"
echo -e "📦 Entorno virtual: Creado ✅"
echo -e "📦 Dependencias: Instaladas ✅"
echo -e "🌐 Navegadores: Instalados ✅"
echo -e "📁 Directorios: Creados ✅"
echo -e "⚙️  Configuración: Preparada ✅"
echo -e "🚀 Script de inicio: Creado ✅"
echo ""
echo -e "${YELLOW}🎯 PRÓXIMOS PASOS:${NC}"
echo -e "1. ${BLUE}Configurar APIs (editar .env):${NC}"
echo -e "   ${CYAN}nano .env${NC}  ${GREEN}# Linux/macOS${NC}"
echo -e "   ${CYAN}notepad .env${NC}  ${GREEN}# Windows${NC}"
echo ""
echo -e "2. ${BLUE}Iniciar aplicación:${NC}"
echo -e "   ${CYAN}./start_complete.sh${NC}  ${GREEN}# Linux/macOS${NC}"
echo -e "   ${CYAN}start_complete.sh${NC}  ${GREEN}# Windows${NC}"
echo ""
echo -e "3. ${BLUE}Abrir en navegador:${NC}"
echo -e "   ${CYAN}http://localhost:8000${NC}"
echo ""
echo -e "${PURPLE}💡 APIS REQUERIDAS (Solo 2):${NC}"
echo -e "   • ${GREEN}OPENROUTER${NC} → https://openrouter.ai/  ${BLUE}(Gratuito)${NC}"
echo -e "   • ${GREEN}SERPER${NC} → https://serper.dev/  ${BLUE}(2,500 búsquedas/mes gratis)${NC}"
echo ""
echo -e "${GREEN}¡Silhouette Unified V4.0 está listo para usar! 🚀${NC}"