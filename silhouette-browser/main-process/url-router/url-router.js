const EventEmitter = require('events');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const dns = require('dns');
const net = require('net');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Sistema de Router de URLs Personalizadas
 * Maneja dominios locales, URLs dinámicas, SSL/TLS automático
 * Inspirado en Firebase Preview URLs + custom domains
 */
class URLRouter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            baseDomain: options.baseDomain || 'silhouette.local',
            previewDomain: options.previewDomain || 'silhouette.app',
            sslEnabled: options.sslEnabled !== false,
            portRange: options.portRange || { min: 3000, max: 9999 },
            maxUrls: options.maxUrls || 100,
            autoCleanup: options.autoCleanup !== false,
            cleanupInterval: options.cleanupInterval || 300000 // 5 minutos
        };
        
        this.urlMappings = new Map();
        this.domainMappings = new Map();
        this.portAllocations = new Map();
        this.sslCertificates = new Map();
        this.proxyServers = new Map();
        
        this.isInitialized = false;
        this.isRunning = false;
        
        // Configuración de puertos por defecto
        this.defaultPorts = {
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
            'django': 8000,
            'flask': 5000,
            'fastapi': 8000,
            'express': 3000,
            'laravel': 8000,
            'rails': 3000,
            'default': 8080
        };
        
        this.init();
    }
    
    /**
     * Inicializar el sistema de URL routing
     */
    async init() {
        try {
            console.log('🌐 Inicializando URL Router...');
            
            // Configurar directorios necesarios
            await this.setupDirectories();
            
            // Cargar certificados SSL existentes
            await this.loadExistingCertificates();
            
            // Configurar limpieza automática
            if (this.options.autoCleanup) {
                this.startAutoCleanup();
            }
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ URL Router inicializado');
        } catch (error) {
            console.error('❌ Error inicializando URL Router:', error);
            throw error;
        }
    }
    
    /**
     * Configurar directorios necesarios
     */
    async setupDirectories() {
        const directories = [
            'ssl/certificates',
            'ssl/private',
            'ssl/public',
            'logs/url-router'
        ];
        
        for (const dir of directories) {
            try {
                await fs.mkdir(path.join(os.homedir(), '.silhouette', dir), { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
        }
    }
    
    /**
     * Cargar certificados SSL existentes
     */
    async loadExistingCertificates() {
        const certDir = path.join(os.homedir(), '.silhouette', 'ssl', 'certificates');
        
        try {
            const files = await fs.readdir(certDir);
            for (const file of files) {
                if (file.endsWith('.crt')) {
                    const domain = file.replace('.crt', '');
                    this.sslCertificates.set(domain, {
                        cert: await fs.readFile(path.join(certDir, file)),
                        key: await fs.readFile(path.join(certDir, file.replace('.crt', '.key')))
                    });
                }
            }
            console.log(`📜 ${this.sslCertificates.size} certificados SSL cargados`);
        } catch (error) {
            console.log('ℹ️ No hay certificados SSL existentes');
        }
    }
    
    /**
     * Crear URL para proyecto
     */
    async createProjectUrl(projectConfig) {
        const { 
            name, 
            framework, 
            port, 
            ssl, 
            customDomain,
            projectId 
        } = projectConfig;
        
        try {
            // Asignar puerto si no se proporciona
            const assignedPort = port || await this.allocatePort(framework, projectId);
            
            // Determinar tipo de URL
            let urlConfig = {
                url: '',
                type: '',
                port: assignedPort,
                ssl: ssl || this.options.sslEnabled
            };
            
            if (customDomain) {
                // URL con dominio personalizado
                urlConfig = await this.createCustomDomainUrl(customDomain, assignedPort, ssl);
            } else {
                // URL con dominio basado en nombre
                const subdomain = this.generateSubdomain(name, projectId);
                urlConfig = await this.createSubdomainUrl(subdomain, assignedPort, ssl);
            }
            
            // Almacenar mapeo
            this.urlMappings.set(urlConfig.url, {
                projectId,
                name,
                framework,
                port: assignedPort,
                createdAt: new Date(),
                type: urlConfig.type
            });
            
            // Configurar proxy si es necesario
            if (urlConfig.type === 'proxy') {
                await this.setupProxy(urlConfig.url, assignedPort);
            }
            
            console.log(`🔗 URL creada: ${urlConfig.url}`);
            
            this.emit('url-created', {
                projectId,
                url: urlConfig.url,
                type: urlConfig.type
            });
            
            return {
                success: true,
                url: urlConfig.url,
                type: urlConfig.type,
                port: assignedPort
            };
            
        } catch (error) {
            console.error('Error creando URL para proyecto:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Crear URL con subdominio
     */
    async createSubdomainUrl(subdomain, port, ssl = true) {
        const domain = this.options.baseDomain;
        const protocol = ssl ? 'https' : 'http';
        const url = `${protocol}://${subdomain}.${domain}:${port}`;
        
        // Verificar si necesitamos certificado SSL
        if (ssl && !this.sslCertificates.has(`${subdomain}.${domain}`)) {
            await this.generateSSLCertificate(`${subdomain}.${domain}`);
        }
        
        return {
            url,
            type: 'subdomain',
            ssl
        };
    }
    
    /**
     * Crear URL con dominio personalizado
     */
    async createCustomDomainUrl(domain, port, ssl = true) {
        const protocol = ssl ? 'https' : 'http';
        const url = `${protocol}://${domain}:${port}`;
        
        // Verificar certificado SSL
        if (ssl && !this.sslCertificates.has(domain)) {
            await this.generateSSLCertificate(domain);
        }
        
        return {
            url,
            type: 'custom',
            ssl
        };
    }
    
    /**
     * Crear URL de preview compartible
     */
    async createPreviewUrl(projectConfig) {
        const { projectId, name, framework, port } = projectConfig;
        
        // Generar hash único para la URL de preview
        const hash = crypto.randomBytes(8).toString('hex');
        const previewId = `${projectId}-${hash}`;
        const domain = this.options.previewDomain;
        const ssl = true;
        
        // Generar certificado SSL si no existe
        if (!this.sslCertificates.has(`${previewId}.${domain}`)) {
            await this.generateSSLCertificate(`${previewId}.${domain}`);
        }
        
        const previewUrl = `https://${previewId}.${domain}`;
        
        // Almacenar mapeo
        this.urlMappings.set(previewUrl, {
            projectId,
            name,
            framework,
            port: port || await this.allocatePort(framework, projectId),
            createdAt: new Date(),
            type: 'preview',
            previewId
        });
        
        console.log(`🔗 URL de preview creada: ${previewUrl}`);
        
        this.emit('preview-url-created', {
            projectId,
            previewUrl,
            previewId
        });
        
        return {
            success: true,
            previewUrl,
            previewId
        };
    }
    
    /**
     * Generar subdominio basado en nombre
     */
    generateSubdomain(name, projectId) {
        // Limpiar y formatear el nombre
        const cleanName = name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        // Agregar ID corto para evitar colisiones
        const shortId = projectId.split('-')[0];
        
        return `${cleanName}-${shortId}`;
    }
    
    /**
     * Asignar puerto dinámicamente
     */
    async allocatePort(framework, projectId) {
        // Intentar puerto por defecto del framework
        const defaultPort = this.defaultPorts[framework] || this.defaultPorts.default;
        
        // Verificar disponibilidad
        const isAvailable = await this.isPortAvailable(defaultPort);
        if (isAvailable) {
            this.portAllocations.set(`${framework}-${defaultPort}`, projectId);
            return defaultPort;
        }
        
        // Buscar puerto disponible
        for (let port = defaultPort + 1; port <= this.options.portRange.max; port++) {
            if (await this.isPortAvailable(port)) {
                this.portAllocations.set(`${framework}-${port}`, projectId);
                return port;
            }
        }
        
        // Si no encuentra en el rango, usar puerto aleatorio
        const randomPort = Math.floor(Math.random() * (this.options.portRange.max - this.options.portRange.min)) + this.options.portRange.min;
        this.portAllocations.set(`random-${randomPort}`, projectId);
        
        return randomPort;
    }
    
    /**
     * Verificar disponibilidad de puerto
     */
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, (err) => {
                if (err) {
                    resolve(false);
                } else {
                    server.once('close', () => resolve(true));
                    server.close();
                }
            });
            server.on('error', () => resolve(false));
        });
    }
    
    /**
     * Generar certificado SSL
     */
    async generateSSLCertificate(domain) {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // Verificar si OpenSSL está disponible
            try {
                await execAsync('which openssl');
            } catch (error) {
                throw new Error('OpenSSL no está disponible para generar certificados');
            }
            
            // Directorio de certificados
            const certDir = path.join(os.homedir(), '.silhouette', 'ssl');
            const certPath = path.join(certDir, 'certificates', `${domain}.crt`);
            const keyPath = path.join(certDir, 'private', `${domain}.key`);
            
            // Generar certificado autofirmado
            const opensslCmd = [
                'openssl req -x509 -newkey rsa:4096 -keyout', keyPath,
                '-out', certPath,
                '-days 365 -nodes -subj "/C=US/ST=State/L=City/O=Silhouette/CN=' + domain + '"'
            ].join(' ');
            
            await execAsync(opensslCmd);
            
            // Cargar certificados en memoria
            this.sslCertificates.set(domain, {
                cert: await fs.readFile(certPath),
                key: await fs.readFile(keyPath)
            });
            
            console.log(`🔐 Certificado SSL generado: ${domain}`);
            
            return true;
            
        } catch (error) {
            console.warn(`⚠️ Error generando certificado SSL para ${domain}:`, error.message);
            return false;
        }
    }
    
    /**
     * Configurar proxy para URL
     */
    async setupProxy(url, targetPort) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const protocol = urlObj.protocol === 'https:' ? 'https' : 'http';
            
            // Configurar servidor proxy
            const proxyServer = protocol === 'https' ? 
                https.createServer(this.getSSLOptions(domain)) : 
                http.createServer();
            
            // Manejar solicitudes
            proxyServer.on('request', (req, res) => {
                this.handleProxyRequest(req, res, targetPort);
            });
            
            // Iniciar servidor proxy
            await new Promise((resolve, reject) => {
                proxyServer.listen(0, 'localhost', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            const proxyPort = proxyServer.address().port;
            this.proxyServers.set(domain, {
                server: proxyServer,
                targetPort,
                createdAt: new Date()
            });
            
            console.log(`🔀 Proxy configurado: ${domain} -> localhost:${targetPort}`);
            
        } catch (error) {
            console.error('Error configurando proxy:', error);
        }
    }
    
    /**
     * Obtener opciones SSL
     */
    getSSLOptions(domain) {
        const cert = this.sslCertificates.get(domain);
        if (!cert) {
            throw new Error(`Certificado SSL no encontrado para ${domain}`);
        }
        
        return {
            cert: cert.cert,
            key: cert.key
        };
    }
    
    /**
     * Manejar solicitud proxy
     */
    handleProxyRequest(req, res, targetPort) {
        const options = {
            hostname: 'localhost',
            port: targetPort,
            path: req.url,
            method: req.method,
            headers: req.headers
        };
        
        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (error) => {
            console.error('Error en proxy request:', error);
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Bad Gateway');
        });
        
        req.pipe(proxyReq);
    }
    
    /**
     * Resolver URL a servicio local
     */
    async resolveUrl(targetUrl) {
        try {
            const urlObj = new URL(targetUrl);
            const domain = urlObj.hostname;
            
            // Verificar si es un dominio local de Silhouette
            if (domain.includes(this.options.baseDomain) || 
                domain.includes(this.options.previewDomain)) {
                
                // Extraer proyecto o subdominio
                const subdomain = domain.split('.')[0];
                const mapping = this.urlMappings.get(targetUrl);
                
                if (mapping) {
                    return {
                        success: true,
                        localUrl: `http://localhost:${mapping.port}`,
                        projectId: mapping.projectId,
                        name: mapping.name
                    };
                }
            }
            
            // URL externa
            return {
                success: true,
                localUrl: null,
                external: true
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Crear URL de acceso externo
     */
    async createExternalAccessUrl(projectId, options = {}) {
        const project = Array.from(this.urlMappings.values()).find(p => p.projectId === projectId);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }
        
        // Generar URL de ngrok o tunnel similar
        const tunnelId = crypto.randomBytes(6).toString('hex');
        const externalUrl = `https://tunnel-${tunnelId}.silhouette.dev`;
        
        // Almacenar mapeo de túnel
        this.urlMappings.set(externalUrl, {
            projectId,
            name: project.name,
            type: 'tunnel',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + (options.duration || 3600000)) // 1 hora por defecto
        });
        
        console.log(`🌐 URL de acceso externo creada: ${externalUrl}`);
        
        this.emit('external-url-created', {
            projectId,
            externalUrl,
            tunnelId
        });
        
        return {
            success: true,
            externalUrl,
            tunnelId,
            expiresAt: new Date(Date.now() + (options.duration || 3600000))
        };
    }
    
    /**
     * Limpiar URLs expiradas
     */
    cleanupExpiredUrls() {
        const now = new Date();
        const expiredUrls = [];
        
        for (const [url, mapping] of this.urlMappings) {
            if (mapping.expiresAt && mapping.expiresAt < now) {
                expiredUrls.push(url);
            }
        }
        
        // Remover URLs expiradas
        for (const url of expiredUrls) {
            this.urlMappings.delete(url);
            console.log(`🗑️ URL expirada removida: ${url}`);
        }
        
        if (expiredUrls.length > 0) {
            this.emit('urls-cleaned', { count: expiredUrls.length });
        }
        
        return expiredUrls.length;
    }
    
    /**
     * Iniciar limpieza automática
     */
    startAutoCleanup() {
        setInterval(() => {
            this.cleanupExpiredUrls();
        }, this.options.cleanupInterval);
    }
    
    /**
     * Obtener estadísticas de URLs
     */
    getUrlStats() {
        const now = new Date();
        const stats = {
            total: this.urlMappings.size,
            byType: {},
            byFramework: {},
            active: 0,
            expired: 0,
            ports: {
                allocated: this.portAllocations.size,
                available: this.options.portRange.max - this.options.portRange.min
            }
        };
        
        for (const mapping of this.urlMappings.values()) {
            // Por tipo
            stats.byType[mapping.type] = (stats.byType[mapping.type] || 0) + 1;
            
            // Por framework
            if (mapping.framework) {
                stats.byFramework[mapping.framework] = (stats.byFramework[mapping.framework] || 0) + 1;
            }
            
            // Estado de expiración
            if (mapping.expiresAt) {
                if (mapping.expiresAt > now) {
                    stats.active++;
                } else {
                    stats.expired++;
                }
            } else {
                stats.active++;
            }
        }
        
        return stats;
    }
    
    /**
     * Listar URLs activas
     */
    listActiveUrls() {
        const now = new Date();
        return Array.from(this.urlMappings.entries())
            .filter(([url, mapping]) => {
                return !mapping.expiresAt || mapping.expiresAt > now;
            })
            .map(([url, mapping]) => ({
                url,
                projectId: mapping.projectId,
                name: mapping.name,
                type: mapping.type,
                framework: mapping.framework,
                createdAt: mapping.createdAt,
                expiresAt: mapping.expiresAt
            }));
    }
    
    /**
     * Remover URL
     */
    async removeUrl(url) {
        const mapping = this.urlMappings.get(url);
        if (!mapping) {
            return { success: false, error: 'URL no encontrada' };
        }
        
        // Remover proxy si existe
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const proxy = this.proxyServers.get(domain);
            if (proxy) {
                proxy.server.close();
                this.proxyServers.delete(domain);
            }
        } catch (error) {
            // URL inválida, continuar
        }
        
        // Remover URL del mapeo
        this.urlMappings.delete(url);
        
        console.log(`🗑️ URL removida: ${url}`);
        this.emit('url-removed', { url, projectId: mapping.projectId });
        
        return { success: true };
    }
    
    /**
     * Verificar si está inicializado
     */
    isRouterReady() {
        return this.isInitialized;
    }
    
    /**
     * Destruir instancia
     */
    destroy() {
        // Cerrar todos los servidores proxy
        for (const [domain, proxy] of this.proxyServers) {
            try {
                proxy.server.close();
            } catch (error) {
                console.warn(`Error cerrando proxy ${domain}:`, error.message);
            }
        }
        
        // Limpiar mapeos
        this.urlMappings.clear();
        this.domainMappings.clear();
        this.portAllocations.clear();
        this.proxyServers.clear();
        
        this.removeAllListeners();
        console.log('🗑️ URL Router destruido');
    }
}

module.exports = URLRouter;