@echo off
echo 🚀 Instalando Chroma Agent...

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado
    echo 📥 Instalar Python 3.8+ desde: https://python.org
    pause
    exit /b 1
)

REM Verificar pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip no está instalado
    pause
    exit /b 1
)

echo 📦 Creando entorno virtual...
python -m venv venv
call venv\Scripts\activate.bat

echo ⬆️ Actualizando pip...
pip install --upgrade pip

echo 📦 Instalando dependencias...
pip install -r requirements.txt

echo 🌐 Instalando navegadores Playwright...
playwright install chromium
playwright install-deps

echo ⚙️ Configurando proyecto...

REM Copiar configuración de ejemplo si no existe
if not exist .env (
    copy .env.example .env
    echo 📝 Archivo .env creado desde .env.example
    echo ⚠️  IMPORTANTE: Editar .env con tus claves de API
)

REM Crear directorio de datos
if not exist data mkdir data
if not exist data\cache mkdir data\cache
if not exist data\logs mkdir data\logs
if not exist browser_data mkdir browser_data
if not exist screenshots mkdir screenshots

echo.
echo ✅ ¡Instalación completada!
echo.
echo 🎯 PRÓXIMOS PASOS:
echo 1. Editar .env con tus claves de API:
echo    notepad .env
echo.
echo 2. Iniciar Chroma Agent:
echo    venv\Scripts\activate.bat
echo    python -m chroma_agent.server
echo.
echo 3. Abrir en navegador:
echo    http://localhost:8000
echo.
echo 📚 Documentación completa en README.md
echo.
pause
