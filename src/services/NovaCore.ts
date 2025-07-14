import { NovaMemory, NovaTask, NovaPlugin, NovaAgent, NovaSystemStatus, NovaConfig, ChatMessage } from '../types';

class NovaCore {
  private memory: NovaMemory[] = [];
  private tasks: NovaTask[] = [];
  private plugins: NovaPlugin[] = [];
  private agents: NovaAgent[] = [];
  private config: NovaConfig;
  private systemStatus: NovaSystemStatus;
  private isInitialized = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.systemStatus = this.getInitialSystemStatus();
    this.initializeSystem();
  }

  private getDefaultConfig(): NovaConfig {
    return {
      autonomyLevel: 'assisted',
      learningEnabled: true,
      memoryRetentionDays: 30,
      maxConcurrentTasks: 5,
      ollamaEndpoint: 'http://localhost:11434',
      defaultModel: 'llama3.1',
      voiceEnabled: false,
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
      await this.loadMemoryFromStorage();
      await this.loadTasksFromStorage();
      await this.loadPluginsFromStorage();
      await this.initializeAgents();
      await this.checkOllamaConnection();
      this.startSystemMonitoring();
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize NOVA system:', error);
      this.emit('error', error);
    }
  }

  // Memory Management
  async addMemory(memory: Omit<NovaMemory, 'id' | 'timestamp'>): Promise<string> {
    const newMemory: NovaMemory = {
      ...memory,
      id: this.generateId(),
      timestamp: Date.now(),
    };
    
    this.memory.unshift(newMemory);
    await this.saveMemoryToStorage();
    this.emit('memoryAdded', newMemory);
    return newMemory.id;
  }

  getMemory(filters?: { type?: string; tags?: string[]; importance?: number }): NovaMemory[] {
    let filtered = this.memory;
    
    if (filters?.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }
    
    if (filters?.tags) {
      filtered = filtered.filter(m => filters.tags!.some(tag => m.tags.includes(tag)));
    }
    
    if (filters?.importance) {
      filtered = filtered.filter(m => m.importance >= filters.importance!);
    }
    
    return filtered;
  }

  async updateMemory(id: string, updates: Partial<NovaMemory>): Promise<void> {
    const index = this.memory.findIndex(m => m.id === id);
    if (index !== -1) {
      this.memory[index] = { ...this.memory[index], ...updates };
      await this.saveMemoryToStorage();
      this.emit('memoryUpdated', this.memory[index]);
    }
  }

  // Task Management
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
    
    if (this.config.autonomyLevel === 'autonomous') {
      this.executeTask(newTask.id);
    }
    
    return newTask.id;
  }

  async updateTask(id: string, updates: Partial<NovaTask>): Promise<void> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates, updatedAt: Date.now() };
      await this.saveTasksToStorage();
      this.emit('taskUpdated', this.tasks[index]);
    }
  }

  async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await this.updateTask(taskId, { status: 'in_progress' });
      
      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.updateTask(taskId, { 
        status: 'completed',
        result: 'Task completed successfully',
        actualTime: 2000
      });
      
      await this.addMemory({
        type: 'task',
        content: `Completed task: ${task.title}`,
        importance: 5,
        tags: ['task', 'completed'],
        metadata: { taskId }
      });
      
    } catch (error) {
      await this.updateTask(taskId, { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Plugin Management
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

  // Agent Communication
  async sendToAgent(agentId: string, message: string): Promise<string> {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    try {
      if (agent.type === 'ollama') {
        return await this.sendToOllama(message, agent.model);
      } else if (agent.type === 'remote') {
        return await this.sendToRemoteAgent(agent.endpoint!, message);
      }
      return 'Agent communication not implemented';
    } catch (error) {
      throw new Error(`Failed to communicate with agent: ${error}`);
    }
  }

  private async sendToOllama(message: string, model = 'llama3.1'): Promise<string> {
    try {
      const response = await fetch(`${this.config.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: message,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      throw new Error(`Ollama communication failed: ${error}`);
    }
  }

  private async sendToRemoteAgent(endpoint: string, message: string): Promise<string> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Remote agent error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  // System Status
  private startSystemMonitoring(): void {
    setInterval(() => {
      this.updateSystemStatus();
    }, 5000);
  }

  private async updateSystemStatus(): Promise<void> {
    const status = {
      ...this.systemStatus,
      network: navigator.onLine,
      activePlugins: this.plugins.filter(p => p.enabled).length,
      activeTasks: this.tasks.filter(t => t.status === 'in_progress').length,
      uptime: this.systemStatus.uptime + 5,
    };

    // Check Ollama connection
    try {
      const response = await fetch(`${this.config.ollamaEndpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      status.ollamaStatus = response.ok ? 'connected' : 'error';
    } catch {
      status.ollamaStatus = 'disconnected';
    }

    this.systemStatus = status;
    this.emit('statusUpdated', status);
  }

  // Ollama Integration
  private async checkOllamaConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.config.ollamaEndpoint}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        this.systemStatus.ollamaStatus = 'connected';
        
        // Initialize Ollama agent
        await this.addAgent({
          id: 'ollama-local',
          name: 'Ollama Local',
          type: 'ollama',
          model: this.config.defaultModel,
          capabilities: ['chat', 'code', 'reasoning'],
          status: 'online',
          lastHeartbeat: Date.now(),
        });
      }
    } catch (error) {
      this.systemStatus.ollamaStatus = 'disconnected';
      console.warn('Ollama not available:', error);
    }
  }

  private async initializeAgents(): Promise<void> {
    // Initialize built-in agents
    await this.addAgent({
      id: 'nova-core',
      name: 'NOVA Core',
      type: 'local',
      capabilities: ['memory', 'tasks', 'plugins', 'system'],
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

  // Storage Management
  private async loadMemoryFromStorage(): Promise<void> {
    const stored = localStorage.getItem('nova-memory');
    if (stored) {
      this.memory = JSON.parse(stored);
    }
  }

  private async saveMemoryToStorage(): Promise<void> {
    localStorage.setItem('nova-memory', JSON.stringify(this.memory));
  }

  private async loadTasksFromStorage(): Promise<void> {
    const stored = localStorage.getItem('nova-tasks');
    if (stored) {
      this.tasks = JSON.parse(stored);
    }
  }

  private async saveTasksToStorage(): Promise<void> {
    localStorage.setItem('nova-tasks', JSON.stringify(this.tasks));
  }

  private async loadPluginsFromStorage(): Promise<void> {
    const stored = localStorage.getItem('nova-plugins');
    if (stored) {
      this.plugins = JSON.parse(stored);
    } else {
      // Initialize default plugins
      this.plugins = [
        {
          id: 'code-assistant',
          name: 'Code Assistant',
          version: '1.0.0',
          description: 'Advanced coding assistance and analysis',
          enabled: true,
          capabilities: ['code-generation', 'debugging', 'refactoring'],
          performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
        },
        {
          id: 'research-agent',
          name: 'Research Agent',
          version: '1.0.0',
          description: 'Web research and information gathering',
          enabled: true,
          capabilities: ['web-search', 'data-analysis', 'summarization'],
          performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
        },
        {
          id: 'memory-manager',
          name: 'Memory Manager',
          version: '1.0.0',
          description: 'Advanced memory management and learning',
          enabled: true,
          capabilities: ['memory-optimization', 'pattern-recognition', 'learning'],
          performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
        },
      ];
    }
  }

  private async savePluginsToStorage(): Promise<void> {
    localStorage.setItem('nova-plugins', JSON.stringify(this.plugins));
  }

  // Event System
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

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public Getters
  get isReady(): boolean {
    return this.isInitialized;
  }

  get currentConfig(): NovaConfig {
    return { ...this.config };
  }

  get currentStatus(): NovaSystemStatus {
    return { ...this.systemStatus };
  }

  get allTasks(): NovaTask[] {
    return [...this.tasks];
  }

  get allPlugins(): NovaPlugin[] {
    return [...this.plugins];
  }

  get allAgents(): NovaAgent[] {
    return [...this.agents];
  }

  get allMemories(): NovaMemory[] {
    return [...this.memory];
  }

  // Public Methods
  async updateConfig(updates: Partial<NovaConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    localStorage.setItem('nova-config', JSON.stringify(this.config));
    this.emit('configUpdated', this.config);
  }

  async processCommand(command: string): Promise<string> {
    await this.addMemory({
      type: 'interaction',
      content: `User command: ${command}`,
      importance: 5,
      tags: ['command', 'user-input'],
    });

    // Process command through available agents
    if (this.systemStatus.ollamaStatus === 'connected') {
      const response = await this.sendToAgent('ollama-local', command);
      
      await this.addMemory({
        type: 'interaction',
        content: `NOVA response: ${response}`,
        importance: 5,
        tags: ['response', 'ollama'],
      });
      
      return response;
    }

    return 'NOVA system online. Ollama connection required for advanced processing.';
  }

  async shutdown(): Promise<void> {
    await this.saveMemoryToStorage();
    await this.saveTasksToStorage();
    await this.savePluginsToStorage();
    this.emit('shutdown');
  }
}

export default NovaCore;