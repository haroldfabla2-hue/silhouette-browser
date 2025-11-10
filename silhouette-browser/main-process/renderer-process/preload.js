// =============================================================================
// PRELOAD SCRIPT - SILHOUETTE BROWSER
// Script de precarga para contexto aislado
// =============================================================================

const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('silhouetteAPI', {
  // Información de la aplicación
  getAppInfo: () => ({
    name: 'Silhouette Browser',
    version: '1.0.0',
    isDev: process.env.NODE_ENV === 'development'
  }),

  // Gestión de ventanas
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized')
  },

  // Gestión de tabs
  tabs: {
    create: (url) => ipcRenderer.invoke('tab-create', url),
    close: (tabId) => ipcRenderer.invoke('tab-close', tabId),
    switch: (tabId) => ipcRenderer.invoke('tab-switch', tabId),
    reload: (tabId) => ipcRenderer.invoke('tab-reload', tabId),
    getAll: () => ipcRenderer.invoke('tab-get-all'),
    getActive: () => ipcRenderer.invoke('tab-get-active')
  },

  // Navegación
  navigation: {
    go: (url) => ipcRenderer.invoke('nav-go', url),
    back: () => ipcRenderer.invoke('nav-back'),
    forward: () => ipcRenderer.invoke('nav-forward'),
    refresh: () => ipcRenderer.invoke('nav-refresh'),
    getCurrent: () => ipcRenderer.invoke('nav-get-current')
  },

  // Búsqueda
  search: {
    perform: (query, engine) => ipcRenderer.invoke('search-perform', query, engine),
    getEngines: () => ipcRenderer.invoke('search-get-engines')
  },

  // Silhouette Agent
  agent: {
    isActive: () => ipcRenderer.invoke('agent-is-active'),
    start: () => ipcRenderer.invoke('agent-start'),
    stop: () => ipcRenderer.invoke('agent-stop'),
    sendMessage: (message) => ipcRenderer.invoke('agent-send-message', message),
    getStatus: () => ipcRenderer.invoke('agent-get-status'),
    executeTask: (task) => ipcRenderer.invoke('agent-execute-task', task)
  },

  // Extensiones
  extensions: {
    getAll: () => ipcRenderer.invoke('extensions-get-all'),
    install: (config) => ipcRenderer.invoke('extensions-install', config),
    uninstall: (extensionId) => ipcRenderer.invoke('extensions-uninstall', extensionId),
    generate: (requirements) => ipcRenderer.invoke('extensions-generate', requirements)
  },

  // Configuración
  config: {
    get: (key) => ipcRenderer.invoke('config-get', key),
    set: (key, value) => ipcRenderer.invoke('config-set', key, value),
    getAll: () => ipcRenderer.invoke('config-get-all'),
    reset: () => ipcRenderer.invoke('config-reset')
  },

  // Seguridad
  security: {
    checkUrl: (url) => ipcRenderer.invoke('security-check-url', url),
    getStatus: () => ipcRenderer.invoke('security-get-status'),
    enablePrivacyMode: () => ipcRenderer.invoke('security-enable-privacy')
  },

  // Métricas
  metrics: {
    getBrowserStats: () => ipcRenderer.invoke('metrics-get-browser-stats'),
    getAgentMetrics: () => ipcRenderer.invoke('metrics-get-agent-metrics'),
    getPerformance: () => ipcRenderer.invoke('metrics-get-performance')
  },

  // Bookmarks e historial
  bookmarks: {
    add: (title, url) => ipcRenderer.invoke('bookmarks-add', title, url),
    remove: (id) => ipcRenderer.invoke('bookmarks-remove', id),
    getAll: () => ipcRenderer.invoke('bookmarks-get-all')
  },

  history: {
    getRecent: (limit) => ipcRenderer.invoke('history-get-recent', limit),
    clear: () => ipcRenderer.invoke('history-clear')
  },

  // Eventos
  on: {
    tabChanged: (callback) => ipcRenderer.on('tab-changed', callback),
    navigation: (callback) => ipcRenderer.on('navigation', callback),
    agentStatus: (callback) => ipcRenderer.on('agent-status', callback),
    securityAlert: (callback) => ipcRenderer.on('security-alert', callback),
    performanceAlert: (callback) => ipcRenderer.on('performance-alert', callback)
  },

  // Sistema Omnipotente
  omnipotent: {
    executeCommand: (commandData) => ipcRenderer.invoke('omnipotent:executeCommand', commandData),
    getStatus: () => ipcRenderer.invoke('omnipotent:getStatus'),
    navigateAndExtract: (data) => ipcRenderer.invoke('omnipotent:navigateAndExtract', data),
    isActive: () => ipcRenderer.invoke('omnipotent:isActive')
  },

  // Remover listeners
  off: {
    tabChanged: (callback) => ipcRenderer.removeListener('tab-changed', callback),
    navigation: (callback) => ipcRenderer.removeListener('navigation', callback),
    agentStatus: (callback) => ipcRenderer.removeListener('agent-status', callback),
    securityAlert: (callback) => ipcRenderer.removeListener('security-alert', callback),
    performanceAlert: (callback) => ipcRenderer.removeListener('performance-alert', callback)
  }
});

// Log de inicialización
console.log('🔗 Preload script cargado: Silhouette Browser API expuesta');
