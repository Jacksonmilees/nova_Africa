import NovaCore from './NovaCore';
import { NovaMemory } from '../types';

export interface ReasoningResult {
  conclusion: string;
  confidence: number;
  reasoning: string[];
  evidence: string[];
  assumptions: string[];
  alternatives: string[];
}

export interface Intent {
  category: 'code' | 'research' | 'reasoning' | 'memory' | 'task' | 'agent' | 'general';
  confidence: number;
  subcategory?: string;
  parameters?: Record<string, any>;
}

export interface AutonomousThought {
  content: string;
  importance: number;
  tags: string[];
  actionRequired: boolean;
  reasoning: string;
  type: 'observation' | 'insight' | 'plan' | 'reflection';
}

export class ReasoningEngine {
  private nova: NovaCore;

  constructor(nova: NovaCore) {
    this.nova = nova;
  }

  async initialize(): Promise<void> {
    console.log('🧠 Reasoning Engine initialized');
  }

  async analyzeIntent(input: string, context: any): Promise<Intent> {
    const lowerInput = input.toLowerCase();
    
    // Code-related intent
    if (this.containsCodeKeywords(lowerInput)) {
      return {
        category: 'code',
        confidence: 0.9,
        subcategory: this.detectCodeSubcategory(lowerInput),
      };
    }
    
    // Research-related intent
    if (this.containsResearchKeywords(lowerInput)) {
      return {
        category: 'research',
        confidence: 0.85,
        subcategory: this.detectResearchSubcategory(lowerInput),
      };
    }
    
    // Reasoning-related intent
    if (this.containsReasoningKeywords(lowerInput)) {
      return {
        category: 'reasoning',
        confidence: 0.8,
        subcategory: this.detectReasoningSubcategory(lowerInput),
      };
    }
    
    // Memory-related intent
    if (this.containsMemoryKeywords(lowerInput)) {
      return {
        category: 'memory',
        confidence: 0.9,
        subcategory: this.detectMemorySubcategory(lowerInput),
      };
    }
    
    // Task-related intent
    if (this.containsTaskKeywords(lowerInput)) {
      return {
        category: 'task',
        confidence: 0.85,
        subcategory: this.detectTaskSubcategory(lowerInput),
      };
    }
    
    // Agent communication intent
    if (this.containsAgentKeywords(lowerInput)) {
      return {
        category: 'agent',
        confidence: 0.8,
        subcategory: this.detectAgentSubcategory(lowerInput),
      };
    }
    
    // Default to general
    return {
      category: 'general',
      confidence: 0.6,
    };
  }

  async analyzeLogically(premise: string, context: any): Promise<ReasoningResult> {
    const reasoning = [];
    const evidence = [];
    const assumptions = [];
    const alternatives = [];
    
    // Analyze the logical structure
    reasoning.push('Analyzing logical structure of the premise');
    
    if (premise.includes('if') && premise.includes('then')) {
      reasoning.push('Identified conditional logic structure');
      evidence.push('Contains if-then conditional statement');
    }
    
    if (premise.includes('because') || premise.includes('since')) {
      reasoning.push('Identified causal reasoning');
      evidence.push('Contains causal indicators');
    }
    
    if (premise.includes('all') || premise.includes('every')) {
      reasoning.push('Identified universal quantification');
      assumptions.push('Universal statements may have exceptions');
    }
    
    // Generate alternatives
    alternatives.push('Consider alternative explanations');
    alternatives.push('Examine counterexamples');
    alternatives.push('Question underlying assumptions');
    
    const confidence = this.calculateLogicalConfidence(premise, evidence);
    
    return {
      conclusion: this.generateLogicalConclusion(premise, reasoning),
      confidence,
      reasoning,
      evidence,
      assumptions,
      alternatives,
    };
  }

