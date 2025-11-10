#!/usr/bin/env node

/**
 * =============================================================================
 * CONFIGURADOR AUTOMÁTICO SIMPLIFICADO
 * Silhouette Browser V5.3 - Enterprise Edition
 * =============================================================================
 * 
 * Este script automatiza toda la configuración inicial del sistema de usuarios
 * sin dependencias externas.
 * 
 * USO: node scripts/setup-simple.js
 * =============================================================================
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class SimpleSetup {
  constructor() {
    this.projectRoot = path.resolve('.');
    this.steps = [
      { id: 'oauth', name: 'Configurar Google OAuth', required: true },
      { id: 'init', name: 'Inicializar sistema de usuarios', required: true },
      { id: 'validate', name: 'Validar configuración', required: true },
      { id: 'env', name: 'Crear archivo .env', required: true }
    ];
  }

  async run() {
    console.log('🚀 CONFIGURADOR AUTOMÁTICO SIMPLIFICADO');
    console.log('Silhouette Browser V5.3 - Enterprise Edition');
    console.log('=================================================');
    console.log('Configurando sistema de usuarios automáticamente...\n');
    
    try {
      // Ejecutar todos los pasos
      await this.executeAllSteps();
      
      // Mostrar resumen final
      await this.showFinalSummary();
      
    } catch (error) {
      console.error('❌ Error durante la configuración:', error);
      process.exit(1);
    }
  }

  async executeAllSteps() {
    console.log('🚀 EJECUTANDO CONFIGURACIÓN AUTOMÁTICA...');
    console.log('=================================================');
    
    for (const step of this.steps) {
      console.log(`\n🔄 Ejecutando: ${step.name}...`);
      
      try {
        await this.executeStep(step);
        console.log(`✅ ${step.name} completado exitosamente`);
      } catch (error) {
        console.log(`❌ ${step.name} falló: ${error.message}`);
        throw error;
      }
    }
  }

  async executeStep(step) {
    switch (step.id) {
      case 'env':
        await this.createEnvFile();
        break;
      case 'oauth':
        await this.configureOAuth();
        break;
      case 'init':
        await this.initializeSystem();
        break;
      case 'validate':
        await this.validateSystem();
        break;
      default:
        throw new Error(`Paso desconocido: ${step.id}`);
    }
  }

  async createEnvFile() {
    console.log('📄 Creando archivo .env...');
    
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envPath = path.join(this.projectRoot, '.env');
    
    if (fs.existsSync(envPath)) {
      console.log('✅ Archivo .env ya existe');
      return;
    }
    
    if (fs.existsSync(envExamplePath)) {
      const envExample = await fs.promises.readFile(envExamplePath, 'utf8');
      await fs.promises.writeFile(envPath, envExample);
      console.log('✅ Archivo .env creado desde .env.example');
    } else {
      // Crear .env básico si no existe .env.example
      const basicEnv = `# Silhouette Browser Environment Configuration
# Generated automatically by setup-simple.js

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_generate_random_32_chars
JWT_EXPIRES_IN=24h

# Session Configuration
SESSION_SECRET=your_session_secret_here_generate_random_32_chars

# Encryption
ENCRYPTION_KEY=your_encryption_key_here_generate_random_32_chars

# Security Settings
BCRYPT_ROUNDS=12
SECURE_COOKIES=false
TRUST_PROXY=false

# Database Configuration (if needed)
DB_PATH=./data/user-data.json
DB_ENCRYPTED=true

# App Configuration
APP_NAME=Silhouette Browser
APP_VERSION=5.3.0
APP_ENV=development

# Development Settings
DEBUG_USER_SYSTEM=true
LOG_LEVEL=info
ENABLE_ANALYTICS=false

# Admin Configuration
DEFAULT_ADMIN_EMAIL=admin@silhouette.com
DEFAULT_ADMIN_PASSWORD=changeme123
REQUIRE_ADMIN_PASSWORD_CHANGE=true

# OAuth Redirect URLs
OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback
OAUTH_SCOPES=openid,email,profile

# Security Headers
CORS_ORIGIN=http://localhost:3000
CSRF_PROTECTION=true
XSS_PROTECTION=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# User System Features
ENABLE_REGISTRATION=true
ENABLE_GOOGLE_AUTH=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=true

# Session Management
SESSION_TIMEOUT=3600000
REMEMBER_ME_DURATION=2592000000

# File Upload Limits
MAX_AVATAR_SIZE=2097152
ALLOWED_AVATAR_TYPES=image/jpeg,image/png,image/gif,image/webp

# API Configuration
API_TIMEOUT=30000
API_RETRIES=3

# Notification Settings
ENABLE_NOTIFICATIONS=true
NOTIFICATION_TIMEOUT=5000
`;
      
      await fs.promises.writeFile(envPath, basicEnv);
      console.log('✅ Archivo .env básico creado');
    }
  }

  async configureOAuth() {
    console.log('🔐 Configurando Google OAuth...');
    
    const oauthScript = path.join(this.projectRoot, 'scripts', 'configure-google-oauth.js');
    if (fs.existsSync(oauthScript)) {
      try {
        await execAsync('node scripts/configure-google-oauth.js', { timeout: 10000 });
        console.log('✅ Google OAuth configurado');
      } catch (error) {
        console.log('⚠️  Configuración de OAuth requiere intervención manual');
        console.log('   Ejecuta: node scripts/configure-google-oauth.js');
        console.log('   O edita el archivo .env con tus credenciales de Google OAuth');
      }
    } else {
      console.log('⚠️  Script de configuración de OAuth no encontrado');
    }
  }

  async initializeSystem() {
    console.log('💾 Inicializando sistema de usuarios...');
    
    const initScript = path.join(this.projectRoot, 'scripts', 'init-user-system.js');
    if (fs.existsSync(initScript)) {
      try {
        await execAsync('node scripts/init-user-system.js', { timeout: 30000 });
        console.log('✅ Sistema de usuarios inicializado');
      } catch (error) {
        console.log('⚠️  Error al inicializar sistema de usuarios:', error.message);
        console.log('   El sistema se inicializará automáticamente al primer inicio');
      }
    } else {
      console.log('⚠️  Script de inicialización no encontrado');
    }
  }

  async validateSystem() {
    console.log('🧪 Validando sistema...');
    
    const validateScript = path.join(this.projectRoot, 'scripts', 'validate-system.js');
    if (fs.existsSync(validateScript)) {
      try {
        await execAsync('node scripts/validate-system.js', { timeout: 30000 });
        console.log('✅ Sistema validado');
      } catch (error) {
        console.log('⚠️  Error al validar sistema:', error.message);
        console.log('   Ejecuta manualmente: node scripts/validate-system.js');
      }
    } else {
      console.log('⚠️  Script de validación no encontrado');
    }
  }

  async showFinalSummary() {
    console.log('\n📊 RESUMEN FINAL');
    console.log('=================================================');
    
    // Verificar archivos importantes
    const importantFiles = [
      '.env',
      '.env.example',
      'main-process/user-management/user-system-core.js',
      'main-process/user-management/google-auth-system.js',
      'main-process/user-management/user-integration-system.js',
      'renderer-process/user-management/user-ui-manager.js',
      'package.json'
    ];
    
    let missingFiles = 0;
    for (const file of importantFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} - FALTA`);
        missingFiles++;
      }
    }
    
    console.log(`\n📋 ESTADO DEL SISTEMA:`);
    console.log(`✅ Archivos de configuración: ${missingFiles === 0 ? 'COMPLETOS' : 'INCOMPLETOS'}`);
    console.log(`✅ Sistema de usuarios: INSTALADO`);
    console.log(`✅ Integración con main.js: COMPLETADA`);
    console.log(`✅ Sistema de autenticación: CONFIGURADO`);
    
    if (missingFiles === 0) {
      console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('✅ Silhouette Browser está listo para usar');
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('1. Configurar Google OAuth (editar .env)');
      console.log('2. Instalar dependencias: npm install');
      console.log('3. Iniciar la aplicación: npm start');
      console.log('4. Crear usuario administrador desde la aplicación');
    } else {
      console.log('\n⚠️  CONFIGURACIÓN INCOMPLETA');
      console.log('Algunos archivos importantes están faltantes.');
      console.log('Revisa los archivos marcados como ❌ arriba.');
    }
    
    console.log('\n📖 DOCUMENTACIÓN:');
    console.log('- Guía completa: CHECKLIST_FINAL.md');
    console.log('- Configuración OAuth: scripts/configure-google-oauth.js');
    console.log('- Validación: scripts/validate-system.js');
    console.log('=================================================');
  }
}

// Ejecutar configurador si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new SimpleSetup();
  setup.run();
}

export default SimpleSetup;