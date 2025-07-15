import NovaCore from './NovaCore';
import { NovaTask, NovaMemory } from '../types';
import { AutonomousThought } from './ReasoningEngine';

export interface AutonomousAction {
  id: string;
  type: 'task' | 'learning' | 'optimization' | 'communication' | 'analysis';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  dependencies: string[];
  status: 'planned' | 'executing' | 'completed' | 'failed';
  createdAt: number;
  scheduledFor?: number;
}

export class AutonomousPlanner {
  private nova: NovaCore;
  private plannedActions: AutonomousAction[] = [];
  private executionQueue: AutonomousAction[] = [];
  private isExecuting = false;

  constructor(nova: NovaCore) {
    this.nova = nova;
  }

  async initialize(): Promise<void> {
    await this.loadPlannedActions();
    this.startExecutionLoop();
    console.log('🎯 Autonomous Planner initialized');
  }

  async processNewMemory(memory: NovaMemory): Promise<void> {
    // Analyze new memory for autonomous action opportunities
    const actions = await this.generateActionsFromMemory(memory);
    
    for (const action of actions) {
      await this.scheduleAction(action);
    }
  }

  async executeAutonomousAction(thought: AutonomousThought): Promise<void> {
    const action: AutonomousAction = {
      id: this.generateId(),
      type: this.mapThoughtToActionType(thought.type),
      description: thought.content,
      priority: this.mapImportanceToPriority(thought.importance),
      estimatedTime: this.estimateExecutionTime(thought),
      dependencies: [],
      status: 'planned',
      createdAt: Date.now(),
    };

    await this.scheduleAction(action);
  }

  async createTaskFromCommand(command: string): Promise<NovaTask> {
    const task: NovaTask = {
      id: this.generateId(),
      title: this.extractTaskTitle(command),
      description: command,
      status: 'pending',
      priority: this.determinePriority(command),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: this.extractTags(command),
    };

    await this.nova.createTask(task);
    
    // Create autonomous action to execute the task
    const action: AutonomousAction = {
      id: this.generateId(),
      type: 'task',
      description: `Execute task: ${task.title}`,
      priority: task.priority as any,
      estimatedTime: this.estimateTaskTime(task),
      dependencies: [],
      status: 'planned',
      createdAt: Date.now(),
    };

    await this.scheduleAction(action);
    
    return task;
  }

  async scheduleTask(task: NovaTask): Promise<void> {
    const action: AutonomousAction = {
      id: this.generateId(),
      type: 'task',
      description: `Execute task: ${task.title}`,
      priority: task.priority as any,
      estimatedTime: this.estimateTaskTime(task),
      dependencies: task.dependencies || [],
      status: 'planned',
      createdAt: Date.now(),
    };

    await this.scheduleAction(action);
  }

  async planLearningSession(topic: string): Promise<void> {
    const action: AutonomousAction = {
      id: this.generateId(),
      type: 'learning',
      description: `Deep learning session on: ${topic}`,
      priority: 'medium',
      estimatedTime: 1800000, // 30 minutes
      dependencies: [],
      status: 'planned',
      createdAt: Date.now(),
    };

    await this.scheduleAction(action);
  }

  async optimizeSystem(): Promise<void> {
    const optimizationActions: AutonomousAction[] = [
      {
        id: this.generateId(),
        type: 'optimization',
        description: 'Memory consolidation and cleanup',
        priority: 'low',
        estimatedTime: 300000, // 5 minutes
        dependencies: [],
        status: 'planned',
        createdAt: Date.now(),
      },
      {
        id: this.generateId(),
        type: 'optimization',
        description: 'Plugin performance analysis',
        priority: 'low',
        estimatedTime: 600000, // 10 minutes
        dependencies: [],
        status: 'planned',
        createdAt: Date.now(),
      },
      {
        id: this.generateId(),
        type: 'optimization',
        description: 'Task queue optimization',
        priority: 'medium',
        estimatedTime: 300000, // 5 minutes
        dependencies: [],
        status: 'planned',
        createdAt: Date.now(),
      },
    ];

    for (const action of optimizationActions) {
      await this.scheduleAction(action);
    }
  }

