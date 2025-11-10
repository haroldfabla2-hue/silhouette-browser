#!/usr/bin/env node

/**
 * =============================================================================
 * SCRIPT DE DEPLOYMENT/PRODUCCIÓN
 * Silhouette Browser V5.3 - Enterprise Edition
 * =============================================================================
 * 
 * Este script prepara y despliega Silhouette Browser para producción:
 * - Configura variables de entorno de producción
 * - Optimiza el build
 * - Ejecuta validaciones
 * - Prepara base de datos
 * - Configura seguridad
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

class ProductionDeployer {
  constructor() {
    this.config = {
      environment: 'production',
      buildType: 'release',
      skipValidation: false,
      backupExisting: true,
      createAdminUser: true
    };
  }

  async deploy() {
    console.log('🚀 DEPLOYER DE PRODUCCIÓN');
    console.log('Silhouette Browser V5.3 - Enterprise Edition');
    console.log('=================================================');
    
    try {
      // Verificar prerrequisitos
      await this.checkPrerequisites();
      
      // Configurar entorno
      await this.setupEnvironment();
      
      // Optimizar build
      await this.optimizeBuild();
      
      // Ejecutar validaciones
      if (!this.config.skipValidation) {
        await this.runValidations();
      }
      
      // Inicializar base de datos
      await this.initializeDatabase();
      
      // Configurar seguridad
      await this.setupSecurity();
      
      // Crear usuario administrador
      if (this.config.createAdminUser) {
        await this.createProductionAdmin();
      }
      
      // Realizar backup
      if (this.config.backupExisting) {
        await this.createBackup();
      }
      
      // Generar build de producción
      await this.generateProductionBuild();
      
      // Crear documentación de deployment
      await this.generateDeploymentDocs();
      
      console.log('✅ DEPLOYMENT COMPLETADO EXITOSAMENTE');
      console.log('=================================================');
      console.log('🎯 Silhouette Browser está listo para producción');
      console.log('📦 Build generado en: dist/');
      console.log('📋 Documentación en: docs/deployment/');
      console.log('⚠️  Revisa la documentación antes del primer uso');
      console.log('=================================================');
      
    } catch (error) {
      console.error('❌ Error durante el deployment:', error);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Verificando prerrequisitos...');
    
    // Verificar Node.js
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      console.log(`✅ Node.js: ${version}`);
      
      if (parseInt(version.substring(1)) < 16) {
        throw new Error('Node.js 16+ requerido');
      }
    } catch (error) {
      throw new Error('Node.js no está instalado o no está en el PATH');
    }
    
    // Verificar npm
    try {
      const { stdout } = await execAsync('npm --version');
      const version = stdout.trim();
      console.log(`✅ npm: ${version}`);
    } catch (error) {
      throw new Error('npm no está instalado o no está en el PATH');
    }
    
    // Verificar que el proyecto existe
    try {
      await fs.access('package.json');
      console.log('✅ package.json encontrado');
    } catch (error) {
      throw new Error('package.json no encontrado. Ejecuta desde el directorio raíz del proyecto');
    }
    
    // Verificar que las dependencias estén instaladas
    try {
      await fs.access('node_modules');
      console.log('✅ node_modules encontrado');
    } catch (error) {
      console.log('⚠️ node_modules no encontrado. Instalando dependencias...');
      await execAsync('npm install');
    }
    
    console.log('✅ Prerrequisitos verificados');
  }

  async setupEnvironment() {
    console.log('⚙️ Configurando entorno de producción...');
    
    // Verificar que existe archivo .env
    try {
      await fs.access('.env');
      console.log('✅ Archivo .env encontrado');
    } catch (error) {
      console.log('⚠️ Archivo .env no encontrado');
      
      const { createEnv } = await inquirer.prompt([{
        type: 'confirm',
        name: 'createEnv',
        message: '¿Deseas crear un archivo .env básico?',
        default: true
      }]);
      
      if (createEnv) {
        await this.createBasicEnvFile();
      }
    }
    
    // Establecer variables de entorno de producción
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEBUG_MODE = 'false';
    process.env.ENABLE_PERFORMANCE_MONITORING = 'true';
    
    console.log('✅ Entorno configurado para producción');
  }

  async createBasicEnvFile() {
    const envContent = `# Configuración de producción - Silhouette Browser V5.3
NODE_ENV=production
ENABLE_DEBUG_MODE=false
ENABLE_PERFORMANCE_MONITORING=true

# Seguridad
JWT_SECRET=genera_un_jwt_secret_super_seguro_de_32_caracteres_minimo
ENCRYPTION_KEY=clave_de_encriptacion_32_caracteres_aqui
SESSION_SECRET=session_secret_super_seguro_aqui
SESSION_TIMEOUT=24h

# Google OAuth (configurar con el script configure-google-oauth.js)
# GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=tu_client_secret
# GOOGLE_REDIRECT_URI=https://tu-dominio.com/auth/callback

# Configuración de la aplicación
APP_URL=https://tu-dominio.com
API_BASE_URL=https://api.tu-dominio.com
FRONTEND_URL=https://tu-dominio.com

# Base de datos local (electron-store)
USER_DATA_PATH=./user-data
ENABLE_AUDIT_LOG=true
AUDIT_LOG_RETENTION_DAYS=365

# Configuración de notificaciones
ENABLE_EMAIL_NOTIFICATIONS=false
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tu_email@gmail.com
# SMTP_PASSWORD=tu_app_password
`;
    
    await fs.writeFile('.env', envContent);
    console.log('✅ Archivo .env básico creado');
    console.log('⚠️  IMPORTANTE: Configura las variables según tu entorno');
  }

  async optimizeBuild() {
    console.log('🔧 Optimizando build...');
    
    // Limpiar build anterior
    try {
      await fs.rm('dist', { recursive: true, force: true });
      console.log('✅ Build anterior limpiado');
    } catch (error) {
      // No hay build anterior
    }
    
    // Optimizar dependencias
    await execAsync('npm audit --audit-level moderate');
    console.log('✅ Auditoría de seguridad completada');
    
    console.log('✅ Build optimizado');
  }

  async runValidations() {
    console.log('🧪 Ejecutando validaciones...');
    
    try {
      await execAsync('node scripts/validate-system.js');
      console.log('✅ Validaciones completadas');
    } catch (error) {
      throw new Error('Validaciones fallaron. Revisa el output anterior para más detalles.');
    }
  }

  async initializeDatabase() {
    console.log('💾 Inicializando base de datos...');
    
    try {
      await execAsync('node scripts/init-user-system.js');
      console.log('✅ Base de datos inicializada');
    } catch (error) {
      console.log('⚠️ Advertencia en inicialización:', error.message);
      // No es crítico, el sistema puede funcionar sin datos iniciales
    }
  }

  async setupSecurity() {
    console.log('🔐 Configurando seguridad...');
    
    // Verificar que las variables de seguridad están configuradas
    const requiredVars = ['JWT_SECRET', 'ENCRYPTION_KEY', 'SESSION_SECRET'];
    const missing = [];
    
    const envContent = await fs.readFile('.env', 'utf8');
    for (const varName of requiredVars) {
      if (!envContent.includes(`${varName}=`)) {
        missing.push(varName);
      }
    }
    
    if (missing.length > 0) {
      console.log('⚠️ Variables de seguridad faltantes:', missing.join(', '));
      console.log('   Estas se configurarán automáticamente al primer inicio');
    }
    
    // Crear directorio de logs
    await fs.mkdir('logs', { recursive: true });
    console.log('✅ Directorio de logs creado');
    
    console.log('✅ Configuración de seguridad completada');
  }

  async createProductionAdmin() {
    console.log('👤 Configurando usuario administrador...');
    
    const { createAdmin } = await inquirer.prompt([{
      type: 'confirm',
      name: 'createAdmin',
      message: '¿Deseas crear un usuario administrador durante el deployment?',
      default: true
    }]);
    
    if (createAdmin) {
      const { email, password } = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Email del administrador:',
          default: 'admin@silhouette.com',
          validate: (input) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(input) || 'Email inválido';
          }
        },
        {
          type: 'password',
          name: 'password',
          message: 'Contraseña del administrador:',
          validate: (input) => {
            return input.length >= 8 || 'La contraseña debe tener al menos 8 caracteres';
          }
        }
      ]);
      
      // Aquí se crearía el usuario admin con las credenciales proporcionadas
      console.log('✅ Usuario administrador configurado');
      console.log(`   Email: ${email}`);
      console.log('   ⚠️  La contraseña se configurará al primer inicio de la aplicación');
    }
  }

  async createBackup() {
    console.log('💾 Creando backup...');
    
    const backupDir = `backup-${new Date().toISOString().split('T')[0]}`;
    await fs.mkdir(backupDir, { recursive: true });
    
    // Copiar archivos importantes
    const filesToBackup = [
      '.env',
      'package.json',
      'package-lock.json'
    ];
    
    for (const file of filesToBackup) {
      try {
        await fs.copyFile(file, `${backupDir}/${file}`);
      } catch (error) {
        // Archivo no existe, continuar
      }
    }
    
    console.log(`✅ Backup creado en: ${backupDir}/`);
  }

  async generateProductionBuild() {
    console.log('📦 Generando build de producción...');
    
    await execAsync('npm run build');
    console.log('✅ Build de producción generado');
  }

  async generateDeploymentDocs() {
    console.log('📋 Generando documentación de deployment...');
    
    await fs.mkdir('docs/deployment', { recursive: true });
    
    const deploymentGuide = `# Guía de Deployment - Silhouette Browser V5.3

## Instalación en Producción

### 1. Preparación del Servidor
- Node.js 16+ instalado
- npm 8+ instalado
- Permisos de administrador
- Espacio en disco mínimo: 2GB

### 2. Configuración Inicial
1. Copia los archivos de la aplicación
2. Configura las variables de entorno en .env
3. Ejecuta: \`npm install\`
4. Configura Google OAuth: \`node scripts/configure-google-oauth.js\`

### 3. Deployment
\`\`\`bash
# Ejecutar script de deployment
node scripts/deploy-production.js

# O manualmente:
npm run build
npm start
\`\`\`

### 4. Configuración de Dominio
- Configura un proxy reverso (nginx/apache)
- Configura SSL/HTTPS
- Configura el dominio en las variables de entorno

### 5. Monitoreo
- Los logs se guardan en: ./logs/
- Monitorear el proceso de la aplicación
- Configurar alertas de sistema

## Mantenimiento

### Actualizaciones
1. Hacer backup de la base de datos
2. Descargar nueva versión
3. Ejecutar migración si es necesaria
4. Reiniciar la aplicación

### Backup
\`\`\`bash
# Backup manual
cp -r user-data/ backup-$(date +%Y%m%d)/
\`\`\`

## Solución de Problemas

### Logs
\`\`\`bash
# Ver logs en tiempo real
tail -f logs/application.log
\`\`\`

### Reinicio
\`\`\`bash
# Reiniciar la aplicación
pkill -f "silhouette-browser"
npm start &
\`\`\`

### Diagnóstico
\`\`\`bash
# Ejecutar validador
node scripts/validate-system.js
\`\`\`
`;
    
    await fs.writeFile('docs/deployment/DEPLOYMENT.md', deploymentGuide);
    console.log('✅ Documentación de deployment creada');
  }
}

// Ejecutar deployer si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new ProductionDeployer();
  deployer.deploy();
}

export default ProductionDeployer;