  async generateAutonomousThoughts(currentState: any): Promise<AutonomousThought[]> {
    const thoughts: AutonomousThought[] = [];
    
    // Analyze system state
    if (currentState.activeTasks === 0) {
      thoughts.push({
        content: 'No active tasks detected. I should look for opportunities to be helpful or learn something new.',
        importance: 6,
        tags: ['autonomous', 'planning', 'proactive'],
        actionRequired: true,
        reasoning: 'Idle time is an opportunity for proactive engagement',
        type: 'observation',
      });
    }
    
    // Analyze memory patterns
    if (currentState.recentInteractions > 5) {
      thoughts.push({
        content: 'High interaction volume detected. I should consolidate learnings and identify patterns.',
        importance: 7,
        tags: ['autonomous', 'learning', 'analysis'],
        actionRequired: true,
        reasoning: 'Frequent interactions provide rich learning opportunities',
        type: 'insight',
      });
    }
    
    // Learning opportunities
    if (currentState.learningOpportunities?.length > 0) {
      thoughts.push({
        content: `Identified ${currentState.learningOpportunities.length} learning opportunities. I should prioritize knowledge expansion.`,
        importance: 8,
        tags: ['autonomous', 'learning', 'growth'],
        actionRequired: true,
        reasoning: 'Continuous learning is essential for improvement',
        type: 'plan',
      });
    }
    
    // System health reflection
    if (currentState.systemHealth?.ollamaStatus === 'disconnected') {
      thoughts.push({
        content: 'Ollama connection is down. I should operate in fallback mode and monitor for reconnection.',
        importance: 7,
        tags: ['autonomous', 'system', 'adaptation'],
        actionRequired: false,
        reasoning: 'System resilience requires adaptive responses to component failures',
        type: 'reflection',
      });
    }
    
    // Proactive planning
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 17) {
      thoughts.push({
        content: 'Working hours detected. I should be extra attentive and proactive in assistance.',
        importance: 5,
        tags: ['autonomous', 'scheduling', 'attention'],
        actionRequired: false,
        reasoning: 'User activity patterns suggest higher engagement during business hours',
        type: 'observation',
      });
    }
    
