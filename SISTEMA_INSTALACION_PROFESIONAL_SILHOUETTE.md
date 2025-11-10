# Sistema de Instalación Profesional - Silhouette Browser

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Cómo Construir los Instaladores](#cómo-construir-los-instaladores)
4. [Características Dinámicas de Detección](#características-dinámicas-de-detección)
5. [Uso del Sistema de Instalación](#uso-del-sistema-de-instalación)
6. [Guía de Troubleshooting](#guía-de-troubleshooting)
7. [Ejecutable Final (.exe)](#ejecutable-final-exe)

---

## 🔍 Descripción General

El **Sistema de Instalación Profesional de Silhouette Browser** es una solución completa y dinámica que crea instaladores profesionales para múltiples plataformas de forma automática. Este sistema está diseñado para adaptarse automáticamente a diferentes sistemas operativos, distribuciones de Linux, y detectar dependencias faltantes con aprobación del usuario.

### Características Principales

- **Multi-Plataforma**: Windows, macOS, Linux
- **Detección Dinámica**: Identifica OS, arquitectura y dependencias automáticamente
- **Instalación Inteligente**: Instala solo lo que falta con aprobación del usuario
- **Rollback Automático**: Reversión completa en caso de error
- **Auto-Actualización**: Sistema integrado de actualizaciones automáticas
- **Firma Digital**: Soporte para code signing en todas las plataformas

### Plataformas Soportadas

| Plataforma | Formato de Instalador | Características |
|------------|----------------------|-----------------|
| **Windows 10/11** | `.exe` (NSIS) | One-click installation, auto-updates |
| **macOS 10.15+** | `.dmg` | Drag & drop, notarization |
| **Ubuntu/Debian** | `.deb` | Package manager integration |
| **Fedora/CentOS** | `.rpm` | Native package support |
| **Arch Linux** | `.AppImage` | Portable, no installation required |

---

## 💻 Requisitos del Sistema

### Requisitos Mínimos para Construcción

#### Para Desarrolladores (Build Environment)
```bash
# Node.js - Versión 18.0 o superior
node --version  # Debe ser >= 18.0.0

# Git
git --version

# 2GB de espacio libre en disco

# Python 3.8+ (para algunos módulos)
python3 --version
```

#### Para Usuarios Finales

**Windows:**
- Windows 10 versión 1903 o superior
- 4GB RAM mínimo (8GB recomendado)
- 2GB espacio libre en disco
- .NET Framework 4.7.2 o superior

**macOS:**
- macOS 10.15 (Catalina) o superior
- 4GB RAM mínimo (8GB recomendado)
- 2GB espacio libre en disco

**Linux:**
- Kernel 3.10 o superior
- 4GB RAM mínimo (8GB recomendado)
- 2GB espacio libre en disco
- GLIBC 2.17 o superior

### Dependencias Automáticamente Detectadas

El sistema detecta y puede instalar automáticamente:

| Dependencia | Windows | macOS | Linux |
|-------------|---------|-------|-------|
| **Node.js** | ✅ | ✅ | ✅ |
| **Python 3.8+** | ✅ | ✅ | ✅ |
| **Git** | ✅ | ✅ | ✅ |
| **Build Tools** | ✅ | ✅ | ✅ |
| **C++ Redistributables** | ✅ | ❌ | ❌ |

---

## 🛠️ Cómo Construir los Instaladores

### Comando Principal de Construcción

```bash
# Navegar al directorio del proyecto
cd silhouette-browser

# Instalar dependencias
npm install

# Construir para todas las plataformas
npm run dist:all

# O construir para plataforma específica
npm run dist:win      # Solo Windows
npm run dist:mac      # Solo macOS
npm run dist:linux    # Solo Linux
```

### Scripts de Construcción Disponibles

```bash
# Desarrollo rápido
npm run dev:build

# Producción completa
npm run prod:build

# Solo empaquetado (sin installer)
npm run package:all

# Limpiar archivos de build
npm run clean

# Validación pre-build
npm run pre-build-check

# Post-build verification
npm run post-build-verify
```

### Configuración de Variables de Entorno

```bash
# Configurar para build de producción
export NODE_ENV=production
export BUILD_TARGET=production

# Configurar para firma de código (opcional)
export WIN_CSC_LINK=path/to/certificate.p12
export MAC_CSC_NAME="Developer ID Application: Your Name"

# Configurar URL de auto-actualización
export UPDATE_URL=https://releases.silhouette-browser.com
```

### Estructura de Salida de Build

```
dist/
├── win-unpacked/          # Windows app sin empaquetar
├── Silhouette Browser Setup X.X.X.exe  # Instalador Windows
├── mac/                   # macOS app
├── Silhouette Browser-X.X.X.dmg         # Instalador macOS
├── linux-unpacked/        # Linux app sin empaquetar
├── Silhouette-Browser-X.X.X.AppImage    # Instalador portable Linux
├── Silhouette-Browser_X.X.X_amd64.deb   # Paquete Debian
└── Silhouette-Browser-X.X-X.x86_64.rpm  # Paquete RPM
```

---

## 🎯 Características Dinámicas de Detección

### 1. Detección de Sistema Operativo

```javascript
// Ejemplo de código de detección (pre-build.js)
async function detectOS() {
  const platform = process.platform;
  const arch = process.arch;
  
  switch (platform) {
    case 'win32':
      return {
        type: 'windows',
        version: await getWindowsVersion(),
        edition: await getWindowsEdition(),
        arch: arch === 'x64' ? '64bit' : '32bit'
      };
    case 'darwin':
      return {
        type: 'macos',
        version: await getMacOSVersion(),
        arch: arch === 'x64' ? 'intel' : 'arm64'
      };
    case 'linux':
      return {
        type: 'linux',
        distribution: await getLinuxDistribution(),
        version: await getDistributionVersion(),
        arch: arch === 'x64' ? '64bit' : 'arm64'
      };
  }
}
```

### 2. Detección de Dependencias

```bash
# El sistema ejecuta estas verificaciones automáticamente:

# Node.js
node --version

# Python
python3 --version

# Git
git --version

# En Windows: Verificar Visual C++ Redistributables
reg query "HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64"

# En macOS: Verificar Xcode Command Line Tools
xcode-select -p

# En Linux: Verificar build essentials
dpkg -l | grep build-essential
```

### 3. Detección de Arquitectura

- **x64**: Procesadores Intel/AMD de 64 bits
- **ARM64**: Apple Silicon (M1/M2), Raspberry Pi 4
- **IA32**: Sistemas de 32 bits (legado)

### 4. Verificación de Permisos

```bash
# Windows: Verificar permisos de administrador
net session >nul 2>&1

# macOS: Verificar permisos de usuario
sudo -n true 2>/dev/null

# Linux: Verificar sudo access
sudo -n true 2>/dev/null
```

---

## 📦 Uso del Sistema de Instalación

### Para Desarrolladores

#### 1. Instalación del Sistema de Build

```bash
# Clonar el repositorio
git clone https://github.com/haroldfabla2-hue/silhouette-search.git
cd silhouette-search

# Hacer ejecutable el instalador dinámico
chmod +x install_professional_dynamic.sh

# Ejecutar detección de sistema
./install_professional_dynamic.sh --detect-only
```

#### 2. Build para Distribución

```bash
# Build completo para distribución
npm run dist:all

# Build con firma de código
npm run dist:signed

# Build con auto-actualización habilitada
npm run dist:autoupdate
```

#### 3. Testeo de Instaladores

```bash
# Test en máquina virtual o emulador
./test_installer.sh --platform=windows --installer=dist/Silhouette-Browser-Setup.exe

# Test de dependencias
./test_installer.sh --test-dependencies

# Test de rollback
./test_installer.sh --test-rollback
```

### Para Usuarios Finales

#### 1. Instalación Automática (Recomendado)

```bash
# Descargar e instalar automáticamente
curl -sSL https://raw.githubusercontent.com/haroldfabla2-hue/silhouette-search/main/install_professional_dynamic.sh | bash

# O descargar y ejecutar localmente
wget https://raw.githubusercontent.com/haroldfabla2-hue/silhouette-search/main/install_professional_dynamic.sh
chmod +x install_professional_dynamic.sh
./install_professional_dynamic.sh
```

#### 2. Instalación Manual

**Windows:**
1. Descargar: `Silhouette Browser Setup X.X.X.exe`
2. Ejecutar como administrador
3. Seguir el asistente de instalación

**macOS:**
1. Descargar: `Silhouette Browser X.X.X.dmg`
2. Abrir DMG y arrastrar a Applications
3. Verificar en Gatekeeper si es necesario

**Linux (Ubuntu/Debian):**
```bash
sudo dpkg -i Silhouette-Browser_X.X.X_amd64.deb
sudo apt-get install -f  # Instalar dependencias faltantes
```

**Linux (Fedora/RHEL):**
```bash
sudo rpm -ivh Silhouette-Browser-X.X-X.x86_64.rpm
```

**Linux (AppImage - Universal):**
```bash
chmod +x Silhouette-Browser-X.X.X.AppImage
./Silhouette-Browser-X.X.X.AppImage
```

#### 3. Configuración Post-Instalación

```bash
# Ejecutar configuración inicial
silhouette-browser --setup

# Verificar instalación
silhouette-browser --version

# Ejecutar auto-actualización
silhouette-browser --update
```

---

## 🔧 Guía de Troubleshooting

### Problemas Comunes y Soluciones

#### 1. Error: "Node.js not found"

**Síntoma:**
```
Error: Node.js is required but not installed
```

**Solución:**
```bash
# Windows (usando Chocolatey)
choco install nodejs

# macOS (usando Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora/RHEL
sudo dnf install nodejs npm

# Arch Linux
sudo pacman -S nodejs npm
```

#### 2. Error: "Python not found"

**Síntoma:**
```
Error: Python 3.8+ is required
```

**Solución:**
```bash
# Windows (usando Chocolatey)
choco install python

# macOS (usando Homebrew)
brew install python3

# Ubuntu/Debian
sudo apt install python3 python3-pip

# Fedora/RHEL
sudo dnf install python3 python3-pip

# Arch Linux
sudo pacman -S python
```

#### 3. Error: "Build failed - insufficient permissions"

**Síntoma:**
```
Error: Permission denied during build
```

**Solución:**
```bash
# Verificar permisos de usuario
sudo chown -R $(whoami) /path/to/project

# Linux/macOS: Agregar usuario al grupo de desarrollo
sudo usermod -a -G wheel $(whoami)  # RHEL/CentOS
sudo usermod -a -G sudo $(whoami)   # Ubuntu/Debian

# Verificar variables de entorno
echo $PATH | grep -i node
echo $PATH | grep -i npm
```

#### 4. Error: "Code signing failed"

**Síntoma:**
```
Error: Failed to sign application
```

**Solución:**
```bash
# Verificar certificados disponibles
# Windows
certmgr.msc

# macOS
security find-identity -v -p codesigning

# Configurar variables de entorno
export WIN_CSC_LINK=/path/to/certificate.p12
export WIN_CSC_KEY_PASSWORD=password
export MAC_CSC_NAME="Developer ID"

# O deshabilitar firma temporalmente
export SKIP_CODE_SIGNING=true
```

#### 5. Error: "Auto-update failed"

**Síntoma:**
```
Error: Unable to check for updates
```

**Solución:**
```bash
# Verificar conectividad
curl -I https://releases.silhouette-browser.com/latest

# Limpiar cache de actualizaciones
rm -rf ~/.config/silhouette-browser/updates

# Verificar permisos de archivo
ls -la ~/.config/silhouette-browser/

# Logs de depuración
./silhouette-browser --verbose --log-file debug.log
```

#### 6. Error: "Application won't start"

**Síntoma:**
```
Silhouette Browser fails to launch
```

**Solución:**

**Windows:**
```cmd
# Ejecutar desde CMD como administrador
cd "C:\Program Files\Silhouette Browser"
Silhouette Browser.exe

# Verificar dependencias de Visual C++
# Descargar: Microsoft Visual C++ Redistributable
```

**macOS:**
```bash
# Verificar Gatekeeper
spctl --assess --verbose /Applications/Silhouette\ Browser.app

# Permitir aplicación (si está bloqueada)
sudo spctl --master-disable  # Solo temporalmente
# O usar: System Preferences > Security & Privacy
```

**Linux:**
```bash
# Verificar librerías
ldd /usr/bin/silhouette-browser

# Instalar dependencias faltantes
sudo apt install libgtk-3-0 libnss3  # Ubuntu/Debian
sudo dnf install gtk3 nss  # Fedora/RHEL

# Ejecutar con más información
./Silhouette Browser --verbose
```

### Comandos de Diagnóstico

```bash
# Diagnóstico completo del sistema
./install_professional_dynamic.sh --diagnose

# Verificar todos los requisitos
npm run system-check

# Generar reporte de logs
npm run generate-logs

# Test de conectividad
npm run network-test

# Validación de instaladores
npm run validate-installers
```

### Logs y Archivos de Configuración

**Ubicaciones de logs:**

- **Windows**: `%APPDATA%\Silhouette Browser\logs\`
- **macOS**: `~/Library/Logs/Silhouette Browser/`
- **Linux**: `~/.local/share/Silhouette Browser/logs/`

**Archivos de configuración:**

- **Windows**: `%APPDATA%\Silhouette Browser\config\`
- **macOS**: `~/Library/Application Support/Silhouette Browser/`
- **Linux**: `~/.config/Silhouette Browser/`

---

## 🚀 Ejecutable Final (.exe)

### Características del Ejecutable Final

Al completar la instalación en Windows, se creará un ejecutable principal:

```
C:\Program Files\Silhouette Browser\Silhouette Browser.exe
```

### Características del Ejecutable

1. **Autocontenido**: Incluye todas las dependencias necesarias
2. **Auto-actualizable**: Se actualiza automáticamente
3. **Firmado digitalmente**: Verificado por Windows SmartScreen
4. **Modo portable**: Puede ejecutarse desde cualquier ubicación
5. **Integración con sistema**: Aparece en Menú Inicio y Programs

### Atajos y Acceso

```bash
# Ejecutar desde línea de comandos
"C:\Program Files\Silhouette Browser\Silhouette Browser.exe"

# Desde PowerShell
Start-Process "C:\Program Files\Silhouette Browser\Silhouette Browser.exe"

# Desde CMD
cd "C:\Program Files\Silhouette Browser" && Silhouette Browser.exe
```

### Crear Acceso Directo

```cmd
# Crear acceso directo en escritorio
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('$env:USERPROFILE\Desktop\Silhouette Browser.lnk'); $Shortcut.TargetPath = 'C:\Program Files\Silhouette Browser\Silhouette Browser.exe'; $Shortcut.Save()"

# Crear acceso directo en menú inicio
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Silhouette Browser.lnk'); $Shortcut.TargetPath = 'C:\Program Files\Silhouette Browser\Silhouette Browser.exe'; $Shortcut.Save()"
```

### Registro en Windows

El instalador registra automáticamente la aplicación en:

- **Programs and Features** (Add/Remove Programs)
- **Windows Registry** (HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Silhouette Browser)
- **File Association** para archivos soportados
- **Protocol Handlers** para custom:// URLs

### Desinstalación Limpia

```cmd
# Usar el desinstalador integrado
"C:\Program Files\Silhouette Browser\Uninstall Silhouette Browser.exe"

# O desde Programs and Features
# Control Panel > Programs > Programs and Features
# Seleccionar "Silhouette Browser" y hacer clic en Uninstall
```

---

## 📞 Soporte y Contacto

### Recursos Adicionales

- **Documentación técnica**: [GitHub Wiki](https://github.com/haroldfabla2-hue/silhouette-search/wiki)
- **Reportar bugs**: [GitHub Issues](https://github.com/haroldfabla2-hue/silhouette-search/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/haroldfabla2-hue/silhouette-search/discussions)
- **Releases**: [GitHub Releases](https://github.com/haroldfabla2-hue/silhouette-search/releases)

### Información de Versión

- **Versión actual**: 4.0.0
- **Última actualización**: 2025-11-10
- **Compatibilidad**: Node.js 18+, Electron 25+

---

*Este documento es parte del Sistema de Instalación Profesional de Silhouette Browser. Para más información técnica, consulte el código fuente en el repositorio oficial.*