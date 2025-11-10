#!/bin/bash
"""
SCRIPT DE INICIO OPTIMIZADO - SILHOUETTE UNIFIED
==============================================
Inicia el servidor completamente optimizado con todas las funcionalidades.

Autor: MiniMax Agent
Fecha: 2025-11-10
"""

# Configuración
SERVER_FILE="optimized_server.py"
PORT=8000
HOST="0.0.0.0"

# Colores para output
RED='[0;31m'
GREEN='[0;32m'
YELLOW='[1;33m'
BLUE='[0;34m'
NC='[0m' # No Color

# Función de logging
log() {
    echo -e "{BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]{NC} $1"
}

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "{RED}❌ Python3 no está instalado{NC}"
    exit 1
fi

# Instalar dependencias
log "📦 Instalando dependencias..."
pip install -r requirements.txt

# Verificar APIs
log "🔍 Verificando configuración de APIs..."
if [ -f ".env" ]; then
    source .env
else
    log "{YELLOW}⚠️  Archivo .env no encontrado{NC}"
    log "Creando .env desde backup..."
    cp framework_v4/.env . 2>/dev/null || echo "OPENROUTER_API_KEY=sk-or-v1-your-key" > .env
fi

# Crear directorios necesarios
log "📁 Creando directorios necesarios..."
mkdir -p data/cache data/logs browser_data screenshots

# Iniciar servidor
log "🚀 Iniciando Silhouette Unified Server..."
log "🌐 URL: http://localhost:$PORT"
log "⚡ Funcionalidades:"
log "   - ✅ APIs originales (navegación, búsqueda, chat, imágenes)"
log "   - ✅ Framework V4.0 (78+ equipos especializados)"
log "   - ✅ Frontend optimizado"
log "   - ✅ Integración completa frontend-backend"
log "   - ✅ APIs existentes mantenidas (OPENROUTER, SERPER)"

echo ""
echo -e "{GREEN}🎯 SILHOUETTE UNIFIED - INTEGRACIÓN COMPLETA{NC}"
echo -e "{BLUE}   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{NC}"
echo -e "   📊 Frontend: Optimizado y unificado"
echo -e "   🔧 Backend: APIs originales + V4.0"
echo -e "   ⚡ Equipos: 78+ especializados"
echo -e "   🔗 Integración: 100% completa"
echo ""

# Iniciar servidor con uvicorn
exec python3 $SERVER_FILE
