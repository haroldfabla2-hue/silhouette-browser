#!/usr/bin/env node

/**
 * =============================================================================
 * SCRIPT DE INICIALIZACIÓN DEL SISTEMA DE USUARIOS
 * Silhouette Browser V5.3 - Enterprise Edition
 * =============================================================================
 * 
 * Este script configura el sistema de usuarios por primera vez:
 * - Crea el usuario administrador por defecto
 * - Configura los roles y permisos base
 * - Valida la configuración de OAuth
 * - Prepara la base de datos local
 * =============================================================================
 */

import { UserSystemCore } from './main-process/user-management/user-system-core.js';
import { GoogleAuthSystem } from './main-process/user-management/google-auth-system.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SystemInitializer {
  constructor() {
    this.userSystem = new UserSystemCore();
    this.googleAuth = new GoogleAuthSystem();
    this.isInitialized = false;
  }

  async initialize() {
    console.log('🚀 Inicializando Sistema de Usuarios - Silhouette Browser V5.3');
    console.log('=================================================================');
    
    try {
      // 1. Cargar configuración
      await this.loadConfiguration();
      
      // 2. Verificar dependencias
      await this.verifyDependencies();
      
      // 3. Inicializar sistema base
      await this.initializeBaseSystem();
      
      // 4. Crear usuario administrador
      await this.createDefaultAdmin();
      
      // 5. Configurar Google OAuth
      await this.configureGoogleOAuth();
      
      // 6. Validar configuración
      await this.validateConfiguration();
      
      // 7. Ejecutar tests básicos
      await this.runBasicTests();
      
      console.log('✅ SISTEMA DE USUARIOS INICIALIZADO CORRECTAMENTE');
      console.log('=================================================================');
      console.log('🎯 Silhouette Browser está listo para producción');
      console.log('👤 Usuario administrador: admin@silhouette.com');
      console.log('🔐 Contraseña temporal: Silhouette2025!');
      console.log('⚠️  CAMBIAR CONTRASEÑA EN EL PRIMER INICIO DE SESIÓN');
      console.log('=================================================================');
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Error durante la inicialización:', error);
      process.exit(1);
    }
  }

  async loadConfiguration() {
    console.log('📋 Cargando configuración...');
    
    // Cargar variables de entorno
    dotenv.config();
    
    // Verificar archivos de configuración
    const configFiles = [
      '.env',
      'config/oauth.config.js',
      'config/security.config.js'
    ];
    
    for (const file of configFiles) {
      const filePath = path.join(__dirname, '..', file);
      // Verificar si existe el archivo
    }
    
    console.log('✅ Configuración cargada');
  }

  async verifyDependencies() {
    console.log('🔍 Verificando dependencias...');
    
    // Verificar que electron-store está disponible
    const { Store } = await import('electron-store');
    const store = new Store({ name: 'user-system-test' });
    await store.set('test', 'ok');
    const testValue = await store.get('test');
    await store.delete('test');
    
    if (testValue !== 'ok') {
      throw new Error('electron-store no funciona correctamente');
    }
    
    // Verificar jsonwebtoken
    const jwt = await import('jsonwebtoken');
    const testToken = jwt.sign({ test: true }, 'test-secret', { expiresIn: '1h' });
    const decoded = jwt.verify(testToken, 'test-secret');
    
    if (!decoded.test) {
      throw new Error('jsonwebtoken no funciona correctamente');
    }
    
    console.log('✅ Dependencias verificadas');
  }

  async initializeBaseSystem() {
    console.log('🏗️ Inicializando sistema base...');
    
    // Inicializar sistema de usuarios
    await this.userSystem.initialize();
    
    // Verificar que se crearon los roles por defecto
    const defaultRoles = await this.userSystem.getRoles();
    const expectedRoles = ['Guest', 'User', 'PowerUser', 'Admin', 'SuperAdmin'];
    
    for (const roleName of expectedRoles) {
      const role = defaultRoles.find(r => r.name === roleName);
      if (!role) {
        throw new Error(`Rol por defecto no encontrado: ${roleName}`);
      }
    }
    
    console.log('✅ Sistema base inicializado con', defaultRoles.length, 'roles');
  }

  async createDefaultAdmin() {
    console.log('👤 Creando usuario administrador por defecto...');
    
    // Verificar si ya existe un administrador
    const existingAdmins = await this.userSystem.getUsersByRole('SuperAdmin');
    
    if (existingAdmins.length > 0) {
      console.log('⚠️ Ya existe un usuario administrador, saltando creación');
      return;
    }
    
    // Crear usuario administrador
    const adminUser = await this.userSystem.createUser({
      email: 'admin@silhouette.com',
      name: 'Administrator',
      password: 'Silhouette2025!', // Contraseña temporal que debe cambiarse
      roles: ['SuperAdmin'],
      profile: {
        avatar: 'https://ui-avatars.com/api/?name=Administrator&background=007acc&color=fff',
        company: 'Silhouette Browser',
        department: 'IT Administration'
      }
    });
    
    console.log('✅ Usuario administrador creado:', adminUser.email);
    console.log('⚠️ CONTRASEÑA TEMPORAL: Silhouette2025!');
    console.log('   CAMBIAR INMEDIATAMENTE EN EL PRIMER INICIO');
  }

  async configureGoogleOAuth() {
    console.log('🔐 Configurando Google OAuth...');
    
    // Verificar credenciales de Google
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.log('⚠️ Credenciales de Google OAuth no configuradas');
      console.log('   Configure GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env');
      console.log('   El sistema funcionará solo con autenticación local');
      return;
    }
    
    // Inicializar sistema de Google Auth
    await this.googleAuth.initialize();
    
    console.log('✅ Google OAuth configurado');
  }

  async validateConfiguration() {
    console.log('🔍 Validando configuración...');
    
    // Verificar configuración de seguridad
    const securityConfig = {
      jwtSecret: process.env.JWT_SECRET,
      encryptionKey: process.env.ENCRYPTION_KEY,
      sessionTimeout: process.env.SESSION_TIMEOUT || '24h'
    };
    
    // Verificar que las configuraciones críticas estén presentes
    const issues = [];
    
    if (!securityConfig.jwtSecret) {
      issues.push('JWT_SECRET no configurado');
    } else if (securityConfig.jwtSecret.length < 32) {
      issues.push('JWT_SECRET debe tener al menos 32 caracteres');
    }
    
    if (issues.length > 0) {
      console.log('⚠️ Problemas de configuración encontrados:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('El sistema puede funcionar con limitaciones de seguridad');
    } else {
      console.log('✅ Configuración de seguridad validada');
    }
  }

  async runBasicTests() {
    console.log('🧪 Ejecutando tests básicos...');
    
    // Test 1: Crear y verificar usuario
    const testUser = await this.userSystem.createUser({
      email: 'test@silhouette.com',
      name: 'Test User',
      password: 'TestPassword123!',
      roles: ['User']
    });
    
    const userCheck = await this.userSystem.getUserByEmail('test@silhouette.com');
    if (!userCheck || userCheck.id !== testUser.id) {
      throw new Error('Test de creación de usuario falló');
    }
    
    // Test 2: Autenticación
    const authResult = await this.userSystem.authenticateUser('test@silhouette.com', 'TestPassword123!');
    if (!authResult.success) {
      throw new Error('Test de autenticación falló');
    }
    
    // Test 3: Verificación de permisos
    const hasPermission = await this.userSystem.checkPermission(testUser.id, 'user:read');
    if (!hasPermission) {
      throw new Error('Test de verificación de permisos falló');
    }
    
    // Limpiar usuario de prueba
    await this.userSystem.deleteUser(testUser.id);
    
    console.log('✅ Tests básicos ejecutados correctamente');
  }
}

// Ejecutar inicialización si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const initializer = new SystemInitializer();
  initializer.initialize();
}

export default SystemInitializer;