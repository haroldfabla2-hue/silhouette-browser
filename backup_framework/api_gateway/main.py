#!/usr/bin/env python3
"""
API Gateway - Framework Silhouette V4.0
Punto de entrada único para todos los equipos

Autor: MiniMax Agent  
Fecha: 2025-11-10
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import json
from typing import Dict, Any, List
from datetime import datetime
import sys
import os

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar orquestador
from core.orchestrator.main import SilhouetteV4Orchestrator

app = FastAPI(
    title="Silhouette V4.0 API Gateway",
    description="Framework Multi-Agente Empresarial - 78+ Equipos Especializados",
    version="4.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar orquestador
orchestrator = SilhouetteV4Orchestrator()

@app.get("/")
async def root():
    return {
        "message": "🚀 Silhouette V4.0 - Framework Multi-Agente Empresarial",
        "version": "4.0.0",
        "teams": len(orchestrator.teams),
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "teams_active": sum(1 for team in orchestrator.teams.values() if team["status"] == "ready"),
        "total_teams": len(orchestrator.teams),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/teams")
async def get_teams():
    return {
        "teams": orchestrator.teams,
        "total": len(orchestrator.teams),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/task")
async def execute_task(task_data: Dict[str, Any]):
    """Ejecuta una tarea individual"""
    try:
        from core.orchestrator.main import Task
        import uuid
        
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            type=task_data.get("type", "generic"),
            priority=task_data.get("priority", "medium"),
            assigned_team=task_data.get("assigned_team"),
            data=task_data
        )
        
        result = await orchestrator.execute_task(task)
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ejecutando tarea: {str(e)}")

@app.post("/workflow")
async def execute_workflow(workflow_data: Dict[str, Any]):
    """Ejecuta un workflow completo"""
    try:
        result = await orchestrator.process_workflow(workflow_data)
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ejecutando workflow: {str(e)}")

@app.get("/workflows")
async def get_completed_workflows():
    """Obtiene workflows completados"""
    return {
        "completed_workflows": len(orchestrator.completed_tasks),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/audiovisual")
async def audiovisual_endpoint():
    """Endpoint especializado para equipo audiovisual"""
    return {
        "team": "audiovisual-team",
        "capabilities": [
            "Generación de scripts virales",
            "Búsqueda automática de imágenes",
            "Prompts de animación para IA",
            "Composición de escenas de video",
            "Control de calidad automático"
        ],
        "status": "ready",
        "port": 8000
    }

@app.get("/marketing")
async def marketing_endpoint():
    """Endpoint especializado para equipo de marketing"""
    return {
        "team": "marketing-team",
        "capabilities": [
            "Estrategias de marketing digital",
            "Análisis de audiencia objetivo",
            "Creación de campañas automatizadas",
            "Optimización de contenido",
            "Análisis de performance"
        ],
        "status": "ready", 
        "port": 8013
    }

@app.get("/business-dev")
async def business_dev_endpoint():
    """Endpoint especializado para desarrollo de negocios"""
    return {
        "team": "business_development_team",
        "capabilities": [
            "Análisis de mercado",
            "Estrategias de crecimiento",
            "Desarrollo de partnerships",
            "Expansión empresarial",
            "Análisis de competencia"
        ],
        "status": "ready",
        "port": 8001
    }

if __name__ == "__main__":
    print("🚀 Iniciando Silhouette V4.0 API Gateway...")
    print(f"📊 Puerto: 8000")
    print(f"🔗 Endpoints disponibles:")
    print(f"   - GET  /")
    print(f"   - GET  /health")
    print(f"   - GET  /teams")
    print(f"   - POST /task")
    print(f"   - POST /workflow")
    print(f"   - GET  /audiovisual")
    print(f"   - GET  /marketing")
    print(f"   - GET  /business-dev")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
