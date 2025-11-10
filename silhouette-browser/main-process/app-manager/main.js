// =============================================================================
// SILHOUETTE BROWSER - MAIN PROCESS
// Punto de entrada principal del navegador con IA integrada
// =============================================================================

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as url from 'url';
import { fileURLToPath } from 'url';

// Importar módulos de Silhouette
import { SecurityLayer } from '../security-layer/security-manager.js';
import { AgentOrchestrator } from '../agent-orchestrator/orchestrator.js';
import { ExtensionEngine } from '../extension-engine/extension-manager.js';
import { BrowserCore } from '../browser-core/engine-browserview.js';
import { NativeIntegrationCore } from '../native-integration/native-integration-core.js';
import { SilhouetteOmnipotentAPI } from '../../omnipotent-system/api/omnipotent-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SilhouetteBrowser {
  constructor() {
    this.mainWindow = null;
    this.securityLayer = new SecurityLayer();
    this.agentOrchestrator = new AgentOrchestrator();
    this.extensionEngine = new ExtensionEngine();
    this.browserCore = new BrowserCore();
    this.nativeIntegration = new NativeIntegrationCore();
    
    // Sistema Omnipotente Integrado
    this.omnipotentAPI = new SilhouetteOmnipotentAPI();
    
    // Configuración de la aplicación
    this.config = {
      isDev: process.env.NODE_ENV === 'development',
      maxWindows: 10,
      enableSandbox: true,
      enableRemoteDebugging: false
    };
  }

  // =============================================================================
  // INICIALIZACIÓN DE LA APLICACIÓN
  // =============================================================================
  
  async initialize() {
    console.log('🚀 Initializing Silhouette Browser V5.1 - Native Integration Revolution...');
    
    try {
      // Configurar seguridad
      await this.setupSecurity();
      
      // Inicializar core del navegador
      await this.initializeBrowserCore();
      
      // Inicializar orquestador de agentes
      await this.initializeAgentOrchestrator();
      
      // Inicializar motor de extensiones
      await this.initializeExtensions();
      
      // Inicializar integración nativa V5.1
      await this.initializeNativeIntegration();
      
      // Inicializar Sistema Omnipotente
      await this.initializeOmnipotentSystem();
      
      // Configurar IPC handlers
      this.setupIpcHandlers();
      
      // Configurar auto-updater
      this.setupAutoUpdater();
      
      console.log('✅ Silhouette Browser initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Silhouette Browser:', error);
      process.exit(1);
    }
  }

  // =============================================================================
  // CONFIGURACIÓN DE SEGURIDAD
  // =============================================================================
  
  async setupSecurity() {
    console.log('🔒 Setting up security layer...');
    
    // Habilitar sandbox
    app.commandLine.appendSwitch('--enable-sandbox');
    app.commandLine.appendSwitch('--disable-web-security');
    app.commandLine.appendSwitch('--no-sandbox');
    app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
    
    // Configurar content security policy
    this.setupContentSecurityPolicy();
    
    // Inicializar capa de seguridad
    await this.securityLayer.initialize();
    
    console.log('✅ Security layer configured');
  }

  setupContentSecurityPolicy() {
    // CSP para prevenir XSS y otros ataques
    const csp = "default-src 'self'; " +
               "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
               "style-src 'self' 'unsafe-inline'; " +
               "img-src 'self' data: https:; " +
               "connect-src 'self' https: ws:; " +
               "frame-src 'self' https:;";
    
    app.setAsDefaultProtocolClient('silhouette', undefined, `--csp=${csp}`);
  }

  // =============================================================================
  // INICIALIZACIÓN DE COMPONENTES CORE
  // =============================================================================
  
  async initializeBrowserCore() {
    console.log('🌐 Initializing browser core...');
    await this.browserCore.initialize();
    
    // Configurar event listeners para grupos de pestañas
    this.setupTabGroupsEventHandlers();
    
    console.log('✅ Browser core ready');
  }

  // =============================================================================
  // TAB GROUPS EVENT HANDLERS
  // =============================================================================
  
  setupTabGroupsEventHandlers() {
    // Configurar listener para cambios de grupos de pestañas
    this.browserCore.on('group-change', (eventType, data) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        // Emitir evento al renderer
        this.mainWindow.webContents.send(eventType, data);
      }
    });
  }

  async initializeAgentOrchestrator() {
    console.log('🤖 Initializing agent orchestrator...');
    await this.agentOrchestrator.initialize();
    console.log('✅ Agent orchestrator ready');
  }

  async initializeExtensions() {
    console.log('🔧 Initializing extension engine...');
    await this.extensionEngine.initialize();
    console.log('✅ Extension engine ready');
  }

  async initializeNativeIntegration() {
    console.log('⚡ Initializing native integration V5.1...');
    await this.nativeIntegration.initialize();
    console.log('✅ Native integration ready - Browser + Live Server + Docker + Testing + Sharing');
  }

  async initializeOmnipotentSystem() {
    console.log('🚀 Initializing Omnipotent System Integration...');
    try {
      await this.omnipotentAPI.initialize();
      console.log('✅ Omnipotent System ready - Browser Control Total');
    } catch (error) {
      console.error('❌ Failed to initialize Omnipotent System:', error);
      // No bloquear la aplicación por fallo del sistema omnipotente
    }
  }

  // =============================================================================
  // GESTIÓN DE VENTANAS DEL NAVEGADOR
  // =============================================================================
  
  async createMainWindow() {
    console.log('🪟 Creating main browser window...');
    
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: this.config.enableSandbox,
        webSecurity: true,
        devTools: this.config.isDev,
        backgroundThrottling: false
      },
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Cargar la aplicación
    await this.loadApplication();
    
    // Mostrar ventana cuando esté lista
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      if (this.config.isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Configurar event listeners
    this.setupWindowEvents();
    
    console.log('✅ Main window created');
  }

  async loadApplication() {
    if (this.config.isDev) {
      // En desarrollo, cargar desde webpack dev server
      await this.mainWindow.loadURL('http://localhost:8080');
    } else {
      // En producción, cargar desde build local (BrowserView edition)
      await this.mainWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, 'renderer-process/index-browserview.html'),
          protocol: 'file:',
          slashes: true
        })
      );
    }
  }

  setupWindowEvents() {
    // Cerrar ventana
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Navegación bloqueada para sitios maliciosos
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      return this.securityLayer.validateUrl(url);
    });

    // Actualizar título dinámicamente
    this.mainWindow.webContents.on('page-title-updated', (event, title) => {
      this.mainWindow.setTitle(`Silhouette Browser - ${title}`);
    });
  }

  // =============================================================================
  // IPC HANDLERS - COMUNICACIÓN RENDERER-MAIN
  // =============================================================================
  
  setupIpcHandlers() {
    console.log('📡 Setting up IPC handlers...');
    
    // Browser control con BrowserView
    ipcMain.handle('browser:navigate', async (event, url) => {
      return await this.browserCore.navigateTo(url);
    });

    ipcMain.handle('browser:getCurrentUrl', async () => {
      return this.browserCore.getCurrentUrl();
    });

    ipcMain.handle('browser:goBack', async () => {
      return await this.browserCore.goBack();
    });

    ipcMain.handle('browser:goForward', async () => {
      return await this.browserCore.goForward();
    });

    ipcMain.handle('browser:refresh', async () => {
      return await this.browserCore.refresh();
    });

    // BrowserView Tab Management
    ipcMain.handle('browser:createTab', async (event, url, options) => {
      return await this.browserCore.createNewTab(url, options);
    });

    ipcMain.handle('browser:closeTab', async (event, tabId) => {
      return await this.browserCore.closeTab(tabId);
    });

    ipcMain.handle('browser:switchToTab', async (event, tabId) => {
      return await this.browserCore.switchToTab(tabId);
    });

    ipcMain.handle('browser:reloadTab', async (event, tabId) => {
      return await this.browserCore.reloadTab(tabId);
    });

    ipcMain.handle('browser:getActiveTabs', async () => {
      return this.browserCore.getActiveTabs();
    });

    ipcMain.handle('browser:getTabCount', async () => {
      return this.browserCore.tabManager.getTabCount();
    });

    ipcMain.handle('browser:getCurrentTitle', async () => {
      return this.browserCore.getCurrentTitle();
    });

    ipcMain.handle('browser:getStats', async () => {
      return this.browserCore.getStats();
    });

    ipcMain.handle('browser:getPerformanceMetrics', async () => {
      return this.browserCore.getPerformanceMetrics();
    });

    // Búsqueda web
    ipcMain.handle('browser:performSearch', async (event, query, engine) => {
      return await this.browserCore.performSearch(query, engine);
    });

    // Bookmarks
    ipcMain.handle('browser:addBookmark', async (event, title, url) => {
      return await this.browserCore.addBookmark(title, url);
    });

    ipcMain.handle('browser:removeBookmark', async (event, bookmarkId) => {
      return await this.browserCore.removeBookmark(bookmarkId);
    });

    ipcMain.handle('browser:getBookmarks', async () => {
      return await this.browserCore.getBookmarks();
    });

    // Historial
    ipcMain.handle('browser:getHistory', async (event, limit) => {
      return await this.browserCore.getHistory(limit);
    });

    ipcMain.handle('browser:clearHistory', async () => {
      return await this.browserCore.clearHistory();
    });

    // Configuración
    ipcMain.handle('browser:getSettings', async () => {
      return this.browserCore.getSettings();
    });

    ipcMain.handle('browser:updateSetting', async (event, key, value) => {
      return await this.browserCore.updateSetting(key, value);
    });

    // Seguridad
    ipcMain.handle('browser:checkSecurity', async (event, url) => {
      return await this.browserCore.checkSecurity(url);
    });

    ipcMain.handle('browser:getSecurityStatus', async () => {
      return this.browserCore.getSecurityStatus();
    });

    // Window management
    ipcMain.handle('window:createNewWindow', async (event, url) => {
      return await this.browserCore.createNewWindow(url);
    });

    ipcMain.handle('window:getWindowList', async () => {
      return this.browserCore.getWindowList();
    });

    ipcMain.handle('window:isWindowActive', async (event, windowId) => {
      return this.browserCore.isWindowActive(windowId);
    });

    // Agent control
    ipcMain.handle('agent:executeTask', async (event, task) => {
      return await this.agentOrchestrator.executeTask(task);
    });

    ipcMain.handle('agent:getTeamStatus', async () => {
      return await this.agentOrchestrator.getTeamStatus();
    });

    // Extension management
    ipcMain.handle('extension:create', async (event, requirements) => {
      return await this.extensionEngine.createExtension(requirements);
    });

    ipcMain.handle('extension:install', async (event, extensionId) => {
      return await this.extensionEngine.installExtension(extensionId);
    });

    ipcMain.handle('extension:getInstalled', async () => {
      return await this.extensionEngine.getInstalledExtensions();
    });

    // Omnipotent System Control (actualizado para BrowserView)
    ipcMain.handle('omnipotent:executeCommand', async (event, commandData) => {
      try {
        const { command, tabId } = commandData;
        console.log('🤖 Executing omnipotent command in BrowserView:', command);
        
        // Obtener tab activo si no se especifica
        let targetTabId = tabId;
        if (!targetTabId && this.mainWindow) {
          targetTabId = this.browserCore.tabManager.activeTabId;
        }
        
        // Ejecutar comando en el contexto del navegador
        const result = await this.omnipotentAPI.executeOmnipotentTask({
          description: command,
          browserViewContext: {
            tabId: targetTabId,
            windowId: 'main'
          }
        });
        
        return {
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('❌ Omnipotent command error:', error);
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });

    ipcMain.handle('omnipotent:getStatus', async () => {
      try {
        return await this.omnipotentAPI.getStatus();
      } catch (error) {
        console.error('❌ Omnipotent status error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('omnipotent:navigateAndExtract', async (event, data) => {
      try {
        const { url, task } = data;
        console.log('🤖 Navigating and extracting in BrowserView:', url, task);
        
        // Crear nueva tab y ejecutar en ella
        const tabId = await this.browserCore.createNewTab(url, { active: true });
        
        const result = await this.omnipotentAPI.executeOmnipotentTask({
          description: task,
          browserViewContext: {
            tabId,
            windowId: 'main'
          }
        });
        
        return {
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('❌ Navigate and extract error:', error);
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });

    // Nuevos métodos omnipotentes para BrowserView
    ipcMain.handle('omnipotent:getActiveTab', async () => {
      try {
        return this.browserCore.tabManager.activeTabId;
      } catch (error) {
        console.error('❌ Get active tab error:', error);
        return null;
      }
    });

    ipcMain.handle('omnipotent:executeInTab', async (event, tabId, task) => {
      try {
        console.log(`🤖 Executing task in tab ${tabId}:`, task);
        
        const result = await this.omnipotentAPI.executeOmnipotentTask({
          description: task,
          browserViewContext: {
            tabId,
            windowId: 'main'
          }
        });
        
        return {
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`❌ Execute in tab error:`, error);
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });

    ipcMain.handle('omnipotent:getAllTabs', async () => {
      try {
        return this.browserCore.getActiveTabs();
      } catch (error) {
        console.error('❌ Get all tabs error:', error);
        return [];
      }
    });

    ipcMain.handle('omnipotent:switchAndExecute', async (event, tabId, task) => {
      try {
        console.log(`🤖 Switching to tab ${tabId} and executing:`, task);
        
        // Cambiar a la tab
        await this.browserCore.switchToTab(tabId);
        
        // Ejecutar tarea
        const result = await this.omnipotentAPI.executeOmnipotentTask({
          description: task,
          browserViewContext: {
            tabId,
            windowId: 'main'
          }
        });
        
        return {
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`❌ Switch and execute error:`, error);
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });

    // =============================================================================
    // OMNIPOTENT TAB GROUPS METHODS
    // =============================================================================

    ipcMain.handle('omnipotent:createTabGroup', async (event, name, options) => {
      try {
        const groupId = await this.browserCore.createTabGroup(name, options);
        return { success: true, groupId };
      } catch (error) {
        console.error('❌ Create tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:createAgentTabGroup', async (event, taskData) => {
      try {
        const groupId = await this.browserCore.createAgentTabGroup(taskData);
        return { success: true, groupId };
      } catch (error) {
        console.error('❌ Create agent tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:addTabToGroup', async (event, groupId, tabId) => {
      try {
        await this.browserCore.addTabToGroup(groupId, tabId);
        return { success: true };
      } catch (error) {
        console.error('❌ Add tab to group error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:removeTabFromGroup', async (event, tabId) => {
      try {
        await this.browserCore.removeTabFromGroup(tabId);
        return { success: true };
      } catch (error) {
        console.error('❌ Remove tab from group error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:activateTabGroup', async (event, groupId) => {
      try {
        await this.browserCore.activateTabGroup(groupId);
        return { success: true };
      } catch (error) {
        console.error('❌ Activate tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:executeAgentGroupTask', async (event, groupId, task) => {
      try {
        const result = await this.browserCore.executeAgentGroupTask(groupId, task);
        return { success: true, result };
      } catch (error) {
        console.error('❌ Execute agent group task error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:performAutoTabGrouping', async () => {
      try {
        await this.browserCore.performAutoTabGrouping();
        return { success: true };
      } catch (error) {
        console.error('❌ Perform auto tab grouping error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:getTabGroups', async () => {
      try {
        return this.browserCore.getAllTabGroups();
      } catch (error) {
        console.error('❌ Get tab groups error:', error);
        return [];
      }
    });

    // Métodos combinados para IA omnipotente
    ipcMain.handle('omnipotent:organizeWorkspaceWithAI', async (event, purpose) => {
      try {
        // Implementar lógica de organización inteligente
        return await this.omnipotentAPI.organizeWorkspaceWithAI(purpose);
      } catch (error) {
        console.error('❌ Organize workspace with AI error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:createTaskFocusedGroup', async (event, taskDescription) => {
      try {
        return await this.omnipotentAPI.createTaskFocusedGroup(taskDescription);
      } catch (error) {
        console.error('❌ Create task focused group error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('omnipotent:intelligentTabManagement', async () => {
      try {
        return await this.omnipotentAPI.intelligentTabManagement();
      } catch (error) {
        console.error('❌ Intelligent tab management error:', error);
        return { success: false, error: error.message };
      }
    });

    // =============================================================================
    // TAB GROUPS MANAGEMENT - GRUPOS DE PESTAÑAS
    // =============================================================================

    // Crear grupo de pestañas
    ipcMain.handle('tabgroups:create', async (event, name, options) => {
      try {
        const groupId = await this.browserCore.createTabGroup(name, options);
        return { success: true, groupId };
      } catch (error) {
        console.error('❌ Create tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    // Crear grupo automático por IA
    ipcMain.handle('tabgroups:createAi', async (event, categorizedTabs) => {
      try {
        const groupId = await this.browserCore.createAiTabGroup(categorizedTabs);
        return { success: true, groupId };
      } catch (error) {
        console.error('❌ Create AI tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    // Crear grupo de agente
    ipcMain.handle('tabgroups:createAgent', async (event, taskData) => {
      try {
        const groupId = await this.browserCore.createAgentTabGroup(taskData);
        return { success: true, groupId };
      } catch (error) {
        console.error('❌ Create agent tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    // Eliminar grupo de pestañas
    ipcMain.handle('tabgroups:delete', async (event, groupId) => {
      try {
        await this.browserCore.deleteTabGroup(groupId);
        return { success: true };
      } catch (error) {
        console.error('❌ Delete tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    // Activar grupo de pestañas
    ipcMain.handle('tabgroups:activate', async (event, groupId) => {
      try {
        await this.browserCore.activateTabGroup(groupId);
        return { success: true };
      } catch (error) {
        console.error('❌ Activate tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    // Desactivar grupo de pestañas
    ipcMain.handle('tabgroups:deactivate', async (event, groupId) => {
      try {
        await this.browserCore.deactivateTabGroup(groupId);
        return { success: true };
      } catch (error) {
        console.error('❌ Deactivate tab group error:', error);
        return { success: false, error: error.message };
      }
    });

    // Obtener todos los grupos
    ipcMain.handle('tabgroups:getAll', async () => {
      try {
        return this.browserCore.getAllTabGroups();
      } catch (error) {
        console.error('❌ Get all tab groups error:', error);
        return [];
      }
    });

    // Obtener grupo específico
    ipcMain.handle('tabgroups:get', async (event, groupId) => {
      try {
        return this.browserCore.getTabGroup(groupId);
      } catch (error) {
        console.error('❌ Get tab group error:', error);
        return null;
      }
    });

    // Obtener grupo activo
    ipcMain.handle('tabgroups:getActive', async () => {
      try {
        return this.browserCore.getActiveTabGroup();
      } catch (error) {
        console.error('❌ Get active tab group error:', error);
        return null;
      }
    });

    // Agregar pestaña a grupo
    ipcMain.handle('tabgroups:addTab', async (event, groupId, tabId) => {
      try {
        await this.browserCore.addTabToGroup(groupId, tabId);
        return { success: true };
      } catch (error) {
        console.error('❌ Add tab to group error:', error);
        return { success: false, error: error.message };
      }
    });

    // Remover pestaña de grupo
    ipcMain.handle('tabgroups:removeTab', async (event, tabId) => {
      try {
        await this.browserCore.removeTabFromGroup(tabId);
        return { success: true };
      } catch (error) {
        console.error('❌ Remove tab from group error:', error);
        return { success: false, error: error.message };
      }
    });

    // Mover pestaña entre grupos
    ipcMain.handle('tabgroups:moveTab', async (event, tabId, fromGroupId, toGroupId) => {
      try {
        await this.browserCore.moveTabToGroup(tabId, fromGroupId, toGroupId);
        return { success: true };
      } catch (error) {
        console.error('❌ Move tab between groups error:', error);
        return { success: false, error: error.message };
      }
    });

    // Ejecutar tarea en grupo de agente
    ipcMain.handle('tabgroups:executeAgentTask', async (event, groupId, task) => {
      try {
        const result = await this.browserCore.executeAgentGroupTask(groupId, task);
        return { success: true, result };
      } catch (error) {
        console.error('❌ Execute agent group task error:', error);
        return { success: false, error: error.message };
      }
    });

    // Agrupación automática por IA
    ipcMain.handle('tabgroups:performAutoGrouping', async () => {
      try {
        await this.browserCore.performAutoTabGrouping();
        return { success: true };
      } catch (error) {
        console.error('❌ Perform auto tab grouping error:', error);
        return { success: false, error: error.message };
      }
    });

    // Habilitar/deshabilitar agrupación automática
    ipcMain.handle('tabgroups:enableAiGrouping', async () => {
      try {
        this.browserCore.enableAiTabGrouping();
        return { success: true };
      } catch (error) {
        console.error('❌ Enable AI tab grouping error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tabgroups:disableAiGrouping', async () => {
      try {
        this.browserCore.disableAiTabGrouping();
        return { success: true };
      } catch (error) {
        console.error('❌ Disable AI tab grouping error:', error);
        return { success: false, error: error.message };
      }
    });

    // Exportar/Importar grupos
    ipcMain.handle('tabgroups:export', async () => {
      try {
        return this.browserCore.exportTabGroups();
      } catch (error) {
        console.error('❌ Export tab groups error:', error);
        return null;
      }
    });

    ipcMain.handle('tabgroups:import', async (event, data) => {
      try {
        const success = await this.browserCore.importTabGroups(data);
        return { success };
      } catch (error) {
        console.error('❌ Import tab groups error:', error);
        return { success: false, error: error.message };
      }
    });

    // Obtener estadísticas de grupos
    ipcMain.handle('tabgroups:getStats', async () => {
      try {
        return {
          totalGroups: this.browserCore.getAllTabGroups().length,
          totalTabsInGroups: this.browserCore.tabGroups.getTotalTabsInGroups(),
          groupsByType: {
            manual: this.browserCore.getTabGroupsByType('manual').length,
            ai: this.browserCore.getTabGroupsByType('ai').length,
            agent: this.browserCore.getTabGroupsByType('agent').length
          }
        };
      } catch (error) {
        console.error('❌ Get tab groups stats error:', error);
        return { totalGroups: 0, totalTabsInGroups: 0, groupsByType: {} };
      }
    });

    // Configuration
    ipcMain.handle('config:get', async (event, key) => {
      return await this.getConfigValue(key);
    });

    ipcMain.handle('config:set', async (event, key, value) => {
      return await this.setConfigValue(key, value);
    });

    // File dialogs
    ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow, options);
      return result;
    });

    // External links
    ipcMain.handle('shell:openExternal', async (event, url) => {
      return await shell.openExternal(url);
    });

    // Notifications
    ipcMain.handle('notification:show', async (event, message, type) => {
      // Implementar sistema de notificaciones
      console.log(`📢 Notification [${type}]:`, message);
      return true;
    });

    ipcMain.handle('notification:hide', async () => {
      // Ocultar notificaciones
      return true;
    });

    // Dialogs
    ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result;
    });

    // App info
    ipcMain.handle('app:getVersion', async () => {
      return app.getVersion();
    });

    // Config management
    ipcMain.handle('config:getAll', async () => {
      // Retornar configuración completa
      return {
        version: app.getVersion(),
        platform: process.platform,
        isDev: this.config.isDev
      };
    });

    // Integrar eventos del TabManager con IPC para comunicación al renderer
    this.setupTabManagerEventBridge();

    console.log('✅ IPC handlers configured for BrowserView');
  }

  // =============================================================================
  // EVENT BRIDGE PARA TAB MANAGER
  // =============================================================================
  
  setupTabManagerEventBridge() {
    console.log('🔗 Setting up TabManager event bridge...');
    
    // Bridge events from TabManager to renderer
    if (this.browserCore && this.browserCore.tabManager) {
      const tabManager = this.browserCore.tabManager;
      
      // Override notifyTabUpdated to send IPC events
      const originalNotifyTabUpdated = tabManager.notifyTabUpdated.bind(tabManager);
      tabManager.notifyTabUpdated = (tabId, eventType, data) => {
        // Send IPC event to renderer
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(`tab:${eventType}`, { tabId, ...data });
        }
        
        // Call original method
        if (originalNotifyTabUpdated) {
          originalNotifyTabUpdated(tabId, eventType, data);
        }
      };
    }
  }

  // =============================================================================
  // CONFIGURACIÓN DE AUTO-UPDATER
  // =============================================================================
  
  setupAutoUpdater() {
    if (this.config.isDev) return;

    console.log('⬆️ Setting up auto-updater...');
    
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('checking-for-update', () => {
      console.log('🔍 Checking for updates...');
    });
    
    autoUpdater.on('update-available', () => {
      console.log('📥 Update available, downloading...');
    });
    
    autoUpdater.on('update-downloaded', () => {
      console.log('✅ Update downloaded, installing...');
      autoUpdater.quitAndInstall();
    });
  }

  // =============================================================================
  // GESTIÓN DE CONFIGURACIÓN
  // =============================================================================
  
  async getConfigValue(key) {
    // Implementar sistema de configuración
    return null;
  }

  async setConfigValue(key, value) {
    // Implementar sistema de configuración
    return true;
  }

  // =============================================================================
  // EVENTOS DE LA APLICACIÓN
  // =============================================================================
  
  onAppReady() {
    this.initialize().then(() => {
      this.createMainWindow();
    });
  }

  onAppAllWindowsClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  onAppActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }
}

// =============================================================================
// PUNTO DE ENTRADA DE LA APLICACIÓN
// =============================================================================

const silhouetteApp = new SilhouetteBrowser();

// Events de la aplicación
app.whenReady().then(() => {
  silhouetteApp.onAppReady();
});

app.on('window-all-closed', () => {
  silhouetteApp.onAppAllWindowsClosed();
});

app.on('activate', () => {
  silhouetteApp.onAppActivate();
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Configuración de ventanas por defecto
app.setAppUserModelId('com.silhouette.browser');

// Logs
console.log('🚀 Silhouette Browser V4.0 starting...');
console.log('🔧 Platform:', process.platform);
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
