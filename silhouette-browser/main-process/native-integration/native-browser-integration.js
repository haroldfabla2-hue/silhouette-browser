const { BrowserWindow, WebContentsView, ipcMain, dialog } = require('electron');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

/**
 * Sistema de Integración Nativa con Browser
 * Control directo de aplicaciones web usando WebContentsView de Electron
 * Inspirado en Gemini Canvas y MiniMax Agent
 */
class NativeBrowserIntegration extends EventEmitter {
    constructor() {
        super();
        this.webContentsViews = new Map();
        this.activeSessions = new Map();
        this.scriptInjectionQueue = [];
        this.isInitialized = false;
        
        // Configuración de ventanas de aplicaciones
        this.appWindowConfig = {
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            show: false,
            frame: true,
            title: 'Silhouette App Preview',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                webSecurity: true,
                allowRunningInsecureContent: false,
                experimentalFeatures: false
            }
        };
        
        // Scripts de inyección para comunicación nativa
        this.injectionScripts = {
            bridge: `
                window.nativeBridge = {
                    // Comunicación bidireccional con Silhouette
                    sendToHost: (message) => {
                        window.postMessage({ type: 'SILHOUETTE_BRIDGE', payload: message }, '*');
                    },
                    
                    // Escuchar mensajes del host
                    onHostMessage: (callback) => {
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'SILHOUETTE_HOST') {
                                callback(event.data.payload);
                            }
                        });
                    },
                    
                    // API para solicitar URLs
                    getAppInfo: () => {
                        return {
                            url: window.location.href,
                            title: document.title,
                            userAgent: navigator.userAgent,
                            viewport: {
                                width: window.innerWidth,
                                height: window.innerHeight
                            }
                        };
                    },
                    
                    // API para capturar errores
                    captureErrors: () => {
                        window.addEventListener('error', (event) => {
                            window.nativeBridge.sendToHost({
                                type: 'error',
                                message: event.message,
                                filename: event.filename,
                                lineno: event.lineno,
                                colno: event.colno
                            });
                        });
                    },
                    
                    // API para medir performance
                    getPerformance: () => {
                        const timing = performance.timing;
                        return {
                            loadTime: timing.loadEventEnd - timing.navigationStart,
                            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                            firstByte: timing.responseStart - timing.navigationStart
                        };
                    }
                };
                
                // Configurar captura de errores automáticamente
                window.nativeBridge.captureErrors();
                
                // Notificar al host que la página está lista
                setTimeout(() => {
                    window.nativeBridge.sendToHost({
                        type: 'page_ready',
                        url: window.location.href,
                        timestamp: Date.now()
                    });
                }, 1000);
            `,
            
            hotReload: `
                // Sistema de Hot Reload
                let lastUpdate = Date.now();
                
                // Observador de cambios en el DOM
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' || mutation.type === 'attributes') {
                            lastUpdate = Date.now();
                        }
                    });
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeOldValue: true
                });
                
                // API de hot reload
                window.hotReload = {
                    onUpdate: (callback) => {
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'SILHOUETTE_HOT_RELOAD') {
                                callback(event.data.payload);
                            }
                        });
                    },
                    
                    requestUpdate: () => {
                        window.nativeBridge.sendToHost({
                            type: 'hot_reload_request',
                            lastUpdate: lastUpdate
                        });
                    },
                    
                    applyUpdate: (updateData) => {
                        if (updateData.type === 'reload') {
                            window.location.reload();
                        } else if (updateData.type === 'refresh') {
                            // Hot module replacement
                            window.location.reload();
                        }
                    }
                };
                
                // Solicitar update inicial
                setTimeout(() => {
                    window.hotReload.requestUpdate();
                }, 2000);
            `
        };
        
