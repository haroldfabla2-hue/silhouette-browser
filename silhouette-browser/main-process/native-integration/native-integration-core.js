const EventEmitter = require('events');
const NativeBrowserIntegration = require('./native-browser-integration');
const LiveServerManager = require('../live-server/live-server-manager');
const DockerIntegration = require('../docker/docker-integration');
const URLRouter = require('../url-router/url-router');
const RealTestingEngine = require('../testing/real-testing-engine');
const PreviewSharing = require('../preview-sharing/preview-sharing');

/**
 * Núcleo de Integración Nativa de Silhouette V5.1
 * Orquesta todos los sistemas para crear una plataforma unificada
 * Combina: Browser Nativo + Live Server + Docker + URLs + Testing + Sharing
 */
class NativeIntegrationCore extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            enableBrowser: options.enableBrowser !== false,
            enableLiveServer: options.enableLiveServer !== false,
            enableDocker: options.enableDocker !== false,
            enableURLs: options.enableURLs !== false,
            enableTesting: options.enableTesting !== false,
            enableSharing: options.enableSharing !== false,
            debug: options.debug || false
        };
        
        // Inicializar subsistemas
        this.nativeBrowser = null;
        this.liveServer = null;
        this.dockerIntegration = null;
        this.urlRouter = null;
        this.testingEngine = null;
        this.previewSharing = null;
        
        // Estado de la aplicación
        this.isInitialized = false;
        this.isRunning = false;
        this.activeProjects = new Map();
        this.sessionData = new Map();
        
        // Configuración global
        this.globalConfig = {
            workspacePath: options.workspacePath || process.cwd(),
            tempPath: options.tempPath || '/tmp/silhouette',
            maxProjects: options.maxProjects || 50,
            autoCleanup: options.autoCleanup !== false
        };
        
        this.init();
    }
    
    /**
     * Inicializar el núcleo de integración
     */
    async init() {
        try {
            console.log('🚀 Inicializando Núcleo de Integración Nativa de Silhouette V5.1...');
            
            // Configurar manejo de errores global
            this.setupGlobalErrorHandling();
            
            // Inicializar subsistemas en paralelo
            await this.initializeSubsystems();
            
            // Configurar integración entre sistemas
            this.setupSubsystemIntegration();
            
            // Configurar limpieza automática
            if (this.globalConfig.autoCleanup) {
                this.setupAutoCleanup();
            }
            
            this.isInitialized = true;
            this.emit('core-initialized');
            
            console.log('✅ Núcleo de Integración Nativa inicializado');
            this.logSystemStatus();
            
        } catch (error) {
            console.error('❌ Error inicializando núcleo:', error);
            throw error;
        }
    }
    
    /**
     * Inicializar todos los subsistemas
     */
    async initializeSubsystems() {
        const initTasks = [];
        
        // Browser Nativo
        if (this.options.enableBrowser) {
            initTasks.push(this.initNativeBrowser());
        }
        
        // Live Server
        if (this.options.enableLiveServer) {
            initTasks.push(this.initLiveServer());
        }
        
        // Docker Integration
        if (this.options.enableDocker) {
            initTasks.push(this.initDockerIntegration());
        }
        
        // URL Router
        if (this.options.enableURLs) {
            initTasks.push(this.initURLRouter());
        }
        
        // Testing Engine
        if (this.options.enableTesting) {
            initTasks.push(this.initTestingEngine());
        }
        
        // Preview Sharing
        if (this.options.enableSharing) {
            initTasks.push(this.initPreviewSharing());
        }
        
        // Ejecutar todas las inicializaciones en paralelo
        const results = await Promise.allSettled(initTasks);
        
        // Verificar resultados
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.warn('⚠️ Algunos subsistemas fallaron al inicializar:', failures.map(f => f.reason.message));
        }
    }
    
    /**
     * Inicializar Browser Nativo
     */
    async initNativeBrowser() {
        try {
            this.nativeBrowser = new NativeBrowserIntegration();
            
            this.nativeBrowser.on('initialized', () => {
                console.log('✅ Browser Nativo inicializado');
            });
            
            this.nativeBrowser.on('window-created', (data) => {
                this.emit('window-created', data);
            });
            
            this.nativeBrowser.on('app-ready', (data) => {
                this.emit('app-ready', data);
            });
            
        } catch (error) {
            console.error('Error inicializando Browser Nativo:', error);
        }
    }
    
    /**
     * Inicializar Live Server
     */
    async initLiveServer() {
        try {
            this.liveServer = new LiveServerManager({
                port: 35729,
                host: 'localhost',
                debug: this.options.debug
            });
            
            this.liveServer.on('initialized', () => {
                console.log('✅ Live Server inicializado');
            });
            
            this.liveServer.on('started', (data) => {
                this.emit('live-server-started', data);
            });
            
            this.liveServer.on('project-created', (data) => {
                this.handleLiveServerProjectCreated(data);
            });
            
        } catch (error) {
            console.error('Error inicializando Live Server:', error);
        }
    }
    
    /**
     * Inicializar Docker Integration
     */
    async initDockerIntegration() {
        try {
            this.dockerIntegration = new DockerIntegration({
                host: 'localhost',
                sslEnabled: true
            });
            
            this.dockerIntegration.on('initialized', () => {
                console.log('✅ Docker Integration inicializado');
            });
            
            this.dockerIntegration.on('application-started', (data) => {
                this.handleDockerAppStarted(data);
            });
            
            this.dockerIntegration.on('database-started', (data) => {
                this.emit('database-started', data);
            });
            
        } catch (error) {
            console.error('Error inicializando Docker Integration:', error);
        }
    }
    
    /**
     * Inicializar URL Router
     */
    async initURLRouter() {
        try {
            this.urlRouter = new URLRouter({
                baseDomain: 'silhouette.local',
                previewDomain: 'silhouette.app',
                sslEnabled: true
            });
            
            this.urlRouter.on('initialized', () => {
                console.log('✅ URL Router inicializado');
            });
            
            this.urlRouter.on('url-created', (data) => {
                this.handleURLCreated(data);
            });
            
        } catch (error) {
            console.error('Error inicializando URL Router:', error);
        }
    }
    
    /**
     * Inicializar Testing Engine
     */
    async initTestingEngine() {
        try {
            this.testingEngine = new RealTestingEngine({
                headless: true,
                screenshotDir: 'test-screenshots',
                reportDir: 'test-reports'
            });
            
            this.testingEngine.on('initialized', () => {
                console.log('✅ Testing Engine inicializado');
            });
            
            this.testingEngine.on('test-completed', (data) => {
                this.emit('test-completed', data);
            });
            
        } catch (error) {
            console.error('Error inicializando Testing Engine:', error);
        }
    }
    
    /**
     * Inicializar Preview Sharing
     */
    async initPreviewSharing() {
        try {
            this.previewSharing = new PreviewSharing({
                port: 8080,
                domain: 'silhouette.app'
            });
            
            this.previewSharing.on('initialized', () => {
                console.log('✅ Preview Sharing inicializado');
            });
            
            this.previewSharing.on('preview-created', (data) => {
                this.emit('preview-created', data);
            });
            
        } catch (error) {
            console.error('Error inicializando Preview Sharing:', error);
        }
    }
    
    /**
     * Configurar integración entre subsistemas
     */
    setupSubsystemIntegration() {
        // Integrar Live Server con URL Router
        if (this.liveServer && this.urlRouter) {
            this.liveServer.on('file-changed', async (data) => {
                // Notificar cambios a través del sistema de URLs
                const projectId = this.getProjectIdByUrl(data.projectId);
                if (projectId) {
                    this.notifyProjectUpdate(projectId, {
                        type: 'file_changed',
                        file: data.file,
                        timestamp: data.timestamp
                    });
                }
            });
        }
        
        // Integrar Docker con Testing Engine
        if (this.dockerIntegration && this.testingEngine) {
            this.dockerIntegration.on('application-started', async (data) => {
                // Crear sesión de testing automáticamente para apps de Docker
                if (data.serviceId) {
                    this.createTestingSessionForApp(data.serviceId, data.url);
                }
            });
        }
        
        // Integrar URL Router con Preview Sharing
        if (this.urlRouter && this.previewSharing) {
            this.urlRouter.on('url-created', async (data) => {
                // Crear preview compartible automáticamente
                if (data.type === 'subdomain') {
                    await this.createPreviewForUrl(data.url, data.projectId);
                }
            });
        }
    }
    
    /**
     * Iniciar todos los servicios
     */
    async startServices() {
        if (this.isRunning) {
            return { success: false, message: 'Servicios ya están ejecutándose' };
        }
        
        try {
            console.log('🔄 Iniciando todos los servicios...');
            
            const startTasks = [];
            
            // Iniciar Live Server
            if (this.liveServer) {
                startTasks.push(this.liveServer.start());
            }
            
            // Iniciar Preview Sharing
            if (this.previewSharing) {
                startTasks.push(this.previewSharing.startServer());
            }
            
            // Ejecutar todos los starts en paralelo
            const results = await Promise.all(startTasks);
            
            // Verificar resultados
            const allSuccess = results.every(r => r.success);
            
            if (allSuccess) {
                this.isRunning = true;
                console.log('✅ Todos los servicios iniciados exitosamente');
                this.emit('services-started');
            } else {
                console.warn('⚠️ Algunos servicios fallaron al iniciar');
            }
            
            return { success: allSuccess };
            
        } catch (error) {
            console.error('Error iniciando servicios:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Crear nuevo proyecto integrado
     */
    async createIntegratedProject(projectConfig) {
        const projectId = this.generateProjectId();
        const {
            name,
            framework,
            sourcePath,
            services = [],
            database = null,
            testing = true,
            sharing = true
        } = projectConfig;
        
        try {
            console.log(`🚀 Creando proyecto integrado: ${name}`);
            
            const project = {
                id: projectId,
                name: name,
                framework: framework,
                sourcePath: sourcePath,
                status: 'creating',
                createdAt: new Date(),
                services: [],
                urls: [],
                testSession: null,
                preview: null
            };
            
            this.activeProjects.set(projectId, project);
            
            // Paso 1: Crear aplicación en Docker
            const appResult = await this.dockerIntegration.runApplication({
                name: name,
                framework: framework,
                sourcePath: sourcePath
            });
            
            if (appResult.success) {
                project.services.push({
                    id: appResult.serviceId,
                    type: 'application',
                    url: appResult.url,
                    status: 'running'
                });
            }
            
            // Paso 2: Crear base de datos si se solicita
            if (database) {
                const dbResult = await this.dockerIntegration.runDatabase(database);
                if (dbResult.success) {
                    project.services.push({
                        id: dbResult.serviceId,
                        type: 'database',
                        database: database,
                        url: dbResult.url,
                        status: 'running'
                    });
                }
            }
            
            // Paso 3: Crear URL personalizada
            if (this.urlRouter) {
                const urlResult = await this.urlRouter.createProjectUrl({
                    name: name,
                    framework: framework,
                    projectId: projectId,
                    ssl: true
                });
                
                if (urlResult.success) {
                    project.urls.push({
                        url: urlResult.url,
                        type: urlResult.type,
                        status: 'active'
                    });
                }
            }
            
            // Paso 4: Crear sesión de testing
            if (testing && this.testingEngine && appResult.success) {
                const testSession = await this.testingEngine.createTestSession({
                    name: `${name} Test Session`,
                    url: appResult.url,
                    browser: 'chrome'
                });
                
                if (testSession.success) {
                    project.testSession = testSession.sessionId;
                }
            }
            
            // Paso 5: Crear preview compartible
            if (sharing && this.previewSharing && appResult.success) {
                const previewResult = await this.previewSharing.createPreview({
                    name: name,
                    description: `Preview de ${name} - ${framework}`,
                    targetUrl: appResult.url,
                    framework: framework,
                    projectId: projectId,
                    expiresIn: 86400000 // 24 horas
                });
                
                if (previewResult.success) {
                    project.preview = {
                        id: previewResult.previewId,
                        url: previewResult.previewUrl,
                        accessToken: previewResult.accessToken
                    };
                }
            }
            
            // Paso 6: Configurar Live Server para el proyecto
            if (this.liveServer) {
                await this.liveServer.createProject({
                    name: name,
                    rootPath: sourcePath,
                    framework: framework
                });
            }
            
            // Paso 7: Crear ventana nativa para preview
            if (this.nativeBrowser && appResult.success) {
                const windowResult = await this.nativeBrowser.createAppWindow({
                    title: `${name} - Silhouette`,
                    url: appResult.url,
                    width: 1200,
                    height: 800
                });
                
                if (windowResult.success) {
                    project.nativeWindow = windowResult.windowId;
                }
            }
            
            project.status = 'running';
            
            console.log(`✅ Proyecto integrado creado: ${name}`);
            
            this.emit('project-created', {
                projectId,
                project: {
                    name: name,
                    framework: framework,
                    status: project.status,
                    services: project.services,
                    urls: project.urls,
                    preview: project.preview,
                    testSession: project.testSession
                }
            });
            
            return {
                success: true,
                projectId,
                project: project
            };
            
        } catch (error) {
            console.error(`Error creando proyecto integrado ${name}:`, error);
            
            // Limpiar en caso de error
            await this.cleanupProject(projectId);
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Ejecutar test automatizado en proyecto
     */
    async runAutomatedTest(projectId, testConfig) {
        const project = this.activeProjects.get(projectId);
        if (!project) {
            return { success: false, error: 'Proyecto no encontrado' };
        }
        
        if (!this.testingEngine) {
            return { success: false, error: 'Testing Engine no disponible' };
        }
        
        try {
            // Usar sesión existente o crear nueva
            let sessionId = project.testSession;
            if (!sessionId) {
                const appService = project.services.find(s => s.type === 'application');
                if (!appService) {
                    return { success: false, error: 'No hay servicio de aplicación disponible' };
                }
                
                const sessionResult = await this.testingEngine.createTestSession({
                    name: `${project.name} Test Session`,
                    url: appService.url,
                    browser: 'chrome'
                });
                
                if (!sessionResult.success) {
                    return sessionResult;
                }
                
                sessionId = sessionResult.sessionId;
                project.testSession = sessionId;
            }
            
            // Ejecutar test
            const testResult = await this.testingEngine.runAutomatedTest(sessionId, testConfig);
            
            if (testResult.success) {
                // Generar reporte
                const reportResult = await this.testingEngine.generateTestReport(testResult.testId);
                
                this.emit('test-completed', {
                    projectId,
                    testId: testResult.testId,
                    result: testResult.result,
                    report: reportResult.report
                });
            }
            
            return testResult;
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Crear URL de preview compartible
     */
    async createPreviewUrl(projectId, options = {}) {
        const project = this.activeProjects.get(projectId);
        if (!project) {
            return { success: false, error: 'Proyecto no encontrado' };
        }
        
        if (!this.previewSharing) {
            return { success: false, error: 'Preview Sharing no disponible' };
        }
        
        try {
            const appService = project.services.find(s => s.type === 'application');
            if (!appService) {
                return { success: false, error: 'No hay servicio de aplicación disponible' };
            }
            
            const previewResult = await this.previewSharing.createPreview({
                name: project.name,
                description: options.description || `Preview de ${project.name}`,
                targetUrl: appService.url,
                framework: project.framework,
                projectId: projectId,
                expiresIn: options.expiresIn || 86400000, // 24 horas
                accessLevel: options.accessLevel || 'public'
            });
            
            if (previewResult.success) {
                project.preview = {
                    id: previewResult.previewId,
                    url: previewResult.previewUrl,
                    accessToken: previewResult.accessToken
                };
                
                this.emit('preview-url-created', {
                    projectId,
                    previewUrl: previewResult.previewUrl,
                    previewId: previewResult.previewId
                });
            }
            
            return previewResult;
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Obtener estado completo del proyecto
     */
    getProjectStatus(projectId) {
        const project = this.activeProjects.get(projectId);
        if (!project) {
            return null;
        }
        
        return {
            id: project.id,
            name: project.name,
            framework: project.framework,
            status: project.status,
            createdAt: project.createdAt,
            services: project.services,
            urls: project.urls,
            preview: project.preview,
            testSession: project.testSession,
            nativeWindow: project.nativeWindow
        };
    }
    
    /**
     * Listar todos los proyectos activos
     */
    listActiveProjects() {
        return Array.from(this.activeProjects.values()).map(project => ({
            id: project.id,
            name: project.name,
            framework: project.framework,
            status: project.status,
            createdAt: project.createdAt,
            serviceCount: project.services.length,
            urlCount: project.urls.length,
            hasPreview: !!project.preview,
            hasTestSession: !!project.testSession
        }));
    }
    
    /**
     * Detener proyecto
     */
    async stopProject(projectId) {
        const project = this.activeProjects.get(projectId);
        if (!project) {
            return { success: false, error: 'Proyecto no encontrado' };
        }
        
        try {
            console.log(`🛑 Deteniendo proyecto: ${project.name}`);
            
            // Detener servicios Docker
            for (const service of project.services) {
                if (service.type === 'application' || service.type === 'database') {
                    try {
                        await this.dockerIntegration.stopApplication(service.id);
                    } catch (error) {
                        console.warn(`Error deteniendo servicio ${service.id}:`, error.message);
                    }
                }
            }
            
            // Cerrar sesión de testing
            if (project.testSession && this.testingEngine) {
                try {
                    await this.testingEngine.closeTestSession(project.testSession);
                } catch (error) {
                    console.warn(`Error cerrando sesión de testing:`, error.message);
                }
            }
            
            // Cerrar ventana nativa
            if (project.nativeWindow && this.nativeBrowser) {
                try {
                    await this.nativeBrowser.closeAppWindow(project.nativeWindow);
                } catch (error) {
                    console.warn(`Error cerrando ventana nativa:`, error.message);
                }
            }
            
            // Remover URLs
            for (const urlInfo of project.urls) {
                if (this.urlRouter) {
                    try {
                        await this.urlRouter.removeUrl(urlInfo.url);
                    } catch (error) {
                        console.warn(`Error removiendo URL:`, error.message);
                    }
                }
            }
            
            project.status = 'stopped';
            this.activeProjects.delete(projectId);
            
            console.log(`✅ Proyecto detenido: ${project.name}`);
            
            this.emit('project-stopped', { projectId });
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Obtener estadísticas globales
     */
    getGlobalStats() {
        return {
            core: {
                initialized: this.isInitialized,
                running: this.isRunning,
                activeProjects: this.activeProjects.size,
                uptime: process.uptime()
            },
            nativeBrowser: this.nativeBrowser ? {
                available: this.nativeBrowser.isReady(),
                windowCount: this.nativeBrowser.listActiveWindows().length
            } : null,
            liveServer: this.liveServer ? {
                available: this.liveServer.isServerInitialized(),
                running: this.liveServer.isServerRunning(),
                projectCount: this.liveServer.listProjects().length,
                clientCount: this.liveServer.getStats().clients.total
            } : null,
            docker: this.dockerIntegration ? {
                available: this.dockerIntegration.isDockerReady(),
                serviceCount: this.dockerIntegration.getStats().services.total,
                runningContainers: this.dockerIntegration.getStats().containers.total
            } : null,
            urlRouter: this.urlRouter ? {
                available: this.urlRouter.isRouterReady(),
                activeUrls: this.urlRouter.listActiveUrls().length,
                totalUrls: this.urlRouter.getUrlStats().total
            } : null,
            testing: this.testingEngine ? {
                available: this.testingEngine.isTestingReady(),
                activeSessions: this.testingEngine.getStats().activeSessions,
                totalTests: this.testingEngine.getStats().totalTests
            } : null,
            previewSharing: this.previewSharing ? {
                available: this.previewSharing.isSharingReady(),
                serverRunning: this.previewSharing.getStats().serverRunning,
                activePreviews: this.previewSharing.getStats().activePreviews,
                totalViews: this.previewSharing.getStats().totalViews
            } : null
        };
    }
    
    /**
     * Handlers de eventos entre subsistemas
     */
    
    handleLiveServerProjectCreated(data) {
        this.emit('live-project-created', data);
    }
    
    handleDockerAppStarted(data) {
        this.emit('docker-app-started', data);
    }
    
    handleURLCreated(data) {
        this.emit('url-created', data);
    }
    
    /**
     * Utilidades auxiliares
     */
    
    generateProjectId() {
        return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getProjectIdByUrl(url) {
        for (const [projectId, project] of this.activeProjects) {
            if (project.urls.some(u => u.url === url)) {
                return projectId;
            }
        }
        return null;
    }
    
    async createTestingSessionForApp(serviceId, url) {
        if (!this.testingEngine) return;
        
        try {
            await this.testingEngine.createTestSession({
                name: `Test Session for ${serviceId}`,
                url: url,
                browser: 'chrome'
            });
        } catch (error) {
            console.warn('Error creando sesión de testing:', error.message);
        }
    }
    
    async createPreviewForUrl(url, projectId) {
        if (!this.previewSharing) return;
        
        try {
            const project = this.activeProjects.get(projectId);
            if (!project) return;
            
            await this.previewSharing.createPreview({
                name: project.name,
                description: `Auto-generated preview for ${project.name}`,
                targetUrl: url,
                framework: project.framework,
                projectId: projectId
            });
        } catch (error) {
            console.warn('Error creando preview automático:', error.message);
        }
    }
    
    notifyProjectUpdate(projectId, update) {
        this.emit('project-updated', { projectId, update });
    }
    
    /**
     * Configuración del sistema
     */
    
    setupGlobalErrorHandling() {
        process.on('uncaughtException', (error) => {
            console.error('Error no capturado:', error);
            this.emit('error', { type: 'uncaught', error: error.message });
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Promesa rechazada no manejada:', reason);
            this.emit('error', { type: 'unhandled-rejection', reason: reason });
        });
    }
    
    setupAutoCleanup() {
        // Limpiar proyectos inactivos cada 10 minutos
        setInterval(() => {
            this.cleanupInactiveProjects();
        }, 600000);
    }
    
    async cleanupInactiveProjects() {
        const now = Date.now();
        const inactiveThreshold = 3600000; // 1 hora
        
        for (const [projectId, project] of this.activeProjects) {
            if (now - project.createdAt.getTime() > inactiveThreshold) {
                console.log(`🧹 Limpiando proyecto inactivo: ${project.name}`);
                await this.stopProject(projectId);
            }
        }
    }
    
    async cleanupProject(projectId) {
        try {
            await this.stopProject(projectId);
        } catch (error) {
            console.warn(`Error limpiando proyecto ${projectId}:`, error.message);
        }
    }
    
    logSystemStatus() {
        const stats = this.getGlobalStats();
        console.log('📊 Estado del Sistema:');
        console.log(`   - Core inicializado: ${stats.core.initialized ? '✅' : '❌'}`);
        console.log(`   - Servicios ejecutándose: ${stats.core.running ? '✅' : '❌'}`);
        console.log(`   - Proyectos activos: ${stats.core.activeProjects}`);
        if (stats.nativeBrowser) console.log(`   - Browser nativo: ${stats.nativeBrowser.available ? '✅' : '❌'}`);
        if (stats.liveServer) console.log(`   - Live Server: ${stats.liveServer.running ? '✅' : '❌'}`);
        if (stats.docker) console.log(`   - Docker: ${stats.docker.available ? '✅' : '❌'}`);
        if (stats.urlRouter) console.log(`   - URL Router: ${stats.urlRouter.available ? '✅' : '❌'}`);
        if (stats.testing) console.log(`   - Testing: ${stats.testing.available ? '✅' : '❌'}`);
        if (stats.previewSharing) console.log(`   - Preview Sharing: ${stats.previewSharing.serverRunning ? '✅' : '❌'}`);
    }
    
    /**
     * Detener todos los servicios
     */
    async shutdown() {
        console.log('🛑 Cerrando Núcleo de Integración Nativa...');
        
        // Detener todos los proyectos
        const stopPromises = Array.from(this.activeProjects.keys()).map(projectId => {
            return this.stopProject(projectId).catch(console.error);
        });
        
        await Promise.all(stopPromises);
        
        // Detener subsistemas
        if (this.liveServer) await this.liveServer.stop();
        if (this.previewSharing) await this.previewSharing.stopServer();
        
        // Destruir subsistemas
        if (this.nativeBrowser) this.nativeBrowser.destroy();
        if (this.liveServer) this.liveServer.destroy();
        if (this.dockerIntegration) this.dockerIntegration.destroy();
        if (this.urlRouter) this.urlRouter.destroy();
        if (this.testingEngine) this.testingEngine.destroy();
        if (this.previewSharing) this.previewSharing.destroy();
        
        this.isRunning = false;
        this.isInitialized = false;
        
        this.removeAllListeners();
        console.log('✅ Núcleo de Integración Nativa cerrado');
    }
}

module.exports = NativeIntegrationCore;