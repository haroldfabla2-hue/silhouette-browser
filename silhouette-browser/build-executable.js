#!/usr/bin/env node

// =============================================================================
// BUILD EXECUTABLE COMPLETE - SILHOUETTE BROWSER
// Genera instaladores ejecutables completos para todas las plataformas
// =============================================================================

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 BUILD EXECUTABLE COMPLETO - SILHOUETTE BROWSER');
console.log('=' .repeat(70));

// Configuración
const CONFIG = {
  platforms: {
    win32: {
      name: 'Windows',
      targets: ['nsis', 'portable', 'msi'],
      arch: ['x64', 'ia32'],
      description: 'Instalador Windows con MSI, NSIS y versión portable'
    },
    darwin: {
      name: 'macOS', 
      targets: ['dmg', 'zip'],
      arch: ['x64', 'arm64'],
      description: 'Aplicación macOS con DMG y ZIP'
    },
    linux: {
      name: 'Linux',
      targets: ['AppImage', 'deb', 'rpm'],
      arch: ['x64', 'arm64'],
      description: 'Linux con AppImage, DEB y RPM'
    }
  },
  features: {
    autoUpdater: true,
    crashReporting: true,
    security: true,
    debug: false
  }
};

// Detectar plataforma actual
function detectCurrentPlatform() {
  const platform = process.platform;
  const arch = process.arch;
  
  console.log(`🖥️ Detectando plataforma actual: ${platform} ${arch}`);
  
  if (platform === 'win32') {
    return 'win32';
  } else if (platform === 'darwin') {
    return 'darwin';
  } else if (platform === 'linux') {
    return 'linux';
  } else {
    throw new Error(`Plataforma no soportada: ${platform}`);
  }
}

// Verificar dependencias
function checkDependencies() {
  console.log('📋 Verificando dependencias...');
  
  const dependencies = [
    { name: 'Node.js', cmd: 'node --version' },
    { name: 'npm', cmd: 'npm --version' },
    { name: 'git', cmd: 'git --version' }
  ];
  
  const missing = [];
  
  dependencies.forEach(dep => {
    try {
      const result = execSync(dep.cmd, { encoding: 'utf8', stdio: 'pipe' });
      console.log(`✅ ${dep.name}: ${result.trim()}`);
    } catch (error) {
      missing.push(dep.name);
      console.error(`❌ ${dep.name}: No encontrado`);
    }
  });
  
  if (missing.length > 0) {
    console.error(`❌ Dependencias faltantes: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ Todas las dependencias están disponibles\n');
}

// Instalar dependencias npm
function installDependencies() {
  console.log('📦 Instalando dependencias npm...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencias instaladas correctamente\n');
  } catch (error) {
    console.error('❌ Error instalando dependencias');
    process.exit(1);
  }
}

// Crear iconos
function createIcons() {
  console.log('🎨 Creando iconos...');
  
  try {
    if (fs.existsSync('create-icons.js')) {
      execSync('node create-icons.js', { stdio: 'inherit' });
      console.log('✅ Iconos creados correctamente\n');
    } else {
      console.warn('⚠️ Script de iconos no encontrado, saltando...');
    }
  } catch (error) {
    console.warn('⚠️ Error creando iconos, continuando...\n');
  }
}

// Limpiar directorio de distribución
function cleanDistDirectory() {
  console.log('🧹 Limpiando directorio de distribución...');
  
  const distDir = 'dist';
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
    console.log('✅ Directorio dist limpiado\n');
  }
  
  // Recrear directorio
  fs.mkdirSync(distDir, { recursive: true });
}

// Generar build para plataforma actual
function buildForPlatform(platform) {
  console.log(`🔨 Generando build para ${platform}...`);
  
  const platformConfig = CONFIG.platforms[platform];
  if (!platformConfig) {
    throw new Error(`Configuración no encontrada para plataforma: ${platform}`);
  }
  
  // Determinar comando de build según plataforma
  let buildCmd;
  let args;
  
  switch (platform) {
    case 'win32':
      buildCmd = 'electron-builder';
      args = ['--win'];
      break;
    case 'darwin':
      buildCmd = 'electron-builder';
      args = ['--mac'];
      break;
    case 'linux':
      buildCmd = 'electron-builder';
      args = ['--linux'];
      break;
    default:
      buildCmd = 'electron-builder';
      args = [];
  }
  
  console.log(`🔧 Ejecutando: ${buildCmd} ${args.join(' ')}`);
  
  try {
    // Ejecutar build con spawn para mejor control
    return new Promise((resolve, reject) => {
      const child = spawn(buildCmd, args, {
        stdio: 'inherit',
        shell: true
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build completado exitosamente\n');
          resolve();
        } else {
          reject(new Error(`Build falló con código: ${code}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error(`❌ Error en build: ${error.message}`);
    throw error;
  }
}

// Verificar builds generados
function verifyBuilds() {
  console.log('🔍 Verificando builds generados...');
  
  const distDir = 'dist';
  if (!fs.existsSync(distDir)) {
    throw new Error('Directorio de distribución no encontrado');
  }
  
  const files = fs.readdirSync(distDir);
  console.log(`📁 Archivos generados en dist/:`);
  
  let totalSize = 0;
  const significantFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalSize += size;
    
    // Solo mostrar archivos significativos (mayores a 1MB)
    if (size > 1024 * 1024) {
      significantFiles.push({
        name: file,
        size: formatBytes(size),
        sizeBytes: size
      });
    }
  });
  
  // Ordenar por tamaño
  significantFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);
  
  significantFiles.forEach(file => {
    console.log(`   • ${file.name} (${file.size})`);
  });
  
  console.log(`\n📊 Total de builds: ${files.length} archivos`);
  console.log(`📊 Tamaño total: ${formatBytes(totalSize)}\n`);
  
  return files;
}

