/**
 * OMNIPOTENT API
 * API principal para interacciones externas
 */

import SilhouetteOmnipotentAgent from '../core/silhouette-omnipotent-agent.js';

export class SilhouetteOmnipotentAPI {
    constructor() {
        this.agent = null;
        this.isInitialized = false;
        this.config = null;
    }

    async initialize(configPath = null) {
        try {
            this.log('Inicializando API Omnipotente...');
            
            // Cargar configuración
            this.config = await this.loadConfiguration(configPath);
            
            // Inicializar agente
            this.agent = new SilhouetteOmnipotentAgent(this.config);
            
            // Inicializar
            await this.agent.initialize();
            
            this.isInitialized = true;
            this.log('API Omnipotente inicializada', 'success');
            
        } catch (error) {
            this.log('Error inicializando API: ' + error.message, 'error');
            throw error;
        }
    }

    async loadConfiguration(configPath) {
        // Simulación de carga de configuración
        return {
            engines: {
                playwright: { enabled: true },
                snowfort: { enabled: true }
            },
            ai: {
                models: {
                    navigation: "gpt-4-turbo",
                    interaction: "claude-3-5-sonnet"
                }
            },
            safety: {
                promptInjectionDefense: true,
                actionConfirmations: true
            }
        };
    }

    // API Principal
    async executeCommand(command, options = {}) {
        if (!this.isInitialized) {
            throw new Error('API no inicializada. Llamar initialize() primero.');
        }

        const task = {
            description: command,
            type: 'generic',
            options: options,
            timestamp: new Date().toISOString()
        };

        return await this.agent.executeOmnipotentTask(task);
    }

    async autonomousNavigation(url, goal) {
        const result = await this.executeCommand(
            `Navega a ${url} para ${goal}`
        );
        return result;
    }

    async extractData(selector, format = 'structured') {
        const result = await this.executeCommand(
            `Extrae datos usando el selector: ${selector}`
        );
        return result;
    }

    async fillForm(formData, context = 'auto') {
        const formDescription = Object.entries(formData)
            .map(([field, value]) => `${field}: ${value}`)
            .join(', ');
            
        const result = await this.executeCommand(
            `Llena el formulario con: ${formDescription}`
        );
        return result;
    }

    async getStatus() {
        if (!this.agent) {
            return { initialized: false };
        }
        
        return await this.agent.getStatus();
    }

    async testConnection() {
        try {
            const status = await this.getStatus();
            return {
                connected: true,
                version: '5.3.0',
                status: status
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] OmnipotentAPI: ${message}`);
    }
}

export default SilhouetteOmnipotentAPI;