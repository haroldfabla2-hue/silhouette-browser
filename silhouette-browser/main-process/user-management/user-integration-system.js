// =============================================================================
// SILHOUETTE BROWSER - INTEGRACIÓN DEL SISTEMA DE USUARIOS V6.0
// Conector principal que integra el sistema de usuarios con toda la aplicación
// Interfaz unificada para autenticación, permisos y gestión de usuarios
// =============================================================================

import EventEmitter from 'events';
import SilhouetteUserSystem from './user-system-core.js';
import GoogleAuthSystem from './google-auth-system.js';
import { UserManagementUI } from '../renderer-process/user-management/user-ui-manager.js';

class SilhouetteUserIntegration extends EventEmitter {
  constructor(mainWindow, options = {}) {
    super();
    
    this.mainWindow = mainWindow;
    this.options = {
      enableUserSystem: options.enableUserSystem !== false,
      enableGoogleOAuth: options.enableGoogleOAuth !== false,
      enableOfflineMode: options.enableOfflineMode !== false,
      autoLogin: options.autoLogin || false,
      sessionPersistence: options.sessionPersistence !== false,
      ...options
    };
    
    // Componentes del sistema
    this.userSystem = null;
    this.googleAuth = null;
    this.userUI = null;
    
    // Estado de integración
    this.isInitialized = false;
    this.currentUser = null;
    this.currentPermissions = [];
    this.sessionData = null;
    
    // Cache de permisos para performance
    this.permissionCache = new Map();
    this.cacheTimeout = 300000; // 5 minutos
    
    console.log('🔗 Silhouette User Integration initialized');
  }

  // =============================================================================
  // INICIALIZACIÓN DEL SISTEMA
  // =============================================================================
  
  async initialize() {
    try {
      if (!this.options.enableUserSystem) {
        console.log('⏭️ User system disabled, skipping initialization');
        return;
      }

      console.log('🔗 Initializing User Integration System...');
      
      // Inicializar sistema de usuarios core
      await this.initializeUserSystem();
      
      // Inicializar autenticación de Google
      if (this.options.enableGoogleOAuth) {
        await this.initializeGoogleAuth();
      }
      
      // Inicializar UI de gestión
      await this.initializeUserUI();
      
      // Configurar IPC handlers
      this.setupIntegrationIpcHandlers();
      
      // Configurar hooks de sistema
      this.setupSystemHooks();
      
      // Verificar sesión persistente
      if (this.options.sessionPersistence) {
        await this.checkPersistentSession();
      }
      
      this.isInitialized = true;
      this.emit('userSystemReady');
      
      console.log('✅ User Integration System ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize User Integration System:', error);
      throw error;
    }
  }

  async initializeUserSystem() {
    try {
      this.userSystem = new SilhouetteUserSystem({
        jwtSecret: process.env.SILHOUETTE_USER_JWT_SECRET,
        sessionTimeout: 86400000, // 24 horas
        maxActiveSessions: 5,
        enableGoogleOAuth: this.options.enableGoogleOAuth,
        enableGitHubIntegration: true,
        enableAuditLogging: true
      });
      
      // Configurar event listeners
      this.userSystem.on('userAuthenticated', (data) => this.handleUserAuthenticated(data));
      this.userSystem.on('sessionCreated', (data) => this.handleSessionCreated(data));
      this.userSystem.on('roleAssigned', (data) => this.handleRoleAssigned(data));
      this.userSystem.on('permissionChanged', (data) => this.handlePermissionChanged(data));
      
      console.log('✅ User system core initialized');
      
    } catch (error) {
      console.error('❌ User system initialization error:', error);
      throw error;
    }
  }

  async initializeGoogleAuth() {
    try {
      this.googleAuth = new GoogleAuthSystem({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: this.getOAuthRedirectUri(),
        enableFedCM: true,
        enablePasskeys: true,
        enableDeviceBinding: true
      });
      
      await this.googleAuth.initialize();
      
      // Configurar event listeners
      this.googleAuth.on('authSuccess', (data) => this.handleGoogleAuthSuccess(data));
      this.googleAuth.on('authError', (data) => this.handleGoogleAuthError(data));
      this.googleAuth.on('tokenRefreshed', () => this.handleTokenRefreshed());
      
      console.log('✅ Google Auth system initialized');
      
    } catch (error) {
      console.error('❌ Google Auth initialization error:', error);
      // No bloquear si falla Google Auth
    }
  }