        this.init();
    }
    
    /**
     * Inicializar el sistema de integración nativa
     */
    async init() {
        console.log('🚀 Inicializando integración nativa con browser...');
        
        // Configurar IPC handlers
        this.setupIpcHandlers();
        
        // Configurar monitoreo de mensajes de ventanas
        this.setupMessageHandlers();
        
        this.isInitialized = true;
        this.emit('initialized');
        
        console.log('✅ Integración nativa con browser inicializada');
    }
    
    /**
     * Configurar handlers de IPC
     */
    setupIpcHandlers() {
        // Crear nueva ventana de aplicación
        ipcMain.handle('native-browser:create-window', async (event, config) => {
            return await this.createAppWindow(config);
        });
        
        // Cerrar ventana de aplicación
        ipcMain.handle('native-browser:close-window', async (event, windowId) => {
            return await this.closeAppWindow(windowId);
        });
        
        // Inyectar script en ventana
        ipcMain.handle('native-browser:inject-script', async (event, windowId, script) => {
            return await this.injectScript(windowId, script);
        });
        
        // Enviar mensaje a ventana
        ipcMain.handle('native-browser:send-message', async (event, windowId, message) => {
            return await this.sendMessageToWindow(windowId, message);
        });
        
        // Obtener información de ventana
        ipcMain.handle('native-browser:get-info', async (event, windowId) => {
            return await this.getWindowInfo(windowId);
        });
        
        // Listar ventanas activas
        ipcMain.handle('native-browser:list-windows', async () => {
            return this.listActiveWindows();
        });
    }
    
    /**
     * Configurar manejo de mensajes de ventanas
     */
    setupMessageHandlers() {
        // Escuchar mensajes de WebContents
        ipcMain.on('web-contents-message', (event, windowId, message) => {
            this.handleWindowMessage(windowId, message);
        });
    }
    
    /**
     * Crear nueva ventana de aplicación
     */
    async createAppWindow(config = {}) {
        try {
            const windowId = this.generateWindowId();
            
            // Combinar configuración por defecto con configuración personalizada
            const windowConfig = {
                ...this.appWindowConfig,
                ...config,
                webPreferences: {
                    ...this.appWindowConfig.webPreferences,
                    ...config.webPreferences
                }
            };
            
            // Crear nueva ventana
            const appWindow = new BrowserWindow(windowConfig);
            
            // Crear WebContentsView para la aplicación
            const webView = new WebContentsView({
                webPreferences: {
                    ...windowConfig.webPreferences,
                    preload: path.join(__dirname, '../preload/native-bridge-preload.js')
                }
            });
            
            // Configurar WebContentsView
            appWindow.addBrowserView(webView);
            this.setupWebContentsView(webView, windowId, appWindow);
            
            // Almacenar referencias
            this.webContentsViews.set(windowId, {
                webView: webView,
                appWindow: appWindow,
                config: windowConfig,
                createdAt: new Date(),
                url: null
            });
            
            // Configurar eventos de la ventana
            this.setupWindowEvents(appWindow, windowId);
            
            // Si hay URL inicial, cargarla
            if (config.url) {
                await this.loadUrl(windowId, config.url);
            } else {
                // Cargar página de bienvenida
                await this.loadWelcomePage(windowId);
            }
            
            console.log(`✅ Ventana de aplicación creada: ${windowId}`);
            return {
                windowId: windowId,
                success: true,
                info: {
                    createdAt: new Date(),
                    config: windowConfig
                }
            };
            
        } catch (error) {
            console.error('❌ Error creando ventana de aplicación:', error);
            throw new Error(`Error creando ventana: ${error.message}`);
        }
    }
    
    /**
     * Configurar WebContentsView
     */
    setupWebContentsView(webView, windowId, appWindow) {
        // Configurar eventos de carga
        webView.webContents.on('did-start-loading', () => {
            this.emit('window-loading', { windowId, url: webView.webContents.getURL() });
        });
        
        webView.webContents.on('did-finish-load', () => {
            this.emit('window-loaded', { windowId, url: webView.webContents.getURL() });
            
            // Inyectar scripts de bridge automáticamente
            setTimeout(() => {
                this.injectBridgeScripts(windowId);
            }, 1000);
        });
        
        webView.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            this.emit('window-error', {
                windowId,
                error: { errorCode, errorDescription, url: validatedURL }
            });
        });
        
        // Configurar manejo de nuevos recursos
        webView.webContents.on('new-window', (event, navigationUrl) => {
            event.preventDefault();
            // Abrir en nueva ventana de Silhouette
            this.createAppWindow({ url: navigationUrl });
        });
        
        // Configurar captura de console
        webView.webContents.on('console-message', (event, level, message, line, sourceId) => {
            this.emit('console-message', {
                windowId,
                level,
                message,
                line,
                sourceId
            });
        });
    }
    
    /**
     * Configurar eventos de ventana
     */
    setupWindowEvents(appWindow, windowId) {
        appWindow.on('closed', () => {
            this.closeAppWindow(windowId);
        });
        
        appWindow.on('focus', () => {
            this.emit('window-focused', { windowId });
        });
        
        appWindow.on('blur', () => {
            this.emit('window-blurred', { windowId });
        });
        
        // Manejar redimensionamiento
        appWindow.on('resize', () => {
            const [width, height] = appWindow.getSize();
            this.emit('window-resized', { windowId, width, height });
        });
    }
    
    /**
     * Inyectar scripts de bridge automáticamente
     */
    async injectBridgeScripts(windowId) {
        const windowData = this.webContentsViews.get(windowId);
        if (!windowData) return;
        
        try {
            // Inyectar script principal de bridge
            await this.injectScript(windowId, this.injectionScripts.bridge);
            
            // Inyectar script de hot reload
            await this.injectScript(windowId, this.injectionScripts.hotReload);
            
            console.log(`✅ Scripts de bridge inyectados en ventana: ${windowId}`);
            
        } catch (error) {
            console.error(`❌ Error inyectando scripts en ventana ${windowId}:`, error);
        }
    }
    
    /**
     * Inyectar script en ventana
     */
    async injectScript(windowId, script) {
        const windowData = this.webContentsViews.get(windowId);
        if (!windowData) {
            throw new Error(`Ventana ${windowId} no encontrada`);
        }
        
        try {
            await windowData.webView.webContents.executeJavaScript(script);
            return { success: true, injected: true };
        } catch (error) {
            console.error(`Error inyectando script en ventana ${windowId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Enviar mensaje a ventana
     */
    async sendMessageToWindow(windowId, message) {
        const windowData = this.webContentsViews.get(windowId);
        if (!windowData) {
            throw new Error(`Ventana ${windowId} no encontrada`);
        }
        
        try {
            // Enviar mensaje via postMessage
            const script = `
                window.postMessage({
                    type: 'SILHOUETTE_HOST',
                    payload: ${JSON.stringify(message)}
                }, '*');
            `;
            
            await windowData.webView.webContents.executeJavaScript(script);
            return { success: true };
        } catch (error) {
            console.error(`Error enviando mensaje a ventana ${windowId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Cargar URL en ventana
     */
    async loadUrl(windowId, url) {
        const windowData = this.webContentsViews.get(windowId);
        if (!windowData) {
            throw new Error(`Ventana ${windowId} no encontrada`);
        }
        
        try {
            await windowData.webView.webContents.loadURL(url);
            windowData.url = url;
            console.log(`✅ URL cargada en ventana ${windowId}: ${url}`);
            return { success: true, url };
        } catch (error) {
            console.error(`Error cargando URL en ventana ${windowId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Cargar página de bienvenida
     */
    async loadWelcomePage(windowId) {
        const welcomeHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Silhouette App Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        .container {
            max-width: 600px;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        p {
            font-size: 1.2em;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .status {
            background: rgba(0, 255, 0, 0.2);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 0, 0.3);
        }
        .features {
            text-align: left;
            margin-top: 30px;
        }
        .feature {
            margin: 10px 0;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        .feature::before {
            content: "✅ ";
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Silhouette App Preview</h1>
        <p>Tu aplicación se está ejecutando en un entorno de desarrollo integrado nativo.</p>
        
        <div class="status">
            <strong>Estado:</strong> Ventana de aplicación lista<br>
            <strong>URL:</strong> ${window.location.href}<br>
            <strong>Tiempo:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div class="features">
            <h3>Características disponibles:</h3>
            <div class="feature">Control nativo de browser</div>
            <div class="feature">Comunicación bidireccional</div>
            <div class="feature">Hot reload automático</div>
            <div class="feature">URLs de preview</div>
            <div class="feature">Testing integrado</div>
        </div>
        
        <p style="margin-top: 30px; font-size: 0.9em; opacity: 0.8;">
            Desarrollado con ❤️ por Silhouette V5.1
        </p>
    </div>
</body>
</html>
        `;
        
        // Cargar HTML como data URL
        const dataUrl = `data:text/html;base64,${Buffer.from(welcomeHtml).toString('base64')}`;
        await this.loadUrl(windowId, dataUrl);
    }
    
    /**
     * Manejar mensaje de ventana
     */
    handleWindowMessage(windowId, message) {
        this.emit('window-message', { windowId, message });
        
        // Manejar mensajes específicos del bridge
        if (message.type === 'SILHOUETTE_BRIDGE') {
            this.handleBridgeMessage(windowId, message.payload);
        }
    }
    
    /**
     * Manejar mensajes del bridge nativo
     */
    handleBridgeMessage(windowId, payload) {
        switch (payload.type) {
            case 'page_ready':
                this.emit('app-ready', { windowId, payload });
                break;
                
            case 'error':
                this.emit('app-error', { windowId, error: payload });
                break;
                
            case 'hot_reload_request':
                this.emit('hot-reload-request', { windowId, payload });
                break;
                
            default:
                this.emit('bridge-message', { windowId, payload });
        }
    }
    
    /**
     * Obtener información de ventana
     */
    async getWindowInfo(windowId) {
        const windowData = this.webContentsViews.get(windowId);
        if (!windowData) {
            return null;
        }
        
        try {
            const webContents = windowData.webView.webContents;
            const appInfo = await webContents.executeJavaScript('window.nativeBridge?.getAppInfo() || {}');
            
            return {
                windowId,
                url: windowData.url,
                title: windowData.appWindow.getTitle(),
                size: windowData.appWindow.getSize(),
                position: windowData.appWindow.getPosition(),
                isVisible: windowData.appWindow.isVisible(),
                isFocused: windowData.appWindow.isFocused(),
                createdAt: windowData.createdAt,
                appInfo: appInfo
            };
        } catch (error) {
            console.error(`Error obteniendo info de ventana ${windowId}:`, error);
            return {
                windowId,
                url: windowData.url,
                title: windowData.appWindow.getTitle(),
                error: error.message
            };
        }
    }
    
    /**
     * Listar ventanas activas
     */
    listActiveWindows() {
        const windows = [];
        for (const [windowId, windowData] of this.webContentsViews) {
            windows.push({
                windowId,
                url: windowData.url,
                title: windowData.appWindow.getTitle(),
                createdAt: windowData.createdAt,
                isVisible: windowData.appWindow.isVisible()
            });
        }
        return windows;
    }
    
    /**
     * Cerrar ventana de aplicación
     */
    async closeAppWindow(windowId) {
        const windowData = this.webContentsViews.get(windowId);
        if (!windowData) {
            return { success: false, error: 'Ventana no encontrada' };
        }
        
        try {
            // Cerrar ventana
            windowData.appWindow.close();
            
            // Limpiar referencias
            this.webContentsViews.delete(windowId);
            this.activeSessions.delete(windowId);
            
            console.log(`✅ Ventana cerrada: ${windowId}`);
            this.emit('window-closed', { windowId });
            
            return { success: true };
        } catch (error) {
            console.error(`Error cerrando ventana ${windowId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Cerrar todas las ventanas
     */
    async closeAllWindows() {
        const results = [];
        for (const windowId of this.webContentsViews.keys()) {
            try {
                const result = await this.closeAppWindow(windowId);
                results.push({ windowId, ...result });
            } catch (error) {
                results.push({ windowId, success: false, error: error.message });
            }
        }
        return results;
    }
    
    /**
     * Generar ID único para ventana
     */
    generateWindowId() {
        return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Verificar si está inicializado
     */
    isReady() {
        return this.isInitialized;
    }
    
    /**
     * Destruir instancia
     */
    destroy() {
        // Cerrar todas las ventanas
        this.closeAllWindows();
        
        // Limpiar eventos
        this.removeAllListeners();
        
        console.log('🗑️ Integración nativa con browser destruida');
    }
}

module.exports = NativeBrowserIntegration;