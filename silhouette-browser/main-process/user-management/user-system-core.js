// =============================================================================
// SILHOUETTE BROWSER - SISTEMA DE USUARIOS INTEGRAL V6.0
// Arquitectura RBAC con Google OAuth + Gestión de Roles + Permisos Granulares
// Inspirado en Google Chrome User System + Comet Browser + Mejores Prácticas RBAC
// =============================================================================

import EventEmitter from 'events';
import Store from 'electron-store';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Octokit } from '@octokit/rest';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SilhouetteUserSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuración del sistema
    this.config = {
      jwtSecret: options.jwtSecret || process.env.SILHOUETTE_USER_JWT_SECRET || 'silhouette-user-secret-v6',
      sessionTimeout: options.sessionTimeout || 86400000, // 24 horas
      maxActiveSessions: options.maxActiveSessions || 5,
      googleClientId: options.googleClientId || process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: options.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET,
      enableGoogleOAuth: options.enableGoogleOAuth !== false,
      enableGitHubIntegration: options.enableGitHubIntegration !== false,
      enableOfflineMode: options.enableOfflineMode !== false,
      maxUsersPerOrganization: options.maxUsersPerOrganization || 1000,
      enableRoleHierarchy: options.enableRoleHierarchy !== false,
      enablePermissionInheritance: options.enablePermissionInheritance !== false,
      enableAuditLogging: options.enableAuditLogging !== false,
      dataRetentionDays: options.dataRetentionDays || 365
    };
    
    // Almacenes de datos
    this.userStore = new Store({
      name: 'silhouette-users',
      defaults: {
        users: new Map(),
        roles: new Map(),
        permissions: new Map(),
        organizations: new Map(),
        sessions: new Map(),
        userSessions: new Map(),
        auditLogs: new Map(),
        googleTokens: new Map()
      }
    });
    
    this.currentUser = null;
    this.currentSession = null;
    this.userData = new Map();
    this.organizationCache = new Map();
    this.permissionCache = new Map();
    
    // Inicializar roles y permisos por defecto
    this.initializeDefaultRoles();
    this.initializeDefaultPermissions();
    
    console.log('👥 Silhouette User System V6.0 initialized');
  }

  // =============================================================================
  // INICIALIZACIÓN DE ROLES Y PERMISOS POR DEFECTO
  // =============================================================================
  
  initializeDefaultPermissions() {
    const defaultPermissions = [
      // Navegación básica
      { id: 'browser.basic', name: 'Navegación Básica', description: 'Capacidad básica de navegación web', category: 'browser', level: 'basic' },
      { id: 'browser.advanced', name: 'Navegación Avanzada', description: 'Características avanzadas de navegación', category: 'browser', level: 'advanced' },
      { id: 'browser.manager', name: 'Gestión de Pestañas', description: 'Administrar múltiples pestañas y grupos', category: 'browser', level: 'advanced' },
      
      // Sistema de agentes
      { id: 'agents.basic', name: 'Agentes Básicos', description: 'Usar agentes de IA básicos', category: 'agents', level: 'basic' },
      { id: 'agents.advanced', name: 'Agentes Avanzados', description: 'Agentes de IA con capacidades avanzadas', category: 'agents', level: 'advanced' },
      { id: 'agents.create', name: 'Crear Agentes', description: 'Crear y configurar agentes personalizados', category: 'agents', level: 'advanced' },
      { id: 'agents.omnipotent', name: 'Agente Omnipotente', description: 'Acceso al sistema omnipotente completo', category: 'agents', level: 'expert' },
      
      // IDE y desarrollo
      { id: 'ide.basic', name: 'IDE Básico', description: 'Editor de código básico', category: 'ide', level: 'basic' },
      { id: 'ide.advanced', name: 'IDE Avanzado', description: 'IDE completo con debugging', category: 'ide', level: 'advanced' },
      { id: 'ide.extensions', name: 'Extensiones IDE', description: 'Instalar y gestionar extensiones', category: 'ide', level: 'advanced' },
      
      // Testing y QA
      { id: 'testing.basic', name: 'Testing Básico', description: 'Ejecutar tests básicos', category: 'testing', level: 'basic' },
      { id: 'testing.advanced', name: 'Testing Avanzado', description: 'Testing automatizado y performance', category: 'testing', level: 'advanced' },
      { id: 'testing.continuous', name: 'CI/CD Testing', description: 'Integración continua y deployment', category: 'testing', level: 'expert' },
      
      // Live server y desarrollo
      { id: 'liveserver.start', name: 'Iniciar Live Server', description: 'Iniciar servidor de desarrollo', category: 'liveserver', level: 'basic' },
      { id: 'liveserver.manage', name: 'Gestionar Live Server', description: 'Configurar y administrar servidores', category: 'liveserver', level: 'advanced' },
      { id: 'liveserver.multiple', name: 'Múltiples Servidores', description: 'Gestionar múltiples servidores concurrentes', category: 'liveserver', level: 'advanced' },
      
      // Integración nativa
      { id: 'native.docker', name: 'Integración Docker', description: 'Gestionar contenedores Docker', category: 'native', level: 'advanced' },
      { id: 'native.system', name: 'Integración Sistema', description: 'Acceso a funciones del sistema operativo', category: 'native', level: 'advanced' },
      { id: 'native.security', name: 'Configuración Seguridad', description: 'Configurar políticas de seguridad', category: 'native', level: 'expert' },
      
      // GitHub y repositorios
      { id: 'github.basic', name: 'GitHub Básico', description: 'Conectar con GitHub básico', category: 'github', level: 'basic' },
      { id: 'github.manage', name: 'Gestionar Repos', description: 'Administrar repositorios', category: 'github', level: 'advanced' },
      { id: 'github.organizations', name: 'GitHub Organizations', description: 'Gestionar organizaciones GitHub', category: 'github', level: 'advanced' },
      
      // Preview sharing
      { id: 'sharing.create', name: 'Crear Previews', description: 'Generar URLs de preview', category: 'sharing', level: 'basic' },
      { id: 'sharing.manage', name: 'Gestionar Previews', description: 'Administrar previews compartidos', category: 'sharing', level: 'advanced' },
      { id: 'sharing.teams', name: 'Compartir con Equipos', description: 'Compartir previews con equipos', category: 'sharing', level: 'advanced' },
      
      // Extensiones
      { id: 'extensions.install', name: 'Instalar Extensiones', description: 'Instalar extensiones desde store', category: 'extensions', level: 'basic' },
      { id: 'extensions.manage', name: 'Gestionar Extensiones', description: 'Administrar extensiones instaladas', category: 'extensions', level: 'advanced' },
      { id: 'extensions.develop', name: 'Desarrollar Extensiones', description: 'Desarrollar extensiones personalizadas', category: 'extensions', level: 'advanced' },
      { id: 'extensions.store', name: 'Extensiones Store', description: 'Publicar en store de extensiones', category: 'extensions', level: 'expert' },
      
      // Administración del sistema
      { id: 'admin.users', name: 'Gestionar Usuarios', description: 'Administrar usuarios del sistema', category: 'admin', level: 'expert' },
      { id: 'admin.roles', name: 'Gestionar Roles', description: 'Crear y modificar roles', category: 'admin', level: 'expert' },
      { id: 'admin.organizations', name: 'Gestionar Organizaciones', description: 'Administrar organizaciones', category: 'admin', level: 'expert' },
      { id: 'admin.system', name: 'Configuración Sistema', description: 'Configuración global del sistema', category: 'admin', level: 'expert' },
      { id: 'admin.audit', name: 'Auditoría Sistema', description: 'Acceso a logs y auditoría', category: 'admin', level: 'expert' },
      
      // APIs y desarrollo
      { id: 'api.access', name: 'Acceso APIs', description: 'Acceso a APIs del sistema', category: 'api', level: 'basic' },
      { id: 'api.develop', name: 'Desarrollar APIs', description: 'Crear APIs personalizadas', category: 'api', level: 'advanced' },
      { id: 'api.manage', name: 'Gestionar APIs', description: 'Administrar endpoints y rate limits', category: 'api', level: 'advanced' },
      
      // Análisis y reportes
      { id: 'analytics.view', name: 'Ver Analytics', description: 'Visualizar métricas y analytics', category: 'analytics', level: 'basic' },
      { id: 'analytics.manage', name: 'Gestionar Analytics', description: 'Configurar dashboards y reportes', category: 'analytics', level: 'advanced' },
      { id: 'analytics.export', name: 'Exportar Datos', description: 'Exportar datos de analytics', category: 'analytics', level: 'advanced' }
    ];

    const permissionsMap = new Map();
    defaultPermissions.forEach(perm => {
      permissionsMap.set(perm.id, perm);
    });

    this.userStore.set('permissions', permissionsMap);
    console.log(`✅ Initialized ${defaultPermissions.length} default permissions`);
  }

  initializeDefaultRoles() {
    const defaultRoles = [
      {
        id: 'guest',
        name: 'Invitado',
        description: 'Acceso limitado para usuarios nuevos',
        color: '#gray',
        level: 1,
        permissions: [
          'browser.basic',
          'agents.basic',
          'ide.basic',
          'testing.basic',
          'liveserver.start',
          'sharing.create'
        ],
        isSystem: true,
        isDefault: true
      },
      {
        id: 'user',
        name: 'Usuario',
        description: 'Usuario estándar con funcionalidades completas',
        color: '#blue',
        level: 2,
        permissions: [
          'browser.basic',
          'browser.advanced',
          'agents.basic',
          'agents.advanced',
          'ide.basic',
          'ide.advanced',
          'testing.basic',
          'testing.advanced',
          'liveserver.start',
          'liveserver.manage',
          'github.basic',
          'sharing.create',
          'sharing.manage',
          'extensions.install',
          'api.access',
          'analytics.view'
        ],
        isSystem: true,
        isDefault: true
      },
      {
        id: 'power_user',
        name: 'Power User',
        description: 'Usuario avanzado con más capacidades',
        color: '#purple',
        level: 3,
        permissions: [
          'browser.basic',
          'browser.advanced',
          'browser.manager',
          'agents.basic',
          'agents.advanced',
          'agents.create',
          'ide.basic',
          'ide.advanced',
          'ide.extensions',
          'testing.basic',
          'testing.advanced',
          'testing.continuous',
          'liveserver.start',
          'liveserver.manage',
          'liveserver.multiple',
          'native.docker',
          'github.basic',
          'github.manage',
          'sharing.create',
          'sharing.manage',
          'sharing.teams',
          'extensions.install',
          'extensions.manage',
          'extensions.develop',
          'api.access',
          'api.develop',
          'analytics.view',
          'analytics.manage'
        ],
        isSystem: true,
        isDefault: true
      },
      {
        id: 'developer',
        name: 'Desarrollador',
        description: 'Desarrollador con acceso completo a herramientas',
        color: '#green',
        level: 4,
        permissions: [
          'browser.basic',
          'browser.advanced',
          'browser.manager',
          'agents.basic',
          'agents.advanced',
          'agents.create',
          'agents.omnipotent',
          'ide.basic',
          'ide.advanced',
          'ide.extensions',
          'testing.basic',
          'testing.advanced',
          'testing.continuous',
          'liveserver.start',
          'liveserver.manage',
          'liveserver.multiple',
          'native.docker',
          'native.system',
          'github.basic',
          'github.manage',
          'github.organizations',
          'sharing.create',
          'sharing.manage',
          'sharing.teams',
          'extensions.install',
          'extensions.manage',
          'extensions.develop',
          'api.access',
          'api.develop',
          'api.manage',
          'analytics.view',
          'analytics.manage',
          'analytics.export'
        ],
        isSystem: true,
        isDefault: true
      },
      {
        id: 'team_lead',
        name: 'Líder de Equipo',
        description: 'Liderazgo técnico con capacidades de gestión',
        color: '#orange',
        level: 5,
        permissions: [
          'browser.basic',
          'browser.advanced',
          'browser.manager',
          'agents.basic',
          'agents.advanced',
          'agents.create',
          'agents.omnipotent',
          'ide.basic',
          'ide.advanced',
          'ide.extensions',
          'testing.basic',
          'testing.advanced',
          'testing.continuous',
          'liveserver.start',
          'liveserver.manage',
          'liveserver.multiple',
          'native.docker',
          'native.system',
          'github.basic',
          'github.manage',
          'github.organizations',
          'sharing.create',
          'sharing.manage',
          'sharing.teams',
          'extensions.install',
          'extensions.manage',
          'extensions.develop',
          'extensions.store',
          'api.access',
          'api.develop',
          'api.manage',
          'analytics.view',
          'analytics.manage',
          'analytics.export'
        ],
        isSystem: true,
        isDefault: true
      },
      {
        id: 'admin',
        name: 'Administrador',
        description: 'Administrador del sistema con control completo',
        color: '#red',
        level: 6,
        permissions: [
          'browser.basic',
          'browser.advanced',
          'browser.manager',
          'agents.basic',
          'agents.advanced',
          'agents.create',
          'agents.omnipotent',
          'ide.basic',
          'ide.advanced',
          'ide.extensions',
          'testing.basic',
          'testing.advanced',
          'testing.continuous',
          'liveserver.start',
          'liveserver.manage',
          'liveserver.multiple',
          'native.docker',
          'native.system',
          'native.security',
          'github.basic',
          'github.manage',
          'github.organizations',
          'sharing.create',
          'sharing.manage',
          'sharing.teams',
          'extensions.install',
          'extensions.manage',
          'extensions.develop',
          'extensions.store',
          'admin.users',
          'admin.roles',
          'admin.organizations',
          'admin.system',
          'admin.audit',
          'api.access',
          'api.develop',
          'api.manage',
          'analytics.view',
          'analytics.manage',
          'analytics.export'
        ],
        isSystem: true,
        isDefault: true
      },
      {
        id: 'super_admin',
        name: 'Super Administrador',
        description: 'Super administrador con acceso absoluto',
        color: '#black',
        level: 7,
        permissions: ['*'], // Acceso a todo
        isSystem: true,
        isDefault: true
      }
    ];

    const rolesMap = new Map();
    defaultRoles.forEach(role => {
      rolesMap.set(role.id, role);
    });

    this.userStore.set('roles', rolesMap);
    console.log(`✅ Initialized ${defaultRoles.length} default roles`);
  }

  // =============================================================================
  // GESTIÓN DE USUARIOS
  // =============================================================================
  
  async createUser(userData) {
    try {
      const {
        email,
        name,
        username,
        password = null,
        googleId = null,
        githubId = null,
        organizationId = null,
        roleIds = ['user'],
        preferences = {},
        metadata = {}
      } = userData;

      // Validar datos requeridos
      if (!email || !name) {
        throw new Error('Email and name are required');
      }

      // Verificar si el usuario ya existe
      const existingUser = this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Generar ID único
      const userId = this.generateUserId();

      // Crear usuario
      const user = {
        id: userId,
        email: email.toLowerCase(),
        name: name,
        username: username || this.generateUsername(name),
        password: password ? await this.hashPassword(password) : null,
        googleId: googleId,
        githubId: githubId,
        organizationId: organizationId,
        roleIds: roleIds,
        isActive: true,
        isEmailVerified: false,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLogin: null,
        lastActivity: Date.now(),
        preferences: {
          theme: 'system',
          language: 'en',
          notifications: true,
          analytics: true,
          autoUpdate: true,
          ...preferences
        },
        metadata: {
          createdAt: Date.now(),
          createdBy: this.currentUser?.id || 'system',
          lastModified: Date.now(),
          lastModifiedBy: this.currentUser?.id || 'system',
          ...metadata
        },
        profile: {
          avatar: null,
          bio: null,
          location: null,
          website: null,
          socialLinks: {}
        }
      };

      // Guardar usuario
      this.userStore.set(`users.${userId}`, user);
      
      // Indexar por email
      this.userStore.set(`userIndex.email.${user.email}`, userId);
      if (username) {
        this.userStore.set(`userIndex.username.${user.username}`, userId);
      }
      if (googleId) {
        this.userStore.set(`userIndex.google.${googleId}`, userId);
      }
      if (githubId) {
        this.userStore.set(`userIndex.github.${githubId}`, userId);
      }

      this.emit('userCreated', { user, createdBy: this.currentUser });
      
      console.log(`✅ User created: ${email} (${userId})`);
      return { success: true, user };

    } catch (error) {
      console.error('❌ Create user error:', error);
      return { success: false, error: error.message };
    }
  }

  async authenticateUser(credentials) {
    try {
      const { email, password, googleToken, githubToken } = credentials;

      let user = null;

      // Autenticación con Google
      if (googleToken) {
        user = await this.authenticateWithGoogle(googleToken);
      }
      // Autenticación con GitHub
      else if (githubToken) {
        user = await this.authenticateWithGitHub(githubToken);
      }
      // Autenticación con email/password
      else if (email && password) {
        user = await this.authenticateWithEmailPassword(email, password);
      }
      else {
        throw new Error('Invalid credentials');
      }

      if (!user) {
        throw new Error('Authentication failed');
      }

      // Actualizar último login
      user.lastLogin = Date.now();
      user.lastActivity = Date.now();
      user.loginCount = (user.loginCount || 0) + 1;
      this.userStore.set(`users.${user.id}`, user);

      // Crear sesión
      const session = await this.createSession(user);

      this.emit('userAuthenticated', { user, session });
      console.log(`✅ User authenticated: ${user.email}`);

      return {
        success: true,
        user: this.sanitizeUser(user),
        session: session.token,
        permissions: await this.getUserPermissions(user.id)
      };

    } catch (error) {
      console.error('❌ Authentication error:', error);
      this.emit('authenticationError', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async authenticateWithGoogle(googleToken) {
    try {
      // Verificar token con Google (simplificado)
      const payload = jwt.decode(googleToken);
      if (!payload || !payload.sub) {
        throw new Error('Invalid Google token');
      }

      // Buscar usuario por Google ID
      let user = this.findUserByGoogleId(payload.sub);
      
      if (!user) {
        // Crear usuario nuevo si no existe
        const userData = {
          email: payload.email,
          name: payload.name || payload.given_name + ' ' + payload.family_name,
          googleId: payload.sub,
          username: payload.email.split('@')[0],
          roleIds: ['user'],
          preferences: {
            avatar: payload.picture
          }
        };

        const result = await this.createUser(userData);
        if (!result.success) {
          throw new Error(result.error);
        }
        user = result.user;
      }

      // Guardar token de Google
      this.userStore.set(`googleTokens.${user.id}`, {
        token: googleToken,
        payload: payload,
        expiresAt: Date.now() + 3600000 // 1 hora
      });

      return user;

    } catch (error) {
      console.error('❌ Google authentication error:', error);
      throw error;
    }
  }

  async authenticateWithGitHub(githubToken) {
    try {
      // Verificar token con GitHub API
      const client = new Octokit({ auth: githubToken });
      const { data: githubUser } = await client.rest.users.getAuthenticated();

      // Buscar usuario por GitHub ID
      let user = this.findUserByGitHubId(githubUser.id.toString());
      
      if (!user) {
        // Crear usuario nuevo si no existe
        const userData = {
          email: githubUser.email || `${githubUser.login}@github.com`,
          name: githubUser.name || githubUser.login,
          githubId: githubUser.id.toString(),
          username: githubUser.login,
          roleIds: ['user'],
          preferences: {
            avatar: githubUser.avatar_url
          }
        };

        const result = await this.createUser(userData);
        if (!result.success) {
          throw new Error(result.error);
        }
        user = result.user;
      }

      return user;

    } catch (error) {
      console.error('❌ GitHub authentication error:', error);
      throw error;
    }
  }

  async authenticateWithEmailPassword(email, password) {
    try {
      const user = this.findUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.password) {
        throw new Error('Password authentication not available for this user');
      }

      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      if (!user.isActive) {
        throw new Error('User account is disabled');
      }

      return user;

    } catch (error) {
      console.error('❌ Email/password authentication error:', error);
      throw error;
    }
  }

  // =============================================================================
  // GESTIÓN DE SESIONES
  // =============================================================================
  
  async createSession(user, options = {}) {
    try {
      const sessionId = this.generateSessionId();
      const token = jwt.sign(
        {
          userId: user.id,
          sessionId: sessionId,
          email: user.email,
          roleIds: user.roleIds
        },
        this.config.jwtSecret,
        {
          expiresIn: this.config.sessionTimeout / 1000, // Convertir a segundos
          issuer: 'silhouette-browser'
        }
      );

      const session = {
        id: sessionId,
        userId: user.id,
        token: token,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        expiresAt: Date.now() + this.config.sessionTimeout,
        ipAddress: options.ipAddress || '127.0.0.1',
        userAgent: options.userAgent || 'silhouette-browser',
        isActive: true,
        deviceInfo: options.deviceInfo || {},
        location: options.location || null
      };

      // Guardar sesión
      this.userStore.set(`sessions.${sessionId}`, session);
      this.userStore.set(`userSessions.${user.id}.${sessionId}`, sessionId);

      // Limpiar sesiones expiradas
      await this.cleanupExpiredSessions();

      this.emit('sessionCreated', { user, session });
      console.log(`✅ Session created for user: ${user.email}`);

      return session;

    } catch (error) {
      console.error('❌ Create session error:', error);
      throw error;
    }
  }

  async validateSession(token) {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret);
      const sessionId = payload.sessionId;
      
      // Verificar que la sesión existe y está activa
      const session = this.userStore.get(`sessions.${sessionId}`);
      if (!session || !session.isActive || session.expiresAt < Date.now()) {
        throw new Error('Session expired or invalid');
      }

      // Actualizar último uso
      session.lastUsed = Date.now();
      this.userStore.set(`sessions.${sessionId}`, session);

      // Obtener usuario
      const user = this.getUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return { user, session, permissions: await this.getUserPermissions(user.id) };

    } catch (error) {
      console.error('❌ Session validation error:', error);
      return null;
    }
  }

  // =============================================================================
  // GESTIÓN DE PERMISOS Y ROLES
  // =============================================================================
  
  async getUserPermissions(userId) {
    try {
      const user = this.getUserById(userId);
      if (!user) {
        return [];
      }

      const roleIds = user.roleIds || [];
      const allPermissions = new Set();

      // Obtener permisos de cada rol
      for (const roleId of roleIds) {
        const role = this.userStore.get(`roles.${roleId}`);
        if (role) {
          if (role.permissions.includes('*')) {
            // Acceso completo
            const allPerms = this.userStore.get('permissions');
            allPerms.forEach((perm, permId) => allPermissions.add(permId));
          } else {
            role.permissions.forEach(permId => allPermissions.add(permId));
          }
        }
      }

      return Array.from(allPermissions);

    } catch (error) {
      console.error('❌ Get user permissions error:', error);
      return [];
    }
  }

  async hasPermission(userId, permission) {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission) || permissions.includes('*');
    } catch (error) {
      console.error('❌ Check permission error:', error);
      return false;
    }
  }

  async assignRoleToUser(userId, roleId) {
    try {
      const user = this.getUserById(userId);
      const role = this.userStore.get(`roles.${roleId}`);

      if (!user) {
        throw new Error('User not found');
      }
      if (!role) {
        throw new Error('Role not found');
      }

      if (!user.roleIds.includes(roleId)) {
        user.roleIds.push(roleId);
        user.metadata.lastModified = Date.now();
        user.metadata.lastModifiedBy = this.currentUser?.id || 'system';
        
        this.userStore.set(`users.${userId}`, user);
        
        this.emit('roleAssigned', { user, role, assignedBy: this.currentUser });
        console.log(`✅ Role ${roleId} assigned to user ${user.email}`);
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Assign role error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================================================
  // MÉTODOS DE UTILIDAD
  // =============================================================================
  
  findUserByEmail(email) {
    try {
      const userId = this.userStore.get(`userIndex.email.${email.toLowerCase()}`);
      return userId ? this.getUserById(userId) : null;
    } catch (error) {
      console.error('❌ Find user by email error:', error);
      return null;
    }
  }

  findUserByGoogleId(googleId) {
    try {
      const userId = this.userStore.get(`userIndex.google.${googleId}`);
      return userId ? this.getUserById(userId) : null;
    } catch (error) {
      console.error('❌ Find user by Google ID error:', error);
      return null;
    }
  }

  findUserByGitHubId(githubId) {
    try {
      const userId = this.userStore.get(`userIndex.github.${githubId}`);
      return userId ? this.getUserById(userId) : null;
    } catch (error) {
      console.error('❌ Find user by GitHub ID error:', error);
      return null;
    }
  }

  getUserById(userId) {
    return this.userStore.get(`users.${userId}`);
  }

  sanitizeUser(user) {
    const { password, passwordResetToken, ...sanitized } = user;
    return sanitized;
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateUsername(name) {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return base + '_' + Math.random().toString(36).substr(2, 4);
  }

  async hashPassword(password) {
    const bcrypt = await import('bcrypt');
    return await bcrypt.hash(password, 12);
  }

  async verifyPassword(password, hash) {
    const bcrypt = await import('bcrypt');
    return await bcrypt.compare(password, hash);
  }

  async cleanupExpiredSessions() {
    try {
      const sessions = this.userStore.get('sessions') || {};
      const now = Date.now();
      
      Object.keys(sessions).forEach(sessionId => {
        const session = sessions[sessionId];
        if (session.expiresAt < now) {
          delete sessions[sessionId];
          // También eliminar de userSessions
          const userSessions = this.userStore.get(`userSessions.${session.userId}`) || {};
          delete userSessions[sessionId];
          this.userStore.set(`userSessions.${session.userId}`, userSessions);
        }
      });
      
      this.userStore.set('sessions', sessions);
    } catch (error) {
      console.error('❌ Cleanup sessions error:', error);
    }
  }

  // =============================================================================
  // EXPORTAR DATOS DEL USUARIO
  // =============================================================================
  
  async exportUserData(userId) {
    try {
      const user = this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const permissions = await this.getUserPermissions(userId);
      const roles = user.roleIds.map(roleId => this.userStore.get(`roles.${roleId}`)).filter(Boolean);

      return {
        user: this.sanitizeUser(user),
        permissions: permissions,
        roles: roles,
        sessions: this.getUserSessions(userId),
        exportDate: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Export user data error:', error);
      throw error;
    }
  }

  getUserSessions(userId) {
    const sessionIds = this.userStore.get(`userSessions.${userId}`) || {};
    const sessions = [];
    
    Object.values(sessionIds).forEach(sessionId => {
      const session = this.userStore.get(`sessions.${sessionId}`);
      if (session) {
        sessions.push(session);
      }
    });
    
    return sessions;
  }
}

export default SilhouetteUserSystem;