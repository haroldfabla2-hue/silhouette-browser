// =============================================================================
// SILHOUETTE BROWSER - UI DE GESTIÓN DE USUARIOS V6.0
// Interfaz completa para autenticación, gestión de roles y permisos
// Implementación de UI moderna inspirada en Chrome y Comet Browser
// =============================================================================

export class UserManagementUI {
  constructor(mainWindow, userSystem, googleAuth) {
    this.mainWindow = mainWindow;
    this.userSystem = userSystem;
    this.googleAuth = googleAuth;
    this.currentUser = null;
    this.currentPermissions = [];
    this.isInitialized = false;
    
    // Estados de la UI
    this.uiState = {
      isLoggedIn: false,
      isLoading: false,
      activeModal: null,
      selectedUser: null,
      usersList: [],
      rolesList: [],
      permissionsList: []
    };
    
    console.log('🎨 User Management UI initialized');
  }

  // =============================================================================
  // INICIALIZACIÓN DE LA UI
  // =============================================================================
  
  async initialize() {
    try {
      console.log('🎨 Initializing User Management UI...');
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Cargar UI inicial
      await this.loadInitialUI();
      
      // Verificar estado de autenticación
      await this.checkAuthStatus();
      
      this.isInitialized = true;
      console.log('✅ User Management UI ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize User Management UI:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Event listeners para el sistema de usuarios
    this.userSystem.on('userAuthenticated', (data) => this.handleUserAuthenticated(data));
    this.userSystem.on('userLoggedOut', () => this.handleUserLoggedOut());
    this.userSystem.on('roleAssigned', (data) => this.handleRoleAssigned(data));
    this.userSystem.on('permissionChanged', (data) => this.handlePermissionChanged(data));
    
    // Event listeners para autenticación de Google
    this.googleAuth.on('authSuccess', (data) => this.handleGoogleAuthSuccess(data));
    this.googleAuth.on('authError', (data) => this.handleGoogleAuthError(data));
    this.googleAuth.on('tokenRefreshed', () => this.updateAuthUI());
    
    // Event listeners para IPC
    this.setupIpcEventListeners();
  }

  setupIpcEventListeners() {
    // Abrir modal de autenticación
    ipcMain.handle('ui:showAuthModal', async () => {
      return await this.showAuthModal();
    });

    // Abrir modal de gestión de usuarios (admin)
    ipcMain.handle('ui:showUserManagement', async () => {
      return await this.showUserManagement();
    });

    // Mostrar información del usuario actual
    ipcMain.handle('ui:getCurrentUserInfo', async () => {
      return await this.getCurrentUserInfo();
    });

    // Actualizar preferencias del usuario
    ipcMain.handle('ui:updateUserPreferences', async (event, preferences) => {
      return await this.updateUserPreferences(preferences);
    });

    // Verificar permisos
    ipcMain.handle('ui:checkPermission', async (event, permission) => {
      return this.hasPermission(permission);
    });

    // Exportar datos del usuario
    ipcMain.handle('ui:exportUserData', async () => {
      return await this.exportUserData();
    });
  }

  // =============================================================================
  // UI DE AUTENTICACIÓN
  // =============================================================================
  
  async showAuthModal() {
    try {
      if (this.uiState.activeModal) {
        await this.closeCurrentModal();
      }

      const authUI = this.createAuthModalUI();
      this.uiState.activeModal = 'auth';
      
      // Mostrar modal
      await this.displayModal(authUI);
      
      // Configurar botones de autenticación
      this.setupAuthButtons();
      
      return { success: true, modal: 'auth' };

    } catch (error) {
      console.error('❌ Show auth modal error:', error);
      return { success: false, error: error.message };
    }
  }

  createAuthModalUI() {
    return `
      <div class="auth-modal" id="authModal">
        <div class="auth-modal-content">
          <div class="auth-header">
            <img src="assets/logo.png" alt="Silhouette Browser" class="auth-logo">
            <h2>Iniciar Sesión en Silhouette</h2>
            <p>Accede a todas las funcionalidades avanzadas</p>
          </div>
          
          <div class="auth-options">
            <button class="auth-btn google-btn" id="googleAuthBtn">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
            
            <div class="auth-divider">
              <span>o</span>
            </div>
            
            <div class="auth-form" id="authForm" style="display: none;">
              <div class="form-group">
                <label for="email">Correo electrónico</label>
                <input type="email" id="email" placeholder="tu@email.com" required>
              </div>
              
              <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" placeholder="••••••••" required>
              </div>
              
              <div class="form-actions">
                <button class="auth-btn primary" id="emailAuthBtn">Iniciar Sesión</button>
                <button class="auth-btn secondary" id="registerBtn">Crear Cuenta</button>
              </div>
            </div>
            
            <button class="auth-btn email-toggle" id="emailToggleBtn">
              Usar correo y contraseña
            </button>
          </div>
          
          <div class="auth-footer">
            <p>Al continuar, aceptas nuestros <a href="#" class="auth-link">Términos de Servicio</a> y <a href="#" class="auth-link">Política de Privacidad</a></p>
          </div>
        </div>
      </div>
    `;
  }

  setupAuthButtons() {
    // Botón de autenticación con Google
    const googleBtn = document.getElementById('googleAuthBtn');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        await this.handleGoogleAuth();
      });
    }

