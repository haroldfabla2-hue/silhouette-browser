const EventEmitter = require('events');
const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

/**
 * Sistema de Integración Docker para Servidores Reales
 * Inspirado en Testcontainers + Docker networking best practices
 * Proporciona ejecución real de aplicaciones con URLs funcionales
 */
class DockerIntegration extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            socketPath: options.socketPath || '/var/run/docker.sock',
            host: options.host || 'localhost',
            networkMode: options.networkMode || 'bridge', // bridge, host
            sslEnabled: options.sslEnabled || true,
            resourceLimits: options.resourceLimits || {
                memory: '512m',
                cpus: '0.5',
                disk: '1g'
            }
        };
        
        this.docker = new Docker({
            socketPath: this.options.socketPath
        });
        
        this.containers = new Map();
        this.networks = new Map();
        this.images = new Map();
        this.services = new Map();
        this.isInitialized = false;
        this.isRunning = false;
        
        // Configuración de redes Docker
        this.networkConfig = {
            namePrefix: 'silhouette-',
            subnet: '172.20.0.0/16',
            gateway: '172.20.0.1'
        };
        
        // Templates de servicios comunes
        this.serviceTemplates = {
            'node-react': {
                image: 'node:18-alpine',
                ports: ['3000:3000'],
                volumes: ['.:/app'],
                command: 'npm start',
                workingDir: '/app',
                environment: {
                    'NODE_ENV': 'development',
                    'CHOKIDAR_USEPOLLING': 'true'
                }
            },
            'node-vue': {
                image: 'node:18-alpine',
                ports: ['8080:8080'],
                volumes: ['.:/app'],
                command: 'npm run dev -- --host 0.0.0.0',
                workingDir: '/app',
                environment: {
                    'NODE_ENV': 'development'
                }
            },
            'node-angular': {
                image: 'node:18-alpine',
                ports: ['4200:4200'],
                volumes: ['.:/app'],
                command: 'ng serve --host 0.0.0.0 --port 4200',
                workingDir: '/app',
                environment: {
                    'NODE_ENV': 'development'
                }
            },
            'python-django': {
                image: 'python:3.11-alpine',
                ports: ['8000:8000'],
                volumes: ['.:/app'],
                command: 'python manage.py runserver 0.0.0.0:8000',
                workingDir: '/app'
            },
            'python-flask': {
                image: 'python:3.11-alpine',
                ports: ['5000:5000'],
                volumes: ['.:/app'],
                command: 'python app.py',
                workingDir: '/app',
                environment: {
                    'FLASK_ENV': 'development',
                    'FLASK_DEBUG': '1'
                }
            },
            'postgresql': {
                image: 'postgres:15-alpine',
                ports: ['5432:5432'],
                environment: {
                    'POSTGRES_DB': 'silhouette',
                    'POSTGRES_USER': 'silhouette',
                    'POSTGRES_PASSWORD': 'silhouette123'
                },
                volumes: ['postgres_data:/var/lib/postgresql/data']
            },
            'mongodb': {
                image: 'mongo:6-alpine',
                ports: ['27017:27017'],
                environment: {
                    'MONGO_INITDB_DATABASE': 'silhouette'
                },
                volumes: ['mongo_data:/data/db']
            },
            'redis': {
                image: 'redis:7-alpine',
                ports: ['6379:6379'],
                command: 'redis-server --appendonly yes',
                volumes: ['redis_data:/data']
            },
            'nginx': {
                image: 'nginx:alpine',
                ports: ['80:80', '443:443'],
                volumes: ['./nginx.conf:/etc/nginx/nginx.conf:ro'],
                command: 'nginx -g "daemon off;"'
            }
        };
        
        this.init();
    }
    
    /**
     * Inicializar el sistema Docker
     */
    async init() {
        try {
            console.log('🐳 Inicializando integración Docker...');
            
            // Verificar conexión con Docker
            await this.verifyDockerConnection();
            
            // Crear red base
            await this.createBaseNetwork();
            
            // Precargar imágenes comunes
            await this.preloadCommonImages();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ Integración Docker inicializada');
        } catch (error) {
            console.error('❌ Error inicializando Docker:', error);
            throw error;
        }
    }
    
    /**
     * Verificar conexión con Docker
     */
    async verifyDockerConnection() {
        try {
            await this.docker.ping();
            console.log('✅ Conexión con Docker verificada');
        } catch (error) {
            throw new Error('No se puede conectar con Docker. Asegúrate de que Docker esté ejecutándose.');
        }
    }
    
    /**
     * Crear red base para Silhouette
     */
    async createBaseNetwork() {
        try {
            const networkName = this.networkConfig.namePrefix + 'base';
            
            try {
                // Intentar obtener red existente
                const network = await this.docker.getNetwork(networkName).inspect();
                this.networks.set(networkName, network);
                console.log(`📡 Red existente encontrada: ${networkName}`);
            } catch (error) {
                // Crear nueva red
                const network = await this.docker.createNetwork({
                    Name: networkName,
                    Driver: 'bridge',
                    IPAM: {
                        Config: [{
                            Subnet: this.networkConfig.subnet,
                            Gateway: this.networkConfig.gateway
                        }]
                    },
                    Options: {
                        'com.docker.network.bridge.name': 'silhouette-br0'
                    }
                });
                
                this.networks.set(networkName, network);
                console.log(`🆕 Red creada: ${networkName}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Error creando red base:', error.message);
        }
    }
    
    /**
     * Precargar imágenes comunes
     */
    async preloadCommonImages() {
        const commonImages = [
            'node:18-alpine',
            'python:3.11-alpine',
            'postgres:15-alpine',
            'mongo:6-alpine',
            'redis:7-alpine',
            'nginx:alpine'
        ];
        
        for (const imageName of commonImages) {
            try {
                await this.pullImage(imageName);
                this.images.set(imageName, true);
                console.log(`📦 Imagen precargada: ${imageName}`);
            } catch (error) {
                console.warn(`⚠️ Error precargando imagen ${imageName}:`, error.message);
            }
        }
    }
    
    /**
     * Ejecutar aplicación en contenedor
     */
    async runApplication(config) {
        const serviceId = this.generateServiceId();
        const projectName = config.name || `app-${Date.now()}`;
        const framework = config.framework || 'unknown';
        
        try {
            // Obtener template de servicio
            const template = this.getServiceTemplate(framework, config);
            
            // Crear configuración de contenedor
            const containerConfig = {
                Image: template.image,
                name: `${this.networkConfig.namePrefix}${projectName}`,
                Hostname: projectName,
                WorkingDir: template.workingDir || '/app',
                Env: template.environment || [],
                Cmd: template.command ? [template.command] : undefined,
                ExposedPorts: this.parseExposedPorts(template.ports || []),
                HostConfig: {
                    Binds: template.volumes || [],
                    NetworkMode: this.networkConfig.namePrefix + 'base',
                    Memory: this.parseMemoryLimit(this.options.resourceLimits.memory),
                    CpuPeriod: 100000,
                    CpuQuota: parseInt(this.options.resourceLimits.cpus) * 100000,
                    RestartPolicy: { Name: 'unless-stopped' }
                }
            };
            
            // Crear contenedor
            const container = await this.docker.createContainer(containerConfig);
            
            // Iniciar contenedor
            await container.start();
            
            // Configurar contenedor en el servicio
            const service = {
                id: serviceId,
                name: projectName,
                container,
                framework: framework,
                config: containerConfig,
                ports: template.ports || [],
                createdAt: new Date(),
                status: 'starting',
                url: null
            };
            
            // Generar URL del servicio
            service.url = await this.generateServiceUrl(service);
            
            // Almacenar servicio
            this.services.set(serviceId, service);
            this.containers.set(container.id, serviceId);
            
            // Configurar monitoreo
            this.setupContainerMonitoring(container, serviceId);
            
            service.status = 'running';
            
            console.log(`🚀 Aplicación ejecutada: ${projectName} -> ${service.url}`);
            
            this.emit('application-started', {
                serviceId,
                name: projectName,
                url: service.url,
                framework: framework
            });
            
            return {
                success: true,
                serviceId,
                url: service.url,
                name: projectName,
                framework: framework,
                container: {
                    id: container.id,
                    name: containerConfig.name
                }
            };
            
        } catch (error) {
            console.error(`❌ Error ejecutando aplicación ${projectName}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Obtener template de servicio
     */
    getServiceTemplate(framework, config) {
        // Buscar template específico del framework
        let templateKey = `node-${framework}`;
        if (this.serviceTemplates[templateKey]) {
            return { ...this.serviceTemplates[templateKey] };
        }
        
        // Template por defecto
        return this.serviceTemplates['node-react'];
    }
    
    /**
     * Generar URL del servicio
     */
    async generateServiceUrl(service) {
        const host = this.options.host;
        const protocol = this.options.sslEnabled ? 'https' : 'http';
        
        // Extraer puerto del primer mapeo de puertos
        const firstPort = service.ports[0];
        if (firstPort && firstPort.includes(':')) {
            const containerPort = firstPort.split(':')[0];
            
            // Verificar si es un dominio local
            if (this.hasLocalDomain(service.name)) {
                const domain = this.getLocalDomain(service.name);
                return `${protocol}://${domain}:${containerPort}`;
            } else {
                return `${protocol}://${host}:${containerPort}`;
            }
        }
        
        // URL por defecto
        return `${protocol}://${host}:8080`;
    }
    
    /**
     * Verificar si tiene dominio local
     */
    hasLocalDomain(serviceName) {
        // En un entorno de desarrollo, podríamos configurar /etc/hosts
        // o usar DNS local para resolver dominios .local
        return true; // Siempre usar dominio local en desarrollo
    }
    
    /**
     * Obtener dominio local
     */
    getLocalDomain(serviceName) {
        return `${serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`;
    }
    
    /**
     * Configurar monitoreo de contenedor
     */
    async setupContainerMonitoring(container, serviceId) {
        // Monitorear estado del contenedor
        container.on('state', (state) => {
            const service = this.services.get(serviceId);
            if (service) {
                service.status = state.Status;
                
                if (state.Status === 'running') {
                    this.emit('container-ready', { serviceId, container: container.id });
                } else if (state.Status === 'stopped' || state.Status === 'exited') {
                    this.emit('container-stopped', { serviceId, container: container.id, state });
                }
            }
        });
        
        // Monitorear logs del contenedor
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            follow: true,
            tail: 100
        });
        
        logs.on('data', (data) => {
            this.emit('container-log', {
                serviceId,
                container: container.id,
                data: data.toString()
            });
        });
    }
    
    /**
     * Detener aplicación
     */
    async stopApplication(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            return { success: false, error: 'Servicio no encontrado' };
        }
        
        try {
            // Detener contenedor
            await service.container.stop();
            
            // Remover contenedor
            await service.container.remove();
            
            // Limpiar referencias
            this.services.delete(serviceId);
            this.containers.delete(service.container.id);
            
            console.log(`🛑 Aplicación detenida: ${service.name}`);
            
            this.emit('application-stopped', { serviceId, name: service.name });
            
            return { success: true };
            
        } catch (error) {
            console.error(`Error deteniendo aplicación ${serviceId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Reiniciar aplicación
     */
    async restartApplication(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            return { success: false, error: 'Servicio no encontrado' };
        }
        
        try {
            // Reiniciar contenedor
            await service.container.restart();
            
            console.log(`🔄 Aplicación reiniciada: ${service.name}`);
            
            this.emit('application-restarted', { serviceId, name: service.name });
            
            return { success: true };
            
        } catch (error) {
            console.error(`Error reiniciando aplicación ${serviceId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Ejecutar base de datos
     */
    async runDatabase(type = 'postgresql', config = {}) {
        const serviceId = this.generateServiceId();
        const serviceName = `db-${type}-${Date.now()}`;
        
        try {
            const template = this.serviceTemplates[type];
            if (!template) {
                throw new Error(`Tipo de base de datos no soportado: ${type}`);
            }
            
            // Crear configuración de contenedor
            const containerConfig = {
                Image: template.image,
                name: `${this.networkConfig.namePrefix}${serviceName}`,
                Env: { ...template.environment, ...config.environment },
                ExposedPorts: this.parseExposedPorts(template.ports || []),
                HostConfig: {
                    Binds: template.volumes || [],
                    NetworkMode: this.networkConfig.namePrefix + 'base',
                    Memory: this.parseMemoryLimit('256m')
                }
            };
            
            // Crear y ejecutar contenedor
            const container = await this.docker.createContainer(containerConfig);
            await container.start();
            
            // Esperar a que la base de datos esté lista
            await this.waitForService(container, type);
            
            const service = {
                id: serviceId,
                name: serviceName,
                container,
                type: type,
                config: containerConfig,
                ports: template.ports || [],
                createdAt: new Date(),
                status: 'running',
                url: await this.generateServiceUrl({
                    name: serviceName,
                    ports: template.ports || []
                })
            };
            
            this.services.set(serviceId, service);
            this.containers.set(container.id, serviceId);
            
            console.log(`🗄️ Base de datos ejecutada: ${type} -> ${service.url}`);
            
            this.emit('database-started', {
                serviceId,
                type: type,
                url: service.url,
                config: config
            });
            
            return {
                success: true,
                serviceId,
                url: service.url,
                type: type
            };
            
        } catch (error) {
            console.error(`Error ejecutando base de datos ${type}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Esperar a que el servicio esté listo
     */
    async waitForService(container, type) {
        const waitTime = 30000; // 30 segundos
        const checkInterval = 1000; // 1 segundo
        const maxAttempts = waitTime / checkInterval;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // Ejecutar comando de ping en el contenedor
                const exec = await container.exec({
                    Cmd: this.getHealthCheckCommand(type),
                    AttachStdout: true,
                    AttachStderr: true
                });
                
                const stream = await exec.start({ hijack: true, stdin: false });
                
                // Esperar a que termine la ejecución
                await new Promise((resolve) => {
                    stream.on('end', resolve);
                    setTimeout(resolve, 5000); // Timeout de seguridad
                });
                
                return true; // Servicio listo
                
            } catch (error) {
                // Intentar nuevamente
                await new Promise(resolve => setTimeout(resolve, checkInterval));
            }
        }
        
        throw new Error(`Timeout esperando a que el servicio ${type} esté listo`);
    }
    
    /**
     * Obtener comando de health check
     */
    getHealthCheckCommand(type) {
        const commands = {
            'postgresql': ['pg_isready', '-U', 'silhouette'],
            'mongodb': ['mongosh', '--eval', 'db.adminCommand("ping")'],
            'redis': ['redis-cli', 'ping']
        };
        
        return commands[type] || ['echo', 'ready'];
    }
    
    /**
     * Listar servicios activos
     */
    listServices() {
        return Array.from(this.services.values()).map(service => ({
            id: service.id,
            name: service.name,
            type: service.type || service.framework,
            url: service.url,
            status: service.status,
            createdAt: service.createdAt,
            ports: service.ports
        }));
    }
    
    /**
     * Obtener logs de servicio
     */
    async getServiceLogs(serviceId, options = {}) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error('Servicio no encontrado');
        }
        
        try {
            const logs = await service.container.logs({
                stdout: true,
                stderr: true,
                follow: false,
                tail: options.tail || 1000
            });
            
            return logs.toString();
        } catch (error) {
            console.error(`Error obteniendo logs del servicio ${serviceId}:`, error);
            return '';
        }
    }
    
    /**
     * Crear docker-compose.yml para proyecto
     */
    async generateDockerCompose(projectPath, framework, services = []) {
        const compose = {
            version: '3.8',
            services: {}
        };
        
        // Servicio principal de la aplicación
        const appService = this.getServiceTemplate(framework);
        compose.services.app = {
            image: appService.image,
            ports: appService.ports,
            volumes: ['.:/app'],
            working_dir: appService.workingDir,
            environment: appService.environment,
            command: appService.command,
            networks: [this.networkConfig.namePrefix + 'base']
        };
        
        // Agregar servicios adicionales
        for (const serviceType of services) {
            const serviceConfig = this.serviceTemplates[serviceType];
            if (serviceConfig) {
                compose.services[serviceType] = {
                    image: serviceConfig.image,
                    ports: serviceConfig.ports,
                    environment: serviceConfig.environment,
                    volumes: serviceConfig.volumes,
                    networks: [this.networkConfig.namePrefix + 'base']
                };
            }
        }
        
        // Configurar redes
        compose.networks = {
            [this.networkConfig.namePrefix + 'base']: {
                driver: 'bridge'
            }
        };
        
        // Escribir archivo docker-compose.yml
        const composePath = path.join(projectPath, 'docker-compose.yml');
        await fs.writeFile(composePath, yaml.dump(compose));
        
        return composePath;
    }
    
    /**
     * Utilidades auxiliares
     */
    
    async pullImage(imageName) {
        return new Promise((resolve, reject) => {
            this.docker.pull(imageName, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                this.docker.modem.followProgress(stream, (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                });
            });
        });
    }
    
    parseExposedPorts(portMappings) {
        const ports = {};
        portMappings.forEach(mapping => {
            const [hostPort, containerPort] = mapping.split(':');
            ports[`${containerPort}/tcp`] = {};
        });
        return ports;
    }
    
    parseMemoryLimit(memoryString) {
        const value = parseInt(memoryString);
        const unit = memoryString.toLowerCase().match(/([a-z]+)$/)[1];
        
        const multipliers = {
            'b': 1,
            'k': 1024,
            'm': 1024 * 1024,
            'g': 1024 * 1024 * 1024
        };
        
        return value * (multipliers[unit] || 1);
    }
    
    generateServiceId() {
        const crypto = require('crypto');
        return 'service_' + crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * Obtener estadísticas del sistema Docker
     */
    getStats() {
        return {
            running: this.isRunning,
            services: {
                total: this.services.size,
                applications: Array.from(this.services.values()).filter(s => s.framework).length,
                databases: Array.from(this.services.values()).filter(s => s.type).length
            },
            containers: {
                total: this.containers.size
            },
            networks: {
                total: this.networks.size
            },
            images: {
                total: this.images.size
            }
        };
    }
    
    /**
     * Verificar si está inicializado
     */
    isDockerReady() {
        return this.isInitialized;
    }
    
    /**
     * Destruir instancia
     */
    destroy() {
        // Detener todos los servicios
        const stopPromises = Array.from(this.services.keys()).map(serviceId => {
            return this.stopApplication(serviceId).catch(console.error);
        });
        
        Promise.all(stopPromises).then(() => {
            this.removeAllListeners();
            console.log('🗑️ Integración Docker destruida');
        });
    }
}

module.exports = DockerIntegration;