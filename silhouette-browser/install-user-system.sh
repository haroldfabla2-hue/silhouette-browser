#!/bin/bash

# =============================================================================
# SILHOUETTE BROWSER - INSTALADOR SISTEMA DE USUARIOS V6.0
# Script automatizado para configurar e implementar el sistema de usuarios
# =============================================================================

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}============================================${NC}"
}

# Variables de configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_JSON="$PROJECT_DIR/package.json"
ENV_FILE="$PROJECT_DIR/.env"
GOOGLE_OAUTH_CONFIG="$PROJECT_DIR/config/google-oauth.json"
USER_SYSTEM_CONFIG="$PROJECT_DIR/config/user-system.json"

# Verificar si estamos en el directorio correcto
if [ ! -f "$PACKAGE_JSON" ]; then
    error "No se encontró package.json. Ejecute este script desde el directorio raíz de Silhouette Browser."
fi

# =============================================================================
# FUNCIONES DE INSTALACIÓN
# =============================================================================

check_dependencies() {
    header "Verificando Dependencias"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js no está instalado. Instale Node.js 18+ primero."
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local major_version=$(echo $node_version | cut -d'.' -f1)
    
    if [ "$major_version" -lt 18 ]; then
        error "Se requiere Node.js 18 o superior. Versión actual: $node_version"
    fi
    
    log "Node.js version: $(node --version) ✓"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        error "npm no está instalado."
    fi
    
    log "npm version: $(npm --version) ✓"
    
    # Verificar si las dependencias del sistema están instaladas
    if ! npm list electron-store &> /dev/null; then
        warn "Instalando dependencias de electron-store..."
        npm install electron-store --save
    fi
    
    if ! npm list jsonwebtoken &> /dev/null; then
        warn "Instalando dependencias de jsonwebtoken..."
        npm install jsonwebtoken --save
    fi
    
    if ! npm list bcrypt &> /dev/null; then
        warn "Instalando dependencias de bcrypt..."
        npm install bcrypt --save
    fi
    
    if ! npm list node-fetch &> /dev/null; then
        warn "Instalando dependencias de node-fetch..."
        npm install node-fetch --save
    fi
    
    log "Todas las dependencias están instaladas ✓"
}

setup_environment() {
    header "Configurando Variables de Entorno"
    
    if [ -f "$ENV_FILE" ]; then
        warn "El archivo .env ya existe. ¿Desea sobreescribirlo? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            info "Manteniendo configuración existente."
            return
        fi
    fi
    
    # Generar secretos aleatorios
    JWT_SECRET=$(openssl rand -base64 32)
    GOOGLE_JWT_SECRET=$(openssl rand -base64 32)
    
    cat > "$ENV_FILE" << EOF
# =============================================================================
# SILHOUETTE BROWSER - CONFIGURACIÓN SISTEMA DE USUARIOS V6.0
# Generado automáticamente el $(date)
# =============================================================================

# Google OAuth 2.0 Configuration
# Obtenga estas credenciales en: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT Secrets (NO COMPARTIR)
# Estos secretos son críticos para la seguridad
SILHOUETTE_USER_JWT_SECRET=$JWT_SECRET
SILHOUETTE_GOOGLE_JWT_SECRET=$GOOGLE_JWT_SECRET

# OAuth Redirect URI
GOOGLE_REDIRECT_URI=https://silhouette.browser/auth/google/callback

# Sistema de Usuarios Configuration
SILHOUETTE_USER_DEBUG=false
SILHOUETTE_USER_SESSION_TIMEOUT=86400000
SILHOUETTE_USER_MAX_SESSIONS=5

# Database Configuration (electron-store)
SILHOUETTE_USER_STORE_ENCRYPTION_KEY=$JWT_SECRET

# Audit and Security
SILHOUETTE_USER_AUDIT_ENABLED=true
SILHOUETTE_USER_AUDIT_RETENTION_DAYS=365

# Development
SILHOUETTE_USER_ENVIRONMENT=production
SILHOUETTE_USER_LOG_LEVEL=info
EOF

    log "Archivo .env creado ✓"
    warn "IMPORTANTE: Configure GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en $ENV_FILE"
    warn "Obtenga las credenciales en Google Cloud Console antes de continuar"
    
    # Esperar confirmación
    echo -e "\n${YELLOW}¿Ha configurado las credenciales de Google OAuth? (y/N)${NC}"
    read -r google_configured
    if [[ ! "$google_configured" =~ ^[Yy]$ ]]; then
        error "Configure las credenciales de Google OAuth antes de continuar"
    fi
}

