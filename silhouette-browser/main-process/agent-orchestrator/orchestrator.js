// =============================================================================
// AGENT ORCHESTRATOR - ORQUESTADOR DE AGENTES
// Coordinación central de todos los equipos especializados
// =============================================================================

import { SilhouetteAgent } from '../agent-orchestrator/silhouette-agent.js';

class AgentOrchestrator {
  constructor() {
    this.silhouetteAgent = new SilhouetteAgent();
    this.isInitialized = false;
    this.activeTeams = new Set();
    this.taskQueue = [];
    this.performanceMetrics = {
      tasksCompleted: 0,
      averageResponseTime: 0,
      teamUtilization: {},
      errorCount: 0
    };
  }

  // =============================================================================
  // INICIALIZACIÓN DEL ORQUESTADOR
  // =============================================================================
  
  async initialize() {
    console.log('🤖 Inicializando Orquestador de Agentes...');
    
    try {
      // Inicializar Silhouette Agent
      await this.silhouetteAgent.initialize();
      
      // Configurar comunicación entre equipos
      this.setupTeamCommunication();
      
      // Inicializar sistema de métricas
      this.initializeMetrics();
      
      this.isInitialized = true;
      console.log('✅ Orquestador de Agentes inicializado correctamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error inicializando Orquestador:', error);
      return false;
    }
  }

  // =============================================================================
  // COMUNICACIÓN ENTRE EQUIPOS
  // =============================================================================
  
  setupTeamCommunication() {
    // Configurar WebSocket para comunicación en tiempo real
    this.setupWebSocketCommunication();
    
    // Configurar sistema de mensajería
    this.setupMessageRouting();
  }

