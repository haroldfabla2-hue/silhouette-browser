// =============================================================================
// PRELOAD SCRIPT PARA BROWSERVIEW
// Comunicación segura entre renderer y main process para BrowserView
// =============================================================================

import { contextBridge, ipcRenderer } from 'electron';

// API expuesta al renderer de forma segura
contextBridge.exposeInMainWorld('silhouetteAPI', {
  // Browser control con BrowserView
  browser: {
    // Navegación
    navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
    getCurrentUrl: () => ipcRenderer.invoke('browser:getCurrentUrl'),
    goBack: () => ipcRenderer.invoke('browser:goBack'),
    goForward: () => ipcRenderer.invoke('browser:goForward'),
    refresh: () => ipcRenderer.invoke('browser:refresh'),
    
    // Tabs con BrowserView
    createTab: (url, options) => ipcRenderer.invoke('browser:createTab', url, options),
    closeTab: (tabId) => ipcRenderer.invoke('browser:closeTab', tabId),
    switchToTab: (tabId) => ipcRenderer.invoke('browser:switchToTab', tabId),
    reloadTab: (tabId) => ipcRenderer.invoke('browser:reloadTab', tabId),
    getActiveTabs: () => ipcRenderer.invoke('browser:getActiveTabs'),
    getTabCount: () => ipcRenderer.invoke('browser:getTabCount'),
    
    // Estado del navegador
    getCurrentTitle: () => ipcRenderer.invoke('browser:getCurrentTitle'),
    getStats: () => ipcRenderer.invoke('browser:getStats'),
    getPerformanceMetrics: () => ipcRenderer.invoke('browser:getPerformanceMetrics'),
    
    // Búsqueda
    performSearch: (query, engine) => ipcRenderer.invoke('browser:performSearch', query, engine),
    
    // Bookmarks
    addBookmark: (title, url) => ipcRenderer.invoke('browser:addBookmark', title, url),
    removeBookmark: (bookmarkId) => ipcRenderer.invoke('browser:removeBookmark', bookmarkId),
    getBookmarks: () => ipcRenderer.invoke('browser:getBookmarks'),
    
    // Historial
    getHistory: (limit) => ipcRenderer.invoke('browser:getHistory', limit),
    clearHistory: () => ipcRenderer.invoke('browser:clearHistory'),
    
    // Configuración
    getSettings: () => ipcRenderer.invoke('browser:getSettings'),
    updateSetting: (key, value) => ipcRenderer.invoke('browser:updateSetting', key, value),
    
    // Seguridad
    checkSecurity: (url) => ipcRenderer.invoke('browser:checkSecurity', url),
    getSecurityStatus: () => ipcRenderer.invoke('browser:getSecurityStatus'),
  },

  // Window management
  window: {
    createNewWindow: (url) => ipcRenderer.invoke('window:createNewWindow', url),
    getWindowList: () => ipcRenderer.invoke('window:getWindowList'),
    isWindowActive: (windowId) => ipcRenderer.invoke('window:isWindowActive', windowId),
  },

  // Omnipotent System (actualizado para BrowserView)
  omnipotent: {
    executeCommand: (commandData) => ipcRenderer.invoke('omnipotent:executeCommand', commandData),
    getStatus: () => ipcRenderer.invoke('omnipotent:getStatus'),
    getHistory: () => ipcRenderer.invoke('omnipotent:getHistory'),
    navigateAndExtract: (url, task) => ipcRenderer.invoke('omnipotent:navigateAndExtract', { url, task }),
    
    // Nuevos métodos para BrowserView
    getActiveTab: () => ipcRenderer.invoke('omnipotent:getActiveTab'),
    executeInTab: (tabId, task) => ipcRenderer.invoke('omnipotent:executeInTab', tabId, task),
    getAllTabs: () => ipcRenderer.invoke('omnipotent:getAllTabs'),
    switchAndExecute: (tabId, task) => ipcRenderer.invoke('omnipotent:switchAndExecute', tabId, task),
  },

  // Event listeners para actualizaciones de tabs
  onTabUpdate: (callback) => {
    ipcRenderer.on('tab:updated', (event, data) => callback(data));
  },

  onTabCreated: (callback) => {
    ipcRenderer.on('tab:created', (event, data) => callback(data));
  },

  onTabClosed: (callback) => {
    ipcRenderer.on('tab:closed', (event, data) => callback(data));
  },

  onTabActiveChanged: (callback) => {
    ipcRenderer.on('tab:active-changed', (event, data) => callback(data));
  },

  onPageLoadStarted: (callback) => {
    ipcRenderer.on('page:load-started', (event, data) => callback(data));
  },

  onPageLoadFinished: (callback) => {
    ipcRenderer.on('page:load-finished', (event, data) => callback(data));
  },

  onPageLoadError: (callback) => {
    ipcRenderer.on('page:load-error', (event, data) => callback(data));
  },

  onPageTitleUpdated: (callback) => {
    ipcRenderer.on('page:title-updated', (event, data) => callback(data));
  },

  onPageFaviconUpdated: (callback) => {
    ipcRenderer.on('page:favicon-updated', (event, data) => callback(data));
  },

  // Utilities
  notifications: {
    show: (message, type) => ipcRenderer.invoke('notification:show', message, type),
    hide: () => ipcRenderer.invoke('notification:hide'),
  },

  // File dialogs
  dialog: {
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),
  },

  // External links
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // Configuration
  config: {
    get: (key) => ipcRenderer.invoke('config:get', key),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value),
    getAll: () => ipcRenderer.invoke('config:getAll'),
  },

  // Version info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
});

// Listener para errores
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Información del preload
console.log('🔗 Preload script para BrowserView cargado');