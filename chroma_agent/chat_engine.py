"""
SILHOUETTE SEARCH - Motor de Chat IA Real
====================================
"""
import os
import aiohttp
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ChatEngine:
    """Motor de chat usando OPENROUTER API"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.default_model = "anthropic/claude-3.5-sonnet"
    
    async def chat(self, message: str, model: str = None) -> Dict[str, Any]:
        """Envía mensaje al chat IA"""
        if not self.api_key:
            return {
                "success": False,
                "error": "OPENROUTER_API_KEY no configurada",
                "message": message
            }
        
        if not model:
            model = self.default_model
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://chroma-agent.local",
            "X-Title": "Chroma Agent"
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": message}
            ],
            "max_tokens": 1000
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "success": True,
                            "message": message,
                            "response": data["choices"][0]["message"]["content"],
                            "model": model,
                            "usage": data.get("usage", {}),
                            "api": "OPENROUTER"
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"API error: {response.status}",
                            "message": message
                        }
        except Exception as e:
            logger.error(f"Error en chat: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": message
            }

# Instancia global
chat_engine = ChatEngine()
