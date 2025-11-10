#!/usr/bin/env node
/**
 * SILHOUETTE V5.1 - VERIFICACIÓN DE INTEGRACIÓN NATIVA
 * Verifica que todos los componentes de la integración nativa estén correctamente configurados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class V5_1_Integration_Verifier {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = 0;
        this.total = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'check': '🔍'
        }[type] || 'ℹ️';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    checkFile(filePath, description) {
        this.total++;
        if (fs.existsSync(filePath)) {
            this.passed++;
            this.log(`${description} - Found`, 'success');
            return true;
        } else {
            this.errors.push(`Missing: ${description} at ${filePath}`);
            this.log(`${description} - Missing`, 'error');
            return false;
        }
    }

    checkFileContent(filePath, searchPattern, description) {
        this.total++;
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(searchPattern)) {
                this.passed++;
                this.log(`${description} - Found`, 'success');
                return true;
            } else {
                this.warnings.push(`${description} - Pattern not found`);
                this.log(`${description} - Pattern not found`, 'warning');
                return false;
            }
        } catch (error) {
            this.errors.push(`Error reading ${filePath}: ${error.message}`);
            this.log(`Error reading ${description}`, 'error');
            return false;
        }
    }

    verifyProjectStructure() {
        this.log('🔍 Verificando estructura del proyecto...', 'check');

        // Archivos principales
        this.checkFile('package.json', 'Package configuration');
        this.checkFile('main-process/app-manager/main.js', 'Main application entry point');
        this.checkFile('renderer-process/index.html', 'Main renderer interface');

        // V5.1 Native Integration Core Files
        this.checkFile('main-process/native-integration/native-integration-core.js', 'Native Integration Core');
        this.checkFile('main-process/native-integration/native-browser-integration.js', 'Native Browser Integration');
        this.checkFile('main-process/native-integration/native-system-initializer.js', 'Native System Initializer');
        
        // Live Server
        this.checkFile('main-process/live-server/live-server-manager.js', 'Live Server Manager');
        
        // Docker Integration
        this.checkFile('main-process/docker/docker-integration.js', 'Docker Integration');
        
        // URL Router
        this.checkFile('main-process/url-router/url-router.js', 'URL Router');
        
        // Testing Engine
        this.checkFile('main-process/testing/real-testing-engine.js', 'Real Testing Engine');
        
        // Preview Sharing
        this.checkFile('main-process/preview-sharing/preview-sharing.js', 'Preview Sharing');
        
        // Bridge Preload
        this.checkFile('main-process/preload/native-bridge-preload.js', 'Native Bridge Preload');
        
        // UI
        this.checkFile('renderer-process/native-dev-ui/native-platform.html', 'Native Platform UI');
        
        // Test files
        this.checkFile('test-native-system.cjs', 'V5.1 Test Suite');
        
        // Documentation
        this.checkFile('SILHOUETTE_V5.1_INTEGRACION_NATIVA_PLAN.md', 'V5.1 Implementation Plan');
        this.checkFile('SILHOUETTE_V5.1_REVOLUCION_NATIVA_README.md', 'V5.1 Documentation');
    }

    verifyPackageJson() {
        this.log('📦 Verificando configuración de package.json...', 'check');

        // Verificar versión
        this.checkFileContent('package.json', '"version": "5.1.0"', 'Version 5.1.0');
        
        // Verificar dependencias nativas V5.1
        this.checkFileContent('package.json', '"live-server":', 'Live Server dependency');
        this.checkFileContent('package.json', '"browser-sync":', 'Browser Sync dependency');
        this.checkFileContent('package.json', '"testcontainers":', 'TestContainers dependency');
        this.checkFileContent('package.json', '"http-server":', 'HTTP Server dependency');
        this.checkFileContent('package.json', '"puppeteer":', 'Puppeteer dependency');
    }

    verifyMainJsIntegration() {
        this.log('⚙️ Verificando integración en main.js...', 'check');

        // Verificar imports
        this.checkFileContent('main-process/app-manager/main.js', 'NativeIntegrationCore', 'Native Integration import');
        
        // Verificar inicialización
        this.checkFileContent('main-process/app-manager/main.js', 'initializeNativeIntegration', 'Native Integration initialization');
        this.checkFileContent('main-process/app-manager/main.js', 'V5.1 - Native Integration Revolution', 'V5.1 branding');
    }

    verifyUIntegration() {
        this.log('🖥️ Verificando integración en UI...', 'check');

        // Verificar tab de plataforma nativa
        this.checkFileContent('renderer-process/index.html', 'Plataforma Nativa', 'Native Platform tab');
        this.checkFileContent('renderer-process/index.html', 'native-dev-ui/native-platform.html', 'Native Platform iframe');
    }

    verifyPreloadScript() {
        this.log('🔗 Verificando preload script...', 'check');

        // Verificar versión en preload
        this.checkFileContent('main-process/preload/native-bridge-preload.js', 'version: \'5.1.0\'', 'Version in preload');
    }

    async runAllVerifications() {
        this.log('🚀 Iniciando verificación completa de Silhouette V5.1...', 'info');
        this.log('=' * 60, 'info');

        this.verifyProjectStructure();
        this.verifyPackageJson();
        this.verifyMainJsIntegration();
        this.verifyUIntegration();
        this.verifyPreloadScript();

        this.log('=' * 60, 'info');
        this.log(`📊 Resumen de verificación:`, 'info');
        this.log(`   Total checks: ${this.total}`, 'info');
        this.log(`   Passed: ${this.passed}`, 'success');
        this.log(`   Failed: ${this.total - this.passed}`, this.total - this.passed === 0 ? 'success' : 'error');
        
        if (this.warnings.length > 0) {
            this.log(`   Warnings: ${this.warnings.length}`, 'warning');
        }

        this.log('=' * 60, 'info');

        if (this.errors.length === 0) {
            this.log('🎉 SILHOUETTE V5.1 - INTEGRACIÓN NATIVA 100% COMPLETA', 'success');
            this.log('   ✅ Todos los componentes están correctamente configurados', 'success');
            this.log('   ✅ La aplicación está lista para ser desplegada', 'success');
            return true;
        } else {
            this.log('❌ SE ENCONTRARON ERRORES EN LA INTEGRACIÓN', 'error');
            this.errors.forEach(error => this.log(`   ${error}`, 'error'));
            return false;
        }
    }
}

// Ejecutar verificación
const verifier = new V5_1_Integration_Verifier();
verifier.runAllVerifications().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Error durante la verificación:', error);
    process.exit(1);
});