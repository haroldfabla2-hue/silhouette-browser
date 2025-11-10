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
import { BrowserCore } from '../browser-core/engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SilhouetteBrowser {
  constructor() {
    this.mainWindow = null;
    this.securityLayer = new SecurityLayer();
    this.agentOrchestrator = new AgentOrchestrator();
    this.extensionEngine = new ExtensionEngine();
    this.browserCore = new BrowserCore();
    
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
    console.log('🚀 Initializing Silhouette Browser V4.0...');
    
    try {
      // Configurar seguridad
      await this.setupSecurity();
      
      // Inicializar core del navegador
      await this.initializeBrowserCore();
      
      // Inicializar orquestador de agentes
      await this.initializeAgentOrchestrator();
      
      // Inicializar motor de extensiones
      await this.initializeExtensions();
      
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
    console.log('✅ Browser core ready');
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
      // En producción, cargar desde build local
      await this.mainWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, 'renderer-process/index.html'),
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
    
    // Browser control
    ipcMain.handle('browser:navigate', async (event, url) => {
      return await this.browserCore.navigate(url);
    });

    ipcMain.handle('browser:getCurrentUrl', async () => {
      return await this.browserCore.getCurrentUrl();
    });

    ipcMain.handle('browser:goBack', async () => {
      return await this.browserCore.goBack();
    });

    ipcMain.handle('browser:goForward', async () => {
      return await this.browserCore.goForward();
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

    console.log('✅ IPC handlers configured');
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
