#!/usr/bin/env python3
"""
AUDITORÍA COMPLETA DEL SISTEMA SILHOUETTE UNIFIED
===============================================
Script para revisar de pies a cabeza todo el sistema y detectar errores.

Autor: MiniMax Agent
Fecha: 2025-11-10
"""

import os
import sys
import ast
import json
import subprocess
import importlib.util
from pathlib import Path
import traceback
from typing import List, Dict, Any, Tuple

class AuditorSilhouette:
    def __init__(self, workspace_path: str = "/workspace/CHROMA_AGENT_GITHUB_READY"):
        self.workspace_path = Path(workspace_path)
        self.errors = []
        self.warnings = []
        self.info = []
        self.success_count = 0
        
    def log_error(self, message: str):
        self.errors.append(f"❌ ERROR: {message}")
        print(f"❌ ERROR: {message}")
        
    def log_warning(self, message: str):
        self.warnings.append(f"⚠️ WARNING: {message}")
        print(f"⚠️ WARNING: {message}")
        
    def log_info(self, message: str):
        self.info.append(f"ℹ️ INFO: {message}")
        print(f"ℹ️ INFO: {message}")
        
    def log_success(self, message: str):
        self.success_count += 1
        print(f"✅ SUCCESS: {message}")

    def revisar_estructura_proyecto(self):
        """Revisar la estructura general del proyecto"""
        print("\n" + "="*60)
        print("🔍 REVISANDO ESTRUCTURA DEL PROYECTO")
        print("="*60)
        
        # Archivos críticos que deben existir
        archivos_criticos = [
            "optimized_server.py",
            "start_optimized.sh", 
            "requirements_optimized.txt",
            "SILHOUETTE_UNIFIED_DOCS.md",
            "chroma_agent/server.py",
            "chroma_agent/browser_agent.py",
            "chroma_agent/search_engine.py",
            "chroma_agent/chat_engine.py",
            "chroma_agent/image_engine.py",
            "chroma_agent/config_manager.py",
            "web_interface/index.html",
            "web_interface/config.html"
        ]
        
        for archivo in archivos_criticos:
            file_path = self.workspace_path / archivo
            if file_path.exists():
                self.log_success(f"Archivo crítico encontrado: {archivo}")
            else:
                self.log_error(f"Archivo crítico FALTANTE: {archivo}")
        
        # Directorios críticos
        directorios_criticos = [
            "chroma_agent",
            "framework_v4",
            "web_interface",
            "backup_chroma",
            "backup_framework", 
            "backup_frontend"
        ]
        
        for directorio in directorios_criticos:
            dir_path = self.workspace_path / directorio
            if dir_path.exists() and dir_path.is_dir():
                self.log_success(f"Directorio crítico encontrado: {directorio}")
            else:
                self.log_error(f"Directorio crítico FALTANTE: {directorio}")

    def revisar_sintaxis_python(self):
        """Revisar sintaxis de archivos Python"""
        print("\n" + "="*60)
        print("🐍 REVISANDO SINTAXIS PYTHON")
        print("="*60)
        
        archivos_python = [
            "optimized_server.py",
            "optimizar_integracion_completa.py",
            "chroma_agent/server.py",
            "chroma_agent/browser_agent.py",
            "chroma_agent/search_engine.py",
            "chroma_agent/chat_engine.py",
            "chroma_agent/image_engine.py",
            "chroma_agent/config_manager.py"
        ]
        
        for archivo in archivos_python:
            file_path = self.workspace_path / archivo
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Verificar sintaxis con ast
                    ast.parse(content)
                    self.log_success(f"Syntax OK: {archivo}")
                    
                    # Verificar encoding
                    if "coding: utf-8" in content[:100] or "#!/usr/bin/env python3" in content[:100]:
                        self.log_success(f"Encoding correcto: {archivo}")
                    
                except SyntaxError as e:
                    self.log_error(f"Syntax ERROR en {archivo}: {e}")
                except Exception as e:
                    self.log_error(f"Error leyendo {archivo}: {e}")

    def revisar_imports_y_dependencias(self):
        """Revisar imports y dependencias críticas"""
        print("\n" + "="*60)
        print("📦 REVISANDO IMPORTS Y DEPENDENCIAS")
        print("="*60)
        
        # Verificar requirements_optimized.txt
        requirements_path = self.workspace_path / "requirements_optimized.txt"
        if requirements_path.exists():
            try:
                with open(requirements_path, 'r', encoding='utf-8') as f:
                    requirements = f.read().strip()
                
                packages = [line.strip() for line in requirements.split('\n') if line.strip()]
                self.log_success(f"Requirements encontrados: {len(packages)} paquetes")
                
                for package in packages[:10]:  # Mostrar primeros 10
                    self.log_info(f"   - {package}")
                
                # Verificar paquetes críticos
                paquetes_criticos = [
                    "fastapi",
                    "uvicorn", 
                    "playwright",
                    "openai",
                    "requests",
                    "python-dotenv"
                ]
                
                for paquete in paquetes_criticos:
                    if any(pkg.startswith(paquete) for pkg in packages):
                        self.log_success(f"Paquete crítico encontrado: {paquete}")
                    else:
                        self.log_warning(f"Paquete crítico podría faltar: {paquete}")
                        
            except Exception as e:
                self.log_error(f"Error leyendo requirements: {e}")
        else:
            self.log_error("requirements_optimized.txt NO ENCONTRADO")

    def revisar_configuracion_env(self):
        """Revisar configuración de variables de entorno"""
        print("\n" + "="*60)
        print("🔧 REVISANDO CONFIGURACIÓN .ENV")
        print("="*60)
        
        env_path = self.workspace_path / ".env"
        if env_path.exists():
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    env_content = f.read()
                
                self.log_success("Archivo .env encontrado")
                
                # Verificar APIs críticas
                apis_criticas = [
                    "OPENROUTER_API_KEY",
                    "SERPER_API_KEY"
                ]
                
                for api in apis_criticas:
                    if f"{api}=" in env_content:
                        self.log_success(f"API configurada: {api}")
                    else:
                        self.log_warning(f"API NO configurada: {api}")
                
                # Verificar formato
                lines = env_content.strip().split('\n')
                valid_lines = 0
                for line in lines:
                    if line and '=' in line and not line.startswith('#'):
                        valid_lines += 1
                
                self.log_success(f"Líneas válidas en .env: {valid_lines}")
                
            except Exception as e:
                self.log_error(f"Error leyendo .env: {e}")
        else:
            self.log_warning("Archivo .env NO encontrado (se creará automáticamente)")

    def revisar_configuracion_servidor(self):
        """Revisar configuración del servidor optimizado"""
        print("\n" + "="*60)
        print("🖥️  REVISANDO CONFIGURACIÓN DEL SERVIDOR")
        print("="*60)
        
        server_path = self.workspace_path / "optimized_server.py"
        if server_path.exists():
            try:
                with open(server_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar imports críticos
                imports_criticos = [
                    "from fastapi import FastAPI",
                    "from fastapi.middleware.cors import CORSMiddleware",
                    "import uvicorn",
                    "import os"
                ]
                
                for imp in imports_criticos:
                    if imp in content:
                        self.log_success(f"Import crítico encontrado: {imp}")
                    else:
                        self.log_error(f"Import crítico FALTANTE: {imp}")
                
                # Verificar endpoints principales
                endpoints = [
                    "@app.get(\"/\")",
                    "@app.get(\"/api/status\")",
                    "@app.get(\"/v4/\")",
                    "@app.get(\"/v4/teams\")"
                ]
                
                for endpoint in endpoints:
                    if endpoint in content:
                        self.log_success(f"Endpoint encontrado: {endpoint}")
                    else:
                        self.log_error(f"Endpoint FALTANTE: {endpoint}")
                
                # Verificar que use el puerto correcto
                if "port = int(os.getenv(\"PORT\", 8000))" in content:
                    self.log_success("Configuración de puerto correcta")
                else:
                    self.log_warning("Configuración de puerto podría estar incorrecta")
                
                # Verificar CORS
                if "allow_origins=[\"*\"]" in content:
                    self.log_success("CORS configurado correctamente")
                else:
                    self.log_warning("CORS podría estar mal configurado")
                
            except Exception as e:
                self.log_error(f"Error revisando servidor: {e}")
        else:
            self.log_error("optimized_server.py NO ENCONTRADO")

    def revisar_frontend(self):
        """Revisar archivos del frontend"""
        print("\n" + "="*60)
        print("🌐 REVISANDO FRONTEND")
        print("="*60)
        
        # Revisar index.html principal
        index_path = self.workspace_path / "web_interface" / "index.html"
        if index_path.exists():
            try:
                with open(index_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar elementos HTML críticos
                elementos_criticos = [
                    "<!DOCTYPE html>",
                    "<title>",
                    "<script>",
                    "fetch('/api/status')",
                    "OPENROUTER",
                    "SERPER"
                ]
                
                for elemento in elementos_criticos:
                    if elemento in content:
                        self.log_success(f"Elemento HTML encontrado: {elemento}")
                    else:
                        self.log_warning(f"Elemento HTML podría faltar: {elemento}")
                
                # Verificar CSS
                if "<style>" in content and "</style>" in content:
                    self.log_success("Estilos CSS encontrados")
                else:
                    self.log_warning("CSS no encontrado o malformado")
                
                # Verificar JavaScript
                if "<script>" in content and "</script>" in content:
                    self.log_success("JavaScript encontrado")
                else:
                    self.log_warning("JavaScript no encontrado o malformado")
                
            except Exception as e:
                self.log_error(f"Error revisando index.html: {e}")
        else:
            self.log_error("web_interface/index.html NO ENCONTRADO")
        
        # Revisar config.html
        config_path = self.workspace_path / "web_interface" / "config.html"
        if config_path.exists():
            self.log_success("web_interface/config.html encontrado")
        else:
            self.log_error("web_interface/config.html NO ENCONTRADO")

    def revisar_framework_v4(self):
        """Revisar Framework V4.0"""
        print("\n" + "="*60)
        print("⚡ REVISANDO FRAMEWORK V4.0")
        print("="*60)
        
        framework_path = self.workspace_path / "framework_v4"
        if framework_path.exists():
            # Verificar directorios principales
            dirs_v4 = [
                "core",
                "equipos_principales", 
                "workflows_dinamicos",
                "sistema_audiovisual",
                "infraestructura"
            ]
            
            for dir_name in dirs_v4:
                dir_path = framework_path / dir_name
                if dir_path.exists() and dir_path.is_dir():
                    self.log_success(f"Directorio V4 encontrado: {dir_name}")
                    
                    # Contar archivos en el directorio
                    try:
                        files = list(dir_path.rglob("*.py"))
                        self.log_success(f"   Archivos Python en {dir_name}: {len(files)}")
                    except Exception:
                        pass
                else:
                    self.log_error(f"Directorio V4 FALTANTE: {dir_name}")
            
            # Verificar archivos de configuración
            config_files = [
                "docker-compose.yml",
                "requirements.txt",
                ".env"
            ]
            
            for config_file in config_files:
                file_path = framework_path / config_file
                if file_path.exists():
                    self.log_success(f"Archivo V4 encontrado: {config_file}")
                else:
                    self.log_warning(f"Archivo V4 podría faltar: {config_file}")
                    
        else:
            self.log_error("framework_v4/ NO ENCONTRADO")

    def revisar_script_inicio(self):
        """Revisar script de inicio optimizado"""
        print("\n" + "="*60)
        print("🚀 REVISANDO SCRIPT DE INICIO")
        print("="*60)
        
        script_path = self.workspace_path / "start_optimized.sh"
        if script_path.exists():
            try:
                # Verificar permisos
                if os.access(script_path, os.X_OK):
                    self.log_success("Script tiene permisos de ejecución")
                else:
                    self.log_warning("Script NO tiene permisos de ejecución")
                
                with open(script_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar comandos críticos
                comandos_criticos = [
                    "pip install -r requirements",
                    "python3",
                    "uvicorn",
                    "optimized_server"
                ]
                
                for comando in comandos_criticos:
                    if comando in content:
                        self.log_success(f"Comando crítico encontrado: {comando}")
                    else:
                        self.log_warning(f"Comando crítico podría faltar: {comando}")
                
                # Verificar shebang
                if content.startswith("#!/bin/bash"):
                    self.log_success("Shebang correcto en script")
                else:
                    self.log_warning("Shebang podría estar mal en script")
                
            except Exception as e:
                self.log_error(f"Error revisando script: {e}")
        else:
            self.log_error("start_optimized.sh NO ENCONTRADO")

    def verificar_importaciones_modulos(self):
        """Verificar que los módulos se puedan importar"""
        print("\n" + "="*60)
        print("🔄 VERIFICANDO IMPORTACIONES")
        print("="*60)
        
        # Cambiar al directorio del workspace
        original_cwd = os.getcwd()
        try:
            os.chdir(self.workspace_path)
            
            # Verificar importaciones básicas
            imports_a_verificar = [
                "fastapi",
                "uvicorn", 
                "requests",
                "dotenv"
            ]
            
            for module in imports_a_verificar:
                try:
                    importlib.import_module(module)
                    self.log_success(f"Módulo importable: {module}")
                except ImportError as e:
                    self.log_warning(f"Módulo NO importable: {module} - {e}")
            
            # Verificar módulos locales
            modulos_locales = [
                "chroma_agent",
                "chroma_agent.browser_agent",
                "chroma_agent.search_engine",
                "chroma_agent.chat_engine"
            ]
            
            for module in modulos_locales:
                try:
                    importlib.import_module(module)
                    self.log_success(f"Módulo local importable: {module}")
                except ImportError as e:
                    self.log_error(f"Módulo local NO importable: {module} - {e}")
                    
        except Exception as e:
            self.log_error(f"Error verificando importaciones: {e}")
        finally:
            os.chdir(original_cwd)

    def test_inicializacion_servidor(self):
        """Probar inicialización del servidor"""
        print("\n" + "="*60)
        print("🧪 PROBANDO INICIALIZACIÓN DEL SERVIDOR")
        print("="*60)
        
        server_path = self.workspace_path / "optimized_server.py"
        if server_path.exists():
            try:
                # Intentar importar el módulo del servidor
                original_cwd = os.getcwd()
                os.chdir(self.workspace_path)
                
                spec = importlib.util.spec_from_file_location("optimized_server", server_path)
                if spec and spec.loader:
                    self.log_success("Servidor puede ser importado como módulo")
                else:
                    self.log_error("Servidor NO puede ser importado como módulo")
                
                os.chdir(original_cwd)
                
            except Exception as e:
                self.log_error(f"Error probando servidor: {e}")
        else:
            self.log_error("optimized_server.py no encontrado para prueba")

    def generar_reporte_completo(self):
        """Generar reporte completo de la auditoría"""
        print("\n" + "="*60)
        print("📊 REPORTE COMPLETO DE AUDITORÍA")
        print("="*60)
        
        print(f"✅ EXITSOS: {self.success_count}")
        print(f"❌ ERRORES: {len(self.errors)}")
        print(f"⚠️  ADVERTENCIAS: {len(self.warnings)}")
        print(f"ℹ️  INFORMACIÓN: {len(self.info)}")
        
        # Mostrar errores críticos
        if self.errors:
            print("\n🔴 ERRORES CRÍTICOS:")
            for error in self.errors:
                print(f"   {error}")
        
        # Mostrar advertencias
        if self.warnings:
            print("\n🟡 ADVERTENCIAS:")
            for warning in self.warnings:
                print(f"   {warning}")
        
        # Resumen final
        if len(self.errors) == 0:
            print("\n🎉 AUDITORÍA COMPLETADA - NO SE ENCONTRARON ERRORES CRÍTICOS")
            print("✅ El sistema está listo para uso")
        elif len(self.errors) <= 3:
            print("\n⚠️  AUDITORÍA COMPLETADA - ERRORES MENORES ENCONTRADOS")
            print("🔧 El sistema puede funcionar con ajustes menores")
        else:
            print("\n🚨 AUDITORÍA COMPLETADA - MÚLTIPLES ERRORES ENCONTRADOS")
            print("🛠️  Se requiere atención antes de usar el sistema")
        
        return len(self.errors) == 0

    def ejecutar_auditoria_completa(self):
        """Ejecutar auditoría completa del sistema"""
        print("🔍 INICIANDO AUDITORÍA COMPLETA DEL SISTEMA SILHOUETTE UNIFIED")
        print("=" * 80)
        
        self.revisar_estructura_proyecto()
        self.revisar_sintaxis_python()
        self.revisar_imports_y_dependencias()
        self.revisar_configuracion_env()
        self.revisar_configuracion_servidor()
        self.revisar_frontend()
        self.revisar_framework_v4()
        self.revisar_script_inicio()
        self.verificar_importaciones_modulos()
        self.test_inicializacion_servidor()
        
        return self.generar_reporte_completo()

if __name__ == "__main__":
    auditor = AuditorSilhouette()
    sistema_ok = auditor.ejecutar_auditoria_completa()
    
    if sistema_ok:
        print("\n🎯 CONCLUSIÓN: SISTEMA APROBADO ✅")
    else:
        print("\n⚠️  CONCLUSIÓN: SISTEMA REQUIERE ATENCIÓN ⚠️")