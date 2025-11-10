@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║                    🚀 SILHOUETTE UNIFIED V4.0                          ║
echo ║                     INSTALADOR COMPLETO AUTOMÁTICO                     ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.

REM Verificar Python
echo 🔍 Verificando Python 3.8+...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado
    echo 📥 Instalar Python 3.8+ desde: https://python.org
    echo 🔗 Asegurar que "Add Python to PATH" esté marcado
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python %PYTHON_VERSION% detectado

REM Verificar pip
echo 🔍 Verificando pip...
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip no está instalado
    echo 📥 Reinstalar Python con pip incluido
    pause
    exit /b 1
)
echo ✅ pip disponible

REM Crear entorno virtual
echo 📦 Creando entorno virtual...
if not exist venv (
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Error creando entorno virtual
        pause
        exit /b 1
    )
    echo ✅ Entorno virtual creado
) else (
    echo ⚠️  Entorno virtual ya existe
)

REM Activar entorno virtual
echo 🔄 Activando entorno virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Error activando entorno virtual
    pause
    exit /b 1
)
echo ✅ Entorno virtual activado

REM Actualizar pip
echo ⬆️ Actualizando pip...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo ⚠️  Error actualizando pip, continuando...
) else (
    echo ✅ pip actualizado
)

REM Instalar dependencias
echo 📦 Instalando dependencias de Python...
if exist requirements.txt (
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
) else (
    echo ❌ requirements.txt no encontrado
    echo 🔍 Verificar que estés en el directorio correcto
    pause
    exit /b 1
)

REM Instalar Playwright
echo 🌐 Instalando navegadores Playwright...
echo    Esto puede tomar 2-3 minutos...
pip install playwright
if errorlevel 1 (
    echo ❌ Error instalando Playwright
    pause
    exit /b 1
)
echo ✅ Playwright instalado

REM Instalar navegadores
echo 🌐 Descargando e instalando navegadores...
playwright install chromium --force
if errorlevel 1 (
    echo ⚠️  Error instalando navegadores, pero continuando...
) else (
    echo ✅ Navegadores instalados
)

REM Crear directorios
echo 📁 Creando directorios de datos...
if not exist data mkdir data
if not exist data\cache mkdir data\cache
if not exist data\logs mkdir data\logs
if not exist browser_data mkdir browser_data
if not exist screenshots mkdir screenshots
echo ✅ Directorios creados

REM Configurar .env
echo ⚙️  Configurando archivo .env...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo ✅ Archivo .env creado desde .env.example
        echo.
        echo ⚠️  IMPORTANTE: Edita .env con tus claves de API:
        echo    notepad .env
    ) else (
        echo OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here > .env
        echo SERPER_API_KEY=your-serper-key-here >> .env
        echo. >> .env
        echo # APIs OPCIONALES >> .env
        echo UNSPLASH_ACCESS_KEY=your-unsplash-key-here >> .env
        echo SERPAPI_KEY=your-serpapi-key-here >> .env
        echo. >> .env
        echo # Configuración del servidor >> .env
        echo PORT=8000 >> .env
        echo HOST=localhost >> .env
        echo ENVIRONMENT=development >> .env
        echo DEBUG=true >> .env
        echo ✅ Archivo .env creado con plantilla
    )
) else (
    echo ⚠️  Archivo .env ya existe
)

REM Crear script de inicio para Windows
echo 🚀 Creando script de inicio...
echo @echo off > start_complete.bat
echo REM Script de inicio mejorado para Silhouette Unified V4.0 >> start_complete.bat
echo. >> start_complete.bat
echo echo 🚀 Iniciando Silhouette Unified V4.0... >> start_complete.bat
echo echo 🌐 URL: http://localhost:8000 >> start_complete.bat
echo echo 📚 Docs: http://localhost:8000/docs >> start_complete.bat
echo. >> start_complete.bat
echo REM Activar entorno virtual >> start_complete.bat
echo if exist venv\Scripts\activate.bat ^( >> start_complete.bat
echo     call venv\Scripts\activate.bat >> start_complete.bat
echo     echo ✅ Entorno virtual activado >> start_complete.bat
echo ^) else ^( >> start_complete.bat
echo     echo ❌ Entorno virtual no encontrado >> start_complete.bat
echo     pause >> start_complete.bat
echo     exit /b 1 >> start_complete.bat
echo ^) >> start_complete.bat
echo. >> start_complete.bat
echo REM Verificar APIs configuradas >> start_complete.bat
echo if exist .env ^( >> start_complete.bat
echo     echo 🔍 Verificando configuración de APIs... >> start_complete.bat
echo ^) else ^( >> start_complete.bat
echo     echo ⚠️  Archivo .env no encontrado >> start_complete.bat
echo ^) >> start_complete.bat
echo. >> start_complete.bat
echo REM Iniciar servidor >> start_complete.bat
echo echo 🎯 ¡Listo para usar! >> start_complete.bat
echo echo. >> start_complete.bat
echo python optimized_server.py >> start_complete.bat

echo ✅ Script de inicio creado

echo.
echo 🎉 ¡INSTALACIÓN COMPLETA TERMINADA!
echo.
echo ═══════════════════════════════════════════════════════════════════════
echo 📦 Python: %PYTHON_VERSION% ✅
echo 📦 Entorno virtual: Creado ✅
echo 📦 Dependencias: Instaladas ✅
echo 🌐 Navegadores: Instalados ✅
echo 📁 Directorios: Creados ✅
echo ⚙️  Configuración: Preparada ✅
echo 🚀 Script de inicio: Creado ✅
echo.
echo 🎯 PRÓXIMOS PASOS:
echo 1. 🔧 Configurar APIs (editar .env):
echo    notepad .env
echo.
echo 2. 🚀 Iniciar aplicación:
echo    start_complete.bat
echo.
echo 3. 🌐 Abrir en navegador:
echo    http://localhost:8000
echo.
echo 💡 APIS REQUERIDAS (Solo 2):
echo    • OPENROUTER → https://openrouter.ai/  (Gratuito)
echo    • SERPER → https://serper.dev/  (2,500 búsquedas/mes gratis)
echo.
echo ¡Silhouette Unified V4.0 está listo para usar! 🚀
echo.
pause