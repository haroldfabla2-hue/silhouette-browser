// =============================================================================
// TAB GROUPS UI MANAGER - GESTOR DE INTERFAZ DE GRUPOS DE PESTAÑAS
// Interfaz completa para gestionar grupos de pestañas de forma intuitiva
// =============================================================================

class TabGroupsUIManager {
  constructor() {
    this.groups = new Map();
    this.activeGroupId = null;
    this.tabs = new Map();
    this.isInitialized = false;
    this.config = {
      autoSave: true,
      aiGroupingEnabled: true,
      showNotifications: true
    };
  }

  // =============================================================================
  // INICIALIZACIÓN
  // =============================================================================

  async initialize() {
    console.log('🗂️ Inicializando Gestor de UI de Grupos de Pestañas...');
    
    try {
      // Cargar grupos existentes
      await this.loadGroups();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Crear elementos de UI
      this.createUI();
      
      // Inicializar drag and drop
      this.initializeDragAndDrop();
      
      this.isInitialized = true;
      console.log('✅ Gestor de UI de Grupos de Pestañas inicializado');
      
    } catch (error) {
      console.error('❌ Error inicializando Tab Groups UI:', error);
    }
  }

  // =============================================================================
  // CARGA DE DATOS
  // =============================================================================

  async loadGroups() {
    try {
      const groups = await window.silhouetteAPI.tabGroups.getAll();
      this.groups.clear();
      
      for (const group of groups) {
        this.groups.set(group.id, group);
      }
      
      this.updateGroupsDisplay();
      console.log(`📦 ${this.groups.size} grupos cargados`);
      
    } catch (error) {
      console.error('❌ Error cargando grupos:', error);
    }
  }

  async loadTabs() {
    try {
      const tabs = await window.silhouetteAPI.browser.getActiveTabs();
      this.tabs.clear();
      
      for (const tab of tabs) {
        this.tabs.set(tab.id, tab);
      }
      
      this.updateTabsDisplay();
      console.log(`📄 ${this.tabs.size} pestañas cargadas`);
      
    } catch (error) {
      console.error('❌ Error cargando pestañas:', error);
    }
  }

  // =============================================================================
  // CREACIÓN DE UI
  // =============================================================================

  createUI() {
    // Crear contenedor principal de grupos de pestañas
    this.createGroupsContainer();
    
    // Crear barra de herramientas
    this.createToolbar();
    
    // Crear modal para crear grupos
    this.createCreateGroupModal();
    
    // Crear panel de información de grupos
    this.createGroupInfoPanel();
  }

  createGroupsContainer() {
    // Agregar sección de grupos a la barra lateral
    const sidebar = document.querySelector('.sidebar-content');
    if (!sidebar) return;
    
    const groupsSection = document.createElement('div');
    groupsSection.className = 'tab-groups-section';
    groupsSection.innerHTML = `
      <div class="tab-groups-header">
        <h3 class="section-title">
          <span class="icon">🗂️</span>
          Grupos de Pestañas
          <button class="btn-small btn-primary" id="createGroupBtn" title="Crear nuevo grupo">
            <span class="icon">➕</span>
          </button>
        </h3>
        <div class="groups-controls">
          <button class="btn-small" id="aiGroupingBtn" title="Agrupación automática por IA">
            🤖
          </button>
          <button class="btn-small" id="autoGroupingBtn" title="Ejecutar agrupación automática">
            🔄
          </button>
        </div>
      </div>
      <div class="tab-groups-list" id="tabGroupsList">
        <!-- Los grupos se cargarán aquí dinámicamente -->
      </div>
      <div class="tab-groups-stats">
        <span id="groupsStats">0 grupos, 0 pestañas</span>
      </div>
    `;
    
    sidebar.appendChild(groupsSection);
    
    // Agregar estilos
    this.addGroupsStyles();
  }

