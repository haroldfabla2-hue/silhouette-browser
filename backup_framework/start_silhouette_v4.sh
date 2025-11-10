#!/bin/bash
# Script de inicio Silhouette V4.0
# Framework Multi-Agente Empresarial

echo "🚀 Iniciando Silhouette V4.0 - Framework Multi-Agente"
echo "📊 78+ Equipos Especializados"
echo "⚡ Sistema Audiovisual Ultra-Profesional"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Crear archivos de configuración
echo "📁 Creando configuración..."
cp .env.example .env 2>/dev/null || echo "⚠️  .env.example no encontrado"

# Levantar servicios core primero
echo "🔧 Levantando servicios core..."
docker-compose up -d postgres redis neo4j rabbitmq

# Esperar que las bases de datos estén listas
echo "⏳ Esperando bases de datos..."
sleep 30

# Levantar equipos principales
echo "👥 Levantando equipos principales..."
docker-compose up -d api-gateway orchestrator planner

# Levantar equipos especializados
echo "🎬 Levantando equipos audiovisuales..."
docker-compose up -d audiovisual-team

echo "💼 Levantando equipos empresariales..."
docker-compose up -d marketing-team business-dev-team

# Levantar monitoreo
echo "📊 Levantando monitoreo..."
docker-compose up -d prometheus grafana

echo ""
echo "✅ Silhouette V4.0 iniciado exitosamente!"
echo "🌐 Interfaz Web: http://localhost:8000"
echo "📊 Grafana: http://localhost:3000 (admin/admin)"
echo "🔧 API Gateway: http://localhost:8000"
echo ""
echo "Equipos disponibles:"
echo "  🎬 Audiovisual Team: Puerto 8000"
echo "  💼 Marketing Team: Puerto 8013" 
echo "  💼 Business Dev: Puerto 8001"
echo "  🔧 Orquestador: Puerto 8001"
echo "  📋 Planificador: Puerto 8002"
echo ""
echo "Para detener: ./stop_silhouette_v4.sh"