// Formatear bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generar reporte de build
function generateBuildReport(platform, files) {
  console.log('📄 Generando reporte de build...');
  
  const report = {
    build: {
      timestamp: new Date().toISOString(),
      platform: platform,
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      os: os.platform(),
      osRelease: os.release(),
      arch: os.arch(),
      hostname: os.hostname()
    },
    features: CONFIG.features,
    platform: CONFIG.platforms[platform],
    artifacts: files.map(file => {
      const filePath = path.join('dist', file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: formatBytes(stats.size),
        sizeBytes: stats.size,
        path: filePath
      };
    }),
    totalSize: files.reduce((sum, file) => {
      const stats = fs.statSync(path.join('dist', file));
      return sum + stats.size;
    }, 0)
  };
  
  const reportFile = `build-report-${platform}-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`✅ Reporte generado: ${reportFile}\n`);
  return report;
}

// Mostrar resumen final
function showFinalSummary(platform, files, report) {
  console.log('🎉 BUILD COMPLETADO EXITOSAMENTE');
  console.log('=' .repeat(70));
  console.log(`🖥️ Plataforma: ${report.build.platform}`);
  console.log(`📦 Versión: ${report.build.version}`);
  console.log(`📁 Archivos generados: ${files.length}`);
  console.log(`💾 Tamaño total: ${formatBytes(report.totalSize)}`);
  console.log('');
  
  console.log('📋 ARCHIVOS PRINCIPALES:');
  report.artifacts
    .filter(artifact => artifact.sizeBytes > 1024 * 1024) // Solo archivos > 1MB
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 5) // Mostrar los 5 más grandes
    .forEach(artifact => {
      console.log(`   • ${artifact.name}`);
      console.log(`     💾 Tamaño: ${artifact.size}`);
      console.log(`     📁 Ubicación: ${artifact.path}`);
      console.log('');
    });
  
  console.log('🚀 CÓMO INSTALAR:');
  console.log('1. Descargar el archivo instalador correspondiente');
  console.log('2. Ejecutar como administrador (si es necesario)');
  console.log('3. Seguir el asistente de instalación');
  console.log('4. Ejecutar Silhouette Browser desde el menú de inicio');
  console.log('');
  
  console.log('🔗 ENLACES ÚTILES:');
  console.log(`   • Repositorio: https://github.com/haroldfabla2-hue/silhouette-browser`);
  console.log(`   • Releases: https://github.com/haroldfabla2-hue/silhouette-browser/releases`);
  console.log('');
  
  console.log('✅ ¡Silhouette Browser listo para distribución!');
}

// Función principal
async function main() {
  try {
    // Verificar que estamos en el directorio correcto
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json no encontrado. Ejecutar desde el directorio del proyecto.');
    }
    
    if (!fs.existsSync('electron-builder.professional.yml')) {
      throw new Error('electron-builder.professional.yml no encontrado.');
    }
    
    // Verificar dependencias
    checkDependencies();
    
    // Instalar dependencias si es necesario
    if (!fs.existsSync('node_modules')) {
      installDependencies();
    }
    
    // Crear iconos
    createIcons();
    
    // Limpiar directorio
    cleanDistDirectory();
    
    // Detectar plataforma
    const platform = detectCurrentPlatform();
    console.log(`🎯 Construyendo para: ${CONFIG.platforms[platform].name}`);
    console.log(`📋 Descripción: ${CONFIG.platforms[platform].description}\n`);
    
    // Ejecutar build
    await buildForPlatform(platform);
    
    // Verificar resultados
    const files = verifyBuilds();
    
    // Generar reporte
    const report = generateBuildReport(platform, files);
    
    // Mostrar resumen
    showFinalSummary(platform, files, report);
    
  } catch (error) {
    console.error('❌ ERROR EN BUILD:', error.message);
    console.error('');
    console.error('🔧 SOLUCIONES POSIBLES:');
    console.error('1. Verificar que todas las dependencias estén instaladas');
    console.error('2. Ejecutar: npm install');
    console.error('3. Verificar que electron-builder esté configurado correctamente');
    console.error('4. Verificar permisos de escritura en el directorio');
    console.error('');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  detectCurrentPlatform,
  formatBytes
};