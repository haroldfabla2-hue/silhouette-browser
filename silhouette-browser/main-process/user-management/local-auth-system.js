// =============================================================================
// SILHOUETTE BROWSER - SISTEMA DE AUTENTICACIÓN LOCAL V6.0
// Sistema de autenticación local sin dependencias externas
// Funciona sin internet y sin configuración OAuth
// =============================================================================

import EventEmitter from 'events';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

class LocalAuthSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      jwtSecret: options.jwtSecret || process.env.LOCAL_JWT_SECRET || 'silhouette-local-auth-secret',
      tokenExpiry: options.tokenExpiry || '24h',
      sessionTimeout: options.sessionTimeout || 24 * 60 * 60 * 1000, // 24 horas
      enableRegistration: options.enableRegistration !== false,
      enablePasswordReset: options.enablePasswordReset !== false,
      adminEmail: options.adminEmail || 'admin@silhouette.local',
      adminPassword: options.adminPassword || 'admin123'
    };
    
    this.users = new Map();
    this.sessions = new Map();
    this.authenticatedUsers = new Set();
    
    // Usuarios predeterminados
    this.defaultUsers = [
      {
        id: 'admin-001',
        email: this.config.adminEmail,
        password: this.config.adminPassword,
        name: 'Administrador Local',
        role: 'admin',
        isAdmin: true,
        avatar: null,
        preferences: {
          theme: 'system',
          language: 'es',
          notifications: true,
          autoSave: true
        },
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      },
      {
        id: 'guest-001',
        email: 'guest@silhouette.local',
        password: 'guest123',
        name: 'Usuario Invitado',
        role: 'user',
        isAdmin: false,
        avatar: null,
        preferences: {
          theme: 'system',
          language: 'es',
          notifications: false,
          autoSave: false
        },
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      }
    ];
    
    // Inicializar usuarios predeterminados
    this.initializeDefaultUsers();
    
    console.log('🏠 Local Auth System V6.0 initialized (Sin Google OAuth)');
  }

  // =============================================================================
  // INICIALIZACIÓN
  // =============================================================================
  
  async initialize() {
    try {
      console.log('🏠 Initializing Local Authentication System...');
      
      // Verificar si ya existen usuarios guardados
      await this.loadUsers();
      
      // Inicializar usuarios predeterminados si no existen
      await this.initializeDefaultUsers();
      
      console.log('✅ Local Authentication System initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Local Auth System:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async loadUsers() {
    try {
      // En un sistema real, esto cargaría desde base de datos
      // Por ahora, mantenemos en memoria
      console.log('📂 Loading users from local storage...');
    } catch (error) {
      console.error('❌ Failed to load users:', error);
    }
  }

  async saveUsers() {
    try {
      // En un sistema real, esto guardaría en base de datos
      // Por ahora, solo logeamos
      console.log('💾 Saving users to local storage...');
    } catch (error) {
      console.error('❌ Failed to save users:', error);
    }
  }

  initializeDefaultUsers() {
    for (const user of this.defaultUsers) {
      if (!this.users.has(user.email)) {
        this.users.set(user.email, user);
        console.log(`👤 Default user created: ${user.email} (${user.name})`);
      }
    }
  }

  // =============================================================================
  // AUTENTICACIÓN
  // =============================================================================
  
  /**
   * Iniciar sesión con email y contraseña
   */
  async signIn(email, password) {
    try {
      console.log(`🔑 Attempting local sign in for: ${email}`);
      
      // Buscar usuario
      const user = this.users.get(email.toLowerCase());
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      if (!user.isActive) {
        throw new Error('Cuenta desactivada');
      }
      
      // Verificar contraseña (en producción usar bcrypt)
      if (user.password !== password) {
        throw new Error('Contraseña incorrecta');
      }
      
      // Generar token
      const token = this.generateToken(user);
      
      // Actualizar último acceso
      user.lastLogin = new Date().toISOString();
      
      // Guardar sesión
      this.sessions.set(token, {
        userId: user.id,
        email: user.email,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.sessionTimeout
      });
      
      this.authenticatedUsers.add(user.id);
      
      // Quitar contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = user;
      
      console.log(`✅ Local sign in successful for: ${email}`);
      this.emit('signIn', { user: userWithoutPassword, token });
      
      return {
        success: true,
        user: userWithoutPassword,
        token,
        authMethod: 'local'
      };
      
    } catch (error) {
      console.error('❌ Local sign in failed:', error);
      this.emit('signInError', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut(token) {
    try {
      const session = this.sessions.get(token);
      
      if (session) {
        this.sessions.delete(token);
        this.authenticatedUsers.delete(session.userId);
        console.log(`🚪 User signed out: ${session.email}`);
      }
      
      this.emit('signOut', { token });
      return { success: true };
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Verificar si un token es válido
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);
      const session = this.sessions.get(token);
      
      if (!session) {
        throw new Error('Sesión no encontrada');
      }
      
      if (session.expiresAt < Date.now()) {
        this.sessions.delete(token);
        throw new Error('Sesión expirada');
      }
      
      const user = [...this.users.values()].find(u => u.id === session.userId);
      
      if (!user || !user.isActive) {
        throw new Error('Usuario no válido');
      }
      
      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.isAdmin,
          avatar: user.avatar,
          preferences: user.preferences
        }
      };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Registrarse (si está habilitado)
   */
  async signUp(userData) {
    if (!this.config.enableRegistration) {
      throw new Error('Registro deshabilitado');
    }
    
    try {
      const { email, password, name } = userData;
      
      // Verificar si el usuario ya existe
      if (this.users.has(email.toLowerCase())) {
        throw new Error('El usuario ya existe');
      }
      
      // Crear nuevo usuario
      const newUser = {
        id: this.generateUserId(),
        email: email.toLowerCase(),
        password: password, // En producción usar bcrypt
        name: name || email.split('@')[0],
        role: 'user',
        isAdmin: false,
        avatar: null,
        preferences: {
          theme: 'system',
          language: 'es',
          notifications: true,
          autoSave: true
        },
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      };
      
      this.users.set(newUser.email, newUser);
      await this.saveUsers();
      
      // Quitar contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = newUser;
      
      console.log(`✅ New user registered: ${email}`);
      this.emit('signUp', { user: userWithoutPassword });
      
      return {
        success: true,
        user: userWithoutPassword,
        authMethod: 'local'
      };
      
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      this.emit('signUpError', error);
      throw error;
    }
  }

  // =============================================================================
  // GESTIÓN DE USUARIOS
  // =============================================================================
  
  /**
   * Obtener información del usuario actual
   */
  async getCurrentUser(token) {
    const verification = await this.verifyToken(token);
    return verification.valid ? verification.user : null;
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(token, updates) {
    try {
      const verification = await this.verifyToken(token);
      if (!verification.valid) {
        throw new Error('Token inválido');
      }
      
      const user = [...this.users.values()].find(u => u.id === verification.user.id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Actualizar campos permitidos
      const allowedFields = ['name', 'preferences', 'avatar'];
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          user[key] = value;
        }
      }
      
      user.updatedAt = new Date().toISOString();
      await this.saveUsers();
      
      const { password: _, ...userWithoutPassword } = user;
      
      console.log(`📝 Profile updated for: ${user.email}`);
      this.emit('profileUpdated', { user: userWithoutPassword });
      
      return {
        success: true,
        user: userWithoutPassword
      };
      
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(token, currentPassword, newPassword) {
    try {
      const verification = await this.verifyToken(token);
      if (!verification.valid) {
        throw new Error('Token inválido');
      }
      
      const user = [...this.users.values()].find(u => u.id === verification.user.id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verificar contraseña actual
      if (user.password !== currentPassword) {
        throw new Error('Contraseña actual incorrecta');
      }
      
      // Actualizar contraseña
      user.password = newPassword; // En producción usar bcrypt
      user.updatedAt = new Date().toISOString();
      await this.saveUsers();
      
      console.log(`🔒 Password changed for: ${user.email}`);
      this.emit('passwordChanged', { userId: user.id });
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // UTILIDADES
  // =============================================================================
  
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin
      },
      this.config.jwtSecret,
      { expiresIn: this.config.tokenExpiry }
    );
  }

  generateUserId() {
    return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Limpiar sesiones expiradas
   */
  async cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];
    
    for (const [token, session] of this.sessions) {
      if (session.expiresAt < now) {
        expiredSessions.push(token);
        this.authenticatedUsers.delete(session.userId);
      }
    }
    
    for (const token of expiredSessions) {
      this.sessions.delete(token);
    }
    
    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Obtener estadísticas del sistema
   */
  getSystemStats() {
    return {
      totalUsers: this.users.size,
      authenticatedUsers: this.authenticatedUsers.size,
      activeSessions: this.sessions.size,
      authMethod: 'local',
      hasGoogleOAuth: false,
      systemMode: 'development'
    };
  }

  // =============================================================================
  // CONFIGURACIÓN
  // =============================================================================
  
  /**
   * Verificar si el sistema OAuth está disponible
   */
  isOAuthConfigured() {
    return false; // Este es el sistema local
  }

  /**
   * Obtener métodos de autenticación disponibles
   */
  getAvailableAuthMethods() {
    return [
      {
        type: 'local',
        name: 'Autenticación Local',
        description: 'Usar email y contraseña local',
        enabled: true,
        configured: true
      },
      {
        type: 'google',
        name: 'Google Sign-In',
        description: 'Iniciar sesión con cuenta de Google',
        enabled: false,
        configured: false,
        reason: 'No configurado'
      }
    ];
  }

  // =============================================================================
  // LIMPIEZA
  // =============================================================================
  
  async shutdown() {
    try {
      // Limpiar todas las sesiones
      this.sessions.clear();
      this.authenticatedUsers.clear();
      
      // Guardar usuarios si es necesario
      await this.saveUsers();
      
      console.log('🏠 Local Authentication System shutdown complete');
      this.emit('shutdown');
      
    } catch (error) {
      console.error('❌ Error during Local Auth System shutdown:', error);
    }
  }
}

export default LocalAuthSystem;