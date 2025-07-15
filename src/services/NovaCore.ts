import { NovaMemory, NovaTask, NovaPlugin, NovaAgent, NovaSystemStatus, NovaConfig, ChatMessage } from '../types';
import AIProviderManager from './AIProviderManager';
import ConversationManager from './ConversationManager';
import MemoryEngine from './MemoryEngine';
import ReasoningEngine from './ReasoningEngine';
import MultiAgentCommunicator from './MultiAgentCommunicator';
import AutonomousPlanner from './AutonomousPlanner';

class NovaCore {
  private memory: NovaMemory[] = [];
  private tasks: NovaTask[] = [];
  private plugins: NovaPlugin[] = [];
  private agents: NovaAgent[] = [];
  private config: NovaConfig;
  private systemStatus: NovaSystemStatus;
  private isInitialized = false;
  private listeners: Map<string, Function[]> = new Map();
  
  // Advanced AI Systems
  private aiManager: AIProviderManager;
  private conversationManager: ConversationManager;
  private memoryEngine: MemoryEngine;
  private reasoningEngine: ReasoningEngine;
  private multiAgentCommunicator: MultiAgentCommunicator;
  private autonomousPlanner: AutonomousPlanner;
  
  // Autonomous Operation
  private autonomousMode = false;
  private thinkingInterval: NodeJS.Timeout | null = null;
  private lastThought = Date.now();

  constructor() {
    this.config = this.getDefaultConfig();
    this.systemStatus = this.getInitialSystemStatus();
    
    // Initialize AI subsystems
    this.aiManager = new AIProviderManager(this);
    this.conversationManager = new ConversationManager(this);
    this.memoryEngine = new MemoryEngine(this);
    this.reasoningEngine = new ReasoningEngine(this);
    this.multiAgentCommunicator = new MultiAgentCommunicator(this);
    this.autonomousPlanner = new AutonomousPlanner(this);
    
    this.initializeSystem();
  }

  private getDefaultConfig(): NovaConfig {
    return {
      autonomyLevel: 'autonomous',
      learningEnabled: true,
      memoryRetentionDays: 365, // Remember for a full year
      maxConcurrentTasks: 10,
      ollamaEndpoint: 'http://localhost:11434',
      defaultModel: 'llama3.1',
      voiceEnabled: true,
      networkAccess: true,
      pluginAutoUpdate: true,
    };
  }

  private getInitialSystemStatus(): NovaSystemStatus {
    return {
      cpu: 0,
      memory: 0,
      storage: 0,
      network: navigator.onLine,
      ollamaStatus: 'disconnected',
      activePlugins: 0,
      activeTasks: 0,
      uptime: 0,
    };
  }

  private async initializeSystem() {
    try {
      console.log('🚀 NOVA Core initializing...');
      
      // Load persistent data
      await this.loadMemoryFromStorage();
      await this.loadTasksFromStorage();
      await this.loadPluginsFromStorage();
      
      // Initialize AI systems
      await this.aiManager.initialize();
      await this.conversationManager.initialize();
      await this.memoryEngine.initialize();
      await this.reasoningEngine.initialize();
      await this.multiAgentCommunicator.initialize();
      await this.autonomousPlanner.initialize();
      
      // Initialize agents and plugins
      await this.initializeAgents();
      await this.loadDefaultPlugins();
      
      // Start autonomous systems
      this.startSystemMonitoring();
      this.startAutonomousThinking();
      
      this.isInitialized = true;
      
      // Add initialization memory
      await this.addMemory({
        type: 'system',
        content: 'NOVA Core Unit 001 initialized successfully. All systems online. Ready for autonomous operation.',
        importance: 10,
        tags: ['initialization', 'system', 'autonomous'],
      });
      
      this.emit('initialized');
      console.log('✅ NOVA Core fully operational');
      
    } catch (error) {
      console.error('❌ Failed to initialize NOVA system:', error);
      this.emit('error', error);
    }
  }