  async initializeUserUI() {
    try {
      this.userUI = new UserManagementUI(this.mainWindow, this.userSystem, this.googleAuth);
      await this.userUI.initialize();
      
      console.log('✅ User UI initialized');
      
    } catch (error) {
      console.error('❌ User UI initialization error:', error);
      // No es crítico si falla la UI
    }
  }

  // =============================================================================
  // IPC HANDLERS PARA INTEGRACIÓN
  // =============================================================================
  
  setupIntegrationIpcHandlers() {
    console.log('📡 Setting up User Integration IPC handlers...');
    
    // Autenticación
    ipcMain.handle('user:login', async (event, credentials) => {
      return await this.loginUser(credentials);
    });
    
    ipcMain.handle('user:logout', async () => {
      return await this.logoutUser();
    });
    
    ipcMain.handle('user:getCurrent', async () => {
      return await this.getCurrentUser();
    });
    
    ipcMain.handle('user:refreshSession', async () => {
      return await this.refreshUserSession();
    });
    
    // Permisos
    ipcMain.handle('user:hasPermission', async (event, permission) => {
      return await this.hasPermission(permission);
    });
    
    ipcMain.handle('user:getPermissions', async () => {
      return await this.getUserPermissions();
    });
    
    // Gestión de usuarios (admin)
    ipcMain.handle('user:create', async (event, userData) => {
      return await this.createUser(userData);
    });
    
    ipcMain.handle('user:update', async (event, userId, updates) => {
      return await this.updateUser(userId, updates);
    });
    
    ipcMain.handle('user:delete', async (event, userId) => {
      return await this.deleteUser(userId);
    });
    
    ipcMain.handle('user:list', async () => {
      return await this.listUsers();
    });
    
    // Roles y permisos
    ipcMain.handle('roles:list', async () => {
      return await this.listRoles();
    });
    
    ipcMain.handle('roles:create', async (event, roleData) => {
      return await this.createRole(roleData);
    });
    
    ipcMain.handle('roles:assign', async (event, userId, roleId) => {
      return await this.assignRoleToUser(userId, roleId);
    });
    
    // Google OAuth
    if (this.googleAuth) {
      ipcMain.handle('google:startAuth', async (event, options) => {
        return await this.googleAuth.startAuthFlow(this.mainWindow.webContents, options);
      });
      
      ipcMain.handle('google:getStatus', async () => {
        return await this.googleAuth.getAuthStatus();
      });
      
      ipcMain.handle('google:logout', async () => {
        return await this.googleAuth.logout();
      });
    }
    
    // Exportación de datos
    ipcMain.handle('user:exportData', async () => {
      return await this.exportUserData();
    });
    
    console.log('✅ User Integration IPC handlers configured');
  }

  // =============================================================================
  // SISTEMA DE HOOKS
  // =============================================================================
  
  setupSystemHooks() {
    // Hook para verificar permisos antes de ejecutar acciones
    this.setupPermissionHooks();
    
    // Hook para persistir datos de usuario
    this.setupPersistenceHooks();
    
    // Hook para auditoría
    this.setupAuditHooks();
    
    // Hook para sincronización entre ventanas
    this.setupSyncHooks();
  }

  setupPermissionHooks() {
    // Verificar permisos antes de acciones críticas
    this.on('beforeAction', (data) => {
      const { action, requiredPermission } = data;
      
      if (requiredPermission && !this.hasPermission(requiredPermission)) {
        throw new Error(`Permission denied: ${requiredPermission} required for ${action}`);
      }
    });
    
    // Cache de permisos para mejorar performance
    setInterval(() => {
      this.permissionCache.clear();
    }, this.cacheTimeout);
  }

  setupPersistenceHooks() {
    // Guardar estado del usuario cuando cambie
    this.on('userChanged', (data) => {
      this.saveUserState(data.user);
    });
    
    // Restaurar estado al inicializar
    this.on('initialize', () => {
      this.restoreUserState();
    });
  }

  setupAuditHooks() {
    // Registrar acciones importantes
    this.on('userAction', (data) => {
      this.logUserAction(data);
    });
  }

  setupSyncHooks() {
    // Sincronizar entre múltiples ventanas
    if (this.mainWindow) {
      this.mainWindow.webContents.on('did-finish-load', () => {
        this.syncUserStateToWindow();
      });
    }
  }

  // =============================================================================
  // GESTIÓN DE USUARIOS
  // =============================================================================
  
