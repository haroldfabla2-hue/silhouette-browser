/**
 * SILHOUETTE BROWSER V4.0 - PLUGIN SYSTEM
 * Sistema extensible de plugins para funcionalidades personalizadas
 */

class SilhouettePluginSystem {
    constructor() {
        this.plugins = new Map();
        this.activePlugins = new Set();
        this.pluginConfigs = new Map();
        this.loadedPlugins = new Set();
    }

    // ========================================================================
    // GESTIÓN DE PLUGINS
    // ========================================================================

    async loadPlugin(pluginId, pluginConfig) {
        try {
            console.log(`🔌 Loading plugin: ${pluginId}`);
            
            // Validar configuración del plugin
            this.validatePluginConfig(pluginConfig);
            
            // Cargar plugin
            const plugin = await this.createPluginInstance(pluginId, pluginConfig);
            
            // Registrar plugin
            this.plugins.set(pluginId, plugin);
            this.pluginConfigs.set(pluginId, pluginConfig);
            
            // Auto-activar si está marcado como auto-start
            if (pluginConfig.autoStart) {
                await this.activatePlugin(pluginId);
            }
            
            this.showNotification(`Plugin ${pluginConfig.name} cargado exitosamente`, 'success');
            return { success: true, pluginId };
            
        } catch (error) {
            console.error(`Error loading plugin ${pluginId}:`, error);
            this.showNotification(`Error cargando plugin: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async activatePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        try {
            if (plugin.activate) {
                await plugin.activate();
            }
            
            this.activePlugins.add(pluginId);
            this.showNotification(`Plugin ${plugin.name} activado`, 'info');
            
            // Actualizar UI si es necesario
            this.updatePluginUI(pluginId, true);
            
            return { success: true };
            
        } catch (error) {
            console.error(`Error activating plugin ${pluginId}:`, error);
            this.showNotification(`Error activando plugin: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async deactivatePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        try {
            if (plugin.deactivate) {
                await plugin.deactivate();
            }
            
            this.activePlugins.delete(pluginId);
            this.showNotification(`Plugin ${plugin.name} desactivado`, 'info');
            
            // Actualizar UI
            this.updatePluginUI(pluginId, false);
            
            return { success: true };
            
        } catch (error) {
            console.error(`Error deactivating plugin ${pluginId}:`, error);
            this.showNotification(`Error desactivando plugin: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async removePlugin(pluginId) {
        // Desactivar si está activo
        if (this.activePlugins.has(pluginId)) {
            await this.deactivatePlugin(pluginId);
        }
        
        // Eliminar plugin
        this.plugins.delete(pluginId);
        this.pluginConfigs.delete(pluginId);
        this.loadedPlugins.delete(pluginId);
        
        this.showNotification(`Plugin eliminado`, 'info');
        return { success: true };
    }

    // ========================================================================
    // PLUGINS PREDEFINIDOS
    // ========================================================================

    getAvailablePlugins() {
        return [
            {
                id: 'research-assistant',
                name: 'Research Assistant',
                description: 'Asistente especializado para investigación académica y análisis de papers',
                category: 'research',
                version: '1.0.0',
                author: 'Silhouette Team',
                icon: '🔍',
                autoStart: false,
                config: {
                    databases: ['semantic-scholar', 'pubmed', 'arxiv'],
                    exportFormats: ['bibtex', 'ris', 'json'],
                    autoSummarize: true
                }
            },
            {
                id: 'code-snippets',
                name: 'Code Snippets Library',
                description: 'Biblioteca personalizable de snippets de código con syntax highlighting',
                category: 'development',
                version: '1.0.0',
                author: 'Silhouette Team',
                icon: '💻',
                autoStart: true,
                config: {
                    languages: ['javascript', 'python', 'html', 'css'],
                    snippetsPerPage: 20,
                    enableSearch: true
                }
            },
            {
                id: 'design-assets',
                name: 'Design Assets Manager',
                description: 'Gestor de recursos de diseño con integración a múltiples fuentes',
                category: 'design',
                version: '1.0.0',
                author: 'Silhouette Team',
                icon: '🎨',
                autoStart: false,
                config: {
                    sources: ['unsplash', 'pixabay', 'pexels'],
                    autoTag: true,
                    favorites: []
                }
            },
            {
                id: 'data-analyzer',
                name: 'Data Analysis Toolbox',
                description: 'Herramientas para análisis de datos con visualizaciones automáticas',
                category: 'analytics',
                version: '1.0.0',
                author: 'Silhouette Team',
                icon: '📊',
                autoStart: false,
                config: {
                    chartTypes: ['bar', 'line', 'pie', 'scatter'],
                    autoInsights: true,
                    exportFormats: ['png', 'svg', 'pdf']
                }
            },
            {
                id: 'social-media',
                name: 'Social Media Scheduler',
                description: 'Programador y gestor de contenido para redes sociales',
                category: 'marketing',
                version: '1.0.0',
                author: 'Silhouette Team',
                icon: '📱',
                autoStart: false,
                config: {
                    platforms: ['twitter', 'linkedin', 'facebook'],
                    autoSchedule: false,
                    contentTemplates: true
                }
            },
            {
                id: 'project-manager',
                name: 'Project Management',
                description: 'Gestor de proyectos con integración de tareas y milestones',
                category: 'productivity',
                version: '1.0.0',
                author: 'Silhouette Team',
                icon: '📋',
                autoStart: false,
                config: {
                    defaultView: 'kanban',
                    autoBackup: true,
                    notifications: true
                }
            },
            {
                id: 'api-monitor',
                name: 'API Health Monitor',
                description: 'Monitor de salud y rendimiento de APIs en tiempo real',
                category: 'monitoring',
                version: '1.0.0',
                author: 'Silhouette Team',
                icon: '⚡',
                autoStart: true,
                config: {
                    checkInterval: 30000,
                    alertThresholds: { responseTime: 5000, errorRate: 5 },
                    notifications: true
                }
            },
            {
                id: 'content-generator',
                name: 'Content Generator AI',
                description: 'Generador de contenido basado en IA para múltiples formatos',
                category: 'content',
                version: '1.0.0',
                author: 'Silhouette Team',
                icon: '✍️',
                autoStart: false,
                config: {
                    contentTypes: ['blog', 'social', 'email', 'ad-copy'],
                    tone: 'professional',
                    length: 'medium'
                }
            }
        ];
    }

    // ========================================================================
    // CREACIÓN DE INSTANCIAS DE PLUGIN
    // ========================================================================

    async createPluginInstance(pluginId, config) {
        // Aquí se implementarían las clases reales de cada plugin
        // Por ahora, usamos un factory que retorna plugins mock
        
        const availablePlugins = this.getAvailablePlugins();
        const pluginConfig = availablePlugins.find(p => p.id === pluginId);
        
        if (!pluginConfig) {
            throw new Error(`Plugin ${pluginId} not found in available plugins`);
        }

        return new MockPlugin(pluginId, config || pluginConfig.config);
    }

    validatePluginConfig(config) {
        if (!config.id || !config.name || !config.version) {
            throw new Error('Invalid plugin configuration: missing required fields');
        }
        
        // Validaciones adicionales...
    }

    // ========================================================================
    // UI DE GESTIÓN DE PLUGINS
    // ========================================================================

    renderPluginManager() {
        const container = document.getElementById('pluginManager');
        if (!container) return;

        container.innerHTML = `
            <div class="config-section">
                <h3>🔌 Gestión de Plugins</h3>
                <div class="plugin-categories">
                    <div class="category-tabs">
                        <button class="plugin-category-tab active" data-category="all">Todos</button>
                        <button class="plugin-category-tab" data-category="research">Investigación</button>
                        <button class="plugin-category-tab" data-category="development">Desarrollo</button>
                        <button class="plugin-category-tab" data-category="design">Diseño</button>
                        <button class="plugin-category-tab" data-category="analytics">Análisis</button>
                        <button class="plugin-category-tab" data-category="marketing">Marketing</button>
                        <button class="plugin-category-tab" data-category="productivity">Productividad</button>
                        <button class="plugin-category-tab" data-category="monitoring">Monitoreo</button>
                        <button class="plugin-category-tab" data-category="content">Contenido</button>
                    </div>
                </div>
                <div class="plugins-grid" id="pluginsGrid">
                    ${this.renderAvailablePlugins()}
                </div>
            </div>
        `;

        this.setupPluginEventListeners();
    }

    renderAvailablePlugins() {
        const availablePlugins = this.getAvailablePlugins();
        
        return availablePlugins.map(plugin => `
            <div class="plugin-card" data-category="${plugin.category}">
                <div class="plugin-header">
                    <div class="plugin-icon">${plugin.icon}</div>
                    <div class="plugin-info">
                        <h4>${plugin.name}</h4>
                        <p>${plugin.description}</p>
                        <div class="plugin-meta">
                            <span class="plugin-version">v${plugin.version}</span>
                            <span class="plugin-author">por ${plugin.author}</span>
                        </div>
                    </div>
                    <div class="plugin-status">
                        ${this.isPluginActive(plugin.id) ? 
                            '<span class="status-indicator online"></span>' : 
                            '<span class="status-indicator offline"></span>'
                        }
                    </div>
                </div>
                <div class="plugin-actions">
                    ${this.getPluginActionButton(plugin)}
                    <button class="btn btn-secondary" onclick="pluginSystem.configurePlugin('${plugin.id}')">
                        ⚙️ Configurar
                    </button>
                </div>
            </div>
        `).join('');
    }

    isPluginActive(pluginId) {
        return this.activePlugins.has(pluginId);
    }

    getPluginActionButton(plugin) {
        if (this.isPluginActive(plugin.id)) {
            return `<button class="btn btn-danger" onclick="pluginSystem.deactivatePlugin('${plugin.id}')">Desactivar</button>`;
        } else {
            return `<button class="btn btn-primary" onclick="pluginSystem.activatePlugin('${plugin.id}')">Activar</button>`;
        }
    }

    setupPluginEventListeners() {
        // Category tabs
        document.querySelectorAll('.plugin-category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchPluginCategory(e.target.dataset.category);
            });
        });
    }

    switchPluginCategory(category) {
        // Update active tab
        document.querySelectorAll('.plugin-category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Filter plugins
        const pluginCards = document.querySelectorAll('.plugin-card');
        pluginCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    async configurePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return;

        // Crear modal de configuración
        const modal = this.createConfigModal(plugin);
        document.body.appendChild(modal);
    }

    createConfigModal(plugin) {
        const modal = document.createElement('div');
        modal.className = 'plugin-config-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const config = this.pluginConfigs.get(plugin.id) || {};

        modal.innerHTML = `
            <div class="plugin-config-content" style="
                background: var(--background-primary);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
                    <h2>⚙️ ${plugin.name}</h2>
                    <p>${plugin.description}</p>
                </div>
                <div class="plugin-config-form" style="padding: 20px;">
                    ${this.renderPluginConfigForm(plugin, config)}
                </div>
                <div style="padding: 20px; border-top: 1px solid var(--border-color); text-align: right;">
                    <button class="btn btn-secondary" onclick="this.closest('.plugin-config-modal').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="pluginSystem.savePluginConfig('${plugin.id}')" style="margin-left: 12px;">Guardar</button>
                </div>
            </div>
        `;

        return modal;
    }

    renderPluginConfigForm(plugin, config) {
        // Formularios dinámicos según el tipo de plugin
        if (plugin.id === 'research-assistant') {
            return `
                <div class="config-field">
                    <label>Base de datos de preferencia:</label>
                    <select id="preferredDatabase">
                        <option value="semantic-scholar" ${config.preferredDatabase === 'semantic-scholar' ? 'selected' : ''}>Semantic Scholar</option>
                        <option value="pubmed" ${config.preferredDatabase === 'pubmed' ? 'selected' : ''}>PubMed</option>
                        <option value="arxiv" ${config.preferredDatabase === 'arxiv' ? 'selected' : ''}>ArXiv</option>
                    </select>
                </div>
                <div class="config-field">
                    <label>Auto-resumen:</label>
                    <input type="checkbox" id="autoSummarize" ${config.autoSummarize ? 'checked' : ''}>
                </div>
            `;
        } else if (plugin.id === 'code-snippets') {
            return `
                <div class="config-field">
                    <label>Snippets por página:</label>
                    <input type="number" id="snippetsPerPage" value="${config.snippetsPerPage || 20}" min="5" max="100">
                </div>
                <div class="config-field">
                    <label>Habilitar búsqueda:</label>
                    <input type="checkbox" id="enableSearch" ${config.enableSearch ? 'checked' : ''}>
                </div>
            `;
        } else {
            return '<p>Configuración específica no disponible para este plugin.</p>';
        }
    }

    savePluginConfig(pluginId) {
        const modal = document.querySelector('.plugin-config-modal');
        const config = {};
        
        // Extraer valores del formulario
        const inputs = modal.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                config[input.id] = input.checked;
            } else {
                config[input.id] = input.value;
            }
        });

        // Guardar configuración
        this.pluginConfigs.set(pluginId, config);
        localStorage.setItem(`pluginConfig_${pluginId}`, JSON.stringify(config));
        
        // Actualizar plugin si está activo
        if (this.activePlugins.has(pluginId)) {
            const plugin = this.plugins.get(pluginId);
            if (plugin && plugin.updateConfig) {
                plugin.updateConfig(config);
            }
        }
        
        modal.remove();
        this.showNotification('Configuración guardada', 'success');
    }

    updatePluginUI(pluginId, isActive) {
        const pluginCard = document.querySelector(`[data-plugin-id="${pluginId}"]`);
        if (pluginCard) {
            const statusIndicator = pluginCard.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.className = `status-indicator ${isActive ? 'online' : 'offline'}`;
            }
        }
    }

    // ========================================================================
    // UTILIDADES
    // ========================================================================

    showNotification(message, type = 'info') {
        if (window.ui && window.ui.showNotification) {
            window.ui.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    savePluginStates() {
        const states = {
            active: Array.from(this.activePlugins),
            configs: Object.fromEntries(this.pluginConfigs),
            loaded: Array.from(this.loadedPlugins)
        };
        localStorage.setItem('silhouettePluginStates', JSON.stringify(states));
    }

    loadPluginStates() {
        const saved = localStorage.getItem('silhouettePluginStates');
        if (!saved) return;

        try {
            const states = JSON.parse(saved);
            
            // Restaurar estados
            states.active?.forEach(pluginId => {
                this.loadPlugin(pluginId, this.pluginConfigs.get(pluginId));
            });
            
            states.configs && Object.entries(states.configs).forEach(([id, config]) => {
                this.pluginConfigs.set(id, config);
            });
            
            states.loaded?.forEach(pluginId => {
                this.loadedPlugins.add(pluginId);
            });
            
        } catch (error) {
            console.error('Error loading plugin states:', error);
        }
    }
}

// Mock Plugin Class para demostración
class MockPlugin {
    constructor(id, config) {
        this.id = id;
        this.name = this.getPluginName(id);
        this.config = config;
        this.isActive = false;
    }

    getPluginName(id) {
        const names = {
            'research-assistant': 'Research Assistant',
            'code-snippets': 'Code Snippets Library',
            'design-assets': 'Design Assets Manager',
            'data-analyzer': 'Data Analysis Toolbox',
            'social-media': 'Social Media Scheduler',
            'project-manager': 'Project Management',
            'api-monitor': 'API Health Monitor',
            'content-generator': 'Content Generator AI'
        };
        return names[id] || 'Unknown Plugin';
    }

    async activate() {
        this.isActive = true;
        console.log(`✅ Plugin ${this.name} activated`);
        return true;
    }

    async deactivate() {
        this.isActive = false;
        console.log(`⏹️ Plugin ${this.name} deactivated`);
        return true;
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log(`⚙️ Plugin ${this.name} config updated:`, this.config);
    }
}

// Inicializar sistema de plugins
document.addEventListener('DOMContentLoaded', () => {
    const pluginSystem = new SilhouettePluginSystem();
    window.pluginSystem = pluginSystem;
    
    // Cargar estados guardados
    pluginSystem.loadPluginStates();
});