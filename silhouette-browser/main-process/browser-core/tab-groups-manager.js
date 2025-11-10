// =============================================================================
// TAB GROUPS MANAGER - GESTOR DE GRUPOS DE PESTAÑAS
// Sistema avanzado para organizar, gestionar y coordinar pestañas en grupos
// Soporte para grupos manuales y automáticos por IA
// =============================================================================

import { BrowserView } from 'electron';

class TabGroupsManager {
  constructor(tabManager) {
    this.tabManager = tabManager;
    this.groups = new Map(); // groupId -> { id, name, tabs: Set, metadata, type, color, created, createdBy }
    this.activeGroupId = null;
    this.nextGroupId = 1;
    this.aiGrouping = true; // IA automática habilitada
    this.colorSchemes = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
  }

  async initialize() {
    console.log('🗂️ Inicializando Gestor de Grupos de Pestañas...');
    
    // Configurar eventos para agrupación automática
    this.setupAutoGroupingEvents();
    
    console.log('✅ Gestor de Grupos de Pestañas inicializado');
  }

  // =============================================================================
  // CREACIÓN DE GRUPOS
  // =============================================================================

  async createGroup(name, options = {}) {
    const groupId = `group-${this.nextGroupId++}`;
    
    const group = {
      id: groupId,
      name: name,
      tabs: new Set(), // Set de tabIds
      metadata: {
        description: options.description || '',
        purpose: options.purpose || 'manual', // 'manual', 'ai', 'agent', 'task'
        color: options.color || this.colorSchemes[Math.floor(Math.random() * this.colorSchemes.length)],
        icon: options.icon || '🗂️',
        automation: {
          enabled: options.automation?.enabled || false,
          tasks: options.automation?.tasks || [],
          scripts: options.automation?.scripts || []
        },
        coordination: {
          agentMode: options.coordination?.agentMode || false,
          maxParallelTasks: options.coordination?.maxParallelTasks || 3,
          waitForCompletion: options.coordination?.waitForCompletion || true,
          failureStrategy: options.coordination?.failureStrategy || 'stop' // 'stop', 'continue', 'retry'
        }
      },
      type: options.type || 'manual', // 'manual', 'ai', 'agent', 'task'
      created: Date.now(),
      createdBy: options.createdBy || 'user', // 'user', 'ai', 'agent'
      active: true
    };

    this.groups.set(groupId, group);
    
    console.log(`📦 Grupo creado: ${name} (${groupId})`);
    this.notifyGroupCreated(groupId);
    
    return groupId;
  }

  async createAiGroup(categorizedTabs) {
    const groupId = `ai-group-${this.nextGroupId++}`;
    
    // Determinar nombre automático basado en contenido
    const groupName = this.generateGroupName(categorizedTabs);
    const groupDescription = this.generateGroupDescription(categorizedTabs);
    
    const group = {
      id: groupId,
      name: groupName,
      tabs: new Set(categorizedTabs.map(tab => tab.id)),
      metadata: {
        description: groupDescription,
        purpose: 'ai',
        color: this.colorSchemes[Math.floor(Math.random() * this.colorSchemes.length)],
        icon: '🤖',
        confidence: categorizedTabs[0]?.confidence || 0.8,
        keywords: this.extractKeywords(categorizedTabs),
        category: this.categorizeContent(categorizedTabs)
      },
      type: 'ai',
      created: Date.now(),
      createdBy: 'ai',
      active: true
    };

    this.groups.set(groupId, group);
    
    // Agregar pestañas al grupo
    for (const tabId of group.tabs) {
      await this.addTabToGroup(groupId, tabId, false);
    }
    
    console.log(`🤖 Grupo IA creado: ${groupName} (${groupId}) con ${group.tabs.size} pestañas`);
    this.notifyGroupCreated(groupId);
    
    return groupId;
  }

