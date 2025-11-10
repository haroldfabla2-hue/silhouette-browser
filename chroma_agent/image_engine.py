"""
SILHOUETTE SEARCH - Motor de Imágenes Real
=====================================
"""
import os
import aiohttp
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ImageEngine:
    """Motor de búsqueda de imágenes usando Unsplash API"""
    
    def __init__(self):
        self.api_key = os.getenv("UNSPLASH_ACCESS_KEY")
        self.base_url = "https://api.unsplash.com"
    
    async def search_images(self, query: str, per_page: int = 10) -> Dict[str, Any]:
        """Busca imágenes en Unsplash"""
        if not self.api_key:
            return {
                "success": False,
                "error": "UNSPLASH_ACCESS_KEY no configurada",
                "query": query
            }
        
        headers = {
            "Authorization": f"Client-ID {self.api_key}"
        }
        
        params = {
            "query": query,
            "per_page": per_page
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/search/photos",
                    headers=headers,
                    params=params
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        images = []
                        for photo in data.get("results", []):
                            images.append({
                                "id": photo["id"],
                                "description": photo.get("description", ""),
                                "alt_description": photo.get("alt_description", ""),
                                "urls": {
                                    "small": photo["urls"]["small"],
                                    "regular": photo["urls"]["regular"],
                                    "full": photo["urls"]["full"]
                                },
                                "user": {
                                    "name": photo["user"]["name"],
                                    "username": photo["user"]["username"]
                                },
                                "links": {
                                    "html": photo["links"]["html"],
                                    "download": photo["links"]["download"]
                                }
                            })
                        
                        return {
                            "success": True,
                            "query": query,
                            "images": images,
                            "total": data.get("total", 0),
                            "total_pages": data.get("total_pages", 0),
                            "api": "UNSPLASH"
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"API error: {response.status}",
                            "query": query
                        }
        except Exception as e:
            logger.error(f"Error buscando imágenes: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query
            }

# Instancia global
image_engine = ImageEngine()