    // Toggle para mostrar formulario de email
    const emailToggleBtn = document.getElementById('emailToggleBtn');
    if (emailToggleBtn) {
      emailToggleBtn.addEventListener('click', () => {
        const form = document.getElementById('authForm');
        const toggleBtn = document.getElementById('emailToggleBtn');
        
        if (form.style.display === 'none') {
          form.style.display = 'block';
          toggleBtn.style.display = 'none';
        }
      });
    }

    // Botón de autenticación con email
    const emailAuthBtn = document.getElementById('emailAuthBtn');
    if (emailAuthBtn) {
      emailAuthBtn.addEventListener('click', async () => {
        await this.handleEmailAuth();
      });
    }

    // Botón de registro
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
      registerBtn.addEventListener('click', async () => {
        await this.handleUserRegistration();
      });
    }
  }

  async handleGoogleAuth() {
    try {
      this.uiState.isLoading = true;
      this.updateAuthUI();
      
      const result = await this.googleAuth.startAuthFlow();
      
      if (result.success) {
        // El callback se manejará automáticamente cuando se complete
        console.log('✅ Google auth flow started');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Google auth error:', error);
      this.showError('Error al iniciar sesión con Google: ' + error.message);
    } finally {
      this.uiState.isLoading = false;
      this.updateAuthUI();
    }
  }

  async handleEmailAuth() {
    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        throw new Error('Por favor completa todos los campos');
      }

      this.uiState.isLoading = true;
      this.updateAuthUI();
      
      const result = await this.userSystem.authenticateUser({
        email: email,
        password: password
      });
      
      if (result.success) {
        await this.handleUserAuthenticated({
          user: result.user,
          session: result.session,
          permissions: result.permissions
        });
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Email auth error:', error);
      this.showError('Error de autenticación: ' + error.message);
    } finally {
      this.uiState.isLoading = false;
      this.updateAuthUI();
    }
  }

  async handleUserRegistration() {
    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        throw new Error('Por favor completa todos los campos');
      }

      this.uiState.isLoading = true;
      this.updateAuthUI();
      
      const result = await this.userSystem.createUser({
        email: email,
        name: email.split('@')[0],
        password: password
      });
      
      if (result.success) {
        // Auto-login después del registro
        const loginResult = await this.userSystem.authenticateUser({
          email: email,
          password: password
        });
        
        if (loginResult.success) {
          await this.handleUserAuthenticated(loginResult);
        }
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ User registration error:', error);
      this.showError('Error al crear cuenta: ' + error.message);
    } finally {
      this.uiState.isLoading = false;
      this.updateAuthUI();
    }
  }

  // =============================================================================
  // UI DE GESTIÓN DE USUARIOS (ADMIN)
  // =============================================================================
  
  async showUserManagement() {
    try {
      // Verificar permisos de administrador
      if (!this.hasPermission('admin.users')) {
        throw new Error('No tienes permisos para gestionar usuarios');
      }

      if (this.uiState.activeModal) {
        await this.closeCurrentModal();
      }

      // Cargar datos
      await this.loadUserManagementData();
      
      const userManagementUI = this.createUserManagementUI();
      this.uiState.activeModal = 'user-management';
      
      await this.displayModal(userManagementUI);
      this.setupUserManagementEvents();
      
      return { success: true, modal: 'user-management' };

    } catch (error) {
      console.error('❌ Show user management error:', error);
      return { success: false, error: error.message };
    }
  }

  async loadUserManagementData() {
    try {
      // Cargar usuarios
      this.uiState.usersList = await this.getAllUsers();
      this.uiState.rolesList = await this.getAllRoles();
      this.uiState.permissionsList = await this.getAllPermissions();
    } catch (error) {
      console.error('❌ Load user management data error:', error);
      throw error;
    }
  }

  createUserManagementUI() {
    return `
      <div class="user-management-modal" id="userManagementModal">
        <div class="user-management-content">
          <div class="user-management-header">
            <h2>Gestión de Usuarios</h2>
            <button class="close-btn" id="closeUserManagement">×</button>
          </div>
          
          <div class="user-management-tabs">
            <button class="tab-btn active" data-tab="users">Usuarios</button>
            <button class="tab-btn" data-tab="roles">Roles</button>
            <button class="tab-btn" data-tab="permissions">Permisos</button>
          </div>
          
          <div class="tab-content">
            <!-- Contenido de usuarios -->
            <div class="tab-panel active" id="users-panel">
              <div class="panel-header">
                <h3>Lista de Usuarios</h3>
                <button class="add-btn" id="addUserBtn">Agregar Usuario</button>
              </div>
              <div class="users-list" id="usersList">
                ${this.renderUsersList()}
              </div>
            </div>
            
            <!-- Contenido de roles -->
            <div class="tab-panel" id="roles-panel">
              <div class="panel-header">
                <h3>Gestión de Roles</h3>
                <button class="add-btn" id="addRoleBtn">Crear Rol</button>
              </div>
              <div class="roles-list" id="rolesList">
                ${this.renderRolesList()}
              </div>
            </div>
            
            <!-- Contenido de permisos -->
            <div class="tab-panel" id="permissions-panel">
              <div class="panel-header">
                <h3>Lista de Permisos</h3>
              </div>
              <div class="permissions-list" id="permissionsList">
                ${this.renderPermissionsList()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderUsersList() {
    return this.uiState.usersList.map(user => `
      <div class="user-item" data-user-id="${user.id}">
        <div class="user-info">
          <img src="${user.profile?.avatar || '/assets/default-avatar.png'}" alt="${user.name}" class="user-avatar">
          <div class="user-details">
            <h4>${user.name}</h4>
            <p class="user-email">${user.email}</p>
            <p class="user-status ${user.isActive ? 'active' : 'inactive'}">
              ${user.isActive ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
        <div class="user-actions">
          <button class="action-btn edit-btn" data-action="edit" data-user-id="${user.id}">Editar</button>
          <button class="action-btn roles-btn" data-action="roles" data-user-id="${user.id}">Roles</button>
          ${user.isActive ? 
            '<button class="action-btn disable-btn" data-action="disable" data-user-id="' + user.id + '">Desactivar</button>' :
            '<button class="action-btn enable-btn" data-action="enable" data-user-id="' + user.id + '">Activar</button>'
          }
          <button class="action-btn delete-btn" data-action="delete" data-user-id="${user.id}">Eliminar</button>
        </div>
      </div>
    `).join('');
  }

  renderRolesList() {
    return this.uiState.rolesList.map(role => `
      <div class="role-item" data-role-id="${role.id}">
        <div class="role-info">
          <div class="role-badge" style="background-color: ${role.color}">${role.name.charAt(0)}</div>
          <div class="role-details">
            <h4>${role.name}</h4>
            <p class="role-description">${role.description}</p>
            <p class="role-level">Nivel: ${role.level}</p>
          </div>
        </div>
        <div class="role-actions">
          <button class="action-btn edit-btn" data-action="edit-role" data-role-id="${role.id}">Editar</button>
          <button class="action-btn permissions-btn" data-action="permissions" data-role-id="${role.id}">Permisos</button>
          ${!role.isSystem ? '<button class="action-btn delete-btn" data-action="delete-role" data-role-id="' + role.id + '">Eliminar</button>' : ''}
        </div>
      </div>
    `).join('');
  }

  renderPermissionsList() {
    const categories = {};
    this.uiState.permissionsList.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });

    return Object.keys(categories).map(category => `
      <div class="permission-category">
        <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
        <div class="permissions-grid">
          ${categories[category].map(permission => `
            <div class="permission-item">
              <div class="permission-info">
                <h5>${permission.name}</h5>
                <p class="permission-description">${permission.description}</p>
                <span class="permission-level">${permission.level}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  setupUserManagementEvents() {
    // Cerrar modal
    const closeBtn = document.getElementById('closeUserManagement');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeCurrentModal());
    }

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Acciones de usuarios
    const userActions = document.querySelectorAll('[data-action]');
    userActions.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleUserAction(e));
    });

    // Botones de agregar
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => this.showAddUserForm());
    }

    const addRoleBtn = document.getElementById('addRoleBtn');
    if (addRoleBtn) {
      addRoleBtn.addEventListener('click', () => this.showAddRoleForm());
    }
  }

  // =============================================================================
  // UI DEL USUARIO ACTUAL
  // =============================================================================
  
  createUserProfileUI() {
    return `
      <div class="user-profile" id="userProfile">
        <div class="profile-header">
          <img src="${this.currentUser?.profile?.avatar || '/assets/default-avatar.png'}" alt="${this.currentUser?.name}" class="profile-avatar">
          <div class="profile-info">
            <h3>${this.currentUser?.name || 'Usuario'}</h3>
            <p class="profile-email">${this.currentUser?.email || ''}</p>
            <div class="profile-roles">
              ${this.currentUser?.roleIds?.map(roleId => {
                const role = this.uiState.rolesList.find(r => r.id === roleId);
                return role ? `<span class="role-tag" style="background-color: ${role.color}">${role.name}</span>` : '';
              }).join('') || ''}
            </div>
          </div>
        </div>
        
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">${this.currentUser?.loginCount || 0}</span>
            <span class="stat-label">Sesiones</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${this.currentPermissions.length}</span>
            <span class="stat-label">Permisos</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${this.getLastActiveTime()}</span>
            <span class="stat-label">Última actividad</span>
          </div>
        </div>
        
        <div class="profile-actions">
          <button class="profile-btn" id="editProfileBtn">Editar Perfil</button>
          <button class="profile-btn" id="preferencesBtn">Preferencias</button>
          <button class="profile-btn" id="exportDataBtn">Exportar Datos</button>
          <button class="profile-btn danger" id="logoutBtn">Cerrar Sesión</button>
        </div>
        
        <div class="permissions-list">
          <h4>Tus Permisos</h4>
          <div class="permissions-grid">
            ${this.renderUserPermissions()}
          </div>
        </div>
      </div>
    `;
  }

  renderUserPermissions() {
    const categories = {};
    this.currentPermissions.forEach(permissionId => {
      const permission = this.uiState.permissionsList.find(p => p.id === permissionId);
      if (permission) {
        if (!categories[permission.category]) {
          categories[permission.category] = [];
        }
        categories[permission.category].push(permission);
      }
    });

    return Object.keys(categories).map(category => `
      <div class="permission-category">
        <h5>${category.charAt(0).toUpperCase() + category.slice(1)}</h5>
        ${categories[category].map(permission => `
          <div class="permission-badge">${permission.name}</div>
        `).join('')}
      </div>
    `).join('');
  }

  // =============================================================================
  // MANEJO DE EVENTOS
  // =============================================================================
  
  async handleUserAuthenticated(data) {
    try {
      console.log('✅ User authenticated:', data.user.email);
      
      this.currentUser = data.user;
      this.currentPermissions = data.permissions;
      this.uiState.isLoggedIn = true;
      
      // Cerrar modal de autenticación
      if (this.uiState.activeModal === 'auth') {
        await this.closeCurrentModal();
      }
      
      // Actualizar UI principal
      this.updateMainUI();
      
      // Mostrar notificación de éxito
      this.showSuccess(`¡Bienvenido, ${data.user.name}!`);
      
      this.emit('userUIUpdated', { user: this.currentUser, permissions: this.currentPermissions });
      
    } catch (error) {
      console.error('❌ Handle user authenticated error:', error);
      this.showError('Error al procesar la autenticación: ' + error.message);
    }
  }

  handleUserLoggedOut() {
    console.log('👤 User logged out');
    
    this.currentUser = null;
    this.currentPermissions = [];
    this.uiState.isLoggedIn = false;
    
    // Actualizar UI principal
    this.updateMainUI();
    
    // Mostrar modal de autenticación
    this.showAuthModal();
    
    this.emit('userUIUpdated', { user: null, permissions: [] });
  }

  updateMainUI() {
    // Actualizar toolbar con información del usuario
    this.updateUserToolbar();
    
    // Actualizar menús según permisos
    this.updateMenusByPermissions();
  }

  updateUserToolbar() {
    // Esta función actualizaría la toolbar principal con la información del usuario
    const toolbarUser = document.getElementById('toolbarUser');
    if (toolbarUser) {
      if (this.uiState.isLoggedIn && this.currentUser) {
        toolbarUser.innerHTML = this.createUserProfileUI();
        this.setupProfileEvents();
      } else {
        toolbarUser.innerHTML = '<button class="login-btn" id="loginBtn">Iniciar Sesión</button>';
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
          loginBtn.addEventListener('click', () => this.showAuthModal());
        }
      }
    }
  }

  updateMenusByPermissions() {
    // Ocultar/mostrar elementos del menú según permisos
    const menuItems = document.querySelectorAll('[data-permission-required]');
    menuItems.forEach(item => {
      const requiredPermission = item.dataset.permissionRequired;
      if (this.hasPermission(requiredPermission)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  setupProfileEvents() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => this.showEditProfileForm());
    }

    const preferencesBtn = document.getElementById('preferencesBtn');
    if (preferencesBtn) {
      preferencesBtn.addEventListener('click', () => this.showPreferencesForm());
    }

    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.exportUserData());
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  // =============================================================================
  // MÉTODOS DE UTILIDAD
  // =============================================================================
  
  async closeCurrentModal() {
    if (this.uiState.activeModal) {
      const modal = document.getElementById(`${this.uiState.activeModal}Modal`);
      if (modal) {
        modal.remove();
      }
      this.uiState.activeModal = null;
    }
  }

  async displayModal(content) {
    // Agregar el modal al DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = content;
    document.body.appendChild(modalContainer);
    
    // Aplicar estilos CSS si es necesario
    this.applyModalStyles();
  }

  applyModalStyles() {
    // CSS para los modales
    const style = document.createElement('style');
    style.textContent = `
      .auth-modal, .user-management-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
      
      .auth-modal-content, .user-management-content {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .auth-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .auth-logo {
        width: 60px;
        height: 60px;
        margin-bottom: 1rem;
      }
      
      .auth-btn {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .google-btn {
        background: #4285F4;
        color: white;
      }
      
      .primary {
        background: #007bff;
        color: white;
      }
      
      .secondary {
        background: #6c757d;
        color: white;
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        float: right;
      }
    `;
    document.head.appendChild(style);
  }

  hasPermission(permission) {
    return this.currentPermissions.includes(permission) || this.currentPermissions.includes('*');
  }

  showError(message) {
    console.error('❌ UI Error:', message);
    // Mostrar notificación de error
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    console.log('✅ UI Success:', message);
    // Mostrar notificación de éxito
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  getLastActiveTime() {
    if (!this.currentUser?.lastActivity) {
      return 'Nunca';
    }
    
    const now = Date.now();
    const lastActivity = this.currentUser.lastActivity;
    const diff = now - lastActivity;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return `Hace ${minutes} min`;
    } else if (hours < 24) {
      return `Hace ${hours} h`;
    } else {
      return `Hace ${days} d`;
    }
  }

  async handleLogout() {
    try {
      // Cerrar sesión en Google
      await this.googleAuth.logout();
      
      // Limpiar datos de usuario
      this.userSystem.logout();
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      this.showError('Error al cerrar sesión');
    }
  }

  // =============================================================================
  // MÉTODOS ABSTRACTOS PARA INTEGRACIÓN
  // =============================================================================
  
  async loadInitialUI() {
    // Sobrescribir en la implementación específica
  }

  async checkAuthStatus() {
    // Sobrescribir en la implementación específica
  }

  async getAllUsers() {
    // Sobrescribir en la implementación específica
    return [];
  }

  async getAllRoles() {
    // Sobrescribir en la implementación específica
    return [];
  }

  async getAllPermissions() {
    // Sobrescribir en la implementación específica
    return [];
  }

  async getCurrentUserInfo() {
    if (this.currentUser) {
      return {
        success: true,
        user: this.currentUser,
        permissions: this.currentPermissions
      };
    } else {
      return { success: false, error: 'No user logged in' };
    }
  }

  updateAuthUI() {
    // Actualizar estados de carga en la UI
    const loadingElements = document.querySelectorAll('.auth-btn');
    loadingElements.forEach(btn => {
      if (this.uiState.isLoading) {
        btn.disabled = true;
        btn.textContent = 'Cargando...';
      } else {
        btn.disabled = false;
      }
    });
  }
}