  async createAgentGroup(taskData) {
    const groupId = `agent-group-${this.nextGroupId++}`;
    
    const group = {
      id: groupId,
      name: taskData.name || `Grupo de Tarea ${groupId}`,
      tabs: new Set(),
      metadata: {
        description: taskData.description || 'Grupo creado para ejecución de tarea por agente',
        purpose: 'agent',
        color: '#FF6B6B',
        icon: '🤖',
        agent: {
          type: taskData.agentType || 'omnipotent',
          taskId: taskData.taskId,
          priority: taskData.priority || 'normal',
          estimatedDuration: taskData.estimatedDuration,
          dependencies: taskData.dependencies || [],
          resources: taskData.resources || []
        },
        automation: {
          enabled: true,
          workflows: taskData.workflows || [],
          scripts: taskData.scripts || []
        },
        coordination: {
          agentMode: true,
          maxParallelTasks: taskData.maxParallelTasks || 5,
          waitForCompletion: true,
          failureStrategy: 'retry'
        }
      },
      type: 'agent',
      created: Date.now(),
      createdBy: 'agent',
      active: true
    };

    this.groups.set(groupId, group);
    
    // Configurar pestañas según la tarea
    await this.setupAgentGroupTabs(groupId, taskData);
    
    console.log(`🤖 Grupo Agente creado: ${group.name} (${groupId})`);
    this.notifyGroupCreated(groupId);
    
    return groupId;
  }

  // =============================================================================
  // GESTIÓN DE PESTAÑAS EN GRUPOS
  // =============================================================================