setup_google_oauth() {
    header "Configuración Google OAuth 2.0"
    
    info "Siga estos pasos para configurar Google OAuth:"
    echo ""
    echo "1. Vaya a Google Cloud Console: https://console.cloud.google.com/"
    echo "2. Cree un nuevo proyecto o seleccione uno existente"
    echo "3. Habilite las siguientes APIs:"
    echo "   - Google+ API"
    echo "   - Google People API" 
    echo "   - Google OAuth 2.0 API"
    echo "4. Vaya a 'Credenciales' > 'Crear credenciales' > 'ID de cliente OAuth 2.0'"
    echo "5. Configure:"
    echo "   - Tipo: 'Aplicación web'"
    echo "   - Nombre: 'Silhouette Browser'"
    echo "   - URIs de redirección autorizados:"
    echo "     * http://localhost:3000/auth/google/callback (desarrollo)"
    echo "     * https://silhouette.browser/auth/google/callback (producción)"
    echo ""
    echo "6. Copie el Client ID y Client Secret al archivo .env"
    echo ""
    
    if [ -f "$ENV_FILE" ]; then
        echo -e "${BLUE}¿Desea abrir el archivo .env para editarlo ahora? (y/N)${NC}"
        read -r open_env
        if [[ "$open_env" =~ ^[Yy]$ ]]; then
            if command -v code &> /dev/null; then
                code "$ENV_FILE"
            elif command -v nano &> /dev/null; then
                nano "$ENV_FILE"
            else
                info "Edite manualmente: $ENV_FILE"
            fi
        fi
    fi
    
    log "Configuración de Google OAuth completada ✓"
}

create_config_files() {
    header "Creando Archivos de Configuración"
    
    # Crear directorio config si no existe
    mkdir -p "$PROJECT_DIR/config"
    
    # Configuración de Google OAuth
    cat > "$GOOGLE_OAUTH_CONFIG" << EOF
{
  "clientConfig": {
    "web": {
      "client_id": "your_google_client_id.apps.googleusercontent.com",
      "client_secret": "your_google_client_secret",
      "auth_uri": "https://accounts.google.com/o/oauth2/v2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "redirect_uris": [
        "http://localhost:3000/auth/google/callback",
        "https://silhouette.browser/auth/google/callback"
      ]
    }
  },
  "scopes": [
    "openid",
    "email", 
    "profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/contacts.readonly"
  ],
  "authFlowConfig": {
    "enableFedCM": true,
    "enablePasskeys": true,
    "enableDeviceBinding": true,
    "autoRefresh": true,
    "sessionTimeout": 86400000
  }
}
EOF

    # Configuración del Sistema de Usuarios
    cat > "$USER_SYSTEM_CONFIG" << EOF
{
  "userSystem": {
    "enabled": true,
    "sessionTimeout": 86400000,
    "maxActiveSessions": 5,
    "enablePersistence": true,
    "enableAudit": true,
    "enableOfflineMode": true,
    "enableGitHubIntegration": true,
    "enableGoogleOAuth": true,
    "defaultRole": "user",
    "autoCreateUser": true
  },
  "roles": {
    "enableCustomRoles": true,
    "maxCustomRoles": 50,
    "enableRoleHierarchy": true,
    "defaultRoles": [
      "guest",
      "user", 
      "power_user",
      "developer",
      "team_lead",
      "admin",
      "super_admin"
    ]
  },
  "permissions": {
    "enableCustomPermissions": true,
    "maxCustomPermissions": 200,
    "categories": [
      "browser",
      "agents",
      "ide", 
      "testing",
      "liveserver",
      "native",
      "github",
      "sharing",
      "extensions",
      "admin",
      "api",
      "analytics"
    ]
  },
  "security": {
    "passwordMinLength": 8,
    "passwordRequireSpecial": true,
    "maxLoginAttempts": 5,
    "lockoutDuration": 300000,
    "sessionValidation": true,
    "ipWhitelist": [],
    "deviceBinding": true
  },
  "ui": {
    "enableUserUI": true,
    "enableAdminPanel": true,
    "enableUserProfile": true,
    "theme": "system",
    "language": "es"
  }
}
EOF

    log "Archivos de configuración creados:"
    log "  - $GOOGLE_OAUTH_CONFIG"
    log "  - $USER_SYSTEM_CONFIG"
}

