#!/usr/bin/env node

/**
 * =============================================================================
 * CONFIGURADOR AUTOMÁTICO COMPLETO
 * Silhouette Browser V5.3 - Enterprise Edition
 * =============================================================================
 * 
 * Este script automatiza toda la configuración inicial del sistema de usuarios:
 * - Configura Google OAuth automáticamente
 * - Inicializa la base de datos
 * - Crea usuario administrador
 * - Valida todo el sistema
 * - Prepara para producción
 * 
 * USO: node scripts/setup-complete.js
 * =============================================================================
 */

import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class CompleteSetup {
  constructor() {
    this.steps = [
      { id: 'oauth', name: 'Configurar Google OAuth', required: true },
      { id: 'init', name: 'Inicializar sistema de usuarios', required: true },
      { id: 'validate', name: 'Validar configuración', required: true },
      { id: 'admin', name: 'Configurar usuario administrador', required: true },
      { id: 'security', name: 'Configurar seguridad', required: false },
      { id: 'production', name: 'Preparar para producción', required: false }
    ];
    this.completedSteps = [];
    this.failedSteps = [];
  }

  async run() {
    console.log('🚀 CONFIGURADOR AUTOMÁTICO COMPLETO');
    console.log('Silhouette Browser V5.3 - Enterprise Edition');
    console.log('=================================================');
    console.log('Este script configurará automáticamente todo el sistema de usuarios');
    console.log('para que esté listo para producción.\n');
    
    try {
      // Mostrar pasos disponibles
      await this.showStepsMenu();
      
      // Ejecutar configuración seleccionada
      await this.executeSelectedSteps();
      
      // Mostrar resumen final
      await this.showFinalSummary();
      
    } catch (error) {
      console.error('❌ Error durante la configuración:', error);
      process.exit(1);
    }
  }

  async showStepsMenu() {
    console.log('📋 PASOS DE CONFIGURACIÓN DISPONIBLES:');
    console.log('=================================================');
    
    this.steps.forEach((step, index) => {
      const status = this.completedSteps.includes(step.id) ? '✅' : 
                    this.failedSteps.includes(step.id) ? '❌' : '⏳';
      const required = step.required ? ' [REQUERIDO]' : ' [OPCIONAL]';
      console.log(`${index + 1}. ${status} ${step.name}${required}`);
    });
    
    console.log('\n💡 Recomendación: Ejecutar todos los pasos marcados como [REQUERIDO]');
  }

  async executeSelectedSteps() {
    const { executeAll } = await inquirer.prompt([{
      type: 'confirm',
      name: 'executeAll',
      message: '¿Deseas ejecutar todos los pasos automáticamente?',
      default: true
    }]);
    
    if (executeAll) {
      await this.executeAllSteps();
    } else {
      await this.executeStepsManually();
    }
  }

  async executeAllSteps() {
    console.log('\n🚀 EJECUTANDO CONFIGURACIÓN AUTOMÁTICA...');
    console.log('=================================================');
    
    for (const step of this.steps) {
      if (this.completedSteps.includes(step.id) || this.failedSteps.includes(step.id)) {
        continue; // Saltar pasos ya completados
      }
      
      console.log(`\n🔄 Ejecutando: ${step.name}...`);
      
      try {
        await this.executeStep(step);
        this.completedSteps.push(step.id);
        console.log(`✅ ${step.name} completado exitosamente`);
      } catch (error) {
        this.failedSteps.push(step.id);
        console.log(`❌ ${step.name} falló: ${error.message}`);
        
        if (step.required) {
          const { continueConfig } = await inquirer.prompt([{
            type: 'confirm',
            name: 'continueConfig',
            message: 'Este paso es requerido. ¿Deseas continuar con los demás pasos?',
            default: false
          }]);
          
          if (!continueConfig) {
            throw new Error(`Configuración cancelada. Paso requerido falló: ${step.name}`);
          }
        }
      }
    }
  }

  async executeStepsManually() {
    console.log('\n🔧 CONFIGURACIÓN MANUAL');
    console.log('=================================================');
    
    for (const step of this.steps) {
      const { execute } = await inquirer.prompt([{
        type: 'confirm',
        name: 'execute',
        message: `¿Deseas ejecutar: ${step.name}?`,
        default: !this.completedSteps.includes(step.id)
      }]);
      
      if (execute && !this.completedSteps.includes(step.id)) {
        try {
          await this.executeStep(step);
          this.completedSteps.push(step.id);
          console.log(`✅ ${step.name} completado exitosamente`);
        } catch (error) {
          this.failedSteps.push(step.id);
          console.log(`❌ ${step.name} falló: ${error.message}`);
        }
      }
    }
  }

  async executeStep(step) {
    switch (step.id) {
      case 'oauth':
        await this.configureOAuth();
        break;
      case 'init':
        await this.initializeSystem();
        break;
      case 'validate':
        await this.validateSystem();
        break;
      case 'admin':
        await this.configureAdmin();
        break;
      case 'security':
        await this.configureSecurity();
        break;
      case 'production':
        await this.prepareProduction();
        break;
      default:
        throw new Error(`Paso desconocido: ${step.id}`);
    }
  }

  async configureOAuth() {
    console.log('🔐 Configurando Google OAuth...');
    
    const { skipOAuth } = await inquirer.prompt([{
      type: 'confirm',
      name: 'skipOAuth',
      message: '¿Ya tienes configuradas las credenciales de Google OAuth?',
      default: false
    }]);
    
    if (skipOAuth) {
      console.log('✅ Saltando configuración de OAuth');
      return;
    }
    
    // Ejecutar configurador de OAuth
    await execAsync('node scripts/configure-google-oauth.js');
    console.log('✅ Google OAuth configurado');
  }

  async initializeSystem() {
    console.log('💾 Inicializando sistema de usuarios...');
    
    await execAsync('node scripts/init-user-system.js');
    console.log('✅ Sistema de usuarios inicializado');
  }

  async validateSystem() {
    console.log('🧪 Validando sistema...');
    
    await execAsync('node scripts/validate-system.js');
    console.log('✅ Sistema validado');
  }

  async configureAdmin() {
    console.log('👤 Configurando usuario administrador...');
    
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
    
    console.log('✅ Configuración de administrador guardada');
    console.log(`   Email: ${email}`);
    console.log('   ⚠️  La contraseña se establecerá al primer inicio de la aplicación');
  }

  async configureSecurity() {
    console.log('🔐 Configurando seguridad...');
    
    // Verificar variables de seguridad
    const envContent = await require('fs/promises').readFile('.env', 'utf8').catch(() => '');
    
    if (envContent) {
      const secrets = ['JWT_SECRET', 'ENCRYPTION_KEY', 'SESSION_SECRET'];
      let missing = 0;
      
      for (const secret of secrets) {
        if (!envContent.includes(`${secret}=`)) {
          missing++;
        }
      }
      
      if (missing > 0) {
        console.log(`⚠️  ${missing} variables de seguridad faltantes`);
        console.log('   Se configurarán automáticamente al primer inicio');
      } else {
        console.log('✅ Todas las variables de seguridad están configuradas');
      }
    } else {
      console.log('⚠️  Archivo .env no encontrado');
    }
  }

  async prepareProduction() {
    console.log('📦 Preparando para producción...');
    
    const { confirmDeploy } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmDeploy',
      message: '¿Deseas ejecutar el proceso completo de deployment? (Puede tomar varios minutos)',
      default: false
    }]);
    
    if (confirmDeploy) {
      await execAsync('node scripts/deploy-production.js');
      console.log('✅ Deployment completado');
    } else {
      console.log('✅ Preparación de producción saltada');
    }
  }

  async showFinalSummary() {
    console.log('\n📊 RESUMEN FINAL');
    console.log('=================================================');
    console.log(`✅ Pasos completados: ${this.completedSteps.length}`);
    console.log(`❌ Pasos fallidos: ${this.failedSteps.length}`);
    console.log(`⏳ Pasos pendientes: ${this.steps.length - this.completedSteps.length - this.failedSteps.length}`);
    
    if (this.failedSteps.length === 0) {
      console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('✅ Silhouette Browser está listo para producción');
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('1. Configurar Google OAuth (si no se hizo automáticamente)');
      console.log('2. Configurar dominio/SSL (para producción)');
      console.log('3. Iniciar la aplicación: npm start');
      console.log('4. Cambiar contraseña de administrador en el primer inicio');
    } else {
      console.log('\n⚠️  CONFIGURACIÓN INCOMPLETA');
      console.log('Algunos pasos fallaron. Revisa el output anterior.');
      console.log('Puedes ejecutar el script nuevamente para completar la configuración.');
    }
    
    console.log('\n📖 DOCUMENTACIÓN:');
    console.log('- Guía de deployment: docs/deployment/DEPLOYMENT.md');
    console.log('- Checklist completo: CHECKLIST_FINAL.md');
    console.log('=================================================');
  }
}

// Ejecutar configurador si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new CompleteSetup();
  setup.run();
}

export default CompleteSetup;