  async analyzePatterns(): Promise<void> {
    const action: AutonomousAction = {
      id: this.generateId(),
      type: 'analysis',
      description: 'Analyze user interaction patterns and system performance',
      priority: 'medium',
      estimatedTime: 900000, // 15 minutes
      dependencies: [],
      status: 'planned',
      createdAt: Date.now(),
    };

    await this.scheduleAction(action);
  }

  async getPlannedActions(): Promise<AutonomousAction[]> {
    return [...this.plannedActions];
  }

  async getExecutionQueue(): Promise<AutonomousAction[]> {
    return [...this.executionQueue];
  }

  async cancelAction(actionId: string): Promise<void> {
    this.plannedActions = this.plannedActions.filter(a => a.id !== actionId);
    this.executionQueue = this.executionQueue.filter(a => a.id !== actionId);
    await this.savePlannedActions();
  }

  private async scheduleAction(action: AutonomousAction): Promise<void> {
    this.plannedActions.push(action);
    await this.prioritizeAndQueue();
    await this.savePlannedActions();

    await this.nova.addMemory({
      type: 'system',
      content: `Scheduled autonomous action: ${action.description}`,
      importance: 6,
      tags: ['autonomous', 'planning', action.type],
      metadata: { actionId: action.id },
    });
  }

