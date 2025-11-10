const EventEmitter = require('events');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const jwt = require('jsonwebtoken');

/**
 * Sistema de Compartir Previews
 * Genera URLs compartibles para revisión de equipos
 * Inspirado en Firebase Preview URLs + Vercel Preview Deployments
 */
class PreviewSharing extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            port: options.port || 8080,
            domain: options.domain || 'silhouette.app',
            jwtSecret: options.jwtSecret || process.env.SILHOUETTE_JWT_SECRET || 'silhouette-preview-secret',
            maxPreviewDuration: options.maxPreviewDuration || 86400000, // 24 horas
            maxPreviews: options.maxPreviews || 1000,
            autoCleanup: options.autoCleanup !== false,
            cleanupInterval: options.cleanupInterval || 3600000, // 1 hora
            corsEnabled: options.corsEnabled !== false,
            rateLimitEnabled: options.rateLimitEnabled !== false
        };
        
        this.previews = new Map();
        this.analytics = new Map();
        this.accessTokens = new Map();
        this.usageStats = new Map();
        
        this.httpServer = null;
        this.isInitialized = false;
        this.isRunning = false;
        
        this.init();
    }
    
    /**
     * Inicializar el sistema de sharing
     */
    async init() {
        try {
            console.log('📤 Inicializando Preview Sharing...');
            
            // Configurar limpieza automática
            if (this.options.autoCleanup) {
                this.startAutoCleanup();
            }
            
            // Cargar previews existentes
            await this.loadExistingPreviews();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ Preview Sharing inicializado');
        } catch (error) {
            console.error('❌ Error inicializando Preview Sharing:', error);
            throw error;
        }
    }
    
    /**
     * Iniciar servidor HTTP para previews
     */
    async startServer() {
        if (this.isRunning) {
            return { success: false, message: 'Servidor ya está ejecutándose' };
        }
        
        try {
            // Crear servidor HTTP
            this.httpServer = http.createServer();
            
            // Configurar rutas
            this.setupRoutes();
            
            // Iniciar servidor
            await new Promise((resolve, reject) => {
                this.httpServer.listen(this.options.port, '0.0.0.0', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            this.isRunning = true;
            console.log(`🌐 Preview Sharing servidor ejecutándose en puerto ${this.options.port}`);
            
            this.emit('server-started', {
                port: this.options.port,
                domain: this.options.domain
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error iniciando servidor de previews:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Detener servidor
     */
    async stopServer() {
        if (!this.isRunning) {
            return { success: false, message: 'Servidor no está ejecutándose' };
        }
        
        try {
            await new Promise((resolve) => {
                this.httpServer.close(() => resolve());
            });
            
            this.isRunning = false;
            console.log('🛑 Preview Sharing servidor detenido');
            
            this.emit('server-stopped');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Crear nuevo preview
     */
    async createPreview(previewConfig) {
        const {
            name,
            description,
            targetUrl,
            framework,
            projectId,
            ownerId,
            expiresIn, // en milisegundos
            accessLevel = 'public', // public, private, team
            teamIds = [],
            tags = []
        } = previewConfig;
        
        try {
            // Verificar límites
            if (this.previews.size >= this.options.maxPreviews) {
                throw new Error('Límite máximo de previews alcanzado');
            }
            
            // Generar ID único
            const previewId = this.generatePreviewId();
            const slug = this.generateSlug(name || `preview-${Date.now()}`);
            
            // Calcular fecha de expiración
            const expiresAt = expiresIn ? 
                new Date(Date.now() + expiresIn) : 
                new Date(Date.now() + this.options.maxPreviewDuration);
            
            // Generar URL de preview
            const previewUrl = `https://${previewId}.${this.options.domain}`;
            
            // Crear token de acceso
            const accessToken = this.generateAccessToken(previewId, ownerId);
            
            // Crear preview
            const preview = {
                id: previewId,
                slug: slug,
                name: name || `Preview ${previewId}`,
                description: description || '',
                targetUrl: targetUrl,
                framework: framework,
                projectId: projectId,
                ownerId: ownerId,
                accessLevel: accessLevel,
                teamIds: teamIds,
                tags: tags,
                createdAt: new Date(),
                expiresAt: expiresAt,
                lastAccess: null,
                accessCount: 0,
                previewUrl: previewUrl,
                accessToken: accessToken,
                analytics: {
                    views: 0,
                    uniqueVisitors: new Set(),
                    averageLoadTime: 0,
                    browserStats: {},
                    countryStats: {}
                }
            };
            
            // Almacenar preview
            this.previews.set(previewId, preview);
            
            // Configurar analytics
            this.analytics.set(previewId, {
                events: [],
                sessions: new Map(),
                lastCleanup: Date.now()
            });
            
            console.log(`📤 Preview creado: ${previewUrl}`);
            
            this.emit('preview-created', {
                previewId,
                previewUrl,
                name: preview.name
            });
            
            return {
                success: true,
                previewId,
                previewUrl,
                accessToken,
                preview: {
                    name: preview.name,
                    description: preview.description,
                    framework: preview.framework,
                    expiresAt: preview.expiresAt
                }
            };
            
        } catch (error) {
            console.error('Error creando preview:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Configurar rutas del servidor
     */
    setupRoutes() {
        this.httpServer.on('request', async (req, res) => {
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                
                // Configurar CORS
                if (this.options.corsEnabled) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                }
                
                // Rate limiting
                if (this.options.rateLimitEnabled && !this.checkRateLimit(req)) {
                    res.writeHead(429, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
                    return;
                }
                
                // Rutas
                if (url.pathname === '/' || url.pathname.startsWith('/preview/')) {
                    await this.handlePreviewRequest(req, res, url);
                } else if (url.pathname === '/api/previews') {
                    await this.handleApiRequest(req, res, url);
                } else if (url.pathname === '/health') {
                    await this.handleHealthCheck(req, res);
                } else if (url.pathname === '/analytics') {
                    await this.handleAnalyticsRequest(req, res, url);
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
                
            } catch (error) {
                console.error('Error procesando request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
    }
    
    /**
     * Manejar request de preview
     */
    async handlePreviewRequest(req, res, url) {
        try {
            // Extraer ID del preview de la URL
            const hostname = url.hostname;
            const previewId = hostname.split('.')[0];
            
            const preview = this.previews.get(previewId);
            if (!preview) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(this.generateNotFoundPage());
                return;
            }
            
            // Verificar expiración
            if (preview.expiresAt < new Date()) {
                res.writeHead(410, { 'Content-Type': 'text/html' });
                res.end(this.generateExpiredPage());
                return;
            }
            
            // Verificar acceso
            const hasAccess = this.checkPreviewAccess(req, preview);
            if (!hasAccess) {
                res.writeHead(403, { 'Content-Type': 'text/html' });
                res.end(this.generateAccessDeniedPage());
                return;
            }
            
            // Actualizar analytics
            this.updatePreviewAnalytics(previewId, req);
            
            // Crear proxy a la URL objetivo
            await this.proxyToTarget(req, res, preview.targetUrl);
            
        } catch (error) {
            console.error('Error en preview request:', error);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(this.generateErrorPage(error.message));
        }
    }
    
    /**
     * Proxy a URL objetivo
     */
    async proxyToTarget(req, res, targetUrl) {
        try {
            const target = new URL(targetUrl);
            const proxyOptions = {
                hostname: target.hostname,
                port: target.port || (target.protocol === 'https:' ? 443 : 80),
                path: target.pathname + target.search,
                method: req.method,
                headers: { ...req.headers, host: target.hostname }
            };
            
            // Remover headers problemáticos
            delete proxyOptions.headers['host'];
            delete proxyOptions.headers['connection'];
            delete proxyOptions.headers['content-length'];
            
            const proxyReq = (target.protocol === 'https:' ? https : http).request(proxyOptions, (proxyRes) => {
                // Configurar headers de respuesta
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                
                // Filtrar headers problemáticos
                delete proxyRes.headers['content-security-policy'];
                delete proxyRes.headers['x-frame-options'];
                
                proxyRes.pipe(res);
            });
            
            proxyReq.on('error', (error) => {
                console.error('Error en proxy request:', error);
                res.writeHead(502, { 'Content-Type': 'text/html' });
                res.end(this.generateProxyErrorPage());
            });
            
            // Pipe del request original
            req.pipe(proxyReq);
            
        } catch (error) {
            console.error('Error configurando proxy:', error);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(this.generateProxyErrorPage());
        }
    }
    
    /**
     * Verificar acceso a preview
     */
    checkPreviewAccess(req, preview) {
        // Previews públicos siempre accesibles
        if (preview.accessLevel === 'public') {
            return true;
        }
        
        // Verificar token de autorización
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, this.options.jwtSecret);
                return decoded.previewId === preview.id;
            } catch (error) {
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * Actualizar analytics de preview
     */
    updatePreviewAnalytics(previewId, req) {
        const preview = this.previews.get(previewId);
        if (!preview) return;
        
        // Actualizar contador de vistas
        preview.analytics.views++;
        preview.lastAccess = new Date();
        
        // Tracking de visitantes únicos
        const visitorId = this.getVisitorId(req);
        preview.analytics.uniqueVisitors.add(visitorId);
        
        // Actualizar estadísticas de browser
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const browser = this.detectBrowser(userAgent);
        preview.analytics.browserStats[browser] = (preview.analytics.browserStats[browser] || 0) + 1;
        
        // Actualizar estadísticas de país (simulado)
        const country = this.getCountryFromIP(req.connection.remoteAddress);
        preview.analytics.countryStats[country] = (preview.analytics.countryStats[country] || 0) + 1;
    }
    
    /**
     * Generar páginas HTML
     */
    generateNotFoundPage() {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview No Encontrado - Silhouette</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
               display: flex; align-items: center; justify-content: center; 
               height: 100vh; margin: 0; background: #f8f9fa; }
        .container { text-align: center; max-width: 500px; padding: 2rem; }
        h1 { color: #dc3545; margin-bottom: 1rem; }
        p { color: #6c757d; margin-bottom: 2rem; }
        a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Preview No Encontrado</h1>
        <p>El preview que buscas no existe o ha sido eliminado.</p>
        <a href="https://silhouette.app">Volver a Silhouette</a>
    </div>
</body>
</html>
        `;
    }
    
    generateExpiredPage() {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Expirado - Silhouette</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
               display: flex; align-items: center; justify-content: center; 
               height: 100vh; margin: 0; background: #f8f9fa; }
        .container { text-align: center; max-width: 500px; padding: 2rem; }
        h1 { color: #fd7e14; margin-bottom: 1rem; }
        p { color: #6c757d; margin-bottom: 2rem; }
        a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⏰ Preview Expirado</h1>
        <p>Este preview ha expirado y ya no está disponible.</p>
        <a href="https://silhouette.app">Volver a Silhouette</a>
    </div>
</body>
</html>
        `;
    }
    
    generateAccessDeniedPage() {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso Denegado - Silhouette</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
               display: flex; align-items: center; justify-content: center; 
               height: 100vh; margin: 0; background: #f8f9fa; }
        .container { text-align: center; max-width: 500px; padding: 2rem; }
        h1 { color: #dc3545; margin-bottom: 1rem; }
        p { color: #6c757d; margin-bottom: 2rem; }
        a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚫 Acceso Denegado</h1>
        <p>No tienes permisos para ver este preview.</p>
        <a href="https://silhouette.app">Volver a Silhouette</a>
    </div>
</body>
</html>
        `;
    }
    
    generateErrorPage(message) {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Silhouette</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
               display: flex; align-items: center; justify-content: center; 
               height: 100vh; margin: 0; background: #f8f9fa; }
        .container { text-align: center; max-width: 500px; padding: 2rem; }
        h1 { color: #dc3545; margin-bottom: 1rem; }
        p { color: #6c757d; margin-bottom: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ Error</h1>
        <p>Ha ocurrido un error: ${message}</p>
    </div>
</body>
</html>
        `;
    }
    
    generateProxyErrorPage() {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error de Conexión - Silhouette</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
               display: flex; align-items: center; justify-content: center; 
               height: 100vh; margin: 0; background: #f8f9fa; }
        .container { text-align: center; max-width: 500px; padding: 2rem; }
        h1 { color: #fd7e14; margin-bottom: 1rem; }
        p { color: #6c757d; margin-bottom: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔌 Error de Conexión</h1>
        <p>No se pudo conectar con el servidor de destino.</p>
    </div>
</body>
</html>
        `;
    }
    
    /**
     * Utilidades auxiliares
     */
    
    generatePreviewId() {
        return 'p_' + crypto.randomBytes(8).toString('hex');
    }
    
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }
    
    generateAccessToken(previewId, ownerId) {
        return jwt.sign(
            { previewId, ownerId, type: 'preview_access' },
            this.options.jwtSecret,
            { expiresIn: '30d' }
        );
    }
    
    getVisitorId(req) {
        // Generar ID único basado en IP y user agent
        const ip = req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        return crypto.createHash('md5').update(ip + userAgent).digest('hex');
    }
    
    detectBrowser(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Other';
    }
    
    getCountryFromIP(ip) {
        // Implementación simplificada - en producción usar GeoIP
        const countryCodes = ['US', 'ES', 'MX', 'AR', 'CO', 'PE', 'CL', 'VE', 'EC', 'BO'];
        return countryCodes[Math.floor(Math.random() * countryCodes.length)];
    }
    
    checkRateLimit(req) {
        // Implementación básica de rate limiting
        const ip = req.connection.remoteAddress;
        const now = Date.now();
        const window = 60000; // 1 minuto
        
        if (!this.usageStats.has(ip)) {
            this.usageStats.set(ip, { count: 1, windowStart: now });
            return true;
        }
        
        const stats = this.usageStats.get(ip);
        if (now - stats.windowStart > window) {
            stats.count = 1;
            stats.windowStart = now;
            return true;
        }
        
        if (stats.count < 100) { // 100 requests por minuto
            stats.count++;
            return true;
        }
        
        return false;
    }
    
    /**
     * Manejar API requests
     */
    async handleApiRequest(req, res, url) {
        // Implementar endpoints de API para gestión de previews
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Preview API v1.0' }));
    }
    
    /**
     * Manejar health check
     */
    async handleHealthCheck(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'Silhouette Preview Sharing',
            version: '5.1.0',
            uptime: process.uptime(),
            previews: this.previews.size,
            timestamp: new Date()
        }));
    }
    
    /**
     * Manejar analytics requests
     */
    async handleAnalyticsRequest(req, res, url) {
        // Implementar endpoints de analytics
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Analytics API v1.0' }));
    }
    
    /**
     * Cargar previews existentes
     */
    async loadExistingPreviews() {
        // En una implementación real, cargar desde base de datos
        console.log('ℹ️ No hay previews existentes para cargar');
    }
    
    /**
     * Iniciar limpieza automática
     */
    startAutoCleanup() {
        setInterval(() => {
            this.cleanupExpiredPreviews();
        }, this.options.cleanupInterval);
    }
    
    /**
     * Limpiar previews expirados
     */
    cleanupExpiredPreviews() {
        const now = new Date();
        const expired = [];
        
        for (const [previewId, preview] of this.previews) {
            if (preview.expiresAt < now) {
                expired.push(previewId);
            }
        }
        
        for (const previewId of expired) {
            this.previews.delete(previewId);
            this.analytics.delete(previewId);
            console.log(`🗑️ Preview expirado eliminado: ${previewId}`);
        }
        
        if (expired.length > 0) {
            this.emit('previews-cleaned', { count: expired.length });
        }
        
        return expired.length;
    }
    
    /**
     * Listar previews activos
     */
    listActivePreviews() {
        const now = new Date();
        return Array.from(this.previews.values())
            .filter(preview => preview.expiresAt > now)
            .map(preview => ({
                id: preview.id,
                name: preview.name,
                url: preview.previewUrl,
                framework: preview.framework,
                createdAt: preview.createdAt,
                expiresAt: preview.expiresAt,
                views: preview.analytics.views,
                uniqueVisitors: preview.analytics.uniqueVisitors.size
            }));
    }
    
    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            totalPreviews: this.previews.size,
            activePreviews: Array.from(this.previews.values()).filter(p => p.expiresAt > new Date()).length,
            totalViews: Array.from(this.previews.values()).reduce((sum, p) => sum + p.analytics.views, 0),
            serverRunning: this.isRunning,
            uptime: process.uptime()
        };
    }
    
    /**
     * Verificar si está inicializado
     */
    isSharingReady() {
        return this.isInitialized;
    }
    
    /**
     * Destruir instancia
     */
    destroy() {
        this.stopServer();
        this.previews.clear();
        this.analytics.clear();
        this.removeAllListeners();
        console.log('🗑️ Preview Sharing destruido');
    }
}

module.exports = PreviewSharing;