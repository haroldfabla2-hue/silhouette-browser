"""
SILHOUETTE SEARCH - Navegación Web Real
===================================
"""
import asyncio
import logging
from playwright.async_api import async_playwright
import json

logger = logging.getLogger(__name__)

class BrowserAgent:
    """Agente de navegación web usando Playwright"""
    
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None
    
    async def start(self):
        """Inicia el navegador"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        self.page = await self.browser.new_page()
        logger.info("🌐 Navegador iniciado")
    
    async def navigate_to(self, url: str) -> dict:
        """Navega a una URL y extrae contenido"""
        try:
            await self.page.goto(url, wait_until="networkidle")
            
            # Extraer título
            title = await self.page.title()
            
            # Extraer contenido principal
            content = await self.page.content()
            
            # Tomar screenshot opcional
            screenshot = None
            try:
                screenshot = await self.page.screenshot()
            except:
                pass  # Screenshot falló, continuar
            
            return {
                "success": True,
                "url": url,
                "title": title,
                "content": content[:1000],  # Primeros 1000 caracteres
                "screenshot": screenshot is not None
            }
        except Exception as e:
            logger.error(f"Error navegando a {url}: {e}")
            return {
                "success": False,
                "error": str(e),
                "url": url
            }
    
    async def extract_elements(self, url: str, selectors: list) -> dict:
        """Extrae elementos específicos de una página"""
        try:
            await self.page.goto(url, wait_until="networkidle")
            
            results = {}
            for selector in selectors:
                try:
                    elements = await self.page.query_selector_all(selector)
                    results[selector] = []
                    for element in elements[:5]:  # Máximo 5 elementos
                        text = await element.text_content()
                        results[selector].append(text.strip() if text else "")
                except Exception as e:
                    results[selector] = f"Error: {str(e)}"
            
            return {
                "success": True,
                "url": url,
                "selectors": results
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "url": url
            }
    
    async def close(self):
        """Cierra el navegador"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("🌐 Navegador cerrado")

# Instancia global
browser_agent = BrowserAgent()
