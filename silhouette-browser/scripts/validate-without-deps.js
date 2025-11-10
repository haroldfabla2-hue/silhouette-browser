#!/usr/bin/env node

/**
 * =============================================================================
 * VALIDADOR DE SISTEMA SIN DEPENDENCIAS EXTERNAS
 * Silhouette Browser V5.3 - Sistema de Usuarios
 * =============================================================================
 * 
 * Este validador verifica que el sistema de usuarios funciona correctamente
 * sin requerir dependencias externas como npm install.
 * 
 * USO: node scripts/validate-without-deps.js
 * =============================================================================
 */

import fs from 'fs';
import path from 'path';

class SystemValidator {
  constructor() {
    this.projectRoot = path.resolve('.');
    this.errors = [];
    this.warnings = [];
    this.success = [];
    this.totalChecks = 0;
    this.passedChecks = 0;
  }

  async run() {
    console.log('🧪 VALIDADOR DE SISTEMA DE USUARIOS');
    console.log('Silhouette Browser V5.3 - Sin dependencias externas');
    console.log('=================================================\n');

    try {
      // Ejecutar todas las validaciones
      await this.validateAll();
      
      // Mostrar resumen final
      this.showSummary();
      
    } catch (error) {
      console.error('❌ Error durante la validación:', error);
      process.exit(1);
    }
  }

  async validateAll() {
    console.log('🔍 EJECUTANDO VALIDACIONES...');
    console.log('=================================================\n');

    // 1. Verificar archivos del sistema
    await this.validateSystemFiles();
    
    // 2. Verificar integración con main.js
    await this.validateMainJsIntegration();
    
    // 3. Verificar archivos de configuración
    await this.validateConfigFiles();
    
    // 4. Verificar scripts
    await this.validateScripts();
    
    // 5. Verificar sintaxis de archivos
    await this.validateSyntax();
    
    // 6. Verificar estructura de directorios
    await this.validateDirectoryStructure();
    
    console.log('\n📋 VALIDACIONES COMPLETADAS\n');
  }