  createToolbar() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const toolbar = document.createElement('div');
    toolbar.className = 'tab-groups-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="toolbar-btn" id="quickGroupBtn" title="Crear grupo rápido (Ctrl+G)">
          📦 Grupo
        </button>
        <button class="toolbar-btn" id="aiGroupBtn" title="Agrupar con IA">
          🤖 IA
        </button>
        <button class="toolbar-btn" id="agentGroupBtn" title="Crear grupo de agente">
          🤖 Agente
        </button>
      </div>
      <div class="toolbar-group">
        <span class="active-group" id="activeGroupDisplay">Sin grupo activo</span>
      </div>
    `;
    
    header.appendChild(toolbar);
  }

  createCreateGroupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'createGroupModal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Crear Nuevo Grupo de Pestañas</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="groupName">Nombre del grupo:</label>
            <input type="text" id="groupName" placeholder="Ej: Desarrollo, Noticias, Compras..." />
          </div>
          <div class="form-group">
            <label for="groupType">Tipo de grupo:</label>
            <select id="groupType">
              <option value="manual">Manual</option>
              <option value="ai">Creado por IA</option>
              <option value="agent">Grupo de Agente</option>
            </select>
          </div>
          <div class="form-group">
            <label for="groupDescription">Descripción (opcional):</label>
            <textarea id="groupDescription" placeholder="Descripción del grupo..."></textarea>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="autoAddTabs" />
              Agregar pestañas seleccionadas automáticamente
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="cancelCreateGroup">Cancelar</button>
          <button class="btn-primary" id="confirmCreateGroup">Crear Grupo</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  createGroupInfoPanel() {
    const sidebar = document.querySelector('.sidebar-content');
    if (!sidebar) return;
    
    const infoPanel = document.createElement('div');
    infoPanel.className = 'group-info-panel';
    infoPanel.id = 'groupInfoPanel';
    infoPanel.innerHTML = `
      <div class="info-header">
        <h4>Información del Grupo</h4>
        <button class="btn-small" id="closeInfoPanel">×</button>
      </div>
      <div class="info-content" id="groupInfoContent">
        <p>Selecciona un grupo para ver información</p>
      </div>
      <div class="info-actions">
        <button class="btn-small" id="activateGroupBtn">Activar</button>
        <button class="btn-small" id="deleteGroupBtn">Eliminar</button>
      </div>
    `;
    
    sidebar.appendChild(infoPanel);
  }

  // =============================================================================
  // ACTUALIZACIÓN DE DISPLAY
  // =============================================================================

  updateGroupsDisplay() {
    const container = document.getElementById('tabGroupsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [groupId, group] of this.groups) {
      const groupElement = this.createGroupElement(group);
      container.appendChild(groupElement);
    }
    
    this.updateStats();
  }

  createGroupElement(group) {
    const groupEl = document.createElement('div');
    groupEl.className = `tab-group ${group.id === this.activeGroupId ? 'active' : ''}`;
    groupEl.dataset.groupId = group.id;
    
    const isAgent = group.type === 'agent';
    const isAI = group.type === 'ai';
    
    groupEl.innerHTML = `
      <div class="group-header">
        <div class="group-icon">
          ${isAgent ? '🤖' : isAI ? '🤖' : '🗂️'}
        </div>
        <div class="group-info">
          <div class="group-name">${group.name}</div>
          <div class="group-meta">
            <span class="group-type">${group.type}</span>
            <span class="tab-count">${group.tabs.length} pestañas</span>
          </div>
        </div>
        <div class="group-actions">
          <button class="btn-icon" data-action="activate" title="Activar grupo">
            ▶️
          </button>
          <button class="btn-icon" data-action="edit" title="Editar grupo">
            ✏️
          </button>
          <button class="btn-icon" data-action="delete" title="Eliminar grupo">
            🗑️
          </button>
        </div>
      </div>
      <div class="group-tabs" id="groupTabs_${group.id}">
        ${this.createGroupTabsList(group)}
      </div>
    `;
    
    // Agregar event listeners
    this.attachGroupEventListeners(groupEl, group);
    
    return groupEl;
  }

  createGroupTabsList(group) {
    return group.tabs.map(tabId => {
      const tab = this.tabs.get(tabId);
      if (!tab) return '';
      
      return `
        <div class="group-tab" data-tab-id="${tabId}">
          <div class="tab-icon">${tab.favicon ? `<img src="${tab.favicon}" alt="favicon">` : '🌐'}</div>
          <div class="tab-info">
            <div class="tab-title">${tab.title || 'Nueva Pestaña'}</div>
            <div class="tab-url">${tab.url || ''}</div>
          </div>
          <button class="btn-icon btn-remove-tab" data-tab-id="${tabId}" title="Remover de grupo">
            ×
          </button>
        </div>
      `;
    }).join('');
  }

  updateStats() {
    const stats = document.getElementById('groupsStats');
    if (stats) {
      const totalGroups = this.groups.size;
      const totalTabsInGroups = Array.from(this.groups.values())
        .reduce((total, group) => total + group.tabs.length, 0);
      
      stats.textContent = `${totalGroups} grupos, ${totalTabsInGroups} pestañas`;
    }
  }

  updateActiveGroupDisplay() {
    const display = document.getElementById('activeGroupDisplay');
    if (!display) return;
    
    if (this.activeGroupId && this.groups.has(this.activeGroupId)) {
      const group = this.groups.get(this.activeGroupId);
      display.textContent = `Grupo activo: ${group.name}`;
    } else {
      display.textContent = 'Sin grupo activo';
    }
  }

  // =============================================================================
  // EVENTOS
  // =============================================================================

  setupEventListeners() {
    // Eventos de creación de grupos
    document.getElementById('createGroupBtn')?.addEventListener('click', () => {
      this.showCreateGroupModal();
    });
    
    document.getElementById('quickGroupBtn')?.addEventListener('click', () => {
      this.quickCreateGroup();
    });
    
    document.getElementById('aiGroupBtn')?.addEventListener('click', () => {
      this.createAiGroup();
    });
    
    document.getElementById('agentGroupBtn')?.addEventListener('click', () => {
      this.createAgentGroup();
    });
    
    // Eventos de agrupación automática
    document.getElementById('aiGroupingBtn')?.addEventListener('click', () => {
      this.toggleAiGrouping();
    });
    
    document.getElementById('autoGroupingBtn')?.addEventListener('click', () => {
      this.performAutoGrouping();
    });
    
    // Modal events
    document.getElementById('cancelCreateGroup')?.addEventListener('click', () => {
      this.hideCreateGroupModal();
    });
    
    document.getElementById('confirmCreateGroup')?.addEventListener('click', () => {
      this.confirmCreateGroup();
    });
    
    // Cerrar modal
    document.querySelector('.modal-close')?.addEventListener('click', () => {
      this.hideCreateGroupModal();
    });
    
    // Cerrar panel de información
    document.getElementById('closeInfoPanel')?.addEventListener('click', () => {
      this.hideGroupInfoPanel();
    });
    
    // Event listeners de grupos de pestañas
    this.setupTabGroupsEventListeners();
    
    // Teclado shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        this.quickCreateGroup();
      }
      if (e.ctrlKey && e.key === 'a' && e.shiftKey) {
        e.preventDefault();
        this.performAutoGrouping();
      }
    });
  }

  setupTabGroupsEventListeners() {
    // Eventos de grupos
    window.silhouetteAPI.onGroupCreated((data) => {
      this.onGroupCreated(data);
    });
    
    window.silhouetteAPI.onGroupDeleted((data) => {
      this.onGroupDeleted(data);
    });
    
    window.silhouetteAPI.onGroupActivated((data) => {
      this.onGroupActivated(data);
    });
    
    window.silhouetteAPI.onGroupDeactivated((data) => {
      this.onGroupDeactivated(data);
    });
    
    window.silhouetteAPI.onTabAddedToGroup((data) => {
      this.onTabAddedToGroup(data);
    });
    
    window.silhouetteAPI.onTabRemovedFromGroup((data) => {
      this.onTabRemovedFromGroup(data);
    });
    
    window.silhouetteAPI.onTabMovedBetweenGroups((data) => {
      this.onTabMovedBetweenGroups(data);
    });
  }

  attachGroupEventListeners(groupEl, group) {
    // Acciones de grupo
    groupEl.querySelector('[data-action="activate"]')?.addEventListener('click', () => {
      this.activateGroup(group.id);
    });
    
    groupEl.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      this.editGroup(group.id);
    });
    
    groupEl.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      this.deleteGroup(group.id);
    });
    
    // Remover pestañas del grupo
    groupEl.querySelectorAll('.btn-remove-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabId = btn.dataset.tabId;
        this.removeTabFromGroup(tabId);
      });
    });
    
    // Clic en grupo para seleccionar
    groupEl.addEventListener('click', (e) => {
      if (!e.target.closest('.group-actions') && !e.target.closest('.btn-remove-tab')) {
        this.selectGroup(group.id);
      }
    });
  }

  // =============================================================================
  // MANEJO DE GRUPOS
  // =============================================================================

  async quickCreateGroup() {
    const selectedTabs = this.getSelectedTabs();
    const groupName = `Grupo ${Date.now() % 1000}`;
    
    try {
      const result = await window.silhouetteAPI.tabGroups.create(groupName, {
        type: 'manual',
        createdBy: 'user'
      });
      
      if (result.success) {
        const groupId = result.groupId;
        
        // Agregar pestañas seleccionadas
        if (selectedTabs.length > 0) {
          for (const tabId of selectedTabs) {
            await window.silhouetteAPI.tabGroups.addTab(groupId, tabId);
          }
        }
        
        this.showNotification(`Grupo "${groupName}" creado con ${selectedTabs.length} pestañas`);
      }
    } catch (error) {
      console.error('❌ Error creando grupo rápido:', error);
      this.showNotification('Error creando grupo', 'error');
    }
  }

  async createAiGroup() {
    try {
      this.showNotification('🤖 Ejecutando agrupación automática por IA...');
      
      const result = await window.silhouetteAPI.tabGroups.performAutoGrouping();
      
      if (result.success) {
        this.showNotification('✅ Agrupación automática completada');
        await this.loadGroups();
      }
    } catch (error) {
      console.error('❌ Error creando grupo IA:', error);
      this.showNotification('Error en agrupación automática', 'error');
    }
  }

  async createAgentGroup() {
    const taskData = {
      name: `Grupo de Tarea ${Date.now() % 1000}`,
      description: 'Grupo creado para ejecución de tarea por agente',
      agentType: 'omnipotent',
      maxParallelTasks: 3,
      automation: {
        enabled: true,
        workflows: []
      },
      coordination: {
        agentMode: true,
        maxParallelTasks: 3,
        waitForCompletion: true,
        failureStrategy: 'retry'
      }
    };
    
    try {
      const result = await window.silhouetteAPI.tabGroups.createAgent(taskData);
      
      if (result.success) {
        this.showNotification(`Grupo de agente "${taskData.name}" creado`);
        await this.loadGroups();
      }
    } catch (error) {
      console.error('❌ Error creando grupo de agente:', error);
      this.showNotification('Error creando grupo de agente', 'error');
    }
  }

  async activateGroup(groupId) {
    try {
      const result = await window.silhouetteAPI.tabGroups.activate(groupId);
      
      if (result.success) {
        this.activeGroupId = groupId;
        this.updateGroupsDisplay();
        this.updateActiveGroupDisplay();
        this.showNotification(`Grupo activado: ${this.groups.get(groupId).name}`);
      }
    } catch (error) {
      console.error('❌ Error activando grupo:', error);
      this.showNotification('Error activando grupo', 'error');
    }
  }

  async deleteGroup(groupId) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el grupo "${group.name}"?`)) {
      return;
    }
    
    try {
      const result = await window.silhouetteAPI.tabGroups.delete(groupId);
      
      if (result.success) {
        if (this.activeGroupId === groupId) {
          this.activeGroupId = null;
        }
        
        this.groups.delete(groupId);
        this.updateGroupsDisplay();
        this.updateActiveGroupDisplay();
        this.showNotification(`Grupo "${group.name}" eliminado`);
      }
    } catch (error) {
      console.error('❌ Error eliminando grupo:', error);
      this.showNotification('Error eliminando grupo', 'error');
    }
  }

  async removeTabFromGroup(tabId) {
    try {
      const result = await window.silhouetteAPI.tabGroups.removeTab(tabId);
      
      if (result.success) {
        this.showNotification('Pestaña removida del grupo');
        await this.loadGroups();
      }
    } catch (error) {
      console.error('❌ Error removiendo pestaña del grupo:', error);
      this.showNotification('Error removiendo pestaña', 'error');
    }
  }

  // =============================================================================
  // MODALES Y UI
  // =============================================================================

  showCreateGroupModal() {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
      modal.style.display = 'flex';
      document.getElementById('groupName')?.focus();
    }
  }

  hideCreateGroupModal() {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    // Limpiar formulario
    const groupNameField = document.getElementById('groupName');
    if (groupNameField) groupNameField.value = '';
    
    const groupDescriptionField = document.getElementById('groupDescription');
    if (groupDescriptionField) groupDescriptionField.value = '';
    document.getElementById('groupType').value = 'manual';
    document.getElementById('autoAddTabs').checked = false;
  }

  async confirmCreateGroup() {
    const name = document.getElementById('groupName').value.trim();
    const type = document.getElementById('groupType').value;
    const description = document.getElementById('groupDescription').value.trim();
    const autoAdd = document.getElementById('autoAddTabs').checked;
    
    if (!name) {
      this.showNotification('El nombre del grupo es requerido', 'error');
      return;
    }
    
    const options = {
      type,
      description,
      createdBy: 'user'
    };
    
    try {
      const result = await window.silhouetteAPI.tabGroups.create(name, options);
      
      if (result.success) {
        const groupId = result.groupId;
        
        if (autoAdd) {
          const selectedTabs = this.getSelectedTabs();
          for (const tabId of selectedTabs) {
            await window.silhouetteAPI.tabGroups.addTab(groupId, tabId);
          }
        }
        
        this.hideCreateGroupModal();
        this.showNotification(`Grupo "${name}" creado exitosamente`);
        await this.loadGroups();
      }
    } catch (error) {
      console.error('❌ Error creando grupo:', error);
      this.showNotification('Error creando grupo', 'error');
    }
  }

  selectGroup(groupId) {
    // Mostrar información del grupo
    this.showGroupInfoPanel(groupId);
    
    // Marcar como seleccionado visualmente
    document.querySelectorAll('.tab-group').forEach(el => {
      el.classList.remove('selected');
    });
    
    const groupEl = document.querySelector(`[data-group-id="${groupId}"]`);
    if (groupEl) {
      groupEl.classList.add('selected');
    }
  }

  showGroupInfoPanel(groupId) {
    const panel = document.getElementById('groupInfoPanel');
    const content = document.getElementById('groupInfoContent');
    
    if (!panel || !content) return;
    
    const group = this.groups.get(groupId);
    if (!group) return;
    
    content.innerHTML = `
      <div class="group-detail">
        <div class="group-name">${group.name}</div>
        <div class="group-type-badge ${group.type}">${group.type}</div>
        <div class="group-stats">
          <div class="stat">
            <span class="stat-label">Pestañas:</span>
            <span class="stat-value">${group.tabs.length}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Creado:</span>
            <span class="stat-value">${new Date(group.created).toLocaleDateString()}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Creado por:</span>
            <span class="stat-value">${group.createdBy}</span>
          </div>
        </div>
        ${group.metadata.description ? `<div class="group-description">${group.metadata.description}</div>` : ''}
      </div>
    `;
    
    // Configurar botones
    document.getElementById('activateGroupBtn')?.addEventListener('click', () => {
      this.activateGroup(groupId);
    });
    
    document.getElementById('deleteGroupBtn')?.addEventListener('click', () => {
      this.deleteGroup(groupId);
    });
    
    panel.style.display = 'block';
  }

  hideGroupInfoPanel() {
    const panel = document.getElementById('groupInfoPanel');
    if (panel) {
      panel.style.display = 'none';
    }
    
    // Deseleccionar grupos
    document.querySelectorAll('.tab-group').forEach(el => {
      el.classList.remove('selected');
    });
  }

  // =============================================================================
  // DRAG AND DROP
  // =============================================================================

  initializeDragAndDrop() {
    // Implementar drag and drop para mover pestañas entre grupos
    // (Esta funcionalidad se puede expandir)
  }

  // =============================================================================
  // UTILIDADES
  // =============================================================================

  getSelectedTabs() {
    // Obtener pestañas seleccionadas actualmente
    // Esta función se puede implementar según la UI específica
    return [];
  }

  showNotification(message, type = 'info') {
    if (!this.config.showNotifications) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove después de 3 segundos
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  toggleAiGrouping() {
    this.config.aiGroupingEnabled = !this.config.aiGroupingEnabled;
    const btn = document.getElementById('aiGroupingBtn');
    if (btn) {
      btn.classList.toggle('active', this.config.aiGroupingEnabled);
      btn.title = this.config.aiGroupingEnabled ? 'Deshabilitar agrupación IA' : 'Habilitar agrupación IA';
    }
    
    this.showNotification(
      this.config.aiGroupingEnabled ? '🤖 Agrupación IA habilitada' : '🚫 Agrupación IA deshabilitada'
    );
  }

  async performAutoGrouping() {
    try {
      this.showNotification('🔄 Ejecutando agrupación automática...');
      
      const result = await window.silhouetteAPI.tabGroups.performAutoGrouping();
      
      if (result.success) {
        this.showNotification('✅ Agrupación automática completada');
        await this.loadGroups();
      }
    } catch (error) {
      console.error('❌ Error en agrupación automática:', error);
      this.showNotification('Error en agrupación automática', 'error');
    }
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  onGroupCreated(data) {
    this.loadGroups();
    this.showNotification('📦 Nuevo grupo creado');
  }

  onGroupDeleted(data) {
    if (this.activeGroupId === data.groupId) {
      this.activeGroupId = null;
      this.updateActiveGroupDisplay();
    }
    this.loadGroups();
    this.showNotification('🗑️ Grupo eliminado');
  }

  onGroupActivated(data) {
    this.activeGroupId = data.groupId;
    this.updateGroupsDisplay();
    this.updateActiveGroupDisplay();
  }

  onGroupDeactivated(data) {
    this.activeGroupId = null;
    this.updateActiveGroupDisplay();
  }

  onTabAddedToGroup(data) {
    this.loadGroups();
  }

  onTabRemovedFromGroup(data) {
    this.loadGroups();
  }

  onTabMovedBetweenGroups(data) {
    this.loadGroups();
  }

  // =============================================================================
  // ESTILOS
  // =============================================================================

  addGroupsStyles() {
    const styles = `
      <style>
        .tab-groups-section {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          background: var(--background-secondary);
        }

        .tab-groups-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          margin: 0;
          color: var(--text-primary);
        }

        .groups-controls {
          display: flex;
          gap: 4px;
        }

        .tab-groups-list {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 12px;
        }

        .tab-group {
          border: 1px solid var(--border-color);
          border-radius: 6px;
          margin-bottom: 8px;
          background: var(--background-tertiary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-group:hover {
          border-color: var(--border-accent);
        }

        .tab-group.active {
          border-color: var(--primary-color);
          background: rgba(0, 122, 204, 0.1);
        }

        .tab-group.selected {
          border-color: var(--accent-color);
          background: rgba(255, 107, 53, 0.1);
        }

        .group-header {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          gap: 8px;
        }

        .group-icon {
          font-size: 16px;
        }

        .group-info {
          flex: 1;
        }

        .group-name {
          font-weight: 600;
          font-size: 13px;
          color: var(--text-primary);
        }

        .group-meta {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .group-type {
          background: var(--accent-color);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
        }

        .group-actions {
          display: flex;
          gap: 4px;
        }

        .group-tabs {
          padding: 0 12px 8px 12px;
        }

        .group-tab {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          margin: 2px 0;
          background: var(--background-primary);
          border-radius: 4px;
          gap: 8px;
        }

        .tab-icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tab-icon img {
          width: 16px;
          height: 16px;
          border-radius: 2px;
        }

        .tab-info {
          flex: 1;
          min-width: 0;
        }

        .tab-title {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-url {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-groups-stats {
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
          padding: 8px;
          border-top: 1px solid var(--border-color);
        }

        .tab-groups-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: var(--background-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .toolbar-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .toolbar-btn {
          padding: 6px 12px;
          background: var(--background-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-primary);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .toolbar-btn:hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .active-group {
          font-size: 12px;
          color: var(--accent-color);
          font-weight: 600;
        }

        .group-info-panel {
          position: fixed;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 280px;
          background: var(--background-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          display: none;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .info-header h4 {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary);
        }

        .group-detail {
          margin-bottom: 16px;
        }

        .group-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .group-type-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .group-type-badge.manual {
          background: var(--primary-color);
          color: white;
        }

        .group-type-badge.ai {
          background: var(--accent-color);
          color: white;
        }

        .group-type-badge.agent {
          background: var(--error-color);
          color: white;
        }

        .group-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .stat-label {
          color: var(--text-muted);
        }

        .stat-value {
          color: var(--text-primary);
          font-weight: 600;
        }

        .group-description {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .info-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .notification {
          position: fixed;
          top: 16px;
          right: 16px;
          padding: 12px 16px;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          z-index: 10000;
          animation: slideIn 0.3s ease;
        }

        .notification.info {
          background: var(--primary-color);
        }

        .notification.success {
          background: var(--success-color);
        }

        .notification.error {
          background: var(--error-color);
        }

        .notification.warning {
          background: var(--warning-color);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .btn-small, .btn-icon {
          padding: 4px 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--background-tertiary);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s ease;
        }

        .btn-small:hover, .btn-icon:hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-primary {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-primary:hover {
          background: var(--accent-color);
          border-color: var(--accent-color);
        }

        .btn-secondary {
          background: var(--background-tertiary);
          color: var(--text-secondary);
          border-color: var(--border-color);
        }

        .btn-secondary:hover {
          background: var(--background-primary);
          color: var(--text-primary);
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          justify-content: center;
          align-items: center;
        }

        .modal-content {
          background: var(--background-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          width: 400px;
          max-width: 90vw;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary);
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: var(--text-primary);
        }

        .modal-body {
          padding: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--background-tertiary);
          color: var(--text-primary);
          font-size: 12px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 60px;
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid var(--border-color);
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Exportar para uso global
window.TabGroupsUIManager = TabGroupsUIManager;