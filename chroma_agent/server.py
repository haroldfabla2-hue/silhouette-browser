#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SILHOUETTE SEARCH - Servidor Principal con Funcionalidades Reales
=================================================================
"""

import os
import asyncio
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv

# Cargar configuración
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Iniciando Silhouette Search...")
    
    # Verificar APIs configuradas
    check_api_keys()
    
    # Crear directorios necesarios
    create_directories()
    
    # Inicializar navegadores para Playwright
    await initialize_browsers()
    
    yield
    
    # Shutdown
    logger.info("🛑 Deteniendo Silhouette Search...")
    await cleanup_browsers()

def check_api_keys():
    """Verifica que las APIs críticas estén configuradas"""
    required_apis = [
        ("OPENROUTER_API_KEY", "Chat inteligente"),
        ("SERPER_API_KEY", "Búsqueda web")
    ]
    
    missing = []
    for key, name in required_apis:
        if not os.getenv(key):
            missing.append(f"{name} ({key})")
    
    if missing:
        logger.warning(f"⚠️ APIs faltantes: {', '.join(missing)}")
        logger.warning("📝 Configurar en .env o vía http://localhost:8000/config")
    else:
        logger.info("✅ Todas las APIs críticas están configuradas")

def create_directories():
    """Crea directorios necesarios"""
    dirs = ["data/cache", "data/logs", "browser_data", "screenshots"]
    for dir_name in dirs:
        Path(dir_name).mkdir(parents=True, exist_ok=True)

async def initialize_browsers():
    """Inicializa navegadores Playwright"""
    try:
        from chroma_agent.browser_agent import browser_agent
        await browser_agent.start()
        logger.info("🌐 Navegador inicializado")
    except Exception as e:
        logger.warning(f"⚠️ Error inicializando navegador: {e}")

async def cleanup_browsers():
    """Limpia navegadores Playwright"""
    try:
        from chroma_agent.browser_agent import browser_agent
        await browser_agent.close()
        logger.info("🌐 Navegador cerrado")
    except Exception as e:
        logger.warning(f"⚠️ Error cerrando navegador: {e}")

# Crear aplicación FastAPI
app = FastAPI(
    title="Silhouette Search",
    description="Sistema de IA unificado con funcionalidades reales - Navegación, búsqueda, chat e imágenes",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIs de funcionalidades reales
from chroma_agent.browser_agent import browser_agent
from chroma_agent.search_engine import search_engine
from chroma_agent.chat_engine import chat_engine
from chroma_agent.image_engine import image_engine
from chroma_agent.config_manager import config

@app.get("/")
async def home():
    """Página principal"""
    return FileResponse("web_interface/index.html")

@app.get("/config")
async def config_page():
    """Página de configuración de APIs"""
    return FileResponse("web_interface/config.html")

@app.get("/api/status")
async def status():
    """Estado del sistema"""
    return {
        "status": "online",
        "version": "1.0.0",
        "project": "Silhouette Search",
        "apis_configured": config.get_api_status(),
        "missing_apis": config.get_missing_apis(),
        "fully_configured": config.is_fully_configured()
    }

@app.post("/api/navegacion/real")
async def navigate_real(data: dict):
    """Navegación web real con Playwright"""
    try:
        url = data.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL requerida")
        
        result = await browser_agent.navigate_to(url)
        return result
    except Exception as e:
        logger.error(f"Error en navegación: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/navegacion/extract")
async def extract_elements(data: dict):
    """Extrae elementos específicos de una página"""
    try:
        url = data.get("url")
        selectors = data.get("selectors", [])
        
        if not url or not selectors:
            raise HTTPException(status_code=400, detail="URL y selectors requeridos")
        
        result = await browser_agent.extract_elements(url, selectors)
        return result
    except Exception as e:
        logger.error(f"Error extrayendo elementos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/busqueda/real")
async def search_real(query: str, num_results: int = 10):
    """Búsqueda web real con SERPER"""
    try:
        result = await search_engine.search(query, num_results)
        return result
    except Exception as e:
        logger.error(f"Error en búsqueda: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/real")
async def chat_real(data: dict):
    """Chat con IA real usando OPENROUTER"""
    try:
        message = data.get("message")
        model = data.get("model")
        
        if not message:
            raise HTTPException(status_code=400, detail="Mensaje requerido")
        
        result = await chat_engine.chat(message, model)
        return result
    except Exception as e:
        logger.error(f"Error en chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/imagenes/real")
async def search_images(query: str, per_page: int = 10):
    """Búsqueda de imágenes real con Unsplash"""
    try:
        result = await image_engine.search_images(query, per_page)
        return result
    except Exception as e:
        logger.error(f"Error buscando imágenes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/config/status")
async def config_status():
    """Estado de configuración de APIs"""
    return {
        "required_apis": config.get_required_apis(),
        "optional_apis": config.get_optional_apis(),
        "configured_status": config.get_api_status(),
        "missing_apis": config.get_missing_apis()
    }

# Montar archivos estáticos si existen
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
except:
    pass  # Directorio static no existe, continuar

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "localhost")
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