  async addTabToGroup(groupId, tabId, notify = true) {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Grupo ${groupId} no encontrado`);
    }

    // Verificar que la pestaña existe
    const tab = this.tabManager.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Pestaña ${tabId} no encontrada`);
    }

    // Agregar pestaña al grupo
    group.tabs.add(tabId);
    
    // Actualizar metadata de la pestaña
    tab.groupId = groupId;
    tab.groupColor = group.metadata.color;
    
    if (notify) {
      this.notifyTabAddedToGroup(groupId, tabId);
    }
    
    console.log(`📄 Pestaña ${tabId} agregada al grupo ${groupId}`);
  }

  async removeTabFromGroup(tabId, notify = true) {
    const tab = this.tabManager.tabs.get(tabId);
    if (!tab || !tab.groupId) {
      return; // No está en un grupo
    }

    const group = this.groups.get(tab.groupId);
    if (!group) {
      return; // Grupo no existe
    }

    // Remover pestaña del grupo
    group.tabs.delete(tabId);
    
    // Limpiar metadata de la pestaña
    delete tab.groupId;
    delete tab.groupColor;
    
    if (group.tabs.size === 0 && group.type !== 'agent') {
      // Eliminar grupo vacío (excepto grupos de agentes)
      await this.deleteGroup(tab.groupId, false);
    }
    
    if (notify) {
      this.notifyTabRemovedFromGroup(tab.groupId, tabId);
    }
    
    console.log(`📄 Pestaña ${tabId} removida del grupo ${tab.groupId}`);
  }

  async moveTabToGroup(tabId, fromGroupId, toGroupId, notify = true) {
    // Remover de grupo actual
    await this.removeTabFromGroup(tabId, false);
    
    // Agregar al nuevo grupo
    await this.addTabToGroup(toGroupId, tabId, false);
    
    if (notify) {
      this.notifyTabMovedBetweenGroups(fromGroupId, toGroupId, tabId);
    }
    
    console.log(`📄 Pestaña ${tabId} movida del grupo ${fromGroupId} al ${toGroupId}`);
  }

  // =============================================================================
  // GESTIÓN DE GRUPOS
  // =============================================================================

  async deleteGroup(groupId, notify = true) {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Grupo ${groupId} no encontrado`);
    }

    // Remover todas las pestañas del grupo
    const tabIds = Array.from(group.tabs);
    for (const tabId of tabIds) {
      await this.removeTabFromGroup(tabId, false);
    }

    // Si es un grupo de agente, ejecutar cleanup
    if (group.type === 'agent') {
      await this.cleanupAgentGroup(groupId);
    }

    // Eliminar el grupo
    this.groups.delete(groupId);
    
    if (this.activeGroupId === groupId) {
      this.activeGroupId = null;
    }
    
    if (notify) {
      this.notifyGroupDeleted(groupId);
    }
    
    console.log(`🗑️ Grupo eliminado: ${groupId}`);
  }

  async activateGroup(groupId) {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Grupo ${groupId} no encontrado`);
    }

    this.activeGroupId = groupId;
    
    // Configurar la primera pestaña del grupo como activa
    const firstTab = Array.from(group.tabs)[0];
    if (firstTab) {
      await this.tabManager.switchToBrowserView(firstTab);
    }
    
    this.notifyGroupActivated(groupId);
    console.log(`🎯 Grupo activado: ${group.name} (${groupId})`);
  }

  async deactivateGroup(groupId) {
    if (this.activeGroupId === groupId) {
      this.activeGroupId = null;
      this.notifyGroupDeactivated(groupId);
      console.log(`⏸️ Grupo desactivado: ${groupId}`);
    }
  }

  // =============================================================================
  // AGRUPACIÓN AUTOMÁTICA POR IA
  // =============================================================================

  async performAutoGrouping() {
    if (!this.aiGrouping) return;
    
    console.log('🤖 Ejecutando agrupación automática de pestañas...');
    
    // Obtener pestañas no agrupadas
    const ungroupedTabs = Array.from(this.tabManager.tabs.values())
      .filter(tab => !tab.groupId);
    
    if (ungroupedTabs.length < 2) {
      console.log('ℹ️ Insuficientes pestañas para agrupar automáticamente');
      return;
    }

    try {
      // Analizar contenido de las pestañas
      const analysisResults = await this.analyzeTabsContent(ungroupedTabs);
      
      // Agrupar por similitud
      const groups = this.groupTabsBySimilarity(analysisResults);
      
      // Crear grupos automáticamente
      for (const groupedTabs of groups) {
        if (groupedTabs.length >= 2) {
          await this.createAiGroup(groupedTabs);
        }
      }
      
      console.log(`✅ Agrupación automática completada: ${groups.length} grupos creados`);
      
    } catch (error) {
      console.error('❌ Error en agrupación automática:', error);
    }
  }

  async analyzeTabsContent(tabs) {
    const analysisResults = [];
    
    for (const tab of tabs) {
      try {
        // Extraer contenido de la pestaña
        const content = await this.extractTabContent(tab.id);
        const analysis = await this.aiAnalysis(content, tab);
        
        analysisResults.push({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          content: content,
          analysis: analysis,
          confidence: analysis.confidence
        });
      } catch (error) {
        console.warn(`⚠️ Error analizando pestaña ${tab.id}:`, error);
      }
    }
    
    return analysisResults;
  }

  async extractTabContent(tabId) {
    const tab = this.tabManager.tabs.get(tabId);
    if (!tab || !tab.browserView?.webContents) {
      return '';
    }

    try {
      // Extraer texto visible de la página
      const content = await tab.browserView.webContents.executeJavaScript(`
        (() => {
          const extractText = (element) => {
            return element.innerText || element.textContent || '';
          };
          
          const title = document.title || '';
          const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => extractText(h)).join(' ');
          const bodyText = extractText(document.body);
          const links = Array.from(document.querySelectorAll('a')).map(a => a.innerText).join(' ');
          
          return {
            title,
            headings,
            bodyText: bodyText.substring(0, 1000), // Limitar tamaño
            links: links.substring(0, 500)
          };
        })()
      `);
      
      return content;
    } catch (error) {
      console.warn(`⚠️ Error extrayendo contenido de pestaña ${tabId}:`, error);
      return { title: tab.title, url: tab.url, headings: '', bodyText: '', links: '' };
    }
  }

  async aiAnalysis(content, tab) {
    // Análisis básico usando palabras clave
    // En una implementación real, aquí se usaría una API de IA
    
    const keywords = this.extractKeywordsFromContent(content);
    const category = this.categorizeByKeywords(keywords);
    
    return {
      keywords,
      category,
      summary: this.generateSummary(content),
      confidence: 0.8,
      reasons: this.generateReasons(content, category)
    };
  }

  extractKeywordsFromContent(content) {
    const allText = `${content.title} ${content.headings} ${content.bodyText} ${content.links}`.toLowerCase();
    
    // Palabras clave por categoría
    const keywordPatterns = {
      'desarrollo': ['código', 'programming', 'javascript', 'html', 'css', 'github', 'developer', 'app', 'api'],
      'noticias': ['noticias', 'news', 'breaking', 'actualidad', 'cnn', 'bbc', 'reuters'],
      'compras': ['tienda', 'shop', 'buy', 'producto', 'price', 'amazon', 'ecommerce'],
      'social': ['facebook', 'twitter', 'instagram', 'social', 'post', 'comment'],
      'video': ['youtube', 'video', 'watch', 'stream', 'netflix', 'media'],
      'documentación': ['docs', 'documentation', 'guide', 'tutorial', 'how to', 'api'],
      'productividad': ['todo', 'task', 'calendar', 'schedule', 'productivity', 'organize']
    };
    
    const foundKeywords = [];
    for (const [category, keywords] of Object.entries(keywordPatterns)) {
      const matched = keywords.filter(keyword => allText.includes(keyword));
      if (matched.length > 0) {
        foundKeywords.push(...matched);
      }
    }
    
    return [...new Set(foundKeywords)]; // Remove duplicates
  }

  categorizeByKeywords(keywords) {
    if (keywords.some(k => ['código', 'programming', 'javascript', 'html', 'css', 'github'].includes(k))) {
      return 'desarrollo';
    }
    if (keywords.some(k => ['noticias', 'news', 'breaking', 'cnn', 'bbc', 'reuters'].includes(k))) {
      return 'noticias';
    }
    if (keywords.some(k => ['tienda', 'shop', 'buy', 'producto', 'amazon', 'ecommerce'].includes(k))) {
      return 'compras';
    }
    if (keywords.some(k => ['facebook', 'twitter', 'instagram', 'social'].includes(k))) {
      return 'social';
    }
    if (keywords.some(k => ['youtube', 'video', 'watch', 'netflix'].includes(k))) {
      return 'video';
    }
    if (keywords.some(k => ['docs', 'documentation', 'guide', 'tutorial', 'how to'].includes(k))) {
      return 'documentación';
    }
    if (keywords.some(k => ['todo', 'task', 'calendar', 'schedule'].includes(k))) {
      return 'productividad';
    }
    
    return 'general';
  }

  groupTabsBySimilarity(analysisResults) {
    // Agrupar pestañas por similitud de categoría y palabras clave
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < analysisResults.length; i++) {
      if (processed.has(analysisResults[i].id)) continue;
      
      const currentGroup = [analysisResults[i]];
      processed.add(analysisResults[i].id);
      
      // Buscar pestañas similares
      for (let j = i + 1; j < analysisResults.length; j++) {
        if (processed.has(analysisResults[j].id)) continue;
        
        const similarity = this.calculateSimilarity(analysisResults[i], analysisResults[j]);
        if (similarity > 0.5) { // Umbral de similitud
          currentGroup.push(analysisResults[j]);
          processed.add(analysisResults[j].id);
        }
      }
      
      groups.push(currentGroup);
    }
    
    return groups;
  }

  calculateSimilarity(tab1, tab2) {
    // Calcular similitud basada en categoría y palabras clave
    let similarity = 0;
    
    // Misma categoría
    if (tab1.analysis.category === tab2.analysis.category) {
      similarity += 0.5;
    }
    
    // Palabras clave comunes
    const commonKeywords = tab1.analysis.keywords.filter(k => 
      tab2.analysis.keywords.includes(k)
    );
    const keywordSimilarity = commonKeywords.length / Math.max(
      tab1.analysis.keywords.length, 
      tab2.analysis.keywords.length
    );
    similarity += keywordSimilarity * 0.5;
    
    return similarity;
  }

  generateGroupName(categorizedTabs) {
    const category = categorizedTabs[0]?.analysis?.category || 'general';
    const categoryNames = {
      'desarrollo': 'Desarrollo',
      'noticias': 'Noticias',
      'compras': 'Compras',
      'social': 'Social',
      'video': 'Video',
      'documentación': 'Documentación',
      'productividad': 'Productividad',
      'general': 'General'
    };
    
    return `${categoryNames[category] || 'General'} ${Date.now() % 1000}`;
  }

  generateGroupDescription(categorizedTabs) {
    const category = categorizedTabs[0]?.analysis?.category || 'general';
    const keywords = [...new Set(categorizedTabs.flatMap(t => t.analysis.keywords))];
    
    return `Grupo automático de ${categorizedTabs.length} pestañas de categoría "${category}" con palabras clave: ${keywords.join(', ')}`;
  }

  extractKeywords(categorizedTabs) {
    return [...new Set(categorizedTabs.flatMap(tab => tab.analysis.keywords))];
  }

  categorizeContent(categorizedTabs) {
    return categorizedTabs[0]?.analysis?.category || 'general';
  }

  generateSummary(content) {
    return `Contenido sobre ${content.title} con ${content.headings.length} encabezados principales.`;
  }

  generateReasons(content, category) {
    return [`Pestañas categorizadas en "${category}" basado en contenido`, `Título: ${content.title}`];
  }

  // =============================================================================
  // COORDINACIÓN DE AGENTES
  // =============================================================================

  async executeAgentGroupTask(groupId, task) {
    const group = this.groups.get(groupId);
    if (!group || group.type !== 'agent') {
      throw new Error(`Grupo ${groupId} no es un grupo de agente válido`);
    }

    console.log(`🤖 Ejecutando tarea en grupo de agente: ${group.name}`);
    
    // Obtener pestañas del grupo
    const tabIds = Array.from(group.tabs);
    const results = [];
    
    // Ejecutar tareas en paralelo según configuración
    const maxParallel = group.metadata.coordination.maxParallelTasks;
    const batches = this.chunkArray(tabIds, maxParallel);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (tabId) => {
        try {
          return await this.executeTaskInTab(tabId, task, group.metadata);
        } catch (error) {
          console.error(`❌ Error ejecutando tarea en pestaña ${tabId}:`, error);
          return { tabId, error: error.message, success: false };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Verificar estrategia de fallo
      const failures = batchResults.filter(r => !r.success);
      if (failures.length > 0 && group.metadata.coordination.failureStrategy === 'stop') {
        console.warn('⚠️ Deteniendo ejecución por fallos críticos');
        break;
      }
    }
    
    return {
      groupId,
      task,
      results,
      success: results.every(r => r.success),
      completedAt: Date.now()
    };
  }

  async setupAgentGroupTabs(groupId, taskData) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    // Crear pestañas específicas para la tarea del agente
    const requiredTabs = taskData.requiredTabs || [];
    
    for (const tabSpec of requiredTabs) {
      const tabId = await this.tabManager.createTabWithBrowserView({
        url: tabSpec.url,
        active: false,
        pinned: tabSpec.pinned || false,
        windowId: 'main'
      });
      
      await this.addTabToGroup(groupId, tabId, false);
    }
  }

  async cleanupAgentGroup(groupId) {
    const group = this.groups.get(groupId);
    if (!group) return;
    
    // Limpiar tareas de agentes en ejecución
    if (group.metadata.agent?.activeTasks) {
      for (const task of group.metadata.agent.activeTasks) {
        try {
          // Cancelar tarea si es posible
          task.cancel();
        } catch (error) {
          console.warn(`⚠️ Error cancelando tarea:`, error);
        }
      }
    }
    
    console.log(`🧹 Grupo de agente ${groupId} limpiado`);
  }

  async executeTaskInTab(tabId, task, groupMetadata) {
    const tab = this.tabManager.tabs.get(tabId);
    if (!tab || !tab.browserView) {
      return { tabId, error: 'Tab no encontrado', success: false };
    }
    
    try {
      // Ejecutar tarea específica basada en el tipo
      switch (task.type) {
        case 'navigate':
          await this.tabManager.navigateToUrl(tab.browserView, task.url);
          break;
          
        case 'extract':
          const content = await tab.browserView.webContents.executeJavaScript(task.script);
          return { tabId, content, success: true };
          
        case 'click':
          await tab.browserView.webContents.executeJavaScript(`
            document.querySelector('${task.selector}').click();
          `);
          break;
          
        case 'fill':
          await tab.browserView.webContents.executeJavaScript(`
            const element = document.querySelector('${task.selector}');
            if (element) {
              element.value = '${task.value}';
              element.dispatchEvent(new Event('input', { bubbles: true }));
            }
          `);
          break;
          
        default:
          // Ejecutar script personalizado
          await tab.browserView.webContents.executeJavaScript(task.script);
      }
      
      return { tabId, success: true };
      
    } catch (error) {
      return { tabId, error: error.message, success: false };
    }
  }

  // =============================================================================
  // EVENTOS Y NOTIFICACIONES
  // =============================================================================

  setupAutoGroupingEvents() {
    // Configurar agrupación automática cuando se abren nuevas pestañas
    this.tabManager.on('tab-created', async (tabId) => {
      // Esperar un poco para que la página cargue
      setTimeout(() => {
        this.performAutoGrouping();
      }, 3000);
    });
  }

  notifyGroupCreated(groupId) {
    // Emitir evento al renderer
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group-created', { groupId });
    }
  }

  notifyGroupDeleted(groupId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group-deleted', { groupId });
    }
  }

  notifyGroupActivated(groupId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group-activated', { groupId });
    }
  }

  notifyGroupDeactivated(groupId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group-deactivated', { groupId });
    }
  }

  notifyTabAddedToGroup(groupId, tabId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group:tab-added', { groupId, tabId });
    }
  }

  notifyTabRemovedFromGroup(groupId, tabId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group:tab-removed', { groupId, tabId });
    }
  }

  notifyTabMovedBetweenGroups(fromGroupId, toGroupId, tabId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group:tab-moved', { 
        fromGroupId, toGroupId, tabId 
      });
    }
  }

  notifyGroupDeleted(groupId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group-deleted', { groupId });
    }
  }

  notifyGroupActivated(groupId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group-activated', { groupId });
    }
  }

  notifyGroupDeactivated(groupId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('group-deactivated', { groupId });
    }
  }

  notifyTabAddedToGroup(groupId, tabId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('tab-added-to-group', { groupId, tabId });
    }
  }

  notifyTabRemovedFromGroup(groupId, tabId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('tab-removed-from-group', { groupId, tabId });
    }
  }

  notifyTabMovedBetweenGroups(fromGroupId, toGroupId, tabId) {
    if (this.tabManager.browserCore?.onGroupChange) {
      this.tabManager.browserCore.onGroupChange('tab-moved-between-groups', { 
        fromGroupId, toGroupId, tabId 
      });
    }
  }

  // =============================================================================
  // UTILIDADES
  // =============================================================================

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // =============================================================================
  // GETTERS
  // =============================================================================

  getAllGroups() {
    return Array.from(this.groups.values()).map(group => ({
      ...group,
      tabs: Array.from(group.tabs)
    }));
  }

  getGroup(groupId) {
    const group = this.groups.get(groupId);
    if (!group) return null;
    
    return {
      ...group,
      tabs: Array.from(group.tabs)
    };
  }

  getActiveGroup() {
    return this.activeGroupId ? this.getGroup(this.activeGroupId) : null;
  }

  getGroupsByType(type) {
    return Array.from(this.groups.values())
      .filter(group => group.type === type)
      .map(group => ({
        ...group,
        tabs: Array.from(group.tabs)
      }));
  }

  getTabCount() {
    return this.groups.size;
  }

  getTotalTabsInGroups() {
    return Array.from(this.groups.values())
      .reduce((total, group) => total + group.tabs.size, 0);
  }

  enableAiGrouping() {
    this.aiGrouping = true;
    console.log('🤖 Agrupación automática por IA habilitada');
  }

  disableAiGrouping() {
    this.aiGrouping = false;
    console.log('🚫 Agrupación automática por IA deshabilitada');
  }

  // =============================================================================
  // SERIALIZACIÓN
  // =============================================================================

  exportGroups() {
    return {
      version: '1.0',
      timestamp: Date.now(),
      groups: this.getAllGroups(),
      settings: {
        aiGrouping: this.aiGrouping,
        colorSchemes: this.colorSchemes
      }
    };
  }

  async importGroups(data) {
    try {
      if (data.settings?.aiGrouping !== undefined) {
        this.aiGrouping = data.settings.aiGrouping;
      }
      
      for (const groupData of data.groups) {
        const groupId = await this.createGroup(groupData.name, groupData.metadata);
        
        for (const tabId of groupData.tabs) {
          await this.addTabToGroup(groupId, tabId, false);
        }
      }
      
      console.log(`📦 ${data.groups.length} grupos importados`);
      return true;
    } catch (error) {
      console.error('❌ Error importando grupos:', error);
      return false;
    }
  }
}

export default TabGroupsManager;