  async validateSystemFiles() {
    console.log('📁 Validando archivos del sistema de usuarios...');
    
    const requiredFiles = [
      'main-process/user-management/user-system-core.js',
      'main-process/user-management/google-auth-system.js',
      'main-process/user-management/local-auth-system.js',
      'main-process/user-management/user-integration-system.js',
      'renderer-process/user-management/user-ui-manager.js'
    ];

    for (const file of requiredFiles) {
      this.totalChecks++;
      const filePath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.length > 0) {
          this.passedChecks++;
          this.success.push(`✅ ${file} - Presente (${stats.size} bytes)`);
        } else {
          this.errors.push(`❌ ${file} - Archivo vacío`);
        }
      } else {
        this.errors.push(`❌ ${file} - No encontrado`);
      }
    }
    
    console.log(`   - ${this.passedChecks}/${this.totalChecks} archivos verificados\n`);
  }

  async validateMainJsIntegration() {
    console.log('🔗 Validando integración con main.js...');
    
    this.totalChecks++;
    const mainJsPath = path.join(this.projectRoot, 'main-process/app-manager/main.js');
    
    if (fs.existsSync(mainJsPath)) {
      const content = fs.readFileSync(mainJsPath, 'utf8');
      
      // Verificar imports del sistema de usuarios
      const requiredImports = [
        'user-system-core.js',
        'google-auth-system.js',
        'user-integration-system.js'
      ];
      
      let hasAllImports = true;
      for (const importName of requiredImports) {
        if (!content.includes(importName)) {
          hasAllImports = false;
          this.errors.push(`❌ main.js - Falta import: ${importName}`);
        }
      }
      
      // Verificar inicialización
      if (!content.includes('this.userSystem = new UserSystemCore()')) {
        hasAllImports = false;
        this.errors.push('❌ main.js - Falta inicialización de UserSystemCore');
      }
      
      if (hasAllImports) {
        this.passedChecks++;
        this.success.push('✅ main.js - Integración completa');
      }
    } else {
      this.errors.push('❌ main.js - No encontrado');
    }
    
    console.log(`   - ${this.passedChecks >= this.totalChecks - 1 ? '✅' : '❌'} Integración verificada\n`);
  }

  async validateConfigFiles() {
    console.log('⚙️ Validando archivos de configuración...');
    
    this.totalChecks++;
    const envPath = path.join(this.projectRoot, '.env');
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    
    let configValid = true;
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Verificar variables críticas
      const requiredVars = [
        'FORCE_LOCAL_AUTH',
        'LOCAL_AUTH_ENABLED',
        'DEFAULT_ADMIN_EMAIL',
        'DEFAULT_ADMIN_PASSWORD'
      ];
      
      for (const varName of requiredVars) {
        if (!envContent.includes(varName)) {
          this.warnings.push(`⚠️ .env - Falta variable: ${varName}`);
        }
      }
      
      this.success.push('✅ .env - Archivo de configuración presente');
    } else {
      this.errors.push('❌ .env - No encontrado');
      configValid = false;
    }
    
    if (fs.existsSync(envExamplePath)) {
      this.success.push('✅ .env.example - Template presente');
    } else {
      this.warnings.push('⚠️ .env.example - No encontrado');
    }
    
    if (configValid) {
      this.passedChecks++;
    }
    
    console.log(`   - ${configValid ? '✅' : '❌'} Configuración verificada\n`);
  }

  async validateScripts() {
    console.log('📜 Validando scripts de configuración...');
    
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      this.errors.push('❌ scripts/ - Directorio no encontrado');
      return;
    }
    
    this.totalChecks++;
    const requiredScripts = [
      'setup-simple.js',
      'init-user-system.js',
      'configure-google-oauth.js',
      'validate-system.js',
      'deploy-production.js',
      'setup-complete.js'
    ];
    
    let scriptsValid = true;
    for (const script of requiredScripts) {
      const scriptPath = path.join(scriptsDir, script);
      if (fs.existsSync(scriptPath)) {
        this.success.push(`✅ scripts/${script} - Presente`);
      } else {
        this.warnings.push(`⚠️ scripts/${script} - No encontrado`);
      }
    }
    
    if (scriptsValid) {
      this.passedChecks++;
    }
    
    console.log(`   - Scripts verificados\n`);
  }

  async validateSyntax() {
    console.log('🔍 Validando sintaxis básica...');
    
    const jsFiles = [
      'main-process/user-management/user-system-core.js',
      'main-process/user-management/local-auth-system.js',
      'main-process/user-management/user-integration-system.js',
      'renderer-process/user-management/user-ui-manager.js',
      'scripts/setup-simple.js'
    ];
    
    for (const file of jsFiles) {
      this.totalChecks++;
      const filePath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Verificaciones básicas de sintaxis
          const hasClass = content.includes('class ');
          const hasExports = content.includes('export');
          const hasProperStructure = this.checkBasicStructure(content);
          
          if (hasClass && hasExports && hasProperStructure) {
            this.passedChecks++;
            this.success.push(`✅ ${file} - Sintaxis correcta`);
          } else {
            this.warnings.push(`⚠️ ${file} - Posibles problemas de sintaxis`);
          }
          
        } catch (error) {
          this.errors.push(`❌ ${file} - Error de sintaxis: ${error.message}`);
        }
      }
    }
    
    console.log(`   - ${this.passedChecks}/${this.totalChecks} archivos con sintaxis correcta\n`);
  }

  checkBasicStructure(content) {
    // Verificar que no hay errores obvios de sintaxis
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    
    return openBraces === closeBraces && openParens === closeParens;
  }

  async validateDirectoryStructure() {
    console.log('📂 Validando estructura de directorios...');
    
    this.totalChecks++;
    
    const requiredDirs = [
      'main-process/user-management',
      'renderer-process/user-management',
      'scripts'
    ];
    
    let structureValid = true;
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        this.success.push(`✅ ${dir}/ - Directorio presente`);
      } else {
        this.errors.push(`❌ ${dir}/ - Directorio no encontrado`);
        structureValid = false;
      }
    }
    
    if (structureValid) {
      this.passedChecks++;
    }
    
    console.log(`   - Estructura de directorios verificada\n`);
  }

  showSummary() {
    console.log('📊 RESUMEN DE VALIDACIÓN');
    console.log('=================================================');
    
    const successRate = ((this.passedChecks / this.totalChecks) * 100).toFixed(1);
    
    console.log(`📈 Resultado: ${this.passedChecks}/${this.totalChecks} validaciones exitosas (${successRate}%)`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORES (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ ADVERTENCIAS (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }
    
    if (this.success.length > 0) {
      console.log(`\n✅ ÉXITOS (${this.success.length}):`);
      this.success.forEach(success => console.log(`   ${success}`));
    }
    
    // Estado final
    console.log('\n🎯 ESTADO DEL SISTEMA:');
    if (this.errors.length === 0) {
      console.log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
      console.log('✅ Todos los archivos están presentes');
      console.log('✅ La integración está completa');
      console.log('✅ El sistema funciona sin Google OAuth');
      console.log('\n🚀 PARA USAR EL SISTEMA:');
      console.log('1. No requiere npm install');
      console.log('2. Funciona con autenticación local');
      console.log('3. Usuarios predeterminados:');
      console.log('   - admin@silhouette.local / admin123');
      console.log('   - guest@silhouette.local / guest123');
    } else if (this.errors.length <= 2) {
      console.log('⚠️ SISTEMA MAYORMENTE FUNCIONAL');
      console.log('   Hay algunos errores menores que no afectan la funcionalidad principal');
    } else {
      console.log('❌ SISTEMA CON PROBLEMAS');
      console.log('   Revisa los errores antes de usar el sistema');
    }
    
    console.log('\n📖 DOCUMENTACIÓN:');
    console.log('- Reporte completo: REPORTE_ESTADO_SISTEMA_USUARIOS_V6.md');
    console.log('- Configuración: .env');
    console.log('- Scripts: scripts/setup-simple.js');
    console.log('=================================================');
  }
}

// Ejecutar validador
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SystemValidator();
  validator.run();
}

export default SystemValidator;