install_user_system() {
    header "Instalando Sistema de Usuarios"
    
    # Verificar que los archivos del sistema existen
    local user_system_files=(
        "main-process/user-management/user-system-core.js"
        "main-process/user-management/google-auth-system.js" 
        "main-process/user-management/user-integration-system.js"
        "renderer-process/user-management/user-ui-manager.js"
    )
    
    for file in "${user_system_files[@]}"; do
        if [ ! -f "$PROJECT_DIR/$file" ]; then
            error "Archivo no encontrado: $file"
        fi
    done
    
    # Actualizar package.json con scripts adicionales
    if command -v jq &> /dev/null; then
        # Backup del package.json
        cp "$PACKAGE_JSON" "$PACKAGE_JSON.backup"
        
        # Agregar scripts
        jq '.scripts += {
            "user:create-admin": "node scripts/create-admin-user.js",
            "user:export-data": "node scripts/export-user-data.js",
            "user:cleanup": "node scripts/cleanup-sessions.js",
            "user:audit": "node scripts/audit-users.js"
        }' "$PACKAGE_JSON" > "$PACKAGE_JSON.tmp"
        
        mv "$PACKAGE_JSON.tmp" "$PACKAGE_JSON"
        
        log "Scripts de usuario agregados a package.json ✓"
    else
        warn "jq no está disponible. Agregue manualmente los scripts al package.json"
        warn "Scripts requeridos:"
        warn "  - user:create-admin"
        warn "  - user:export-data" 
        warn "  - user:cleanup"
        warn "  - user:audit"
    fi
    
    # Crear directorio de scripts
    mkdir -p "$PROJECT_DIR/scripts"
    
    log "Sistema de usuarios instalado ✓"
}