  async loginUser(credentials) {
    try {
      console.log('🔐 Logging in user...');
      
      const result = await this.userSystem.authenticateUser(credentials);
      
      if (result.success) {
        await this.handleUserAuthenticated(result);
        return { success: true, user: result.user, session: result.session };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async logoutUser() {
    try {
      console.log('👤 Logging out user...');
      
      // Cerrar sesión en Google
      if (this.googleAuth) {
        await this.googleAuth.logout();
      }
      
      // Limpiar datos locales
      this.currentUser = null;
      this.currentPermissions = [];
      this.sessionData = null;
      this.permissionCache.clear();
      
      // Emitir evento
      this.emit('userLoggedOut');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    if (this.currentUser) {
      return {
        success: true,
        user: this.currentUser,
        permissions: this.currentPermissions,
        session: this.sessionData
      };
    } else {
      return { success: false, error: 'No user logged in' };
    }
  }

  // =============================================================================
  // GESTIÓN DE PERMISOS
  // =============================================================================
  
  async hasPermission(permission) {
    try {
      if (!this.currentUser) {
        return false;
      }
      
      // Verificar cache primero
      const cacheKey = `${this.currentUser.id}_${permission}`;
      if (this.permissionCache.has(cacheKey)) {
        return this.permissionCache.get(cacheKey);
      }
      
      // Verificar con el sistema de usuarios
      const hasPerm = await this.userSystem.hasPermission(this.currentUser.id, permission);
      
      // Guardar en cache
      this.permissionCache.set(cacheKey, hasPerm);
      
      return hasPerm;
      
    } catch (error) {
      console.error('❌ Check permission error:', error);
      return false;
    }
  }

  async getUserPermissions() {
    return {
      success: true,
      permissions: this.currentPermissions
    };
  }

  // =============================================================================
  // GESTIÓN DE ROLES Y USUARIOS (ADMIN)
  // =============================================================================
  
  async createUser(userData) {
    try {
      // Verificar permisos de admin
      if (!await this.hasPermission('admin.users')) {
        throw new Error('Permission denied: admin.users required');
      }
      
      const result = await this.userSystem.createUser(userData);
      return result;
      
    } catch (error) {
      console.error('❌ Create user error:', error);
      return { success: false, error: error.message };
    }
  }

  async listUsers() {
    try {
      // Verificar permisos
      if (!await this.hasPermission('admin.users')) {
        throw new Error('Permission denied: admin.users required');
      }
      
      // Obtener usuarios del sistema
      const users = this.userSystem.userStore.get('users') || {};
      const usersList = Object.values(users).map(user => {
        const { password, passwordResetToken, ...sanitizedUser } = user;
        return sanitizedUser;
      });
      
      return { success: true, users: usersList };
      
    } catch (error) {
      console.error('❌ List users error:', error);
      return { success: false, error: error.message };
    }
  }

  async assignRoleToUser(userId, roleId) {
    try {
      if (!await this.hasPermission('admin.roles')) {
        throw new Error('Permission denied: admin.roles required');
      }
      
      const result = await this.userSystem.assignRoleToUser(userId, roleId);
      return result;
      
    } catch (error) {
      console.error('❌ Assign role error:', error);
      return { success: false, error: error.message };
    }
  }

  async listRoles() {
    try {
      const roles = this.userSystem.userStore.get('roles') || {};
      return { success: true, roles: Array.from(roles.values()) };
      
    } catch (error) {
      console.error('❌ List roles error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================================================
  // MANEJO DE EVENTOS
  // =============================================================================
  
  async handleUserAuthenticated(data) {
    try {
      console.log('✅ User authenticated:', data.user.email);
      
      this.currentUser = data.user;
      this.currentPermissions = data.permissions || await this.userSystem.getUserPermissions(data.user.id);
      
      // Crear sesión de integración
      this.sessionData = {
        token: data.session,
        user: data.user,
        permissions: this.currentPermissions,
        createdAt: Date.now()
      };
      
      // Guardar estado persistente
      if (this.options.sessionPersistence) {
        this.saveUserState(data.user);
      }
      
      // Emitir eventos
      this.emit('userAuthenticated', { user: this.currentUser, permissions: this.currentPermissions });
      this.emit('userChanged', { user: this.currentUser });
      
      // Sincronizar con otras ventanas
      this.syncUserState();
      
    } catch (error) {
      console.error('❌ Handle user authenticated error:', error);
    }
  }

  handleGoogleAuthSuccess(data) {
    console.log('✅ Google auth success:', data.user.email);
    
    // Integrar con el sistema de usuarios de Silhouette
    this.loginUser({
      googleToken: data.tokens.access_token,
      userInfo: data.user
    });
  }

  handleGoogleAuthError(data) {
    console.error('❌ Google auth error:', data.error);
    this.emit('authError', data);
  }

  handleTokenRefreshed() {
    console.log('🔄 Token refreshed');
    this.emit('tokenRefreshed');
  }

  // =============================================================================
  // PERSISTENCIA Y SINCRONIZACIÓN
  // =============================================================================
  
  async checkPersistentSession() {
    try {
      // Verificar si hay una sesión guardada
      const savedUser = this.loadUserState();
      if (savedUser && savedUser.id) {
        console.log('🔍 Found persistent session:', savedUser.email);
        
        // Verificar que la sesión sigue siendo válida
        const sessionValidation = await this.userSystem.validateSession(savedUser.sessionToken);
        if (sessionValidation) {
          await this.handleUserAuthenticated({
            user: sessionValidation.user,
            session: sessionValidation.session,
            permissions: sessionValidation.permissions
          });
        }
      }
    } catch (error) {
      console.error('❌ Check persistent session error:', error);
    }
  }

  async saveUserState(user) {
    try {
      const state = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.profile?.avatar,
          roleIds: user.roleIds
        },
        sessionToken: this.sessionData?.token,
        savedAt: Date.now()
      };
      
      // Guardar en electron-store
      const Store = (await import('electron-store')).default;
      const store = new Store({ name: 'user-session' });
      store.set('userState', state);
      
    } catch (error) {
      console.error('❌ Save user state error:', error);
    }
  }

  loadUserState() {
    try {
      const Store = (require('electron-store')).default;
      const store = new Store({ name: 'user-session' });
      return store.get('userState');
    } catch (error) {
      console.error('❌ Load user state error:', error);
      return null;
    }
  }

  syncUserState() {
    try {
      // Sincronizar estado con todas las ventanas
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('user:stateChanged', {
          user: this.currentUser,
          permissions: this.currentPermissions
        });
      }
    } catch (error) {
      console.error('❌ Sync user state error:', error);
    }
  }

  syncUserStateToWindow() {
    if (this.currentUser) {
      this.mainWindow.webContents.send('user:stateChanged', {
        user: this.currentUser,
        permissions: this.currentPermissions
      });
    }
  }

  // =============================================================================
  // MÉTODOS DE UTILIDAD
  // =============================================================================
  
  getOAuthRedirectUri() {
    // Determinar URI de redirección según el entorno
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000/auth/google/callback';
    } else {
      return 'https://silhouette.browser/auth/google/callback';
    }
  }

  async exportUserData() {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }
      
      const userData = await this.userSystem.exportUserData(this.currentUser.id);
      return { success: true, data: userData };
      
    } catch (error) {
      console.error('❌ Export user data error:', error);
      return { success: false, error: error.message };
    }
  }

  logUserAction(data) {
    // Implementar logging para auditoría
    console.log(`📊 User action: ${data.action} by ${this.currentUser?.email || 'anonymous'}`);
    
    if (this.options.enableAuditLogging) {
      // Guardar log de auditoría
      // Implementación específica del log
    }
  }

  // =============================================================================
  // INTEGRACIÓN CON OTROS SISTEMAS
  // =============================================================================
  
  // Integrar con GitHub
  integrateWithGitHub(githubClient) {
    if (githubClient) {
      // Vincular cuenta de GitHub con usuario de Silhouette
      githubClient.on('userConnected', (data) => {
        if (this.currentUser) {
          this.updateUserGitHubIntegration(data);
        }
      });
    }
  }

  // Integrar con sistema de agentes
  integrateWithAgents(agentSystem) {
    if (agentSystem) {
      // Los agentes pueden acceder a información del usuario
      agentSystem.setUserContext(this.currentUser, this.currentPermissions);
    }
  }

  // Integrar con sistema de preview sharing
  integrateWithPreviewSharing(previewSystem) {
    if (previewSystem) {
      // Asociar previews con usuarios
      previewSystem.setUserContext(this.currentUser);
    }
  }

  updateUserGitHubIntegration(githubData) {
    if (this.currentUser) {
      // Actualizar datos de GitHub en el perfil del usuario
      // Implementación específica
    }
  }
}

export default SilhouetteUserIntegration;