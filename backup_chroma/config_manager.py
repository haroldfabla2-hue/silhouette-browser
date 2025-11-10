"""
SILHOUETTE SEARCH - Gestor de Configuración
=====================================
"""
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class ConfigManager:
    """Gestor centralizado de configuración"""
    
    def __init__(self):
        self.required_apis = {
            "OPENROUTER_API_KEY": {
                "name": "OPENROUTER",
                "description": "Chat inteligente con IA",
                "required": True
            },
            "SERPER_API_KEY": {
                "name": "SERPER", 
                "description": "Búsqueda web en Google",
                "required": True
            },
            "UNSPLASH_ACCESS_KEY": {
                "name": "UNSPLASH",
                "description": "Búsqueda de imágenes HD",
                "required": False
            }
        }
    
    def get_api_status(self) -> Dict[str, Any]:
        """Obtiene el estado de configuración de las APIs"""
        status = {}
        for key, info in self.required_apis.items():
            status[info["name"]] = {
                "configured": bool(os.getenv(key)),
                "required": info["required"],
                "description": info["description"]
            }
        return status
    
    def get_required_apis(self) -> Dict[str, Any]:
        """Retorna solo las APIs requeridas"""
        return {k: v for k, v in self.required_apis.items() if v["required"]}
    
    def get_optional_apis(self) -> Dict[str, Any]:
        """Retorna solo las APIs opcionales"""
        return {k: v for k, v in self.required_apis.items() if not v["required"]}
    
    def is_fully_configured(self) -> bool:
        """Verifica si todas las APIs requeridas están configuradas"""
        for key, info in self.required_apis.items():
            if info["required"] and not os.getenv(key):
                return False
        return True
    
    def get_missing_apis(self) -> list:
        """Retorna lista de APIs faltantes"""
        missing = []
        for key, info in self.required_apis.items():
            if info["required"] and not os.getenv(key):
                missing.append(info["name"])
        return missing

config = ConfigManager()