setup_scripts() {
    header "Creando Scripts de Utilidad"
    
    # Script para crear usuario administrador
    cat > "$PROJECT_DIR/scripts/create-admin-user.js" << 'EOF'
#!/usr/bin/env node

const SilhouetteUserSystem = require('../main-process/user-management/user-system-core.js');

async function createAdminUser() {
    const userSystem = new SilhouetteUserSystem();
    
    console.log('Creating admin user...');
    
    const adminData = {
        email: 'admin@silhouette.browser',
        name: 'Administrator',
        username: 'admin',
        roleIds: ['admin'],
        preferences: {
            theme: 'dark',
            language: 'es'
        }
    };
    
    const result = await userSystem.createUser(adminData);
    
    if (result.success) {
        console.log('✅ Admin user created successfully');
        console.log('Email: admin@silhouette.browser');
        console.log('Password: Please set via user preferences');
    } else {
        console.error('❌ Failed to create admin user:', result.error);
        process.exit(1);
    }
}

createAdminUser();
EOF

    # Script para limpieza de sesiones
    cat > "$PROJECT_DIR/scripts/cleanup-sessions.js" << 'EOF'
#!/usr/bin/env node

const SilhouetteUserSystem = require('../main-process/user-management/user-system-core.js');

async function cleanupSessions() {
    const userSystem = new SilhouetteUserSystem();
    
    console.log('Cleaning up expired sessions...');
    
    await userSystem.cleanupExpiredSessions();
    
    console.log('✅ Session cleanup completed');
}

cleanupSessions();
EOF

    # Script de exportación de datos
    cat > "$PROJECT_DIR/scripts/export-user-data.js" << 'EOF'
#!/usr/bin/env node

const SilhouetteUserSystem = require('../main-process/user-management/user-system-core.js');
const fs = require('fs').promises;

async function exportUserData(userEmail) {
    const userSystem = new SilhouetteUserSystem();
    
    const user = userSystem.findUserByEmail(userEmail);
    if (!user) {
        console.error('❌ User not found:', userEmail);
        process.exit(1);
    }
    
    const data = await userSystem.exportUserData(user.id);
    
    const outputFile = `user-data-${userEmail.replace('@', '-')}-${Date.now()}.json`;
    await fs.writeFile(outputFile, JSON.stringify(data, null, 2));
    
    console.log('✅ User data exported to:', outputFile);
}

const userEmail = process.argv[2];
if (!userEmail) {
    console.error('Usage: node export-user-data.js <user-email>');
    process.exit(1);
}

exportUserData(userEmail);
EOF

    chmod +x "$PROJECT_DIR/scripts/create-admin-user.js"
    chmod +x "$PROJECT_DIR/scripts/cleanup-sessions.js" 
    chmod +x "$PROJECT_DIR/scripts/export-user-data.js"
    
    log "Scripts de utilidad creados:"
    log "  - scripts/create-admin-user.js"
    log "  - scripts/cleanup-sessions.js"
    log "  - scripts/export-user-data.js"
}

integrate_with_main() {
    header "Integrando con main.js"
    
    local main_file="$PROJECT_DIR/main-process/app-manager/main.js"
    
    if [ ! -f "$main_file" ]; then
        warn "main.js no encontrado. Cree la integración manualmente."
        return
    fi
    
    # Verificar si ya está integrado
    if grep -q "SilhouetteUserIntegration" "$main_file"; then
        warn "El sistema de usuarios ya está integrado en main.js"
        return
    fi
    
    # Backup del main.js
    cp "$main_file" "$main_file.backup"
    
    # Crear parche para main.js
    cat > /tmp/main_js_patch.txt << 'EOF'
# AGREGAR DESPUÉS DE LOS IMPORTS EXISTENTES:
# import SilhouetteUserIntegration from '../user-management/user-integration-system.js';

# EN EL CONSTRUCTOR, AGREGAR:
# this.userIntegration = null;

# EN EL MÉTODO initialize(), AGREGAR DESPUÉS DE LA INICIALIZACIÓN DE OTROS SISTEMAS:
# // Inicializar sistema de usuarios
# await this.initializeUserSystem();

# AGREGAR NUEVO MÉTODO:
# async initializeUserSystem() {
#   try {
#     console.log('👥 Initializing User System...');
#     
#     this.userIntegration = new SilhouetteUserIntegration(this.mainWindow, {
#       enableUserSystem: true,
#       enableGoogleOAuth: true,
#       enableOfflineMode: true,
#       autoLogin: false,
#       sessionPersistence: true
#     });
#     
#     await this.userIntegration.initialize();
#     
#     // Integrar con otros sistemas
#     if (this.githubClient) {
#       this.userIntegration.integrateWithGitHub(this.githubClient);
#     }
#     if (this.agentOrchestrator) {
#       this.userIntegration.integrateWithAgents(this.agentOrchestrator);
#     }
#     if (this.previewSharing) {
#       this.userIntegration.integrateWithPreviewSharing(this.previewSharing);
#     }
#     
#     console.log('✅ User System ready');
#     
#   } catch (error) {
#     console.error('❌ User System initialization failed:', error);
#     // No bloquear la aplicación por fallo del sistema de usuarios
#   }
# }
EOF

    info "Parche para main.js creado en /tmp/main_js_patch.txt"
    warn "Aplique manualmente los cambios indicados en main.js"
    warn "Se ha creado un backup en: $main_file.backup"
}

