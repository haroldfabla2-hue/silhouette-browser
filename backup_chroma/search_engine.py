"""
SILHOUETTE SEARCH - Motor de Búsqueda Real
========================================
"""
import os
import aiohttp
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class SearchEngine:
    """Motor de búsqueda usando SERPER API"""
    
    def __init__(self):
        self.api_key = os.getenv("SERPER_API_KEY")
        self.base_url = "https://google.serper.dev"
    
    async def search(self, query: str, num_results: int = 10) -> Dict[str, Any]:
        """Realiza búsqueda web real"""
        if not self.api_key:
            return {
                "success": False,
                "error": "SERPER_API_KEY no configurada",
                "query": query
            }
        
        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "q": query,
            "num": num_results
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/search", 
                    headers=headers, 
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "success": True,
                            "query": query,
                            "results": data.get("organic", [])[:num_results],
                            "count": len(data.get("organic", [])),
                            "search_info": {
                                "took_ms": data.get("searchParameters", {}).get("totalResults"),
                                "api": "SERPER"
                            }
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"API error: {response.status}",
                            "query": query
                        }
        except Exception as e:
            logger.error(f"Error en búsqueda: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query
            }

# Instancia global
search_engine = SearchEngine()
