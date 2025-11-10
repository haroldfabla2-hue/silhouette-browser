# 🚀 GUÍA DE INSTALACIÓN FINAL - Silhouette Browser V5.3

## 📋 VERIFICACIÓN PREVIA DE SISTEMA

### 🔧 **Requisitos del Sistema**
- **Node.js**: 18.0 o superior
- **npm**: 8.0 o superior  
- **Sistema Operativo**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **RAM**: Mínimo 4GB (recomendado 8GB+)
- **Espacio en disco**: 2GB libres

### 🧪 **Verificación de Dependencias**
```bash
# Verificar Node.js
node --version    # Debe ser v18+

# Verificar npm
npm --version     # Debe ser v8+

# Verificar Git
git --version
```

## ⚡ INSTALACIÓN RÁPIDA (3 PASOS)

### 📥 **Paso 1: Clonar Repositorio**
```bash
# Clonar desde GitHub
git clone https://github.com/haroldfabla2-hue/silhouette-browser-v5.git
cd silhouette-browser-v5

# O descargar ZIP y extraer
```

### 📦 **Paso 2: Instalar Dependencias**
```bash
# Instalación completa
npm install

# Si hay problemas de permisos
npm install --no-optional

# Para desarrollo (opcional)
npm install --include=dev
```

### 🎮 **Paso 3: Ejecutar Aplicación**
```bash
# Modo producción
npm start

# Modo desarrollo  
npm run dev

# Demo de funcionalidades IA
npm run omnipotent:demo
```

## 🔧 CONFIGURACIÓN AVANZADA

### 🔑 **Configuración de APIs de IA**

Para usar las funcionalidades completas del modo agente, crea el archivo `config/api-keys.json`:

```json
{
  "openrouter": "sk-or-v1-tu-api-key-aqui",
  "serper": "tu-serper-api-key",
  "anthropic": "sk-ant-tu-api-key",
  "openai": "sk-tu-openai-api-key"
}
```

### 📁 **Estructura de Configuración**
```
silhouette-browser-v5/
├── config/
│   ├── api-keys.json          # APIs de IA
│   └── app-config.json        # Configuración de app
├── data/                      # Datos de usuario
├── logs/                      # Archivos de log
└── cache/                     # Cache temporal
```

## 🧪 VERIFICACIÓN DE INSTALACIÓN

### ✅ **Test de Funcionalidad Básica**
```bash
# Ejecutar test final
node test-final-browserview.cjs

# Resultado esperado:
# ✅ Tests pasados: 6
# ❌ Tests fallidos: 0
# 📈 Total: 6
# 🎯 Tasa de éxito: 100.0%
```

### 🤖 **Test del Modo Agente**
```bash
# Ejecutar demo completo
node demo-modo-agente-completo.js

# Verificar capacidades:
# ✅ Ver páginas web
# ✅ Hacer clic en elementos  
# ✅ Comandos en lenguaje natural
# ✅ Navegación entre pestañas
# ✅ Extracción de datos
# ✅ Automatización de workflows
```

## 🎮 USAR EL MODO AGENTE

### 💬 **Comandos de Ejemplo**
Una vez que la aplicación esté ejecutándose:

1. **Abrir la aplicación** con `npm start`
2. **Usar comandos en la interfaz**:
   ```
   "Ve a Google y busca noticias de IA"
   "Extrae todos los enlaces de esta página"
   "Crea nueva pestaña y navega a GitHub"
   "Navega a Amazon y busca laptops gaming"
   ```

### 🔍 **Verificar Funcionamiento**
- ✅ La aplicación inicia sin errores
- ✅ Las pestañas se crean correctamente
- ✅ Los comandos en lenguaje natural responden
- ✅ La IA puede hacer clic en elementos
- ✅ Se pueden extraer datos de páginas web

## 🛠️ SOLUCIÓN DE PROBLEMAS

### ❌ **Error: "Command 'npm' not found"**
**Solución**: Instalar Node.js desde [nodejs.org](https://nodejs.org)

### ❌ **Error: "Permission denied"**
**Solución**:
```bash
# Linux/Mac
sudo npm install -g npm

# Windows (como administrador)
npm install -g npm
```

### ❌ **Error: "Module not found"**
**Solución**:
```bash
# Limpiar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

### ❌ **Error: "Electron not found"**
**Solución**:
```bash
# Instalar Electron específicamente
npm install electron --save-dev

# Verificar instalación
npx electron --version
```

### ❌ **Error: "Port already in use"**
**Solución**:
```bash
# Cambiar puerto en main.js
# O terminar proceso existente
pkill -f electron
```

## 📦 CREAR INSTALADORES

### 🖥️ **Para Windows**
```bash
npm run build
npm run dist:win
# Genera: dist/Silhouette Browser Setup.exe
```

### 🍎 **Para macOS**
```bash
npm run build
npm run dist:mac
# Genera: dist/Silhouette Browser.dmg
```

### 🐧 **Para Linux**
```bash
npm run build
npm run dist:linux
# Genera: dist/Silhouette Browser.AppImage
```

## 🔄 ACTUALIZACIONES

### 📈 **Actualizar a Nueva Versión**
```bash
# Ir al directorio del proyecto
cd silhouette-browser-v5

# Obtener últimos cambios
git pull origin main

# Reinstalar dependencias si es necesario
npm install

# Ejecutar tests de verificación
node test-final-browserview.cjs

# Ejecutar aplicación
npm start
```

## 🧹 DESINSTALACIÓN

### 🗑️ **Limpieza Completa**
```bash
# Eliminar aplicación
cd silhouette-browser-v5
rm -rf node_modules package-lock.json
rm -rf dist build

# Eliminar datos de usuario (opcional)
rm -rf data/ logs/ cache/

# Eliminar configuración
rm config/api-keys.json
```

## 🎯 VERIFICACIÓN FINAL

### ✅ **Checklist de Instalación Exitosa**
- [ ] Node.js 18+ instalado
- [ ] npm 8+ funcionando
- [ ] Repositorio clonado
- [ ] Dependencias instaladas sin errores
- [ ] Aplicación inicia con `npm start`
- [ ] Tests pasan al 100%
- [ ] Modo agente responde a comandos
- [ ] Navegación funciona correctamente

### 🎉 **Si todo está correcto...**
¡**FELICITACIONES**! Tienes Silhouette Browser V5.3 completamente instalado y funcionando.

**🚀 Próximos pasos:**
1. Explorar las funcionalidades del modo agente
2. Configurar APIs de IA para funcionalidad completa
3. Crear workflows automatizados
4. Disfrutar de la navegación del futuro

## 📞 SOPORTE

### 🆘 **Obtener Ayuda**
- 📖 **Documentación**: [README.md](README.md)
- 🐛 **Reportar bugs**: Issues en GitHub
- 💬 **Discusiones**: Discussions en GitHub
- 🤖 **Demo**: `npm run omnipotent:demo`

### 🔍 **Comandos de Diagnóstico**
```bash
# Verificar configuración
node -v && npm -v

# Verificar instalación
npm list electron

# Test completo
npm test

# Demo de funcionalidades
npm run omnipotent:demo
```

---

**🎯 Silhouette Browser V5.3 - Instalación completada exitosamente**

*¿Problemas? Verifica que cumplas todos los requisitos y revisa la sección de solución de problemas.*