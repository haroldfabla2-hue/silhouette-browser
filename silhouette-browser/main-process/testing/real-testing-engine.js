const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Motor de Testing Real con Servidores Funcionales
 * Inspirado en Testcontainers + Selenium WebDriver
 * Ejecuta pruebas con URLs reales y servidores funcionales
 */
class RealTestingEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            headless: options.headless !== false,
            browser: options.browser || 'chrome', // chrome, firefox, edge
            timeout: options.timeout || 30000,
            screenshotDir: options.screenshotDir || 'test-screenshots',
            reportDir: options.reportDir || 'test-reports',
            videoRecording: options.videoRecording !== false,
            maxParallel: options.maxParallel || 5,
            retryAttempts: options.retryAttempts || 3
        };
        
        this.browsers = new Map();
        this.testSessions = new Map();
        this.serviceContainers = new Map();
        this.testResults = new Map();
        this.isInitialized = false;
        
        // Configuración de browsers
        this.browserConfigs = {
            'chrome': {
                executablePath: null, // Usar bundled Chromium
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            },
            'firefox': {
                browser: 'firefox'
            },
            'edge': {
                browser: 'chromium',
                executablePath: null
            }
        };
        
        // Tipos de tests soportados
        this.testTypes = {
            'e2e': {
                name: 'End-to-End',
                description: 'Pruebas completas de flujo de usuario'
            },
            'ui': {
                name: 'User Interface',
                description: 'Pruebas de elementos de interfaz'
            },
            'api': {
                name: 'API Testing',
                description: 'Pruebas de endpoints y APIs'
            },
            'performance': {
                name: 'Performance',
                description: 'Pruebas de rendimiento y carga'
            },
            'accessibility': {
                name: 'Accessibility',
                description: 'Pruebas de accesibilidad'
            },
            'visual': {
                name: 'Visual Regression',
                description: 'Pruebas de regresión visual'
            }
        };
        
        this.init();
    }
    
    /**
     * Inicializar el motor de testing
     */
    async init() {
        try {
            console.log('🧪 Inicializando Real Testing Engine...');
            
            // Configurar directorios
            await this.setupDirectories();
            
            // Verificar browsers disponibles
            await this.verifyBrowsers();
            
            // Configurar handlers de señal
            this.setupSignalHandlers();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ Real Testing Engine inicializado');
        } catch (error) {
            console.error('❌ Error inicializando Real Testing Engine:', error);
            throw error;
        }
    }
    
    /**
     * Configurar directorios necesarios
     */
    async setupDirectories() {
        const directories = [
            this.options.screenshotDir,
            this.options.reportDir,
            'test-videos',
            'test-artifacts'
        ];
        
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    /**
     * Verificar browsers disponibles
     */
    async verifyBrowsers() {
        const availableBrowsers = [];
        
        for (const [name, config] of Object.entries(this.browserConfigs)) {
            try {
                const browser = await this.createBrowser(name);
                await browser.close();
                availableBrowsers.push(name);
            } catch (error) {
                console.warn(`⚠️ Browser ${name} no disponible:`, error.message);
            }
        }
        
        this.availableBrowsers = availableBrowsers;
        console.log(`🌐 Browsers disponibles: ${availableBrowsers.join(', ')}`);
    }
    
    /**
     * Configurar manejo de señales del sistema
     */
    setupSignalHandlers() {
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }
    
    /**
     * Crear nueva sesión de testing
     */
    async createTestSession(sessionConfig) {
        const sessionId = this.generateSessionId();
        const {
            name,
            url,
            browser = 'chrome',
            viewport = { width: 1920, height: 1080 },
            timeout = this.options.timeout
        } = sessionConfig;
        
        try {
            // Crear browser instance
            const browserInstance = await this.createBrowser(browser);
            
            // Crear contexto
            const context = await browserInstance.newContext({
                viewport: viewport,
                userAgent: this.getCustomUserAgent(browser)
            });
            
            // Crear página
            const page = await context.newPage();
            
            // Configurar interceptors
            this.setupPageInterceptors(page, sessionId);
            
            // Configurar manejo de errores
            this.setupPageErrorHandling(page, sessionId);
            
            // Configurar grabación de video si está habilitada
            let videoPath = null;
            if (this.options.videoRecording) {
                const videoDir = 'test-videos';
                videoPath = path.join(videoDir, `${sessionId}.webm`);
                await context.setDefaultTimeout(timeout);
                await context.setExtraHTTPHeaders({
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
                });
            }
            
            // Crear sesión
            const session = {
                id: sessionId,
                name: name || `Test Session ${Date.now()}`,
                browser: browserInstance,
                context: context,
                page: page,
                url: url,
                createdAt: new Date(),
                status: 'created',
                viewport: viewport,
                timeout: timeout,
                videoPath: videoPath,
                screenshots: [],
                logs: []
            };
            
            this.testSessions.set(sessionId, session);
            this.browsers.set(sessionId, browserInstance);
            
            console.log(`🧪 Sesión de testing creada: ${sessionId}`);
            
            this.emit('session-created', {
                sessionId,
                name: session.name,
                url: url,
                browser: browser
            });
            
            return {
                success: true,
                sessionId: sessionId,
                session: session
            };
            
        } catch (error) {
            console.error(`Error creando sesión de testing ${sessionId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Navegar a URL en sesión
     */
    async navigateToUrl(sessionId, url) {
        const session = this.testSessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Sesión no encontrada' };
        }
        
        try {
            session.status = 'navigating';
            session.url = url;
            
            // Configurar timeout para navegación
            session.page.setDefaultTimeout(session.timeout);
            
            // Navegar a la URL
            await session.page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: session.timeout
            });
            
            // Esperar a que la página cargue completamente
            await session.page.waitForSelector('body', { 
                state: 'visible',
                timeout: session.timeout / 2 
            });
            
            session.status = 'ready';
            
            console.log(`🔗 Navegando a URL en sesión ${sessionId}: ${url}`);
            
            this.emit('navigated', { sessionId, url });
            
            return {
                success: true,
                url: url,
                title: await session.page.title()
            };
            
        } catch (error) {
            session.status = 'error';
            console.error(`Error navegando a ${url} en sesión ${sessionId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Ejecutar test automatizado
     */
    async runAutomatedTest(sessionId, testConfig) {
        const session = this.testSessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Sesión no encontrada' };
        }
        
        const {
            type = 'ui',
            steps = [],
            assertions = [],
            screenshot = true,
            video = true
        } = testConfig;
        
        const testId = this.generateTestId();
        const startTime = Date.now();
        
        try {
            console.log(`🧪 Ejecutando test ${testId} en sesión ${sessionId}`);
            
            const result = {
                testId: testId,
                sessionId: sessionId,
                type: type,
                steps: [],
                assertions: [],
                screenshots: [],
                startTime: startTime,
                endTime: null,
                duration: 0,
                success: true,
                errors: []
            };
            
            session.status = 'testing';
            
            // Ejecutar pasos del test
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const stepResult = await this.executeTestStep(session, step, i + 1);
                result.steps.push(stepResult);
                
                if (!stepResult.success) {
                    result.success = false;
                    result.errors.push(stepResult.error);
                    break; // Detener en el primer error
                }
            }
            
            // Ejecutar aserciones
            for (let i = 0; i < assertions.length; i++) {
                const assertion = assertions[i];
                const assertionResult = await this.executeAssertion(session, assertion, i + 1);
                result.assertions.push(assertionResult);
                
                if (!assertionResult.success) {
                    result.success = false;
                    result.errors.push(assertionResult.error);
                }
            }
            
            // Capturar screenshots si está habilitado
            if (screenshot) {
                const screenshotPath = await this.captureScreenshot(session, testId);
                result.screenshots.push(screenshotPath);
            }
            
            // Finalizar test
            result.endTime = Date.now();
            result.duration = result.endTime - result.startTime;
            session.status = 'ready';
            
            // Almacenar resultado
            this.testResults.set(testId, result);
            
            console.log(`✅ Test ${testId} completado: ${result.success ? 'ÉXITO' : 'FALLO'}`);
            
            this.emit('test-completed', {
                testId,
                sessionId,
                result: result
            });
            
            return {
                success: true,
                testId: testId,
                result: result
            };
            
        } catch (error) {
            session.status = 'error';
            const result = {
                testId: testId,
                sessionId: sessionId,
                type: type,
                success: false,
                error: error.message,
                startTime: startTime,
                endTime: Date.now(),
                duration: Date.now() - startTime
            };
            
            this.testResults.set(testId, result);
            
            this.emit('test-failed', { testId, sessionId, error: error.message });
            
            return {
                success: false,
                testId: testId,
                error: error.message,
                result: result
            };
        }
    }
    
    /**
     * Ejecutar paso de test
     */
    async executeTestStep(session, step, stepNumber) {
        const { action, selector, value, wait, description } = step;
        
        try {
            console.log(`  Paso ${stepNumber}: ${description || action} ${selector || ''}`);
            
            const stepResult = {
                step: stepNumber,
                action: action,
                selector: selector,
                value: value,
                description: description,
                success: true,
                startTime: Date.now(),
                endTime: null,
                duration: 0
            };
            
            // Esperar si se especifica
            if (wait) {
                await new Promise(resolve => setTimeout(resolve, wait));
            }
            
            // Ejecutar acción
            switch (action) {
                case 'click':
                    await this.clickElement(session, selector);
                    break;
                    
                case 'type':
                    await this.typeText(session, selector, value);
                    break;
                    
                case 'clear':
                    await this.clearField(session, selector);
                    break;
                    
                case 'select':
                    await this.selectOption(session, selector, value);
                    break;
                    
                case 'hover':
                    await this.hoverElement(session, selector);
                    break;
                    
                case 'scroll':
                    await this.scrollElement(session, selector, value);
                    break;
                    
                case 'wait_for_selector':
                    await this.waitForSelector(session, selector, value);
                    break;
                    
                case 'wait_for_navigation':
                    await this.waitForNavigation(session, value);
                    break;
                    
                case 'evaluate':
                    await this.evaluateScript(session, value);
                    break;
                    
                default:
                    throw new Error(`Acción no soportada: ${action}`);
            }
            
            stepResult.endTime = Date.now();
            stepResult.duration = stepResult.endTime - stepResult.startTime;
            
            return stepResult;
            
        } catch (error) {
            return {
                step: stepNumber,
                action: action,
                selector: selector,
                success: false,
                error: error.message,
                startTime: Date.now(),
                endTime: Date.now(),
                duration: Date.now() - Date.now()
            };
        }
    }
    
    /**
     * Ejecutar aserción
     */
    async executeAssertion(session, assertion, assertionNumber) {
        const { type, selector, value, description } = assertion;
        
        try {
            console.log(`  Aserción ${assertionNumber}: ${description || type} ${selector || ''}`);
            
            const assertionResult = {
                assertion: assertionNumber,
                type: type,
                selector: selector,
                expected: value,
                description: description,
                success: true,
                actual: null,
                startTime: Date.now(),
                endTime: null,
                duration: 0
            };
            
            let actual = null;
            
            switch (type) {
                case 'visible':
                    actual = await this.isElementVisible(session, selector);
                    if (!actual) {
                        throw new Error(`Elemento ${selector} no es visible`);
                    }
                    break;
                    
                case 'text':
                    actual = await this.getElementText(session, selector);
                    if (value && !actual.includes(value)) {
                        throw new Error(`Texto esperado "${value}" no encontrado. Texto actual: "${actual}"`);
                    }
                    break;
                    
                case 'value':
                    actual = await this.getElementValue(session, selector);
                    if (value && actual !== value) {
                        throw new Error(`Valor esperado "${value}" no coincide. Valor actual: "${actual}"`);
                    }
                    break;
                    
                case 'url':
                    actual = session.page.url();
                    if (value && !actual.includes(value)) {
                        throw new Error(`URL esperada "${value}" no coincide. URL actual: "${actual}"`);
                    }
                    break;
                    
                case 'title':
                    actual = await session.page.title();
                    if (value && !actual.includes(value)) {
                        throw new Error(`Título esperado "${value}" no coincide. Título actual: "${actual}"`);
                    }
                    break;
                    
                case 'count':
                    actual = await this.getElementsCount(session, selector);
                    if (value && actual !== value) {
                        throw new Error(`Conteo esperado ${value} no coincide. Conteo actual: ${actual}`);
                    }
                    break;
                    
                default:
                    throw new Error(`Tipo de aserción no soportado: ${type}`);
            }
            
            assertionResult.actual = actual;
            assertionResult.endTime = Date.now();
            assertionResult.duration = assertionResult.endTime - assertionResult.startTime;
            
            return assertionResult;
            
        } catch (error) {
            return {
                assertion: assertionNumber,
                type: type,
                selector: selector,
                success: false,
                error: error.message,
                actual: null,
                startTime: Date.now(),
                endTime: Date.now(),
                duration: 0
            };
        }
    }
    
    /**
     * Acciones de test
     */
    
    async clickElement(session, selector) {
        await session.page.click(selector);
    }
    
    async typeText(session, selector, text) {
        await session.page.fill(selector, text);
    }
    
    async clearField(session, selector) {
        await session.page.click(selector);
        await session.page.keyboard.press('Control+a');
        await session.page.keyboard.press('Delete');
    }
    
    async selectOption(session, selector, value) {
        await session.page.selectOption(selector, value);
    }
    
    async hoverElement(session, selector) {
        await session.page.hover(selector);
    }
    
    async scrollElement(session, selector, position = 'center') {
        await session.page.evaluate((sel, pos) => {
            const element = document.querySelector(sel);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: pos });
            }
        }, selector, position);
    }
    
    async waitForSelector(session, selector, timeout = 10000) {
        await session.page.waitForSelector(selector, { timeout });
    }
    
    async waitForNavigation(session, timeout = 30000) {
        await session.page.waitForNavigation({ timeout });
    }
    
    async evaluateScript(session, script) {
        return await session.page.evaluate(script);
    }
    
    /**
     * Aserciones
     */
    
    async isElementVisible(session, selector) {
        try {
            const element = await session.page.$(selector);
            if (!element) return false;
            
            return await element.isVisible();
        } catch (error) {
            return false;
        }
    }
    
    async getElementText(session, selector) {
        return await session.page.textContent(selector);
    }
    
    async getElementValue(session, selector) {
        return await session.page.inputValue(selector);
    }
    
    async getElementsCount(session, selector) {
        const elements = await session.page.$$(selector);
        return elements.length;
    }
    
    /**
     * Capturar screenshot
     */
    async captureScreenshot(session, testId, options = {}) {
        const timestamp = Date.now();
        const filename = `${testId}-${timestamp}.png`;
        const filepath = path.join(this.options.screenshotDir, filename);
        
        const screenshotOptions = {
            fullPage: options.fullPage || false,
            type: 'png',
            quality: options.quality || 100
        };
        
        await session.page.screenshot({ 
            path: filepath, 
            ...screenshotOptions 
        });
        
        console.log(`📸 Screenshot capturado: ${filename}`);
        
        this.emit('screenshot-captured', { sessionId: session.id, filepath, testId });
        
        return filepath;
    }
    
    /**
     * Configurar interceptors de página
     */
    setupPageInterceptors(page, sessionId) {
        // Interceptar requests de red
        page.on('request', (request) => {
            this.emit('network-request', {
                sessionId,
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });
        
        // Interceptar responses
        page.on('response', (response) => {
            this.emit('network-response', {
                sessionId,
                url: response.url(),
                status: response.status(),
                contentType: response.headers()['content-type']
            });
        });
        
        // Capturar console logs
        page.on('console', (message) => {
            const log = {
                sessionId,
                type: message.type(),
                text: message.text(),
                timestamp: Date.now()
            };
            
            const session = this.testSessions.get(sessionId);
            if (session) {
                session.logs.push(log);
            }
            
            this.emit('console-log', log);
        });
    }
    
    /**
     * Configurar manejo de errores
     */
    setupPageErrorHandling(page, sessionId) {
        page.on('pageerror', (error) => {
            this.emit('page-error', {
                sessionId,
                error: error.message,
                stack: error.stack
            });
        });
        
        page.on('requestfailed', (request) => {
            this.emit('request-failed', {
                sessionId,
                url: request.url(),
                error: request.failure()
            });
        });
    }
    
    /**
     * Crear browser instance
     */
    async createBrowser(browserName = 'chrome') {
        const config = this.browserConfigs[browserName];
        if (!config) {
            throw new Error(`Browser no configurado: ${browserName}`);
        }
        
        return await puppeteer.launch({
            headless: this.options.headless,
            executablePath: config.executablePath,
            args: config.args,
            defaultViewport: { width: 1920, height: 1080 }
        });
    }
    
    /**
     * Obtener user agent personalizado
     */
    getCustomUserAgent(browser) {
        const userAgents = {
            'chrome': 'Silhouette-Testing-Engine/5.1.0 (Browser Automation)',
            'firefox': 'Silhouette-Testing-Engine/5.1.0 (Browser Automation)',
            'edge': 'Silhouette-Testing-Engine/5.1.0 (Edge Automation)'
        };
        
        return userAgents[browser] || 'Silhouette-Testing-Engine/5.1.0';
    }
    
    /**
     * Ejecutar test de performance
     */
    async runPerformanceTest(sessionId, url) {
        const session = this.testSessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Sesión no encontrada' };
        }
        
        try {
            // Navegar a la URL
            const navResult = await this.navigateToUrl(sessionId, url);
            if (!navResult.success) {
                return navResult;
            }
            
            // Medir métricas de performance
            const performanceMetrics = await session.page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                const resources = performance.getEntriesByType('resource');
                
                return {
                    navigation: {
                        dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
                        connectTime: navigation.connectEnd - navigation.connectStart,
                        requestTime: navigation.responseStart - navigation.requestStart,
                        responseTime: navigation.responseEnd - navigation.responseStart,
                        domTime: navigation.domComplete - navigation.domLoading,
                        loadTime: navigation.loadEventEnd - navigation.navigationStart
                    },
                    paint: paint.map(entry => ({
                        name: entry.name,
                        startTime: entry.startTime
                    })),
                    resources: {
                        count: resources.length,
                        totalSize: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
                        byType: resources.reduce((acc, resource) => {
                            acc[resource.initiatorType] = (acc[resource.initiatorType] || 0) + 1;
                            return acc;
                        }, {})
                    }
                };
            });
            
            // Generar reporte de performance
            const report = {
                url: url,
                timestamp: new Date(),
                metrics: performanceMetrics,
                score: this.calculatePerformanceScore(performanceMetrics)
            };
            
            console.log(`📊 Test de performance completado para ${url}`);
            
            this.emit('performance-test-completed', {
                sessionId,
                url,
                report
            });
            
            return {
                success: true,
                report: report
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Calcular score de performance
     */
    calculatePerformanceScore(metrics) {
        const { navigation, resources } = metrics;
        
        // Scores individuales (0-100)
        const loadTimeScore = Math.max(0, 100 - (navigation.loadTime / 1000) * 10);
        const domTimeScore = Math.max(0, 100 - (navigation.domTime / 1000) * 5);
        const resourceScore = Math.max(0, 100 - (resources.count / 50) * 20);
        
        // Score promedio
        return Math.round((loadTimeScore + domTimeScore + resourceScore) / 3);
    }
    
    /**
     * Cerrar sesión de testing
     */
    async closeTestSession(sessionId) {
        const session = this.testSessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Sesión no encontrada' };
        }
        
        try {
            // Cerrar browser
            if (session.browser) {
                await session.browser.close();
            }
            
            // Limpiar referencias
            this.testSessions.delete(sessionId);
            this.browsers.delete(sessionId);
            
            console.log(`🛑 Sesión de testing cerrada: ${sessionId}`);
            
            this.emit('session-closed', { sessionId });
            
            return { success: true };
            
        } catch (error) {
            console.error(`Error cerrando sesión ${sessionId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Generar reporte de testing
     */
    async generateTestReport(testId) {
        const result = this.testResults.get(testId);
        if (!result) {
            return { success: false, error: 'Resultado de test no encontrado' };
        }
        
        const report = {
            testId: testId,
            summary: {
                success: result.success,
                totalSteps: result.steps.length,
                successfulSteps: result.steps.filter(s => s.success).length,
                totalAssertions: result.assertions.length,
                successfulAssertions: result.assertions.filter(a => a.success).length,
                duration: result.duration,
                startTime: new Date(result.startTime),
                endTime: new Date(result.endTime)
            },
            steps: result.steps,
            assertions: result.assertions,
            screenshots: result.screenshots,
            errors: result.errors
        };
        
        // Guardar reporte
        const reportPath = path.join(this.options.reportDir, `${testId}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Reporte generado: ${reportPath}`);
        
        this.emit('report-generated', { testId, reportPath, report });
        
        return {
            success: true,
            reportPath: reportPath,
            report: report
        };
    }
    
    /**
     * Utilidades
     */
    
    generateSessionId() {
        return 'session_' + crypto.randomBytes(6).toString('hex');
    }
    
    generateTestId() {
        return 'test_' + crypto.randomBytes(6).toString('hex');
    }
    
    /**
     * Listar sesiones activas
     */
    listActiveSessions() {
        return Array.from(this.testSessions.values()).map(session => ({
            id: session.id,
            name: session.name,
            url: session.url,
            status: session.status,
            createdAt: session.createdAt
        }));
    }
    
    /**
     * Obtener estadísticas
     */
    getStats() {
        const now = Date.now();
        return {
            activeSessions: this.testSessions.size,
            totalTests: this.testResults.size,
            successfulTests: Array.from(this.testResults.values()).filter(r => r.success).length,
            availableBrowsers: this.availableBrowsers,
            uptime: process.uptime()
        };
    }
    
    /**
     * Limpiar recursos
     */
    async cleanup() {
        // Cerrar todas las sesiones
        const closePromises = Array.from(this.testSessions.keys()).map(sessionId => {
            return this.closeTestSession(sessionId).catch(console.error);
        });
        
        await Promise.all(closePromises);
        
        this.removeAllListeners();
        console.log('🗑️ Real Testing Engine limpiado');
    }
    
    /**
     * Verificar si está inicializado
     */
    isTestingReady() {
        return this.isInitialized;
    }
    
    /**
     * Destruir instancia
     */
    destroy() {
        this.cleanup();
        this.removeAllListeners();
        console.log('🗑️ Real Testing Engine destruido');
    }
}

module.exports = RealTestingEngine;