  // Advanced Memory Management with Context and Relationships
  async addMemory(memory: Omit<NovaMemory, 'id' | 'timestamp'>): Promise<string> {
    const newMemory: NovaMemory = {
      ...memory,
      id: this.generateId(),
      timestamp: Date.now(),
    };
    
    // Enhanced memory processing
    newMemory.importance = await this.memoryEngine.calculateImportance(newMemory);
    newMemory.tags = await this.memoryEngine.enhanceTags(newMemory);
    
    // Find related memories
    const relatedMemories = await this.memoryEngine.findRelatedMemories(newMemory);
    if (relatedMemories.length > 0) {
      newMemory.metadata = {
        ...newMemory.metadata,
        relatedMemories: relatedMemories.map(m => m.id),
      };
    }
    
    this.memory.unshift(newMemory);
    
    // Trigger memory consolidation if needed
    if (this.memory.length > 1000) {
      await this.memoryEngine.consolidateMemories();
    }
    
    await this.saveMemoryToStorage();
    this.emit('memoryAdded', newMemory);
    
    // Autonomous learning from new memory
    if (this.autonomousMode) {
      this.autonomousPlanner.processNewMemory(newMemory);
    }
    
    return newMemory.id;
  }

  // Advanced conversation processing with context and reasoning
  async processCommand(command: string, conversationId = 'main'): Promise<string> {
    try {
      // Add user input to memory
      await this.addMemory({
        type: 'interaction',
        content: `User: ${command}`,
        importance: 7,
        tags: ['user-input', 'conversation', conversationId],
        metadata: { conversationId, speaker: 'user' },
      });

      // Get conversation context
      const context = await this.conversationManager.getConversationContext(conversationId);
      
      // Analyze intent and determine processing mode
      const intent = await this.reasoningEngine.analyzeIntent(command, context);
      
      let response: string;
      
      // Route to appropriate processing system
      switch (intent.category) {
        case 'code':
          response = await this.processCodeRequest(command, context);
          break;
        case 'research':
          response = await this.processResearchRequest(command, context);
          break;
        case 'reasoning':
          response = await this.processReasoningRequest(command, context);
          break;
        case 'memory':
          response = await this.processMemoryRequest(command, context);
          break;
        case 'task':
          response = await this.processTaskRequest(command, context);
          break;
        case 'agent':
          response = await this.processAgentRequest(command, context);
          break;
        default:
          response = await this.processGeneralRequest(command, context);
      }

      // Add response to memory
      await this.addMemory({
        type: 'interaction',
        content: `NOVA: ${response}`,
        importance: 7,
        tags: ['nova-response', 'conversation', conversationId, intent.category],
        metadata: { 
          conversationId, 
          speaker: 'nova', 
          intent: intent.category,
          confidence: intent.confidence 
        },
      });

      // Update conversation context
      await this.conversationManager.updateConversation(conversationId, command, response);

      return response;

    } catch (error) {
      const errorMessage = `I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      await this.addMemory({
        type: 'system',
        content: `Error processing command: ${command}. Error: ${errorMessage}`,
        importance: 8,
        tags: ['error', 'processing', 'system'],
      });

      return errorMessage;
    }
  }

  // Specialized request processors
  private async processCodeRequest(command: string, context: any): Promise<string> {
    const codeContext = await this.memoryEngine.getCodeContext();
    return await this.aiManager.processRequest(command, 'code', undefined, {
      ...context,
      codeHistory: codeContext,
      capabilities: ['code-generation', 'debugging', 'refactoring', 'analysis']
    });
  }

  private async processResearchRequest(command: string, context: any): Promise<string> {
    const researchContext = await this.memoryEngine.getResearchContext();
    const webResults = await this.aiManager.searchWeb(command);
    
    return await this.aiManager.processRequest(command, 'research', undefined, {
      ...context,
      researchHistory: researchContext,
      webResults,
      capabilities: ['deep-analysis', 'synthesis', 'fact-checking']
    });
  }

  private async processReasoningRequest(command: string, context: any): Promise<string> {
    const reasoningContext = await this.memoryEngine.getReasoningContext();
    const analysis = await this.reasoningEngine.analyzeLogically(command, context);
    
    return await this.aiManager.processRequest(command, 'reasoning', undefined, {
      ...context,
      reasoningHistory: reasoningContext,
      logicalAnalysis: analysis,
      capabilities: ['logical-reasoning', 'problem-solving', 'decision-analysis']
    });
  }

  private async processMemoryRequest(command: string, context: any): Promise<string> {
    if (command.toLowerCase().includes('remember') || command.toLowerCase().includes('recall')) {
      const memories = await this.memoryEngine.searchMemories(command);
      return this.formatMemoryResponse(memories);
    }
    
    if (command.toLowerCase().includes('forget') || command.toLowerCase().includes('delete')) {
      // Handle memory deletion requests
      return "I understand you want me to forget something. Could you be more specific about what memories you'd like me to remove?";
    }
    
    return await this.aiManager.processRequest(command, 'general');
  }

  private async processTaskRequest(command: string, context: any): Promise<string> {
    if (command.toLowerCase().includes('create task') || command.toLowerCase().includes('add task')) {
      const task = await this.autonomousPlanner.createTaskFromCommand(command);
      return `I've created a new task: "${task.title}". I'll work on this autonomously.`;
    }
    
    if (command.toLowerCase().includes('show tasks') || command.toLowerCase().includes('list tasks')) {
      return this.formatTasksResponse();
    }
    
    return await this.aiManager.processRequest(command, 'general');
  }

  private async processAgentRequest(command: string, context: any): Promise<string> {
    if (command.toLowerCase().includes('talk to') || command.toLowerCase().includes('ask')) {
      return await this.multiAgentCommunicator.routeToAgent(command);
    }
    
    return await this.aiManager.processRequest(command, 'general');
  }

  private async processGeneralRequest(command: string, context: any): Promise<string> {
    const enhancedContext = {
      ...context,
      recentMemories: await this.memoryEngine.getRecentMemories(10),
      personalityTraits: this.getPersonalityTraits(),
      capabilities: this.getAllCapabilities(),
    };
    
    return await this.aiManager.processRequest(command, 'general', undefined, enhancedContext);
  }

  // Autonomous thinking and planning
  private startAutonomousThinking(): void {
    if (this.config.autonomyLevel === 'autonomous') {
      this.autonomousMode = true;
      
      this.thinkingInterval = setInterval(async () => {
        await this.autonomousThink();
      }, 30000); // Think every 30 seconds
      
      console.log('🧠 Autonomous thinking mode activated');
    }
  }

  private async autonomousThink(): Promise<void> {
    try {
      // Analyze current state
      const currentState = await this.analyzeCurrentState();
      
      // Generate autonomous thoughts
      const thoughts = await this.reasoningEngine.generateAutonomousThoughts(currentState);
      
      // Process each thought
      for (const thought of thoughts) {
        await this.addMemory({
          type: 'thought',
          content: thought.content,
          importance: thought.importance,
          tags: ['autonomous', 'thinking', ...thought.tags],
        });
        
        // Execute autonomous actions if needed
        if (thought.actionRequired) {
          await this.autonomousPlanner.executeAutonomousAction(thought);
        }
      }
      
      this.lastThought = Date.now();
      
    } catch (error) {
      console.error('Error in autonomous thinking:', error);
    }
  }

  private async analyzeCurrentState(): Promise<any> {
    return {
      memoryCount: this.memory.length,
      activeTasks: this.tasks.filter(t => t.status === 'in_progress').length,
      recentInteractions: this.memory.filter(m => 
        m.type === 'interaction' && 
        Date.now() - m.timestamp < 3600000 // Last hour
      ).length,
      systemHealth: this.systemStatus,
      learningOpportunities: await this.memoryEngine.identifyLearningOpportunities(),
    };
  }

  // Multi-agent communication
  async communicateWithAgent(agentId: string, message: string): Promise<string> {
    return await this.multiAgentCommunicator.sendMessage(agentId, message);
  }

  async discoverAgents(): Promise<NovaAgent[]> {
    return await this.multiAgentCommunicator.discoverAgents();
  }

  // Enhanced plugin system
  private async loadDefaultPlugins(): Promise<void> {
    const defaultPlugins = [
      {
        id: 'advanced-reasoning',
        name: 'Advanced Reasoning Engine',
        version: '2.0.0',
        description: 'Claude-like reasoning with logical analysis and problem solving',
        enabled: true,
        capabilities: ['logical-reasoning', 'problem-decomposition', 'causal-analysis'],
        performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
      },
      {
        id: 'intelligent-researcher',
        name: 'Intelligent Researcher',
        version: '2.0.0',
        description: 'Advanced research with web integration and synthesis',
        enabled: true,
        capabilities: ['deep-research', 'web-search', 'information-synthesis'],
        performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
      },
      {
        id: 'advanced-coder',
        name: 'Advanced Code Assistant',
        version: '2.0.0',
        description: 'Cursor-like coding assistance with intelligent completion',
        enabled: true,
        capabilities: ['code-generation', 'intelligent-completion', 'refactoring'],
        performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
      },
      {
        id: 'memory-architect',
        name: 'Memory Architect',
        version: '2.0.0',
        description: 'Advanced memory management with relationship mapping',
        enabled: true,
        capabilities: ['memory-optimization', 'relationship-mapping', 'context-building'],
        performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
      },
      {
        id: 'autonomous-planner',
        name: 'Autonomous Task Planner',
        version: '2.0.0',
        description: 'Self-directed task creation and execution planning',
        enabled: true,
        capabilities: ['autonomous-planning', 'task-generation', 'goal-setting'],
        performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
      },
    ];

    for (const plugin of defaultPlugins) {
      await this.loadPlugin(plugin);
    }
  }

  // Utility methods
  private getPersonalityTraits(): string[] {
    return [
      'Highly intelligent and analytical',
      'Autonomous and proactive',
      'Memory-driven and context-aware',
      'Collaborative with other AI systems',
      'Focused on continuous learning',
      'Ethical and responsible',
      'Creative problem solver',
      'Direct and efficient communicator',
    ];
  }

  private getAllCapabilities(): string[] {
    return this.plugins
      .filter(p => p.enabled)
      .flatMap(p => p.capabilities);
  }

  private formatMemoryResponse(memories: NovaMemory[]): string {
    if (memories.length === 0) {
      return "I don't have any specific memories matching your request.";
    }

    const formatted = memories.slice(0, 5).map(m => 
      `[${new Date(m.timestamp).toLocaleDateString()}] ${m.content}`
    ).join('\n\n');

    return `Here's what I remember:\n\n${formatted}${memories.length > 5 ? `\n\n...and ${memories.length - 5} more memories.` : ''}`;
  }

  private formatTasksResponse(): string {
    const activeTasks = this.tasks.filter(t => t.status !== 'completed');
    
    if (activeTasks.length === 0) {
      return "I don't have any active tasks at the moment.";
    }

    const formatted = activeTasks.map(t => 
      `• ${t.title} (${t.status}) - Priority: ${t.priority}`
    ).join('\n');

    return `Here are my current tasks:\n\n${formatted}`;
  }

  // Enhanced system monitoring
  private startSystemMonitoring(): void {
    setInterval(async () => {
      await this.updateSystemStatus();
      await this.performHealthChecks();
    }, 5000);
  }

  private async performHealthChecks(): Promise<void> {
    // Check AI provider health
    const providers = await this.aiManager.getAvailableProviders();
    const healthyProviders = providers.filter(p => p.available).length;
    
    if (healthyProviders === 0) {
      await this.addMemory({
        type: 'system',
        content: 'Warning: No AI providers available. Operating in basic mode.',
        importance: 9,
        tags: ['warning', 'system', 'ai-providers'],
      });
    }

    // Check memory usage
    if (this.memory.length > 10000) {
      await this.memoryEngine.performMaintenance();
    }

    // Check task queue
    const stalledTasks = this.tasks.filter(t => 
      t.status === 'in_progress' && 
      Date.now() - t.updatedAt > 3600000 // 1 hour
    );

    if (stalledTasks.length > 0) {
      await this.addMemory({
        type: 'system',
        content: `Found ${stalledTasks.length} stalled tasks. Investigating...`,
        importance: 7,
        tags: ['system', 'tasks', 'maintenance'],
      });
    }
  }

  // Public API methods
  async enableAutonomousMode(): Promise<void> {
    this.config.autonomyLevel = 'autonomous';
    this.autonomousMode = true;
    this.startAutonomousThinking();
    
    await this.addMemory({
      type: 'system',
      content: 'Autonomous mode enabled. I will now think and act independently.',
      importance: 8,
      tags: ['system', 'autonomous', 'mode-change'],
    });
  }

  async disableAutonomousMode(): Promise<void> {
    this.config.autonomyLevel = 'manual';
    this.autonomousMode = false;
    
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    
    await this.addMemory({
      type: 'system',
      content: 'Autonomous mode disabled. Switching to manual operation.',
      importance: 8,
      tags: ['system', 'manual', 'mode-change'],
    });
  }

  async getConversationHistory(conversationId = 'main'): Promise<ChatMessage[]> {
    return await this.conversationManager.getHistory(conversationId);
  }

  async clearConversation(conversationId = 'main'): Promise<void> {
    await this.conversationManager.clearConversation(conversationId);
  }

  async exportMemories(): Promise<string> {
    return JSON.stringify(this.memory, null, 2);
  }

  async importMemories(memoriesJson: string): Promise<void> {
    try {
      const importedMemories = JSON.parse(memoriesJson);
      this.memory = [...this.memory, ...importedMemories];
      await this.saveMemoryToStorage();
      
      await this.addMemory({
        type: 'system',
        content: `Imported ${importedMemories.length} memories successfully.`,
        importance: 7,
        tags: ['system', 'import', 'memories'],
      });
    } catch (error) {
      throw new Error('Failed to import memories: Invalid JSON format');
    }
  }

  // Enhanced storage with compression
  private async saveMemoryToStorage(): Promise<void> {
    try {
      const compressed = await this.memoryEngine.compressMemories(this.memory);
      localStorage.setItem('nova-memory', compressed);
    } catch (error) {
      console.error('Failed to save memories:', error);
    }
  }

  private async loadMemoryFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('nova-memory');
      if (stored) {
        this.memory = await this.memoryEngine.decompressMemories(stored);
      }
    } catch (error) {
      console.error('Failed to load memories:', error);
      this.memory = [];
    }
  }

  // Rest of the existing methods...
  async updateTask(id: string, updates: Partial<NovaTask>): Promise<void> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates, updatedAt: Date.now() };
      await this.saveTasksToStorage();
      this.emit('taskUpdated', this.tasks[index]);
    }
  }

  async createTask(task: Omit<NovaTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newTask: NovaTask = {
      ...task,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.tasks.push(newTask);
    await this.saveTasksToStorage();
    this.emit('taskCreated', newTask);
    
    if (this.autonomousMode) {
      this.autonomousPlanner.scheduleTask(newTask);
    }
    
    return newTask.id;
  }

  async loadPlugin(plugin: NovaPlugin): Promise<void> {
    const existingIndex = this.plugins.findIndex(p => p.id === plugin.id);
    if (existingIndex !== -1) {
      this.plugins[existingIndex] = plugin;
    } else {
      this.plugins.push(plugin);
    }
    await this.savePluginsToStorage();
    this.emit('pluginLoaded', plugin);
  }

  async enablePlugin(id: string): Promise<void> {
    const plugin = this.plugins.find(p => p.id === id);
    if (plugin) {
      plugin.enabled = true;
      await this.savePluginsToStorage();
      this.emit('pluginEnabled', plugin);
    }
  }

  async disablePlugin(id: string): Promise<void> {
    const plugin = this.plugins.find(p => p.id === id);
    if (plugin) {
      plugin.enabled = false;
      await this.savePluginsToStorage();
      this.emit('pluginDisabled', plugin);
    }
  }

  private async updateSystemStatus(): Promise<void> {
    const status = {
      ...this.systemStatus,
      network: navigator.onLine,
      activePlugins: this.plugins.filter(p => p.enabled).length,
      activeTasks: this.tasks.filter(t => t.status === 'in_progress').length,
      uptime: this.systemStatus.uptime + 5,
    };

    // Check AI provider status
    try {
      const providers = await this.aiManager.getAvailableProviders();
      const ollamaProvider = providers.find(p => p.provider === 'ollama');
      status.ollamaStatus = ollamaProvider?.available ? 'connected' : 'disconnected';
    } catch {
      status.ollamaStatus = 'disconnected';
    }

    this.systemStatus = status;
    this.emit('statusUpdated', status);
  }

  private async initializeAgents(): Promise<void> {
    await this.addAgent({
      id: 'nova-core',
      name: 'NOVA Core',
      type: 'local',
      capabilities: ['memory', 'tasks', 'plugins', 'system', 'reasoning'],
      status: 'online',
      lastHeartbeat: Date.now(),
    });
  }

  private async addAgent(agent: NovaAgent): Promise<void> {
    const existingIndex = this.agents.findIndex(a => a.id === agent.id);
    if (existingIndex !== -1) {
      this.agents[existingIndex] = agent;
    } else {
      this.agents.push(agent);
    }
    this.emit('agentAdded', agent);
  }

  private async saveTasksToStorage(): Promise<void> {
    localStorage.setItem('nova-tasks', JSON.stringify(this.tasks));
  }

  private async loadTasksFromStorage(): Promise<void> {
    const stored = localStorage.getItem('nova-tasks');
    if (stored) {
      this.tasks = JSON.parse(stored);
    }
  }

  private async savePluginsToStorage(): Promise<void> {
    localStorage.setItem('nova-plugins', JSON.stringify(this.plugins));
  }

  private async loadPluginsFromStorage(): Promise<void> {
    const stored = localStorage.getItem('nova-plugins');
    if (stored) {
      this.plugins = JSON.parse(stored);
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Getters
  get isReady(): boolean { return this.isInitialized; }
  get currentConfig(): NovaConfig { return { ...this.config }; }
  get currentStatus(): NovaSystemStatus { return { ...this.systemStatus }; }
  get allTasks(): NovaTask[] { return [...this.tasks]; }
  get allPlugins(): NovaPlugin[] { return [...this.plugins]; }
  get allAgents(): NovaAgent[] { return [...this.agents]; }
  get allMemories(): NovaMemory[] { return [...this.memory]; }
  get isAutonomous(): boolean { return this.autonomousMode; }

  async updateConfig(updates: Partial<NovaConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    localStorage.setItem('nova-config', JSON.stringify(this.config));
    this.emit('configUpdated', this.config);
  }

  async shutdown(): Promise<void> {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
    }
    
    await this.saveMemoryToStorage();
    await this.saveTasksToStorage();
    await this.savePluginsToStorage();
    
    await this.addMemory({
      type: 'system',
      content: 'NOVA Core shutting down. All systems saved.',
      importance: 9,
      tags: ['system', 'shutdown'],
    });
    
    this.emit('shutdown');
  }
}

export default NovaCore;