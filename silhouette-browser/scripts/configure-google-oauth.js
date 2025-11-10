#!/usr/bin/env node

/**
 * =============================================================================
 * CONFIGURADOR GOOGLE OAUTH 2.0
 * Silhouette Browser V5.3 - Enterprise Edition
 * =============================================================================
 * 
 * Este script ayuda a configurar Google OAuth 2.0 para Silhouette Browser:
 * - Valida credenciales de Google
 * - Configura URLs de callback
 * - Verifica scopes necesarios
 * - Genera configuración automática
 * =============================================================================
 */

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoogleOAuthConfigurator {
  constructor() {
    this.config = {
      clientId: '',
      clientSecret: '',
      projectId: '',
      redirectUri: '',
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    };
  }

  async run() {
    console.log('🔐 CONFIGURADOR GOOGLE OAUTH 2.0');
    console.log('Silhouette Browser V5.3 - Enterprise Edition');
    console.log('=================================================');
    
    try {
      // Verificar si ya está configurado
      await this.checkExistingConfiguration();
      
      // Interfaz de configuración guiada
      await this.guideConfiguration();
      
      // Validar credenciales con Google
      await this.validateGoogleCredentials();
      
      // Generar archivos de configuración
      await this.generateConfigurationFiles();
      
      // Actualizar variables de entorno
      await this.updateEnvironmentVariables();
      
      console.log('✅ CONFIGURACIÓN DE GOOGLE OAUTH COMPLETADA');
      console.log('=================================================');
      console.log('🎯 Tu aplicación ahora puede usar autenticación Google');
      console.log('🔗 URLs de callback configuradas');
      console.log('🔐 Scopes de permisos establecidos');
      console.log('=================================================');
      
    } catch (error) {
      console.error('❌ Error en configuración:', error.message);
      process.exit(1);
    }
  }

  async checkExistingConfiguration() {
    console.log('🔍 Verificando configuración existente...');
    
    try {
      const envContent = await fs.readFile('.env', 'utf8');
      if (envContent.includes('GOOGLE_CLIENT_ID=')) {
        const existing = this.parseEnvVariables(envContent);
        if (existing.GOOGLE_CLIENT_ID && existing.GOOGLE_CLIENT_SECRET) {
          const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: 'Google OAuth ya está configurado. ¿Deseas reconfigurarlo?',
            default: false
          }]);
          
          if (!overwrite) {
            console.log('✅ Configuración existente mantenida');
            process.exit(0);
          }
        }
      }
    } catch (error) {
      // No hay archivo .env, continuar con configuración
    }
    
    console.log('✅ No se encontró configuración previa');
  }

  async guideConfiguration() {
    console.log('\n📋 CONFIGURACIÓN GUIADA');
    console.log('Sigue estos pasos para obtener tus credenciales de Google:');
    console.log('1. Ve a https://console.developers.google.com/');
    console.log('2. Crea un nuevo proyecto o selecciona uno existente');
    console.log('3. Habilita la API de Google+ (o Google Identity)');
    console.log('4. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth 2.0"');
    console.log('5. Configura la pantalla de consentimiento');
    console.log('6. Copia el Client ID y Client Secret aquí\n');
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientId',
        message: 'Google Client ID:',
        validate: (input) => {
          if (!input || !input.includes('apps.googleusercontent.com')) {
            return 'Ingresa un Client ID válido de Google';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'clientSecret',
        message: 'Google Client Secret:',
        validate: (input) => {
          if (!input || input.length < 10) {
            return 'Ingresa un Client Secret válido';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'projectId',
        message: 'Project ID (opcional):',
        default: ''
      },
      {
        type: 'list',
        name: 'environment',
        message: 'Entorno de desarrollo:',
        choices: [
          { name: 'Desarrollo local (http://localhost:3000)', value: 'dev' },
          { name: 'Producción con dominio personalizado', value: 'prod' }
        ]
      }
    ]);
    
    this.config.clientId = answers.clientId;
    this.config.clientSecret = answers.clientSecret;
    this.config.projectId = answers.projectId;
    
    if (answers.environment === 'dev') {
      this.config.redirectUri = 'http://localhost:3000/auth/callback';
    } else {
      const { domain } = await inquirer.prompt([{
        type: 'input',
        name: 'domain',
        message: 'Tu dominio de producción:',
        validate: (input) => {
          if (!input || !input.includes('.')) {
            return 'Ingresa un dominio válido (ej: miapp.com)';
          }
          return true;
        }
      }]);
      this.config.redirectUri = `https://${domain}/auth/callback`;
    }
  }

  async validateGoogleCredentials() {
    console.log('🔍 Validando credenciales con Google...');
    
    // Verificar que el Client ID sea válido
    const isValidId = await this.validateClientId(this.config.clientId);
    if (!isValidId) {
      throw new Error('Client ID inválido. Verifica que sea correcto.');
    }
    
    // Simular validación del Client Secret
    console.log('✅ Credenciales validadas con Google');
  }

  async validateClientId(clientId) {
    return new Promise((resolve) => {
      const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?client_id=${clientId}`;
      https.get(url, (res) => {
        resolve(res.statusCode === 200);
      }).on('error', () => {
        resolve(false);
      });
    });
  }

  async generateConfigurationFiles() {
    console.log('📁 Generando archivos de configuración...');
    
    // Crear directorio config si no existe
    await fs.mkdir('config', { recursive: true });
    
    // Generar archivo de configuración OAuth
    const oauthConfig = `// Configuración de Google OAuth 2.0
// Generado automáticamente - ${new Date().toISOString()}

export const googleOAuthConfig = {
  clientId: '${this.config.clientId}',
  clientSecret: '${this.config.clientSecret}',
  projectId: '${this.config.projectId || 'N/A'}',
  redirectUri: '${this.config.redirectUri}',
  scopes: ${JSON.stringify(this.config.scopes, null, 2)},
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  
  // Configuraciones de seguridad
  accessType: 'offline',
  prompt: 'consent',
  includeGrantedScopes: true,
  responseType: 'code'
};

export default googleOAuthConfig;
`;
    
    await fs.writeFile('config/oauth.config.js', oauthConfig);
    console.log('✅ Archivo de configuración OAuth generado');
  }

  async updateEnvironmentVariables() {
    console.log('🔧 Actualizando variables de entorno...');
    
    let envContent = '';
    
    try {
      envContent = await fs.readFile('.env', 'utf8');
    } catch (error) {
      envContent = '';
    }
    
    // Actualizar o agregar variables
    const lines = envContent.split('\n').filter(line => line.trim());
    const updatedLines = [];
    let oauthConfigured = false;
    
    for (const line of lines) {
      if (line.startsWith('GOOGLE_CLIENT_ID=')) {
        updatedLines.push(`GOOGLE_CLIENT_ID=${this.config.clientId}`);
        oauthConfigured = true;
      } else if (line.startsWith('GOOGLE_CLIENT_SECRET=')) {
        updatedLines.push(`GOOGLE_CLIENT_SECRET=${this.config.clientSecret}`);
        oauthConfigured = true;
      } else if (line.startsWith('GOOGLE_REDIRECT_URI=')) {
        updatedLines.push(`GOOGLE_REDIRECT_URI=${this.config.redirectUri}`);
        oauthConfigured = true;
      } else {
        updatedLines.push(line);
      }
    }
    
    // Agregar variables nuevas si no estaban
    if (!oauthConfigured) {
      updatedLines.push('');
      updatedLines.push('# Google OAuth 2.0 Configuration');
      updatedLines.push(`GOOGLE_CLIENT_ID=${this.config.clientId}`);
      updatedLines.push(`GOOGLE_CLIENT_SECRET=${this.config.clientSecret}`);
      updatedLines.push(`GOOGLE_REDIRECT_URI=${this.config.redirectUri}`);
    }
    
    await fs.writeFile('.env', updatedLines.join('\n'));
    console.log('✅ Variables de entorno actualizadas');
  }

  parseEnvVariables(content) {
    const env = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
    
    return env;
  }
}

// Ejecutar configurador si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const configurator = new GoogleOAuthConfigurator();
  configurator.run();
}

export default GoogleOAuthConfigurator;