setup_testing() {
    header "Configurando Tests"
    
    # Crear directorio de tests
    mkdir -p "$PROJECT_DIR/tests/user-management"
    
    # Test básico del sistema de usuarios
    cat > "$PROJECT_DIR/tests/user-management/test-user-system.js" << 'EOF'
const SilhouetteUserSystem = require('../../../main-process/user-management/user-system-core.js');

describe('Silhouette User System', () => {
  let userSystem;
  
  beforeEach(() => {
    userSystem = new SilhouetteUserSystem();
  });
  
  test('should create user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    };
    
    const result = await userSystem.createUser(userData);
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
  });
  
  test('should authenticate user with email/password', async () => {
    // Crear usuario con password
    const userData = {
      email: 'test2@example.com',
      name: 'Test User 2',
      password: 'testpassword123'
    };
    
    await userSystem.createUser(userData);
    
    // Autenticar
    const result = await userSystem.authenticateUser({
      email: 'test2@example.com',
      password: 'testpassword123'
    });
    
    expect(result.success).toBe(true);
  });
  
  test('should validate permissions', async () => {
    const user = {
      id: 'test-user-1',
      roleIds: ['user']
    };
    
    const permissions = await userSystem.getUserPermissions('test-user-1');
    expect(Array.isArray(permissions)).toBe(true);
  });
});
EOF

    # Test de Google Auth
    cat > "$PROJECT_DIR/tests/user-management/test-google-auth.js" << 'EOF'
const GoogleAuthSystem = require('../../../main-process/user-management/google-auth-system.js');

describe('Google Auth System', () => {
  let googleAuth;
  
  beforeEach(() => {
    googleAuth = new GoogleAuthSystem({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret'
    });
  });
  
  test('should initialize successfully', async () => {
    await expect(googleAuth.initialize()).resolves.not.toThrow();
  });
  
  test('should generate PKCE codes', () => {
    const { codeVerifier, codeChallenge } = googleAuth.generatePKCE();
    
    expect(codeVerifier).toBeTruthy();
    expect(codeChallenge).toBeTruthy();
    expect(codeChallenge).toHaveLength(43); // Base64url encoded SHA256
  });
});
EOF

    log "Tests del sistema de usuarios creados:"
    log "  - tests/user-management/test-user-system.js"
    log "  - tests/user-management/test-google-auth.js"
}

create_documentation() {
    header "Creando Documentación Adicional"
    
    # README del sistema de usuarios
    cat > "$PROJECT_DIR/USER_SYSTEM_README.md" << 'EOF'
# Sistema de Usuarios Silhouette Browser V6.0

## Inicio Rápido

1. **Configurar Google OAuth**:
   ```bash
   # Editar .env
   nano .env
   ```

2. **Crear usuario administrador**:
   ```bash
   npm run user:create-admin
   ```

3. **Ejecutar tests**:
   ```bash
   npm test
   ```

## Scripts Disponibles

- `npm run user:create-admin` - Crear usuario administrador
- `npm run user:export-data <email>` - Exportar datos de usuario
- `npm run user:cleanup` - Limpiar sesiones expiradas
- `npm run user:audit` - Auditoría de usuarios

## Troubleshooting

### Google OAuth no funciona
- Verificar CLIENT_ID y CLIENT_SECRET en .env
- Verificar URIs de redirección en Google Cloud Console
- Verificar que las APIs están habilitadas

### Error de permisos
- Verificar roles del usuario
- Limpiar cache: `userSystem.permissionCache.clear()`
- Revisar logs de auditoría

## Comandos Útiles

```bash
# Ver usuarios
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users

# Revocar sesión
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:3000/api/sessions

# Exportar todos los datos
node scripts/export-user-data.js admin@silhouette.browser
```
EOF

    log "Documentación creada: USER_SYSTEM_README.md"
}

