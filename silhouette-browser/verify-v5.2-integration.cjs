#!/usr/bin/env node

/**
 * Verificación de Integración V5.2 - Sistema de Temas y Widgets
 * Silhouette Browser V5.2
 * 
 * Este script verifica que todos los componentes del sistema de temas
 * y widgets estén correctamente integrados.
 */

const fs = require('fs');
const path = require('path');

class V5_2_IntegrationVerifier {
    constructor() {
        this.workspaceRoot = path.join(__dirname, 'renderer-process');
        this.errors = [];
        this.warnings = [];
        this.passed = 0;
        this.total = 0;
    }

    log(message, type = 'info') {
        const prefix = {
            'info': '🔍',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        console.log(`${prefix[type]} ${message}`);
    }

    checkFileExists(filePath, description) {
        this.total++;
        if (fs.existsSync(filePath)) {
            this.log(`${description}: Encontrado`, 'success');
            this.passed++;
            return true;
        } else {
            this.log(`${description}: NO ENCONTRADO - ${filePath}`, 'error');
            this.errors.push(`Falta archivo: ${description} (${filePath})`);
            return false;
        }
    }

    checkFileContent(filePath, searchString, description) {
        this.total++;
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(searchString)) {
                this.log(`${description}: Contenido verificado`, 'success');
                this.passed++;
                return true;
            } else {
                this.log(`${description}: Contenido NO encontrado`, 'error');
                this.errors.push(`Contenido faltante en ${filePath}: ${searchString}`);
                return false;
            }
        } catch (error) {
            this.log(`${description}: Error leyendo archivo - ${error.message}`, 'error');
            this.errors.push(`Error leyendo ${filePath}: ${error.message}`);
            return false;
        }
    }

    verifyThemeSystem() {
        this.log('\n🎨 VERIFICANDO SISTEMA DE TEMAS...', 'info');
        
        // Verificar archivos del sistema de temas
        this.checkFileExists(
            path.join(this.workspaceRoot, 'theme-system/themes.css'),
            'CSS de Temas'
        );
        
        this.checkFileExists(
            path.join(this.workspaceRoot, 'theme-system/theme-manager.js'),
            'Gestor de Temas'
        );
        
        this.checkFileExists(
            path.join(this.workspaceRoot, 'theme-system/theme-switcher.js'),
            'Selector de Temas'
        );
        
        this.checkFileExists(
            path.join(this.workspaceRoot, 'theme-system/theme-detection.js'),
            'Detección de Temas'
        );
    }

    verifyWidgetSystem() {
        this.log('\n🧩 VERIFICANDO SISTEMA DE WIDGETS...', 'info');
        
        // Verificar archivos del sistema de widgets
        this.checkFileExists(
            path.join(this.workspaceRoot, 'widget-system/widget-builder.js'),
            'Constructor de Widgets'
        );
        
        this.checkFileExists(
            path.join(this.workspaceRoot, 'widget-system/widget-manager.js'),
            'Gestor de Widgets'
        );
        
        this.checkFileExists(
            path.join(this.workspaceRoot, 'widget-system/layout-manager.js'),
            'Gestor de Layout'
        );
        
        this.checkFileExists(
            path.join(this.workspaceRoot, 'widget-system/widget-presets.js'),
            'Widgets Predefinidos'
        );
        
        this.checkFileExists(
            path.join(this.workspaceRoot, 'widget-system/widget-config.js'),
            'Configuración de Widgets'
        );
    }

    verifyIndexHtmlIntegration() {
        this.log('\n🔗 VERIFICANDO INTEGRACIÓN EN INDEX.HTML...', 'info');
        
        const indexPath = path.join(this.workspaceRoot, 'index.html');
        
        // Verificar imports de CSS
        this.checkFileContent(
            indexPath,
            'theme-system/themes.css',
            'Import CSS de Temas'
        );
        
        // Verificar imports de JS
        this.checkFileContent(
            indexPath,
            'theme-system/theme-manager.js',
            'Import Theme Manager'
        );
        
        this.checkFileContent(
            indexPath,
            'widget-system/widget-builder.js',
            'Import Widget Builder'
        );
        
        // Verificar botón de tema
        this.checkFileContent(
            indexPath,
            'themeButton',
            'Botón de Cambio de Tema'
        );
        
        // Verificar modal de tema
        this.checkFileContent(
            indexPath,
            'themeSwitcherModal',
            'Modal de Selector de Temas'
        );
        
        // Verificar tab de widgets
        this.checkFileContent(
            indexPath,
            'data-tab="widgets"',
            'Tab de Widgets'
        );
        
        // Verificar funciones de tema
        this.checkFileContent(
            indexPath,
            'openThemeModal',
            'Función openThemeModal'
        );
        
        // Verificar funciones de widgets
        this.checkFileContent(
            indexPath,
            'initializeWidgetSystem',
            'Función initializeWidgetSystem'
        );
    }

    verifyPackageJson() {
        this.log('\n📦 VERIFICANDO DEPENDENCIAS EN PACKAGE.JSON...', 'info');
        
        const packagePath = path.join(__dirname, 'package.json');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            // Verificar react-grid-layout
            this.total++;
            if (packageJson.dependencies['react-grid-layout']) {
                this.log('react-grid-layout: Encontrado en dependencies', 'success');
                this.passed++;
            } else {
                this.log('react-grid-layout: NO ENCONTRADO en dependencies', 'warning');
                this.warnings.push('react-grid-layout faltante en dependencies');
            }
            
            // Verificar versión de Silhouette
            this.total++;
            if (packageJson.version && packageJson.version.startsWith('5')) {
                this.log(`Versión de Silhouette: ${packageJson.version}`, 'success');
                this.passed++;
            } else {
                this.log(`Versión de Silhouette: ${packageJson.version} (debería ser 5.x.x)`, 'warning');
                this.warnings.push('Versión de Silhouette debería ser 5.x.x');
            }
            
        } catch (error) {
            this.log(`Error leyendo package.json: ${error.message}`, 'error');
            this.errors.push(`Error leyendo package.json: ${error.message}`);
        }
    }

    verifyCSSVariables() {
        this.log('\n🎨 VERIFICANDO VARIABLES CSS...', 'info');
        
        const themesPath = path.join(this.workspaceRoot, 'theme-system/themes.css');
        
        // Verificar que el archivo de temas existe
        if (fs.existsSync(themesPath)) {
            try {
                const content = fs.readFileSync(themesPath, 'utf8');
                
                // Verificar temas principales
                const themes = ['dark', 'light', 'blue', 'purple', 'red', 'green'];
                themes.forEach(theme => {
                    this.total++;
                    if (content.includes(`[data-theme="${theme}"]`)) {
                        this.log(`Tema "${theme}": Definido`, 'success');
                        this.passed++;
                    } else {
                        this.log(`Tema "${theme}": NO DEFINIDO`, 'warning');
                        this.warnings.push(`Tema "${theme}" no definido en themes.css`);
                    }
                });
                
            } catch (error) {
                this.log(`Error leyendo themes.css: ${error.message}`, 'error');
                this.errors.push(`Error leyendo themes.css: ${error.message}`);
            }
        }
    }

    async run() {
        this.log('🚀 INICIANDO VERIFICACIÓN DE INTEGRACIÓN V5.2', 'info');
        this.log('================================================', 'info');
        
        this.verifyThemeSystem();
        this.verifyWidgetSystem();
        this.verifyIndexHtmlIntegration();
        this.verifyPackageJson();
        this.verifyCSSVariables();
        
        this.log('\n📊 RESUMEN DE VERIFICACIÓN', 'info');
        this.log('================================================', 'info');
        this.log(`Total de verificaciones: ${this.total}`, 'info');
        this.log(`Exitosas: ${this.passed}`, 'success');
        this.log(`Errores: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'success');
        this.log(`Advertencias: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'success');
        
        if (this.errors.length > 0) {
            this.log('\n❌ ERRORES ENCONTRADOS:', 'error');
            this.errors.forEach(error => this.log(`  • ${error}`, 'error'));
        }
        
        if (this.warnings.length > 0) {
            this.log('\n⚠️ ADVERTENCIAS:', 'warning');
            this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
        }
        
        const successRate = ((this.passed / this.total) * 100).toFixed(1);
        this.log(`\n📈 TASA DE ÉXITO: ${successRate}%`, 'info');
        
        if (this.errors.length === 0) {
            this.log('\n🎉 ¡INTEGRACIÓN V5.2 COMPLETADA EXITOSAMENTE!', 'success');
            this.log('Silhouette Browser V5.2 está listo con temas y widgets', 'success');
            process.exit(0);
        } else {
            this.log('\n❌ INTEGRACIÓN INCOMPLETA - Revisar errores', 'error');
            process.exit(1);
        }
    }
}

// Ejecutar verificación
if (require.main === module) {
    const verifier = new V5_2_IntegrationVerifier();
    verifier.run().catch(error => {
        console.error('Error durante la verificación:', error);
        process.exit(1);
    });
}

module.exports = V5_2_IntegrationVerifier;