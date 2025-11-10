/**
 * SILHOUETTE BROWSER V4.0 - CONFIGURATION WIZARD
 * Wizard de configuración inicial para nuevos usuarios
 */

class SilhouetteConfigWizard {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            'welcome',
            'theme',
            'basic-apis', 
            'ai-models',
            'specialized-apis',
            'team-selection',
            'routing',
            'complete'
        ];
        this.config = {};
    }

    async startWizard() {
        console.log('🎯 Starting Silhouette Configuration Wizard...');
        this.showWelcomeStep();
    }

    showWelcomeStep() {
        const modal = this.createModal('🎉 Bienvenido a Silhouette Browser V4.0', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
                <h3>Configuración Asistida</h3>
                <p>Te guiaremos paso a paso para configurar tu navegador de IA más avanzado</p>
                <p style="color: var(--text-muted); font-size: 14px; margin-top: 16px;">
                    ⏱️ Tiempo estimado: 3-5 minutos
                </p>
                <div style="margin-top: 24px;">
                    <button class="btn btn-primary" onclick="wizard.nextStep()">Comenzar</button>
                    <button class="btn btn-secondary" onclick="wizard.skipWizard()" style="margin-left: 12px;">Saltar</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    showThemeStep() {
        this.currentStep = 1;
        const modal = this.createModal('🎨 Selecciona tu tema preferido', `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px;">
                <div class="theme-option" onclick="wizard.selectTheme('dark')" style="cursor: pointer;">
                    <div style="background: #1a1a1a; height: 120px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; color: #fff;">🌙 Oscuro</div>
                    <div style="text-align: center;">Tema Oscuro</div>
                    <div style="text-align: center; color: var(--text-muted); font-size: 12px;">Por defecto</div>
                </div>
                <div class="theme-option" onclick="wizard.selectTheme('light')" style="cursor: pointer;">
                    <div style="background: #ffffff; height: 120px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; color: #333;">☀️ Claro</div>
                    <div style="text-align: center;">Tema Claro</div>
                    <div style="text-align: center; color: var(--text-muted); font-size: 12px;">Brillante</div>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    showBasicApisStep() {
        this.currentStep = 2;
        const modal = this.createModal('🔑 Configura las APIs básicas', `
            <div style="padding: 20px;">
                <p>Estas APIs son esenciales para el funcionamiento básico:</p>
                <div style="margin-top: 20px;">
                    <div class="api-card required">
                        <div class="api-header">
                            <span class="api-name">OpenRouter</span>
                            <span class="api-status">Requerido</span>
                        </div>
                        <input type="password" class="api-input" id="wizardOpenrouterKey" placeholder="sk-or-v1-...">
                        <div class="usage-indicator">Acceso a modelos premium de IA</div>
                    </div>
                    <div class="api-card required">
                        <div class="api-header">
                            <span class="api-name">SERPER</span>
                            <span class="api-status">Requerido</span>
                        </div>
                        <input type="password" class="api-input" id="wizardSerperKey" placeholder="Tu API Key">
                        <div class="usage-indicator">Búsqueda web avanzada</div>
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-secondary" onclick="wizard.previousStep()">Anterior</button>
                    <button class="btn btn-primary" onclick="wizard.saveBasicApis()" style="margin-left: 12px;">Siguiente</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    showAiModelsStep() {
        this.currentStep = 3;
        const modal = this.createModal('🤖 Selecciona tus modelos de IA', `
            <div style="padding: 20px;">
                <p>Elige los modelos más adecuados para tus necesidades:</p>
                <div style="margin-top: 20px;">
                    <div class="model-card">
                        <h4>🧠 Para Análisis y Razonamiento</h4>
                        <select class="model-select" id="wizardAiModel">
                            <option value="openai/gpt-4">GPT-4 (Más capaz)</option>
                            <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet (Equilibrado)</option>
                            <option value="google/gemini-pro">Gemini Pro (Rápido)</option>
                        </select>
                    </div>
                    <div class="model-card">
                        <h4>💻 Para Generación de Código</h4>
                        <select class="model-select" id="wizardCodeModel">
                            <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Rápido)</option>
                            <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo (Equilibrado)</option>
                            <option value="codellama/CodeLlama-34b-Instruct-hf">Code Llama 34B (Especializado)</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-secondary" onclick="wizard.previousStep()">Anterior</button>
                    <button class="btn btn-primary" onclick="wizard.saveAiModels()" style="margin-left: 12px;">Siguiente</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    showSpecializedApisStep() {
        this.currentStep = 4;
        const modal = this.createModal('🎨 APIs Especializadas (Opcional)', `
            <div style="padding: 20px;">
                <p>Configura APIs adicionales según tu área de trabajo (puedes saltarte este paso):</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px;">
                    <div class="api-card optional">
                        <div class="api-header">
                            <span class="api-name">Unsplash (Imágenes)</span>
                        </div>
                        <input type="password" class="api-input" id="wizardUnsplashKey" placeholder="Opcional">
                    </div>
                    <div class="api-card optional">
                        <div class="api-header">
                            <span class="api-name">Runway (Video)</span>
                        </div>
                        <input type="password" class="api-input" id="wizardRunwayKey" placeholder="Opcional">
                    </div>
                    <div class="api-card optional">
                        <div class="api-header">
                            <span class="api-name">LinkedIn (Business)</span>
                        </div>
                        <input type="password" class="api-input" id="wizardLinkedinKey" placeholder="Opcional">
                    </div>
                    <div class="api-card optional">
                        <div class="api-header">
                            <span class="api-name">Alpha Vantage (Finance)</span>
                        </div>
                        <input type="password" class="api-input" id="wizardAlphaKey" placeholder="Opcional">
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-secondary" onclick="wizard.previousStep()">Anterior</button>
                    <button class="btn btn-primary" onclick="wizard.saveSpecializedApis()" style="margin-left: 12px;">Siguiente</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    showTeamSelectionStep() {
        this.currentStep = 5;
        const modal = this.createModal('🏢 Selecciona tus equipos activos', `
            <div style="padding: 20px;">
                <p>Activa los equipos que más usarás (puedes cambiar esto después):</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px;">
                    <div class="team-card-advanced active">
                        <div class="team-header-advanced">
                            <span class="team-name-advanced">Artificial Intelligence Team</span>
                            <input type="checkbox" class="team-toggle-advanced" checked>
                        </div>
                        <div class="team-specialists-advanced">ML, NLP, Computer Vision</div>
                    </div>
                    <div class="team-card-advanced active">
                        <div class="team-header-advanced">
                            <span class="team-name-advanced">Code Generation Team</span>
                            <input type="checkbox" class="team-toggle-advanced" checked>
                        </div>
                        <div class="team-specialists-advanced">Frontend, Backend, Fullstack</div>
                    </div>
                    <div class="team-card-advanced">
                        <div class="team-header-advanced">
                            <span class="team-name-advanced">Design Creative Team</span>
                            <input type="checkbox" class="team-toggle-advanced">
                        </div>
                        <div class="team-specialists-advanced">UI/UX, Branding, Graphics</div>
                    </div>
                    <div class="team-card-advanced">
                        <div class="team-header-advanced">
                            <span class="team-name-advanced">Marketing Team</span>
                            <input type="checkbox" class="team-toggle-advanced">
                        </div>
                        <div class="team-specialists-advanced">Digital, Content, Campaigns</div>
                    </div>
                    <div class="team-card-advanced">
                        <div class="team-header-advanced">
                            <span class="team-name-advanced">Research Team</span>
                            <input type="checkbox" class="team-toggle-advanced">
                        </div>
                        <div class="team-specialists-advanced">Analysis, Data, Insights</div>
                    </div>
                    <div class="team-card-advanced">
                        <div class="team-header-advanced">
                            <span class="team-name-advanced">Quality Assurance Team</span>
                            <input type="checkbox" class="team-toggle-advanced">
                        </div>
                        <div class="team-specialists-advanced">Testing, Automation, Bugs</div>
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-secondary" onclick="wizard.previousStep()">Anterior</button>
                    <button class="btn btn-primary" onclick="wizard.saveTeamSelection()" style="margin-left: 12px;">Finalizar</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }

    showCompleteStep() {
        this.currentStep = 7;
        const modal = this.createModal('🎉 ¡Configuración Completada!', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
                <h3>¡Silhouette está listo para usar!</h3>
                <p>Tu navegador de IA ha sido configurado exitosamente</p>
                <div style="margin-top: 20px; padding: 16px; background: var(--background-secondary); border-radius: 8px;">
                    <h4>🎯 Siguiente paso:</h4>
                    <p>Ve a la pestaña <strong>Chat</strong> y comienza a interactuar con tu agente de IA</p>
                </div>
                <div style="margin-top: 24px;">
                    <button class="btn btn-primary" onclick="wizard.closeWizard()">¡Comenzar a usar!</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
        
        // Aplicar configuración guardada
        this.applyWizardConfig();
    }

    // Métodos de navegación
    nextStep() {
        this.removeCurrentModal();
        switch (this.currentStep) {
            case 0: this.showThemeStep(); break;
            case 1: this.showBasicApisStep(); break;
            case 2: this.showAiModelsStep(); break;
            case 3: this.showSpecializedApisStep(); break;
            case 4: this.showTeamSelectionStep(); break;
            case 5: this.showCompleteStep(); break;
        }
    }

    previousStep() {
        this.removeCurrentModal();
        this.currentStep--;
        this.nextStep();
    }

    selectTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.config.theme = theme;
        this.nextStep();
    }

    saveBasicApis() {
        const openrouterKey = document.getElementById('wizardOpenrouterKey')?.value;
        const serperKey = document.getElementById('wizardSerperKey')?.value;
        
        if (!openrouterKey || !serperKey) {
            alert('Por favor ingresa ambas API keys para continuar');
            return;
        }
        
        this.config.basicApis = { openrouterKey, serperKey };
        this.nextStep();
    }

    saveAiModels() {
        const aiModel = document.getElementById('wizardAiModel')?.value;
        const codeModel = document.getElementById('wizardCodeModel')?.value;
        
        this.config.aiModels = { aiModel, codeModel };
        this.nextStep();
    }

    saveSpecializedApis() {
        const unsplashKey = document.getElementById('wizardUnsplashKey')?.value;
        const runwayKey = document.getElementById('wizardRunwayKey')?.value;
        const linkedinKey = document.getElementById('wizardLinkedinKey')?.value;
        const alphaKey = document.getElementById('wizardAlphaKey')?.value;
        
        this.config.specializedApis = { unsplashKey, runwayKey, linkedinKey, alphaKey };
        this.nextStep();
    }

    saveTeamSelection() {
        this.config.teamSelection = { 
            timestamp: new Date().toISOString(),
            version: 'wizard-v1.0'
        };
        this.nextStep();
    }

    applyWizardConfig() {
        // Aplicar configuración guardada
        if (this.config.theme) {
            document.body.setAttribute('data-theme', this.config.theme);
        }
        
        // Guardar en configuración principal
        localStorage.setItem('silhouetteWizardConfig', JSON.stringify(this.config));
        localStorage.setItem('wizardCompleted', 'true');
    }

    skipWizard() {
        this.removeCurrentModal();
        this.showNotification('Wizard saltado. Puedes configurar todo manualmente en las pestañas.');
    }

    closeWizard() {
        this.removeCurrentModal();
        this.showNotification('¡Configuración completada! Bienvenido a Silhouette Browser V4.0', 'success');
    }

    // Utilidades
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'config-wizard-modal';
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
        
        const modalContent = document.createElement('div');
        modalContent.className = 'config-wizard-content';
        modalContent.style.cssText = `
            background: var(--background-primary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        modalContent.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
                <h2 style="color: var(--primary-color); margin: 0;">${title}</h2>
            </div>
            <div class="wizard-content">
                ${content}
            </div>
        `;
        
        modal.appendChild(modalContent);
        
        // Cerrar con ESC
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.skipWizard();
            }
        });
        
        return modal;
    }

    removeCurrentModal() {
        const modal = document.querySelector('.config-wizard-modal');
        if (modal) {
            modal.remove();
        }
    }

    showNotification(message, type = 'info') {
        if (window.ui && window.ui.showNotification) {
            window.ui.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    shouldShowWizard() {
        return !localStorage.getItem('wizardCompleted');
    }
}

// Auto-inicializar wizard si es la primera vez
document.addEventListener('DOMContentLoaded', () => {
    const wizard = new SilhouetteConfigWizard();
    window.wizard = wizard;
    
    // Mostrar wizard en primera carga
    if (wizard.shouldShowWizard()) {
        setTimeout(() => {
            wizard.startWizard();
        }, 2000); // Delay para que cargue la UI principal
    }
});