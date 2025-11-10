/**
 * SILHOUETTE V5.1 - INICIALIZACIÓN DE SISTEMA NATIVO
 * Conecta la nueva plataforma de desarrollo nativo con la aplicación principal
 * 
 * Este archivo inicializa todos los subsistemas de desarrollo nativo:
 * - NativeBrowserIntegration
 * - LiveServerManager  
 * - DockerIntegration
 * - URLRouter
 * - RealTestingEngine
 * - PreviewSharing
 * 
 * Proporciona una interfaz unificada para el renderer process
 */

const { ipcMain, BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Inicializador del Sistema Nativo V5.1
 */
class NativeSystemInitializer {
    constructor() {
        this.nativeCore = null;
        this.isInitialized = false;
        this.config = {
            workspacePath: path.join(__dirname, '../../../workspace'),
            tempPath: path.join(__dirname, '../../../temp'),
            enableDebug: process.env.NODE_ENV === 'development'
        };
    }

    /**
     * Inicializar todo el sistema nativo
     */
    async initialize() {
        try {
            console.log('🚀 Inicializando Silhouette V5.1 - Sistema Nativo...');

            // Cargar el núcleo de integración nativa
            await this.loadNativeCore();

            // Configurar IPC handlers
            this.setupIpcHandlers();

            // Configurar manejo de ventanas nativas
            this.setupNativeWindowHandlers();

            // Configurar monitoreo de sistema
            this.setupSystemMonitoring();

            this.isInitialized = true;
            console.log('✅ Silhouette V5.1 - Sistema Nativo inicializado correctamente');

            return {
                success: true,
                version: '5.1.0',
                components: {
                    nativeBrowser: !!this.nativeCore.nativeBrowser,
                    liveServer: !!this.nativeCore.liveServer,
                    docker: !!this.nativeCore.dockerIntegration,
                    urlRouter: !!this.nativeCore.urlRouter,
                    testing: !!this.nativeCore.testingEngine,
                    sharing: !!this.nativeCore.previewSharing
                }
            };

        } catch (error) {
            console.error('❌ Error inicializando Sistema Nativo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cargar el núcleo de integración nativa
     */
    async loadNativeCore() {
        try {
            // Cargar la clase NativeIntegrationCore
            const NativeIntegrationCore = require(path.join(__dirname, '../native-integration/native-integration-core'));
            
            // Inicializar el núcleo
            this.nativeCore = new NativeIntegrationCore({
                workspacePath: this.config.workspacePath,
                tempPath: this.config.tempPath,
                debug: this.config.enableDebug,
                
                // Configuración de subsistemas
                enableBrowser: true,
                enableLiveServer: true,
                enableDocker: true,
                enableURLs: true,
                enableTesting: true,
                enableSharing: true
            });

            // Configurar eventos del núcleo
            this.setupCoreEventHandlers();

        } catch (error) {
            console.error('Error cargando NativeIntegrationCore:', error);
            throw error;
        }
    }

    /**
     * Configurar eventos del núcleo
     */
    setupCoreEventHandlers() {
        if (!this.nativeCore) return;

        // Eventos de proyectos
        this.nativeCore.on('project-created', (data) => {
            console.log(`📦 Proyecto creado: ${data.project.name}`);
            this.broadcastToRenderers('native:project-created', data);
        });

        this.nativeCore.on('project-started', (data) => {
            console.log(`▶️ Proyecto iniciado: ${data.projectId}`);
            this.broadcastToRenderers('native:project-started', data);
        });

        this.nativeCore.on('project-stopped', (data) => {
            console.log(`⏹️ Proyecto detenido: ${data.projectId}`);
            this.broadcastToRenderers('native:project-stopped', data);
        });

        // Eventos de servicios
        this.nativeCore.on('service-started', (data) => {
            console.log(`🐳 Servicio iniciado: ${data.service.name}`);
            this.broadcastToRenderers('native:service-started', data);
        });

        // Eventos de URLs
        this.nativeCore.on('url-created', (data) => {
            console.log(`🌐 URL creada: ${data.url}`);
            this.broadcastToRenderers('native:url-created', data);
        });

        // Eventos de testing
        this.nativeCore.on('test-completed', (data) => {
            console.log(`🧪 Tests completados: ${data.result.success ? 'ÉXITO' : 'FALLO'}`);
            this.broadcastToRenderers('native:test-completed', data);
        });

        // Eventos de preview sharing
        this.nativeCore.on('preview-created', (data) => {
            console.log(`📤 Preview creado: ${data.previewUrl}`);
            this.broadcastToRenderers('native:preview-created', data);
        });

        // Eventos de sistema
        this.nativeCore.on('services-started', () => {
            console.log('🔄 Todos los servicios iniciados');
            this.broadcastToRenderers('native:services-started', {});
        });

        this.nativeCore.on('error', (data) => {
            console.error('❌ Error en sistema nativo:', data);
            this.broadcastToRenderers('native:error', data);
        });
    }

    /**
     * Configurar IPC handlers para comunicación con renderer
     */
    setupIpcHandlers() {
        // Gestión de proyectos
        ipcMain.handle('native:create-project', async (event, projectConfig) => {
            try {
                const result = await this.nativeCore.createIntegratedProject(projectConfig);
                return result;
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('native:list-projects', async () => {
            return this.nativeCore.listActiveProjects();
        });

        ipcMain.handle('native:stop-project', async (event, projectId) => {
            try {
                return await this.nativeCore.stopProject(projectId);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Gestión de testing
        ipcMain.handle('native:run-tests', async (event, projectId, testConfig) => {
            try {
                return await this.nativeCore.runAutomatedTest(projectId, testConfig);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Gestión de URLs
        ipcMain.handle('native:create-preview-url', async (event, projectId, options) => {
            try {
                return await this.nativeCore.createPreviewUrl(projectId, options);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Estados de sistema
        ipcMain.handle('native:get-system-stats', async () => {
            return this.nativeCore.getGlobalStats();
        });

        // Iniciar servicios
        ipcMain.handle('native:start-services', async () => {
            try {
                return await this.nativeCore.startServices();
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Información de sistema
        ipcMain.handle('native:get-version', async () => {
            return {
                version: '5.1.0',
                codename: 'Revolución Nativa',
                features: [
                    'Native Browser Integration',
                    'Live Server with Hot Reload',
                    'Docker Container Management',
                    'Custom URL Generation',
                    'Real Testing with Puppeteer',
                    'Enterprise Preview Sharing'
                ]
            };
        });

        // Gestión de ventanas nativas
        ipcMain.handle('native:create-window', async (event, config) => {
            try {
                if (!this.nativeCore.nativeBrowser) {
                    throw new Error('Native Browser no está disponible');
                }
                return await this.nativeCore.nativeBrowser.createAppWindow(config);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('native:close-window', async (event, windowId) => {
            try {
                if (!this.nativeCore.nativeBrowser) {
                    throw new Error('Native Browser no está disponible');
                }
                return await this.nativeCore.nativeBrowser.closeAppWindow(windowId);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Gestión de URLs personalizadas
        ipcMain.handle('native:create-custom-url', async (event, urlConfig) => {
            try {
                if (!this.nativeCore.urlRouter) {
                    throw new Error('URL Router no está disponible');
                }
                return await this.nativeCore.urlRouter.createProjectUrl(urlConfig);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Testing engine directo
        ipcMain.handle('native:create-test-session', async (event, sessionConfig) => {
            try {
                if (!this.nativeCore.testingEngine) {
                    throw new Error('Testing Engine no está disponible');
                }
                return await this.nativeCore.testingEngine.createTestSession(sessionConfig);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Docker management directo
        ipcMain.handle('native:run-app-container', async (event, appConfig) => {
            try {
                if (!this.nativeCore.dockerIntegration) {
                    throw new Error('Docker Integration no está disponible');
                }
                return await this.nativeCore.dockerIntegration.runApplication(appConfig);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    /**
     * Configurar manejo de ventanas nativas
     */
    setupNativeWindowHandlers() {
        if (!this.nativeCore?.nativeBrowser) return;

        // Escuchar eventos de ventanas nativas
        this.nativeCore.nativeBrowser.on('window-created', (data) => {
            console.log(`🪟 Ventana nativa creada: ${data.windowId}`);
            this.broadcastToRenderers('native:window-created', data);
        });

        this.nativeCore.nativeBrowser.on('window-closed', (data) => {
            console.log(`🗑️ Ventana nativa cerrada: ${data.windowId}`);
            this.broadcastToRenderers('native:window-closed', data);
        });

        this.nativeCore.nativeBrowser.on('app-ready', (data) => {
            console.log(`✅ Aplicación lista en ventana: ${data.windowId}`);
            this.broadcastToRenderers('native:app-ready', data);
        });

        this.nativeCore.nativeBrowser.on('app-error', (data) => {
            console.error(`❌ Error en aplicación: ${data.error.message}`);
            this.broadcastToRenderers('native:app-error', data);
        });
    }

    /**
     * Configurar monitoreo de sistema
     */
    setupSystemMonitoring() {
        // Monitoreo de estadísticas cada 30 segundos
        setInterval(() => {
            if (this.isInitialized && this.nativeCore) {
                const stats = this.nativeCore.getGlobalStats();
                this.broadcastToRenderers('native:stats-update', stats);
            }
        }, 30000);

        // Limpieza de recursos cada 5 minutos
        setInterval(() => {
            if (this.isInitialized && this.nativeCore) {
                this.performCleanup();
            }
        }, 300000);
    }

    /**
     * Limpiar recursos del sistema
     */
    async performCleanup() {
        try {
            // Limpiar proyectos inactivos
            if (this.nativeCore?.cleanupInactiveProjects) {
                await this.nativeCore.cleanupInactiveProjects();
            }

            // Limpiar archivos temporales
            this.cleanupTempFiles();

            console.log('🧹 Limpieza de sistema completada');
        } catch (error) {
            console.warn('⚠️ Error durante limpieza de sistema:', error.message);
        }
    }

    /**
     * Limpiar archivos temporales
     */
    cleanupTempFiles() {
        try {
            const tempDir = this.config.tempPath;
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                const now = Date.now();
                const maxAge = 3600000; // 1 hora

                files.forEach(file => {
                    const filePath = path.join(tempDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (now - stats.mtime.getTime() > maxAge) {
                        fs.unlinkSync(filePath);
                    }
                });
            }
        } catch (error) {
            console.warn('Error limpiando archivos temporales:', error.message);
        }
    }

    /**
     * Enviar mensaje a todos los renderers
     */
    broadcastToRenderers(channel, data) {
        // Esta función será llamada desde el contexto de main process
        // Los renderers se suscribirán a estos eventos
        if (global.mainWindow && !global.mainWindow.isDestroyed()) {
            global.mainWindow.webContents.send(channel, data);
        }
    }

    /**
     * Obtener estado del sistema
     */
    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            core: !!this.nativeCore,
            version: '5.1.0',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: process.platform,
            nodeVersion: process.version
        };
    }

    /**
     * Apagar el sistema
     */
    async shutdown() {
        try {
            console.log('🛑 Apagando Silhouette V5.1 - Sistema Nativo...');

            if (this.nativeCore) {
                await this.nativeCore.shutdown();
            }

            this.isInitialized = false;
            console.log('✅ Sistema Nativo apagado correctamente');

        } catch (error) {
            console.error('❌ Error apagando Sistema Nativo:', error);
        }
    }
}

// Exportar el inicializador
module.exports = NativeSystemInitializer;

// Auto-inicialización si se ejecuta directamente
if (require.main === module) {
    const initializer = new NativeSystemInitializer();
    
    initializer.initialize().then((result) => {
        if (result.success) {
            console.log('🎉 Silhouette V5.1 Sistema Nativo listo para usar');
            console.log('🔧 Componentes disponibles:', Object.keys(result.components).filter(k => result.components[k]).join(', '));
        } else {
            console.error('❌ Error en inicialización:', result.error);
        }
    }).catch(console.error);

    // Manejar cierre de aplicación
    process.on('SIGINT', async () => {
        console.log('\n🛑 Cerrando Silhouette V5.1...');
        await initializer.shutdown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await initializer.shutdown();
        process.exit(0);
    });
}