  setupWebSocketCommunication() {
    // WebSocket para comunicación entre equipos en tiempo real
    this.webSocketServer = {
      clients: new Set(),
      rooms: new Map(),
      
      addClient(client) {
        this.clients.add(client);
      },
      
      removeClient(client) {
        this.clients.delete(client);
      },
      
      broadcast(message, room = null) {
        const targetClients = room ? 
          this.getRoomClients(room) : this.clients;
        
        targetClients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message));
          }
        });
      },
      
      getRoomClients(room) {
        const roomClients = this.rooms.get(room) || new Set();
        return Array.from(roomClients).filter(client => 
          client.readyState === 1
        );
      }
    };
  }

  setupMessageRouting() {
    // Sistema de enrutamiento de mensajes entre equipos
    this.messageRouter = {
      routes: new Map(),
      middleware: [],
      
      registerRoute(team, handler) {
        this.routes.set(team, handler);
      },
      
      routeMessage(message) {
        const { from, to, type, payload } = message;
        
        // Ejecutar middleware
        for (const middleware of this.middleware) {
          const result = middleware(message);
          if (result === false) return; // Bloquear mensaje
        }
        
        // Enrutar mensaje
        const handler = this.routes.get(to);
        if (handler) {
          return handler({ from, type, payload });
        } else {
          console.warn(`No handler found for team: ${to}`);
        }
      }
    };
  }

  // =============================================================================
  // SISTEMA DE MÉTRICAS
  // =============================================================================
  
  initializeMetrics() {
    this.metricsCollector = {
      startTime: Date.now(),
      teamMetrics: new Map(),
      taskHistory: [],
      
      trackTaskStart(taskId, teamId) {
        const timestamp = Date.now();
        this.taskHistory.push({
          taskId,
          teamId,
          startTime: timestamp,
          status: 'running'
        });
      },
      
      trackTaskEnd(taskId, result) {
        const task = this.taskHistory.find(t => t.taskId === taskId);
        if (task) {
          task.endTime = Date.now();
          task.duration = task.endTime - task.startTime;
          task.result = result;
          task.status = 'completed';
        }
      },
      
      updateTeamUtilization(teamId, utilization) {
        this.teamMetrics.set(teamId, {
          ...this.teamMetrics.get(teamId),
          utilization,
          lastUpdate: Date.now()
        });
      }
    };
  }

  // =============================================================================
  // GESTIÓN DE TAREAS
  // =============================================================================
  
  async executeTask(task) {
    const taskStart = Date.now();
    
    try {
      console.log(`🎯 Ejecutando tarea: ${task.id}`);
      
      // Identificar equipos necesarios
      const requiredTeams = this.identifyRequiredTeams(task);
      
      // Asignar equipos a la tarea
      const taskAssignment = this.assignTeams(requiredTeams, task);
      
      // Ejecutar coordinación de equipos
      const result = await this.coordinateTeams(taskAssignment);
      
      // Registrar resultado
      this.recordTaskCompletion(task, result, taskStart);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error ejecutando tarea ${task.id}:`, error);
      this.recordTaskError(task, error, taskStart);
      throw error;
    }
  }

  identifyRequiredTeams(task) {
    const requiredTeams = new Set();
    
    // Análisis de requisitos basado en el tipo de tarea
    if (task.type === 'web_navigation') {
      requiredTeams.add('browser');
      requiredTeams.add('automation');
    }
    
    if (task.type === 'content_creation') {
      requiredTeams.add('design_creative');
      requiredTeams.add('content_generation');
    }
    
    if (task.type === 'data_analysis') {
      requiredTeams.add('artificial_intelligence');
      requiredTeams.add('research');
    }
    
    if (task.type === 'business_intelligence') {
      requiredTeams.add('business_development');
      requiredTeams.add('analytics');
    }
    
    // Equipos de infraestructura siempre activos
    requiredTeams.add('orchestrator');
    requiredTeams.add('planner');
    requiredTeams.add('monitor');
    
    return Array.from(requiredTeams);
  }

  assignTeams(requiredTeams, task) {
    const assignment = {
      primary: null,
      supporting: [],
      supervisor: 'orchestrator'
    };
    
    // Seleccionar equipo primario basado en tipo de tarea
    const teamPriorities = {
      'web_navigation': 'browser',
      'content_creation': 'design_creative',
      'data_analysis': 'artificial_intelligence',
      'business_intelligence': 'business_development'
    };
    
    assignment.primary = teamPriorities[task.type] || 'orchestrator';
    
    // Asignar equipos de apoyo
    assignment.supporting = requiredTeams.filter(team => 
      team !== assignment.primary && team !== 'orchestrator'
    );
    
    return assignment;
  }

  async coordinateTeams(assignment) {
    const { primary, supporting, supervisor } = assignment;
    
    console.log(`🤝 Coordinando equipos: ${primary} (primario), ${supporting.join(', ')} (apoyo)`);
    
    // Crear plan de coordinación
    const coordinationPlan = this.createCoordinationPlan(assignment);
    
    // Ejecutar coordinación
    const result = await this.executeCoordinationPlan(coordinationPlan);
    
    return result;
  }

  createCoordinationPlan(assignment) {
    return {
      sequence: [
        { step: 'initialize', team: 'orchestrator' },
        { step: 'plan', team: 'planner' },
        { step: 'execute_primary', team: assignment.primary },
        { step: 'coordinate_supporting', teams: assignment.supporting },
        { step: 'synthesize', team: 'orchestrator' },
        { step: 'deliver', team: 'orchestrator' }
      ],
      timeline: Date.now() + 30000, // 30 segundos máximo
      timeout: 30000
    };
  }

  async executeCoordinationPlan(plan) {
    const results = [];
    
    for (const step of plan.sequence) {
      try {
        const stepResult = await this.executeStep(step);
        results.push({ step: step.step, result: stepResult });
        
        // Verificar timeout
        if (Date.now() > plan.timeline) {
          throw new Error('Plan de coordinación excedió tiempo límite');
        }
        
      } catch (error) {
        console.error(`Error en paso ${step.step}:`, error);
        throw error;
      }
    }
    
    return this.synthesizeResults(results);
  }

  async executeStep(step) {
    switch (step.step) {
      case 'initialize':
        return this.silhouetteAgent.activate();
        
      case 'plan':
        return this.silhouetteAgent.createPlan(step);
        
      case 'execute_primary':
        return this.silhouetteAgent.executePrimaryTask(step);
        
      case 'coordinate_supporting':
        return this.silhouetteAgent.executeSupportingTasks(step);
        
      case 'synthesize':
        return this.silhouetteAgent.synthesizeResults(results);
        
      case 'deliver':
        return this.silhouetteAgent.deliverResults(results);
        
      default:
        throw new Error(`Paso desconocido: ${step.step}`);
    }
  }

  synthesizeResults(results) {
    // Sintetizar resultados de todos los pasos
    const synthesized = {
      success: true,
      data: {},
      metadata: {
        executionTime: Date.now(),
        stepsCompleted: results.length
      }
    };
    
    results.forEach(result => {
      if (result.result && result.result.data) {
        Object.assign(synthesized.data, result.result.data);
      }
    });
    
    return synthesized;
  }

  // =============================================================================
  // REGISTRO DE MÉTRICAS
  // =============================================================================
  
  recordTaskCompletion(task, result, startTime) {
    const duration = Date.now() - startTime;
    
    this.performanceMetrics.tasksCompleted++;
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime + duration) / 2;
    
    console.log(`✅ Tarea ${task.id} completada en ${duration}ms`);
  }

  recordTaskError(task, error, startTime) {
    const duration = Date.now() - startTime;
    
    this.performanceMetrics.errorCount++;
    this.performanceMetrics.lastError = {
      task: task.id,
      error: error.message,
      duration
    };
    
    console.error(`❌ Tarea ${task.id} falló después de ${duration}ms:`, error);
  }

  // =============================================================================
  // GETTERS Y UTILIDADES
  // =============================================================================
  
  getMetrics() {
    return {
      ...this.performanceMetrics,
      activeTeams: Array.from(this.activeTeams),
      queueLength: this.taskQueue.length,
      systemUptime: Date.now() - this.metricsCollector.startTime
    };
  }

  getTeamStatus() {
    return this.silhouetteAgent.getTeamStatus();
  }

  isReady() {
    return this.isInitialized && this.silhouetteAgent.isActive;
  }

  // =============================================================================
  // LIMPIEZA Y CIERRE
  // =============================================================================
  
  async cleanup() {
    console.log('🧹 Limpiando Orquestador de Agentes...');
    
    if (this.auditInterval) {
      clearInterval(this.auditInterval);
    }
    
    await this.silhouetteAgent.deactivate();
    
    console.log('✅ Orquestador de Agentes limpiado');
  }
}

export { AgentOrchestrator };