verify_installation() {
    header "Verificando Instalación"
    
    local errors=0
    
    # Verificar archivos principales
    local required_files=(
        "main-process/user-management/user-system-core.js"
        "main-process/user-management/google-auth-system.js"
        "main-process/user-management/user-integration-system.js"
        "renderer-process/user-management/user-ui-manager.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$PROJECT_DIR/$file" ]; then
            log "✓ $file"
        else
            error "✗ $file (FALTANTE)"
            ((errors++))
        fi
    done
    
    # Verificar archivos de configuración
    if [ -f "$ENV_FILE" ]; then
        log "✓ .env file"
    else
        error "✗ .env file (FALTANTE)"
        ((errors++))
    fi
    
    # Verificar scripts
    local scripts=(
        "scripts/create-admin-user.js"
        "scripts/cleanup-sessions.js"
        "scripts/export-user-data.js"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$PROJECT_DIR/$script" ]; then
            log "✓ $script"
        else
            error "✗ $script (FALTANTE)"
            ((errors++))
        fi
    done
    
    # Verificar dependencias
    if npm list electron-store jsonwebtoken bcrypt node-fetch &> /dev/null; then
        log "✓ Dependencies installed"
    else
        error "✗ Missing dependencies"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log "✅ Instalación verificada exitosamente"
    else
        error "❌ Se encontraron $errors errores en la instalación"
    fi
}

print_next_steps() {
    header "Siguientes Pasos"
    
    echo -e "${CYAN}1. Configure Google OAuth:${NC}"
    echo "   - Obtenga credenciales en Google Cloud Console"
    echo "   - Edite .env con CLIENT_ID y CLIENT_SECRET"
    echo ""
    echo -e "${CYAN}2. Integre con main.js:${NC}"
    echo "   - Aplique los cambios indicados en /tmp/main_js_patch.txt"
    echo "   - Verifique la integración manualmente"
    echo ""
    echo -e "${CYAN}3. Crear usuario administrador:${NC}"
    echo "   npm run user:create-admin"
    echo ""
    echo -e "${CYAN}4. Probar el sistema:${NC}"
    echo "   npm start"
    echo "   # Ir a Settings > User Management"
    echo ""
    echo -e "${CYAN}5. Configurar producción:${NC}"
    echo "   - Cambiar GOOGLE_REDIRECT_URI en .env"
    echo "   - Configurar SSL/TLS"
    echo "   - Configurar backups automáticos"
    echo ""
    echo -e "${GREEN}🎉 ¡Sistema de Usuarios V6.0 instalado exitosamente!${NC}"
    echo ""
    echo -e "${YELLOW}Para soporte: users-support@silhouette.browser${NC}"
}

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

main() {
    header "SILHOUETTE BROWSER - INSTALADOR SISTEMA DE USUARIOS V6.0"
    
    echo -e "${PURPLE}Este script instalará y configurará el sistema de usuarios completo${NC}"
    echo -e "${PURPLE}incluyendo Google OAuth, RBAC, y UI de gestión.${NC}"
    echo ""
    
    # Confirmar instalación
    echo -e "${YELLOW}¿Desea continuar con la instalación? (y/N)${NC}"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Instalación cancelada."
        exit 0
    fi
    
    echo ""
    
    # Ejecutar pasos de instalación
    check_dependencies
    setup_environment
    setup_google_oauth
    create_config_files
    install_user_system
    setup_scripts
    integrate_with_main
    setup_testing
    create_documentation
    verify_installation
    print_next_steps
    
    echo ""
    header "INSTALACIÓN COMPLETADA"
}

# Ejecutar función principal
main "$@"