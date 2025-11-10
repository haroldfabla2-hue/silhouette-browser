const EventEmitter = require('events');
const { WebSocketServer } = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');

/**
 * Sistema de Live Server Avanzado
 * Inspirado en VS Code Live Server + Firebase Preview URLs
 * Maneja comunicación WebSocket, hot reload, y URLs dinámicas
 */
class LiveServerManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            port: options.port || 35729, // Puerto por defecto para hot reload
            host: options.host || 'localhost',
            https: options.https || false,
            cors: options.cors !== false,
            debug: options.debug || false,
            watchPaths: options.watchPaths || [],
            ignorePaths: options.ignorePaths || [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/.next/**',
                '**/.nuxt/**'
            ],
            fileExtensions: options.fileExtensions || [
                '.html', '.css', '.js', '.jsx', '.ts', '.tsx',
                '.vue', '.svelte', '.json', '.md'
            ]
        };
        
        this.wss = null;
        this.httpServer = null;
        this.watchers = new Map();
        this.clients = new Map();
        this.fileTree = new Map();
        this.urlMappings = new Map();
        this.isInitialized = false;
        this.isRunning = false;
        
        // Configuración de URLs
        this.urlConfig = {
            basePort: 3000,
            maxPort: 65535,
            domainSuffix: '.local',
            previewDomain: 'silhouette.app',
            sslEnabled: true
        };
        
        // Estados de proyectos
        this.projects = new Map();
        
        this.init();
    }
    
    /**
     * Inicializar el sistema de Live Server
     */
    async init() {
        try {
            console.log('🚀 Inicializando Live Server Manager...');
            
            // Crear servidor HTTP para WebSocket
            this.createHttpServer();
            
            // Inicializar WebSocket server
            this.createWebSocketServer();
            
            // Configurar sistema de URLs
            this.setupUrlManager();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ Live Server Manager inicializado');
        } catch (error) {
            console.error('❌ Error inicializando Live Server:', error);
            throw error;
        }
    }
    
    /**
     * Crear servidor HTTP para WebSocket
     */
    createHttpServer() {
        this.httpServer = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
    }
    
    /**
     * Crear servidor WebSocket
     */
    createWebSocketServer() {
        this.wss = new WebSocketServer({
            server: this.httpServer,
            path: '/hot-reload',
            perMessageDeflate: false
        });
        
        this.wss.on('connection', (ws, req) => {
            this.handleWebSocketConnection(ws, req);
        });
        
        this.wss.on('error', (error) => {
            console.error('Error en WebSocket server:', error);
        });
    }
    
    /**
     * Configurar sistema de manejo de URLs
     */
    setupUrlManager() {
        // Configurar mapeo de dominios locales
        this.localDomains = new Map();
        
        // Patrones de frameworks y sus puertos sugeridos
        this.frameworkPorts = {
            'react': 3000,
            'vue': 8080,
            'angular': 4200,
            'svelte': 5000,
            'nextjs': 3000,
            'nuxt': 3000,
            'gatsby': 8000,
            'vite': 5173,
            'webpack-dev-server': 8080,
            'parcel': 1234,
            ' CRA ': 3000,
            'default': 8080
        };
    }
    
    /**
     * Iniciar el servidor
     */
    async start() {
        if (this.isRunning) {
            return { success: false, message: 'Live Server ya está ejecutándose' };
        }
        
        try {
            await new Promise((resolve, reject) => {
                this.httpServer.listen(this.options.port, this.options.host, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            this.isRunning = true;
            console.log(`🔄 Live Server ejecutándose en ws://${this.options.host}:${this.options.port}`);
            
            this.emit('started', {
                wsUrl: `ws://${this.options.host}:${this.options.port}/hot-reload`,
                httpUrl: `http://${this.options.host}:${this.options.port}`
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error iniciando Live Server:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Detener el servidor
     */
    async stop() {
        if (!this.isRunning) {
            return { success: false, message: 'Live Server no está ejecutándose' };
        }
        
        try {
            // Cerrar todas las conexiones WebSocket
            for (const [clientId, client] of this.clients) {
                client.ws.close(1000, 'Server shutting down');
            }
            
            // Cerrar servidor HTTP
            await new Promise((resolve) => {
                this.httpServer.close(() => resolve());
            });
            
            // Detener todos los watchers
            for (const [path, watcher] of this.watchers) {
                watcher.close();
            }
            this.watchers.clear();
            
            this.isRunning = false;
            console.log('🛑 Live Server detenido');
            
            this.emit('stopped');
            return { success: true };
        } catch (error) {
            console.error('Error deteniendo Live Server:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Crear nuevo proyecto y asignar URL
     */
    async createProject(projectConfig) {
        const projectId = this.generateProjectId();
        const project = {
            id: projectId,
            name: projectConfig.name || `project-${Date.now()}`,
            rootPath: projectConfig.rootPath,
            framework: projectConfig.framework || 'unknown',
            port: await this.allocatePort(projectConfig.framework),
            url: null,
            createdAt: new Date(),
            status: 'initializing',
            files: new Set(),
            clients: new Set()
        };
        
        try {
            // Generar URL para el proyecto
            project.url = await this.generateProjectUrl(project);
            
            // Configurar watcher de archivos
            await this.setupFileWatcher(project);
            
            // Registrar proyecto
            this.projects.set(projectId, project);
            this.urlMappings.set(project.url, projectId);
            
            console.log(`✅ Proyecto creado: ${project.name} -> ${project.url}`);
            
            this.emit('project-created', {
                projectId,
                project: {
                    name: project.name,
                    url: project.url,
                    port: project.port,
                    framework: project.framework
                }
            });
            
            return {
                success: true,
                projectId,
                url: project.url,
                config: project
            };
            
        } catch (error) {
            console.error(`Error creando proyecto ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Configurar watcher de archivos para proyecto
     */
    async setupFileWatcher(project) {
        const watcher = chokidar.watch(project.rootPath, {
            ignored: this.options.ignorePaths,
            persistent: true,
            ignoreInitial: true,
            followSymlinks: false
        });
        
        // Eventos de archivos
        watcher
            .on('add', (filePath) => {
                this.handleFileAdded(project, filePath);
            })
            .on('change', (filePath) => {
                this.handleFileChanged(project, filePath);
            })
            .on('unlink', (filePath) => {
                this.handleFileRemoved(project, filePath);
            })
            .on('addDir', (dirPath) => {
                this.handleDirectoryAdded(project, dirPath);
            })
            .on('unlinkDir', (dirPath) => {
                this.handleDirectoryRemoved(project, dirPath);
            });
        
        this.watchers.set(project.id, watcher);
        project.status = 'active';
    }
    
    /**
     * Generar URL para proyecto
     */
    async generateProjectUrl(project) {
        const domain = this.getProjectDomain(project);
        const subdomain = this.getProjectSubdomain(project);
        const port = project.port;
        
        if (domain) {
            // URL con dominio personalizado
            return `http${this.urlConfig.sslEnabled ? 's' : ''}://${subdomain}.${domain}:${port}`;
        } else {
            // URL localhost con puerto dinámico
            return `http://localhost:${port}`;
        }
    }
    
    /**
     * Obtener dominio del proyecto
     */
    getProjectDomain(project) {
        // Lógica para determinar dominio basada en framework y configuración
        if (project.framework === 'react') return 'react.local';
        if (project.framework === 'vue') return 'vue.local';
        if (project.framework === 'angular') return 'angular.local';
        
        // Dominio genérico
        return 'silhouette.local';
    }
    
    /**
     * Obtener subdominio del proyecto
     */
    getProjectSubdomain(project) {
        // Crear subdominio basado en nombre del proyecto
        return project.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    /**
     * Asignar puerto dinámico
     */
    async allocatePort(framework = 'default') {
        // Buscar puerto sugerido por framework
        let suggestedPort = this.frameworkPorts[framework] || this.frameworkPorts.default;
        
        // Verificar si el puerto está disponible
        const isPortAvailable = await this.checkPortAvailability(suggestedPort);
        if (isPortAvailable) {
            return suggestedPort;
        }
        
        // Buscar puerto disponible
        for (let port = suggestedPort + 1; port <= this.urlConfig.maxPort; port++) {
            if (await this.checkPortAvailability(port)) {
                return port;
            }
        }
        
        throw new Error('No hay puertos disponibles');
    }
    
    /**
     * Verificar disponibilidad de puerto
     */
    async checkPortAvailability(port) {
        return new Promise((resolve) => {
            const server = require('net').createServer();
            server.listen(port, () => {
                server.once('close', () => {
                    resolve(true);
                });
                server.close();
            });
            server.on('error', () => {
                resolve(false);
            });
        });
    }
    
    /**
     * Manejar conexión WebSocket
     */
    handleWebSocketConnection(ws, req) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            ws: ws,
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            connectedAt: new Date(),
            projects: new Set()
        };
        
        this.clients.set(clientId, client);
        
        console.log(`🔗 Cliente WebSocket conectado: ${clientId}`);
        
        // Enviar mensaje de bienvenida
        this.sendToClient(clientId, {
            type: 'connected',
            clientId: clientId,
            server: {
                version: '5.1.0',
                timestamp: Date.now()
            }
        });
        
        // Manejar mensajes del cliente
        ws.on('message', (data) => {
            this.handleClientMessage(clientId, data);
        });
        
        // Manejar desconexión
        ws.on('close', (code, reason) => {
            this.handleClientDisconnection(clientId, code, reason);
        });
        
        ws.on('error', (error) => {
            console.error(`Error en WebSocket cliente ${clientId}:`, error);
        });
        
        this.emit('client-connected', { clientId, client });
    }
    
    /**
     * Manejar mensaje de cliente
     */
    handleClientMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case 'subscribe':
                    this.handleProjectSubscription(clientId, message);
                    break;
                    
                case 'unsubscribe':
                    this.handleProjectUnsubscription(clientId, message);
                    break;
                    
                case 'ping':
                    this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
                    break;
                    
                case 'file_change':
                    this.handleRemoteFileChange(clientId, message);
                    break;
                    
                default:
                    console.log(`Mensaje desconocido de ${clientId}:`, message.type);
            }
            
        } catch (error) {
            console.error(`Error procesando mensaje de ${clientId}:`, error);
        }
    }
    
    /**
     * Manejar suscripción a proyecto
     */
    handleProjectSubscription(clientId, message) {
        const client = this.clients.get(clientId);
        const projectId = message.projectId;
        
        if (client && this.projects.has(projectId)) {
            client.projects.add(projectId);
            
            const project = this.projects.get(projectId);
            project.clients.add(clientId);
            
            this.sendToClient(clientId, {
                type: 'subscribed',
                projectId: projectId,
                project: {
                    name: project.name,
                    url: project.url,
                    framework: project.framework
                }
            });
            
            console.log(`Cliente ${clientId} suscrito a proyecto ${projectId}`);
        } else {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Proyecto no encontrado',
                projectId: projectId
            });
        }
    }
    
    /**
     * Manejar cancelación de suscripción
     */
    handleProjectUnsubscription(clientId, message) {
        const client = this.clients.get(clientId);
        const projectId = message.projectId;
        
        if (client && this.projects.has(projectId)) {
            client.projects.delete(projectId);
            
            const project = this.projects.get(projectId);
            project.clients.delete(clientId);
            
            this.sendToClient(clientId, {
                type: 'unsubscribed',
                projectId: projectId
            });
            
            console.log(`Cliente ${clientId} desuscrito de proyecto ${projectId}`);
        }
    }
    
    /**
     * Manejar cambio de archivo remoto
     */
    async handleFileChanged(project, filePath) {
        const projectId = this.getProjectIdByPath(filePath);
        if (!projectId) return;
        
        const project = this.projects.get(projectId);
        if (!project || project.status !== 'active') return;
        
        const relativePath = path.relative(project.rootPath, filePath);
        
        // Notificar a todos los clientes suscritos
        for (const clientId of project.clients) {
            this.sendToClient(clientId, {
                type: 'file_changed',
                projectId: projectId,
                file: {
                    path: relativePath,
                    fullPath: filePath,
                    timestamp: Date.now(),
                    size: await this.getFileSize(filePath)
                }
            });
        }
        
        // Verificar si es un archivo de hot reload
        if (this.isHotReloadFile(filePath)) {
            await this.triggerHotReload(projectId, relativePath);
        }
        
        console.log(`📝 Archivo cambiado: ${relativePath} en proyecto ${projectId}`);
        this.emit('file-changed', { projectId, filePath, relativePath });
    }
    
    /**
     * Manejar archivo añadido
     */
    handleFileAdded(project, filePath) {
        const relativePath = path.relative(project.rootPath, filePath);
        project.files.add(relativePath);
        
        console.log(`📄 Archivo añadido: ${relativePath} en proyecto ${project.id}`);
        this.emit('file-added', { projectId: project.id, filePath, relativePath });
    }
    
    /**
     * Manejar archivo removido
     */
    handleFileRemoved(project, filePath) {
        const relativePath = path.relative(project.rootPath, filePath);
        project.files.delete(relativePath);
        
        console.log(`🗑️ Archivo removido: ${relativePath} en proyecto ${project.id}`);
        this.emit('file-removed', { projectId: project.id, filePath, relativePath });
    }
    
    /**
     * Disparar hot reload
     */
    async triggerHotReload(projectId, filePath) {
        const project = this.projects.get(projectId);
        if (!project) return;
        
        const reloadData = {
            type: 'reload',
            projectId: projectId,
            file: filePath,
            timestamp: Date.now(),
            reason: 'file_change'
        };
        
        // Enviar a todos los clientes del proyecto
        for (const clientId of project.clients) {
            this.sendToClient(clientId, reloadData);
        }
        
        this.emit('hot-reload', { projectId, filePath, reloadData });
        console.log(`🔄 Hot reload disparado: ${filePath} en ${project.name}`);
    }
    
    /**
     * Verificar si un archivo necesita hot reload
     */
    isHotReloadFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return this.options.fileExtensions.includes(ext);
    }
    
    /**
     * Enviar mensaje a cliente
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return false;
        
        try {
            if (client.ws.readyState === 1) { // WebSocket.OPEN
                client.ws.send(JSON.stringify(message));
                return true;
            }
        } catch (error) {
            console.error(`Error enviando mensaje a ${clientId}:`, error);
        }
        
        return false;
    }
    
    /**
     * Enviar mensaje a todos los clientes
     */
    broadcast(message, filter = null) {
        const recipients = filter ? 
            Array.from(this.clients.values()).filter(filter) : 
            this.clients.values();
        
        for (const client of recipients) {
            this.sendToClient(client.id, message);
        }
    }
    
    /**
     * Manejar desconexión de cliente
     */
    handleClientDisconnection(clientId, code, reason) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Remover de todos los proyectos
        for (const projectId of client.projects) {
            const project = this.projects.get(projectId);
            if (project) {
                project.clients.delete(clientId);
            }
        }
        
        this.clients.delete(clientId);
        
        console.log(`🔌 Cliente WebSocket desconectado: ${clientId} (${code}: ${reason})`);
        this.emit('client-disconnected', { clientId, code, reason });
    }
    
    /**
     * Manejar solicitud HTTP
     */
    handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        if (url.pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                server: 'Silhouette Live Server',
                version: '5.1.0',
                uptime: process.uptime(),
                clients: this.clients.size,
                projects: this.projects.size
            }));
            return;
        }
        
        if (url.pathname === '/projects') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                projects: Array.from(this.projects.values()).map(p => ({
                    id: p.id,
                    name: p.name,
                    url: p.url,
                    framework: p.framework,
                    status: p.status,
                    createdAt: p.createdAt
                }))
            }));
            return;
        }
        
        // 404 para otras rutas
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
    
    /**
     * Obtener tamaño de archivo
     */
    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Obtener ID de proyecto por ruta
     */
    getProjectIdByPath(filePath) {
        for (const [projectId, project] of this.projects) {
            if (filePath.startsWith(project.rootPath)) {
                return projectId;
            }
        }
        return null;
    }
    
    /**
     * Generar ID de proyecto
     */
    generateProjectId() {
        return 'project_' + crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * Generar ID de cliente
     */
    generateClientId() {
        return 'client_' + crypto.randomBytes(6).toString('hex');
    }
    
    /**
     * Listar proyectos activos
     */
    listProjects() {
        return Array.from(this.projects.values()).map(project => ({
            id: project.id,
            name: project.name,
            url: project.url,
            framework: project.framework,
            status: project.status,
            createdAt: project.createdAt,
            clientCount: project.clients.size,
            fileCount: project.files.size
        }));
    }
    
    /**
     * Obtener estadísticas del servidor
     */
    getStats() {
        return {
            running: this.isRunning,
            port: this.options.port,
            host: this.options.host,
            clients: {
                total: this.clients.size,
                active: Array.from(this.clients.values()).filter(c => c.ws.readyState === 1).length
            },
            projects: {
                total: this.projects.size,
                active: Array.from(this.projects.values()).filter(p => p.status === 'active').length
            },
            uptime: process.uptime()
        };
    }
    
    /**
     * Verificar si está ejecutándose
     */
    isServerRunning() {
        return this.isRunning;
    }
    
    /**
     * Verificar si está inicializado
     */
    isServerInitialized() {
        return this.isInitialized;
    }
    
    /**
     * Destruir instancia
     */
    destroy() {
        this.stop();
        this.removeAllListeners();
        console.log('🗑️ Live Server Manager destruido');
    }
}

module.exports = LiveServerManager;