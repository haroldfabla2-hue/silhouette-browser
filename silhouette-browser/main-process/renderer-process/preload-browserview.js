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
    
    // Nuevos métodos omnipotentes para grupos de pestañas
    createTabGroup: (name, options) => ipcRenderer.invoke('omnipotent:createTabGroup', name, options),
    createAgentTabGroup: (taskData) => ipcRenderer.invoke('omnipotent:createAgentTabGroup', taskData),
    addTabToGroup: (groupId, tabId) => ipcRenderer.invoke('omnipotent:addTabToGroup', groupId, tabId),
    removeTabFromGroup: (tabId) => ipcRenderer.invoke('omnipotent:removeTabFromGroup', tabId),
    activateTabGroup: (groupId) => ipcRenderer.invoke('omnipotent:activateTabGroup', groupId),
    executeAgentGroupTask: (groupId, task) => ipcRenderer.invoke('omnipotent:executeAgentGroupTask', groupId, task),
    performAutoTabGrouping: () => ipcRenderer.invoke('omnipotent:performAutoTabGrouping'),
    getTabGroups: () => ipcRenderer.invoke('omnipotent:getTabGroups'),
    
    // Métodos combinados para IA omnipotente
    organizeWorkspaceWithAI: (purpose) => ipcRenderer.invoke('omnipotent:organizeWorkspaceWithAI', purpose),
    createTaskFocusedGroup: (taskDescription) => ipcRenderer.invoke('omnipotent:createTaskFocusedGroup', taskDescription),
    intelligentTabManagement: () => ipcRenderer.invoke('omnipotent:intelligentTabManagement'),
  },

  // Tab Groups Management - Grupos de Pestañas
  tabGroups: {
    // Crear grupos
    create: (name, options) => ipcRenderer.invoke('tabgroups:create', name, options),
    createAi: (categorizedTabs) => ipcRenderer.invoke('tabgroups:createAi', categorizedTabs),
    createAgent: (taskData) => ipcRenderer.invoke('tabgroups:createAgent', taskData),
    
    // Gestionar grupos
    delete: (groupId) => ipcRenderer.invoke('tabgroups:delete', groupId),
    activate: (groupId) => ipcRenderer.invoke('tabgroups:activate', groupId),
    deactivate: (groupId) => ipcRenderer.invoke('tabgroups:deactivate', groupId),
    
    // Obtener grupos
    getAll: () => ipcRenderer.invoke('tabgroups:getAll'),
    get: (groupId) => ipcRenderer.invoke('tabgroups:get', groupId),
    getActive: () => ipcRenderer.invoke('tabgroups:getActive'),
    getStats: () => ipcRenderer.invoke('tabgroups:getStats'),
    
    // Gestionar pestañas en grupos
    addTab: (groupId, tabId) => ipcRenderer.invoke('tabgroups:addTab', groupId, tabId),
    removeTab: (tabId) => ipcRenderer.invoke('tabgroups:removeTab', tabId),
    moveTab: (tabId, fromGroupId, toGroupId) => ipcRenderer.invoke('tabgroups:moveTab', tabId, fromGroupId, toGroupId),
    
    // Ejecución de tareas en grupos de agente
    executeAgentTask: (groupId, task) => ipcRenderer.invoke('tabgroups:executeAgentTask', groupId, task),
    
    // Agrupación automática
    performAutoGrouping: () => ipcRenderer.invoke('tabgroups:performAutoGrouping'),
    enableAiGrouping: () => ipcRenderer.invoke('tabgroups:enableAiGrouping'),
    disableAiGrouping: () => ipcRenderer.invoke('tabgroups:disableAiGrouping'),
    
    // Exportar/Importar
    export: () => ipcRenderer.invoke('tabgroups:export'),
    import: (data) => ipcRenderer.invoke('tabgroups:import', data),
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

  // Event listeners para grupos de pestañas
  onGroupCreated: (callback) => {
    ipcRenderer.on('group:created', (event, data) => callback(data));
  },

  onGroupDeleted: (callback) => {
    ipcRenderer.on('group:deleted', (event, data) => callback(data));
  },

  onGroupActivated: (callback) => {
    ipcRenderer.on('group:activated', (event, data) => callback(data));
  },

  onGroupDeactivated: (callback) => {
    ipcRenderer.on('group:deactivated', (event, data) => callback(data));
  },

  onTabAddedToGroup: (callback) => {
    ipcRenderer.on('group:tab-added', (event, data) => callback(data));
  },

  onTabRemovedFromGroup: (callback) => {
    ipcRenderer.on('group:tab-removed', (event, data) => callback(data));
  },

  onTabMovedBetweenGroups: (callback) => {
    ipcRenderer.on('group:tab-moved', (event, data) => callback(data));
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

  // Browser events
  onPageTitleUpdated: (callback) => {
    ipcRenderer.on('page:title-updated', (event, data) => callback(data));
  },

  onPageFaviconUpdated: (callback) => {
    ipcRenderer.on('page:favicon-updated', (event, data) => callback(data));
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