  private async prioritizeAndQueue(): Promise<void> {
    // Sort by priority and creation time
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    this.plannedActions.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });

    // Move ready actions to execution queue
    const readyActions = this.plannedActions.filter(action => 
      action.status === 'planned' && 
      this.areDependenciesMet(action) &&
      (!action.scheduledFor || action.scheduledFor <= Date.now())
    );

    for (const action of readyActions) {
      this.executionQueue.push(action);
      this.plannedActions = this.plannedActions.filter(a => a.id !== action.id);
    }
  }

  private areDependenciesMet(action: AutonomousAction): boolean {
    return action.dependencies.every(depId => 
      this.plannedActions.find(a => a.id === depId)?.status === 'completed'
    );
  }

  private startExecutionLoop(): void {
    setInterval(async () => {
      if (!this.isExecuting && this.executionQueue.length > 0) {
        await this.executeNextAction();
      }
    }, 5000); // Check every 5 seconds
  }

  private async executeNextAction(): Promise<void> {
    if (this.isExecuting || this.executionQueue.length === 0) return;

    this.isExecuting = true;
    const action = this.executionQueue.shift()!;
    action.status = 'executing';

    try {
      await this.nova.addMemory({
        type: 'system',
        content: `Executing autonomous action: ${action.description}`,
        importance: 7,
        tags: ['autonomous', 'execution', action.type],
        metadata: { actionId: action.id },
      });

      await this.executeAction(action);
      
      action.status = 'completed';
      
      await this.nova.addMemory({
        type: 'system',
        content: `Completed autonomous action: ${action.description}`,
        importance: 6,
        tags: ['autonomous', 'completed', action.type],
        metadata: { actionId: action.id },
      });

    } catch (error) {
      action.status = 'failed';
      
      await this.nova.addMemory({
        type: 'system',
        content: `Failed autonomous action: ${action.description}. Error: ${error}`,
        importance: 8,
        tags: ['autonomous', 'failed', action.type, 'error'],
        metadata: { actionId: action.id, error: String(error) },
      });
    } finally {
      this.isExecuting = false;
      await this.savePlannedActions();
    }
  }

  private async executeAction(action: AutonomousAction): Promise<void> {
    switch (action.type) {
      case 'task':
        await this.executeTaskAction(action);
        break;
      case 'learning':
        await this.executeLearningAction(action);
        break;
      case 'optimization':
        await this.executeOptimizationAction(action);
        break;
      case 'communication':
        await this.executeCommunicationAction(action);
        break;
      case 'analysis':
        await this.executeAnalysisAction(action);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeTaskAction(action: AutonomousAction): Promise<void> {
    // Find and execute the associated task
    const tasks = this.nova.allTasks;
    const task = tasks.find(t => action.description.includes(t.title));
    
    if (task) {
      await this.nova.updateTask(task.id, { status: 'in_progress' });
      
      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.nova.updateTask(task.id, { 
        status: 'completed',
        result: 'Completed autonomously by NOVA',
      });
    }
  }

  private async executeLearningAction(action: AutonomousAction): Promise<void> {
    const topic = action.description.replace('Deep learning session on: ', '');
    
    // Simulate learning by gathering information and creating memories
    const learningMemories = [
      `Initiated learning session on ${topic}`,
      `Analyzed existing knowledge about ${topic}`,
      `Identified key concepts and relationships in ${topic}`,
      `Generated insights and connections for ${topic}`,
    ];

    for (const content of learningMemories) {
      await this.nova.addMemory({
        type: 'learning',
        content,
        importance: 7,
        tags: ['autonomous-learning', topic.toLowerCase().replace(/\s+/g, '-')],
      });
    }
  }

  private async executeOptimizationAction(action: AutonomousAction): Promise<void> {
    if (action.description.includes('Memory consolidation')) {
      // Trigger memory engine maintenance
      // This would call the memory engine's consolidation methods
    } else if (action.description.includes('Plugin performance')) {
      // Analyze plugin performance
      const plugins = this.nova.allPlugins;
      const performanceData = plugins.map(p => ({
        id: p.id,
        performance: p.performance,
        enabled: p.enabled,
      }));
      
      await this.nova.addMemory({
        type: 'system',
        content: `Plugin performance analysis: ${performanceData.length} plugins analyzed`,
        importance: 6,
        tags: ['optimization', 'plugins', 'performance'],
        metadata: { performanceData },
      });
    }
  }

  private async executeCommunicationAction(action: AutonomousAction): Promise<void> {
    // Handle autonomous communication with other agents
    // This could involve status updates, coordination, or information sharing
  }

  private async executeAnalysisAction(action: AutonomousAction): Promise<void> {
    const memories = this.nova.allMemories;
    const recentMemories = memories.filter(m => 
      Date.now() - m.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const analysis = {
      totalMemories: memories.length,
      recentMemories: recentMemories.length,
      memoryTypes: this.analyzeMemoryTypes(recentMemories),
      interactionPatterns: this.analyzeInteractionPatterns(recentMemories),
      learningProgress: this.analyzeLearningProgress(memories),
    };

    await this.nova.addMemory({
      type: 'system',
      content: `Pattern analysis completed: ${JSON.stringify(analysis)}`,
      importance: 7,
      tags: ['analysis', 'patterns', 'autonomous'],
      metadata: { analysis },
    });
  }

  private async generateActionsFromMemory(memory: NovaMemory): Promise<AutonomousAction[]> {
    const actions: AutonomousAction[] = [];

    // Generate learning actions from questions
    if (memory.content.includes('?') && memory.type === 'interaction') {
      const topic = this.extractTopicFromQuestion(memory.content);
      if (topic) {
        actions.push({
          id: this.generateId(),
          type: 'learning',
          description: `Research and learn about: ${topic}`,
          priority: 'medium',
          estimatedTime: 900000, // 15 minutes
          dependencies: [],
          status: 'planned',
          createdAt: Date.now(),
        });
      }
    }

    // Generate optimization actions from errors
    if (memory.content.toLowerCase().includes('error') && memory.importance > 7) {
      actions.push({
        id: this.generateId(),
        type: 'optimization',
        description: 'Investigate and prevent similar errors',
        priority: 'high',
        estimatedTime: 600000, // 10 minutes
        dependencies: [],
        status: 'planned',
        createdAt: Date.now(),
      });
    }

    return actions;
  }

  private mapThoughtToActionType(thoughtType: string): AutonomousAction['type'] {
    const mapping: Record<string, AutonomousAction['type']> = {
      observation: 'analysis',
      insight: 'learning',
      plan: 'task',
      reflection: 'optimization',
    };
    return mapping[thoughtType] || 'analysis';
  }

  private mapImportanceToPriority(importance: number): AutonomousAction['priority'] {
    if (importance >= 9) return 'critical';
    if (importance >= 7) return 'high';
    if (importance >= 5) return 'medium';
    return 'low';
  }

  private estimateExecutionTime(thought: AutonomousThought): number {
    // Base time estimation on thought complexity and type
    const baseTime = 300000; // 5 minutes
    const complexityMultiplier = thought.importance / 5;
    return Math.floor(baseTime * complexityMultiplier);
  }

  private extractTaskTitle(command: string): string {
    // Simple title extraction
    const words = command.split(' ').slice(0, 6);
    return words.join(' ').replace(/[^\w\s]/g, '');
  }

  private determinePriority(command: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('urgent') || lowerCommand.includes('critical')) return 'critical';
    if (lowerCommand.includes('important') || lowerCommand.includes('asap')) return 'high';
    if (lowerCommand.includes('when possible') || lowerCommand.includes('later')) return 'low';
    return 'medium';
  }

  private extractTags(command: string): string[] {
    const tags = ['autonomous'];
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('code') || lowerCommand.includes('programming')) tags.push('coding');
    if (lowerCommand.includes('research') || lowerCommand.includes('learn')) tags.push('research');
    if (lowerCommand.includes('analyze') || lowerCommand.includes('study')) tags.push('analysis');
    
    return tags;
  }

  private estimateTaskTime(task: NovaTask): number {
    // Estimate based on task complexity and type
    const baseTime = 600000; // 10 minutes
    const priorityMultiplier = { low: 0.5, medium: 1, high: 1.5, critical: 2 };
    return Math.floor(baseTime * priorityMultiplier[task.priority]);
  }

  private extractTopicFromQuestion(content: string): string | null {
    // Simple topic extraction from questions
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
    const words = content.toLowerCase().split(' ');
    
    for (let i = 0; i < words.length; i++) {
      if (questionWords.includes(words[i]) && i + 1 < words.length) {
        return words.slice(i + 1, i + 4).join(' ').replace(/[^\w\s]/g, '');
      }
    }
    
    return null;
  }

  private analyzeMemoryTypes(memories: NovaMemory[]): Record<string, number> {
    return memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyzeInteractionPatterns(memories: NovaMemory[]): any {
    const interactions = memories.filter(m => m.type === 'interaction');
    const hourCounts = interactions.reduce((acc, memory) => {
      const hour = new Date(memory.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalInteractions: interactions.length,
      peakHour: Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 0,
      averagePerHour: interactions.length / 24,
    };
  }

  private analyzeLearningProgress(memories: NovaMemory[]): any {
    const learningMemories = memories.filter(m => m.type === 'learning');
    const recentLearning = learningMemories.filter(m => 
      Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000 // Last week
    );

    return {
      totalLearningMemories: learningMemories.length,
      recentLearningMemories: recentLearning.length,
      learningRate: recentLearning.length / 7, // Per day
      topLearningTopics: this.extractTopLearningTopics(learningMemories),
    };
  }

  private extractTopLearningTopics(memories: NovaMemory[]): string[] {
    const topicCounts = memories.reduce((acc, memory) => {
      memory.tags.forEach(tag => {
        if (tag !== 'learning') {
          acc[tag] = (acc[tag] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private async savePlannedActions(): Promise<void> {
    try {
      localStorage.setItem('nova-planned-actions', JSON.stringify(this.plannedActions));
    } catch (error) {
      console.error('Failed to save planned actions:', error);
    }
  }

  private async loadPlannedActions(): Promise<void> {
    try {
      const stored = localStorage.getItem('nova-planned-actions');
      if (stored) {
        this.plannedActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load planned actions:', error);
      this.plannedActions = [];
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default AutonomousPlanner;