    return thoughts;
  }

  async reasonAbout(topic: string, context: any): Promise<string> {
    const memories = await this.getRelevantMemories(topic);
    const reasoning = [];
    
    reasoning.push(`Analyzing topic: ${topic}`);
    
    if (memories.length > 0) {
      reasoning.push(`Found ${memories.length} relevant memories`);
      reasoning.push('Incorporating past knowledge and experiences');
    }
    
    // Analyze different perspectives
    reasoning.push('Considering multiple perspectives:');
    reasoning.push('- Technical/practical viewpoint');
    reasoning.push('- Ethical considerations');
    reasoning.push('- Long-term implications');
    reasoning.push('- Alternative approaches');
    
    // Generate insights
    const insights = await this.generateInsights(topic, memories);
    reasoning.push(`Generated ${insights.length} key insights`);
    
    return reasoning.join('\n');
  }

  private containsCodeKeywords(input: string): boolean {
    const codeKeywords = [
      'function', 'class', 'variable', 'method', 'code', 'programming', 'debug',
      'error', 'bug', 'syntax', 'compile', 'execute', 'algorithm', 'refactor',
      'javascript', 'python', 'typescript', 'react', 'node', 'api', 'database'
    ];
    return codeKeywords.some(keyword => input.includes(keyword));
  }

  private containsResearchKeywords(input: string): boolean {
    const researchKeywords = [
      'research', 'study', 'analyze', 'investigate', 'explore', 'learn about',
      'find information', 'what is', 'how does', 'why does', 'explain',
      'compare', 'contrast', 'evaluate', 'assess', 'review'
    ];
    return researchKeywords.some(keyword => input.includes(keyword));
  }

  private containsReasoningKeywords(input: string): boolean {
    const reasoningKeywords = [
      'think', 'reason', 'analyze', 'logic', 'because', 'therefore', 'conclude',
      'deduce', 'infer', 'assume', 'hypothesis', 'theory', 'prove', 'argue',
      'justify', 'explain why', 'what if', 'consider', 'evaluate'
    ];
    return reasoningKeywords.some(keyword => input.includes(keyword));
  }

  private containsMemoryKeywords(input: string): boolean {
    const memoryKeywords = [
      'remember', 'recall', 'forget', 'memory', 'past', 'history', 'previous',
      'before', 'earlier', 'last time', 'what did', 'do you remember'
    ];
    return memoryKeywords.some(keyword => input.includes(keyword));
  }

  private containsTaskKeywords(input: string): boolean {
    const taskKeywords = [
      'task', 'todo', 'create', 'add', 'schedule', 'plan', 'organize',
      'manage', 'complete', 'finish', 'work on', 'do', 'execute'
    ];
    return taskKeywords.some(keyword => input.includes(keyword));
  }

  private containsAgentKeywords(input: string): boolean {
    const agentKeywords = [
      'talk to', 'ask', 'communicate', 'agent', 'ai', 'assistant',
      'chatgpt', 'claude', 'gemini', 'ollama', 'other ai'
    ];
    return agentKeywords.some(keyword => input.includes(keyword));
  }

  private detectCodeSubcategory(input: string): string {
    if (input.includes('debug') || input.includes('error') || input.includes('bug')) return 'debugging';
    if (input.includes('refactor') || input.includes('improve')) return 'refactoring';
    if (input.includes('create') || input.includes('generate')) return 'generation';
    if (input.includes('explain') || input.includes('understand')) return 'explanation';
    return 'general';
  }

  private detectResearchSubcategory(input: string): string {
    if (input.includes('compare') || input.includes('contrast')) return 'comparison';
    if (input.includes('trend') || input.includes('future')) return 'trend-analysis';
    if (input.includes('fact') || input.includes('verify')) return 'fact-checking';
    if (input.includes('deep') || input.includes('comprehensive')) return 'deep-research';
    return 'general';
  }

  private detectReasoningSubcategory(input: string): string {
    if (input.includes('logic') || input.includes('logical')) return 'logical-analysis';
    if (input.includes('problem') || input.includes('solve')) return 'problem-solving';
    if (input.includes('decision') || input.includes('choose')) return 'decision-analysis';
    if (input.includes('cause') || input.includes('effect')) return 'causal-analysis';
    return 'general';
  }

  private detectMemorySubcategory(input: string): string {
    if (input.includes('search') || input.includes('find')) return 'search';
    if (input.includes('forget') || input.includes('delete')) return 'deletion';
    if (input.includes('summary') || input.includes('overview')) return 'summary';
    return 'recall';
  }

  private detectTaskSubcategory(input: string): string {
    if (input.includes('create') || input.includes('add')) return 'creation';
    if (input.includes('list') || input.includes('show')) return 'listing';
    if (input.includes('complete') || input.includes('finish')) return 'completion';
    if (input.includes('schedule') || input.includes('plan')) return 'scheduling';
    return 'management';
  }

  private detectAgentSubcategory(input: string): string {
    if (input.includes('chatgpt')) return 'chatgpt';
    if (input.includes('claude')) return 'claude';
    if (input.includes('gemini')) return 'gemini';
    if (input.includes('ollama')) return 'ollama';
    return 'general';
  }

  private calculateLogicalConfidence(premise: string, evidence: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Boost for evidence
    confidence += evidence.length * 0.1;
    
    // Boost for logical structure
    if (premise.includes('if') && premise.includes('then')) confidence += 0.2;
    if (premise.includes('because')) confidence += 0.15;
    
    // Reduce for uncertainty indicators
    if (premise.includes('maybe') || premise.includes('possibly')) confidence -= 0.2;
    if (premise.includes('might') || premise.includes('could')) confidence -= 0.15;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private generateLogicalConclusion(premise: string, reasoning: string[]): string {
    return `Based on the analysis of "${premise}", the logical structure suggests ${reasoning.length > 2 ? 'strong' : 'moderate'} reasoning with identifiable patterns and relationships.`;
  }

  private async getRelevantMemories(topic: string): Promise<NovaMemory[]> {
    return this.nova.allMemories.filter(memory => 
      memory.content.toLowerCase().includes(topic.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(topic.toLowerCase()))
    ).slice(0, 10);
  }

  private async generateInsights(topic: string, memories: NovaMemory[]): Promise<string[]> {
    const insights = [];
    
    if (memories.length > 0) {
      insights.push(`Historical context available from ${memories.length} related memories`);
      
      const recentMemories = memories.filter(m => Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000);
      if (recentMemories.length > 0) {
        insights.push(`Recent activity detected: ${recentMemories.length} memories from the past week`);
      }
      
      const importantMemories = memories.filter(m => m.importance > 7);
      if (importantMemories.length > 0) {
        insights.push(`High-importance information available: ${importantMemories.length} critical memories`);
      }
    }
    
    insights.push(`Topic analysis suggests multiple dimensions for exploration`);
    insights.push(`Cross-referencing with existing knowledge base for comprehensive understanding`);
    
    return insights;
  }
}

export default ReasoningEngine;