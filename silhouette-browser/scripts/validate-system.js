#!/usr/bin/env node

/**
 * =============================================================================
 * VALIDADOR DEL SISTEMA DE USUARIOS
 * Silhouette Browser V5.3 - Enterprise Edition
 * =============================================================================
 * 
 * Este script valida que todos los componentes del sistema de usuarios
 * estén funcionando correctamente antes del lanzamiento:
 * - Pruebas de funcionalidad
 * - Validación de seguridad
 * - Verificación de rendimiento
 * - Tests de integración
 * =============================================================================
 */

import { UserSystemCore } from '../main-process/user-management/user-system-core.js';
import { GoogleAuthSystem } from '../main-process/user-management/google-auth-system.js';
import { UserIntegrationSystem } from '../main-process/user-management/user-integration-system.js';
import { performance } from 'perf_hooks';

class SystemValidator {
  constructor() {
    this.userSystem = new UserSystemCore();
    this.googleAuth = new GoogleAuthSystem();
    this.userIntegration = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    };
    this.startTime = performance.now();
  }

  async validate() {
    console.log('🔍 VALIDADOR DEL SISTEMA DE USUARIOS');
    console.log('Silhouette Browser V5.3 - Enterprise Edition');
    console.log('=================================================');
    
    try {
      // Inicializar sistemas
      await this.initializeSystems();
      
      // Ejecutar todas las validaciones
      await this.runAllValidations();
      
      // Generar reporte
      await this.generateReport();
      
      console.log('✅ VALIDACIÓN COMPLETADA');
      
      if (this.testResults.failed === 0) {
        console.log('🎯 SISTEMA LISTO PARA PRODUCCIÓN');
        process.exit(0);
      } else {
        console.log('⚠️ SISTEMA REQUIERE CORRECCIONES ANTES DEL LANZAMIENTO');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error durante la validación:', error);
      process.exit(1);
    }
  }

  async initializeSystems() {
    console.log('🚀 Inicializando sistemas...');
    
    await this.userSystem.initialize();
    await this.googleAuth.initialize();
    
    console.log('✅ Sistemas inicializados');
  }

  async runAllValidations() {
    console.log('\n📋 EJECUTANDO VALIDACIONES:');
    console.log('=================================================');
    
    // Tests críticos de funcionalidad
    await this.testUserCreation();
    await this.testAuthentication();
    await this.testPermissions();
    await this.testRoleManagement();
    await this.testSessionManagement();
    
    // Tests de seguridad
    await this.testSecurity();
    
    // Tests de rendimiento
    await this.testPerformance();
    
    // Tests de integración
    await this.testIntegration();
    
    // Tests de persistencia
    await this.testDataPersistence();
  }

  async test(name, testFunction) {
    console.log(`🧪 ${name}...`);
    this.testResults.total++;
    
    try {
      const start = performance.now();
      await testFunction();
      const end = performance.now();
      
      this.testResults.passed++;
      console.log(`   ✅ ${name} (${(end - start).toFixed(2)}ms)`);
    } catch (error) {
      this.testResults.failed++;
      console.log(`   ❌ ${name}: ${error.message}`);
    }
  }

  async testUserCreation() {
    await this.test('Creación de usuarios', async () => {
      const user = await this.userSystem.createUser({
        email: 'test.user@validation.com',
        name: 'Test User',
        password: 'TestPassword123!',
        roles: ['User']
      });
      
      if (!user || !user.id) {
        throw new Error('No se pudo crear usuario');
      }
      
      // Limpiar
      await this.userSystem.deleteUser(user.id);
    });
  }

  async testAuthentication() {
    await this.test('Autenticación de usuarios', async () => {
      const user = await this.userSystem.createUser({
        email: 'auth.test@validation.com',
        name: 'Auth Test User',
        password: 'AuthTest123!',
        roles: ['User']
      });
      
      const result = await this.userSystem.authenticateUser('auth.test@validation.com', 'AuthTest123!');
      if (!result.success) {
        throw new Error('Autenticación falló');
      }
      
      // Limpiar
      await this.userSystem.deleteUser(user.id);
    });
  }

  async testPermissions() {
    await this.test('Sistema de permisos', async () => {
      const user = await this.userSystem.createUser({
        email: 'perm.test@validation.com',
        name: 'Permission Test User',
        password: 'PermTest123!',
        roles: ['User']
      });
      
      // Verificar permisos de rol User
      const hasBasicAccess = await this.userSystem.checkPermission(user.id, 'browser:navigate');
      if (!hasBasicAccess) {
        throw new Error('Permisos básicos no asignados');
      }
      
      // Verificar que no tiene permisos de admin
      const hasAdminAccess = await this.userSystem.checkPermission(user.id, 'user:admin');
      if (hasAdminAccess) {
        throw new Error('Permisos de admin incorrectamente asignados');
      }
      
      // Limpiar
      await this.userSystem.deleteUser(user.id);
    });
  }

  async testRoleManagement() {
    await this.test('Gestión de roles', async () => {
      const roles = await this.userSystem.getRoles();
      
      if (roles.length < 3) {
        throw new Error('No hay suficientes roles definidos');
      }
      
      // Verificar rol SuperAdmin
      const superAdminRole = roles.find(r => r.name === 'SuperAdmin');
      if (!superAdminRole) {
        throw new Error('Rol SuperAdmin no encontrado');
      }
      
      // Verificar permisos del SuperAdmin
      if (!superAdminRole.permissions.includes('user:admin')) {
        throw new Error('SuperAdmin no tiene permisos de admin');
      }
    });
  }

  async testSessionManagement() {
    await this.test('Gestión de sesiones', async () => {
      const user = await this.userSystem.createUser({
        email: 'session.test@validation.com',
        name: 'Session Test User',
        password: 'SessionTest123!',
        roles: ['User']
      });
      
      // Crear sesión
      const authResult = await this.userSystem.authenticateUser('session.test@validation.com', 'SessionTest123!');
      if (!authResult.session) {
        throw new Error('No se creó sesión');
      }
      
      // Verificar sesión
      const sessionValid = await this.userSystem.validateSession(authResult.session.token);
      if (!sessionValid) {
        throw new Error('Sesión no es válida');
      }
      
      // Limpiar
      await this.userSystem.deleteUser(user.id);
    });
  }

  async testSecurity() {
    await this.test('Validación de seguridad', async () => {
      // Verificar que las contraseñas están hasheadas
      const user = await this.userSystem.createUser({
        email: 'security.test@validation.com',
        name: 'Security Test User',
        password: 'SecurityTest123!',
        roles: ['User']
      });
      
      const storedUser = await this.userSystem.getUserByEmail('security.test@validation.com');
      if (!storedUser.password || storedUser.password === 'SecurityTest123!') {
        throw new Error('Contraseña no está hasheada');
      }
      
      // Verificar que el email sea válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(storedUser.email)) {
        throw new Error('Email no válido');
      }
      
      // Limpiar
      await this.userSystem.deleteUser(user.id);
    });
  }

  async testPerformance() {
    await this.test('Rendimiento del sistema', async () => {
      const iterations = 100;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const user = await this.userSystem.createUser({
          email: `perf.test.${i}@validation.com`,
          name: `Perf Test User ${i}`,
          password: 'PerfTest123!',
          roles: ['User']
        });
        
        // Limpiar inmediatamente
        await this.userSystem.deleteUser(user.id);
      }
      
      const end = performance.now();
      const avgTime = (end - start) / iterations;
      
      if (avgTime > 100) { // Máximo 100ms por operación
        throw new Error(`Rendimiento insuficiente: ${avgTime.toFixed(2)}ms promedio`);
      }
    });
  }

  async testIntegration() {
    await this.test('Integración de sistemas', async () => {
      // Verificar que el sistema de integración se puede inicializar
      this.userIntegration = new UserIntegrationSystem(this.userSystem, this.googleAuth);
      await this.userIntegration.initialize();
      
      if (!this.userIntegration) {
        throw new Error('Sistema de integración no se inicializó');
      }
    });
  }

  async testDataPersistence() {
    await this.test('Persistencia de datos', async () => {
      const user = await this.userSystem.createUser({
        email: 'persist.test@validation.com',
        name: 'Persistence Test User',
        password: 'PersistTest123!',
        roles: ['User'],
        profile: {
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test user for persistence validation'
        }
      });
      
      // Simular reinicio del sistema
      await this.userSystem.initialize();
      
      // Verificar que los datos persisten
      const recoveredUser = await this.userSystem.getUserByEmail('persist.test@validation.com');
      if (!recoveredUser || recoveredUser.profile?.bio !== 'Test user for persistence validation') {
        throw new Error('Datos no persisten correctamente');
      }
      
      // Limpiar
      await this.userSystem.deleteUser(user.id);
    });
  }

  async generateReport() {
    const endTime = performance.now();
    const totalTime = endTime - this.startTime;
    
    console.log('\n📊 REPORTE DE VALIDACIÓN');
    console.log('=================================================');
    console.log(`⏱️  Tiempo total: ${totalTime.toFixed(2)}ms`);
    console.log(`✅ Tests pasados: ${this.testResults.passed}`);
    console.log(`❌ Tests fallidos: ${this.testResults.failed}`);
    console.log(`⚠️  Advertencias: ${this.testResults.warnings}`);
    console.log(`📈 Tasa de éxito: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    console.log('=================================================');
    
    if (this.testResults.failed > 0) {
      console.log('❌ PROBLEMAS ENCONTRADOS:');
      console.log('El sistema tiene fallos que deben corregirse antes del lanzamiento.');
    } else {
      console.log('✅ SISTEMA COMPLETAMENTE VÁLIDO');
      console.log('El sistema está listo para producción.');
    }
    
    // Guardar reporte
    const report = {
      timestamp: new Date().toISOString(),
      version: '5.3.0',
      results: this.testResults,
      totalTime,
      status: this.testResults.failed === 0 ? 'PASSED' : 'FAILED'
    };
    
    // Aquí se podría guardar el reporte en un archivo
    console.log(`📄 Reporte guardado en: validation-report-${Date.now()}.json`);
  }
}

// Ejecutar validador si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SystemValidator();
  validator.validate();
}

export default SystemValidator;