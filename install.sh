#!/bin/bash
# =============================================================================
# CHROMA AGENT - Instalador para Linux/macOS
# =============================================================================

set -e  # Salir en caso de error

echo "🚀 Instalando Chroma Agent..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    echo "📥 Instalar Python 3.8+ desde: https://python.org"
    exit 1
fi

# Verificar pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 no está instalado"
    exit 1
fi

# Crear entorno virtual
echo "📦 Creando entorno virtual..."
python3 -m venv venv
source venv/bin/activate

# Actualizar pip
echo "⬆️ Actualizando pip..."
pip install --upgrade pip

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# Instalar navegadores Playwright
echo "🌐 Instalando navegadores Playwright..."
playwright install chromium
playwright install-deps

# Configurar proyecto
echo "⚙️ Configurando proyecto..."

# Copiar configuración de ejemplo si no existe
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Archivo .env creado desde .env.example"
    echo "⚠️  IMPORTANTE: Editar .env con tus claves de API"
fi

# Crear directorio de datos
mkdir -p data/cache data/logs browser_data screenshots

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Editar .env con tus claves de API:"
echo "   nano .env"
echo ""
echo "2. Iniciar Chroma Agent:"
echo "   source venv/bin/activate"
echo "   python -m chroma_agent.server"
echo ""
echo "3. Abrir en navegador:"
echo "   http://localhost:8000"
echo ""
echo "📚 Documentación completa en README.md"
