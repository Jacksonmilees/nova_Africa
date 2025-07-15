import NovaCore from './NovaCore';
import { NovaAgent } from '../types';

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  content: string;
  timestamp: number;
  type: 'request' | 'response' | 'broadcast' | 'heartbeat';
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  name: string;
  description: string;
  parameters: string[];
  returnType: string;
}

export class MultiAgentCommunicator {
  private nova: NovaCore;
  private messageHistory: AgentMessage[] = [];
  private agentRegistry: Map<string, NovaAgent> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(nova: NovaCore) {
    this.nova = nova;
  }

  async initialize(): Promise<void> {
    await this.registerSelfAsAgent();
    await this.startHeartbeat();
    await this.discoverAgents();
    console.log('🤝 Multi-Agent Communicator initialized');
  }

  async sendMessage(agentId: string, content: string): Promise<string> {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in registry`);
    }

    const message: AgentMessage = {
      id: this.generateId(),
      fromAgent: 'nova-core',
      toAgent: agentId,
      content,
      timestamp: Date.now(),
      type: 'request',
    };

    this.messageHistory.push(message);

    try {
      let response: string;

      switch (agent.type) {
        case 'ollama':
          response = await this.sendToOllama(content, agent);
          break;
        case 'api':
          response = await this.sendToApiAgent(content, agent);
          break;
        case 'remote':
          response = await this.sendToRemoteAgent(content, agent);
          break;
        default:
          response = await this.sendToLocalAgent(content, agent);
      }

      // Log response
      const responseMessage: AgentMessage = {
        id: this.generateId(),
        fromAgent: agentId,
        toAgent: 'nova-core',
        content: response,
        timestamp: Date.now(),
        type: 'response',
        metadata: { originalMessageId: message.id },
      };

      this.messageHistory.push(responseMessage);

      // Add to memory
      await this.nova.addMemory({
        type: 'interaction',
        content: `Agent communication with ${agent.name}: ${content} -> ${response.substring(0, 200)}...`,
        importance: 6,
        tags: ['agent-communication', agentId, 'multi-agent'],
        metadata: { agentId, messageId: message.id },
      });

      return response;

    } catch (error) {
      const errorMessage = `Failed to communicate with agent ${agentId}: ${error}`;
      
      await this.nova.addMemory({
        type: 'system',
        content: errorMessage,
        importance: 7,
        tags: ['error', 'agent-communication', agentId],
      });

      throw new Error(errorMessage);
    }
  }

  async routeToAgent(request: string): Promise<string> {
    // Analyze request to determine best agent
    const bestAgent = await this.selectBestAgent(request);
    
    if (!bestAgent) {
      return "I don't have access to any suitable agents for this request.";
    }

    return await this.sendMessage(bestAgent.id, request);
  }

  async broadcastMessage(content: string): Promise<Map<string, string>> {
    const responses = new Map<string, string>();
    const activeAgents = Array.from(this.agentRegistry.values()).filter(a => a.status === 'online');

    for (const agent of activeAgents) {
      try {
        const response = await this.sendMessage(agent.id, content);
        responses.set(agent.id, response);
      } catch (error) {
        responses.set(agent.id, `Error: ${error}`);
      }
    }

    return responses;
  }

  async discoverAgents(): Promise<NovaAgent[]> {
    const discoveredAgents: NovaAgent[] = [];

    // Check for Ollama
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(3000),
      });
      
      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        const models = data.models || [];
        
        for (const model of models) {
          const agent: NovaAgent = {
            id: `ollama-${model.name}`,
            name: `Ollama ${model.name}`,
            type: 'ollama',
            model: model.name,
            capabilities: ['chat', 'reasoning', 'code-assistance'],
            status: 'online',
            lastHeartbeat: Date.now(),
            config: { endpoint: 'http://localhost:11434' },
          };
          
          discoveredAgents.push(agent);
          this.agentRegistry.set(agent.id, agent);
        }
      }
    } catch (error) {
      console.log('Ollama not available for agent discovery');
    }

    // Check for Gemini API
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      const agent: NovaAgent = {
        id: 'gemini-api',
        name: 'Google Gemini',
        type: 'api',
        capabilities: ['chat', 'reasoning', 'research', 'web-search'],
        status: 'online',
        lastHeartbeat: Date.now(),
        config: { 
          apiKey: import.meta.env.VITE_GEMINI_API_KEY,
          model: import.meta.env.VITE_MODEL || 'gemini-1.5-flash',
        },
      };
      
      discoveredAgents.push(agent);
      this.agentRegistry.set(agent.id, agent);
    }

    // Discover network agents (placeholder for future implementation)
    await this.discoverNetworkAgents();

    await this.nova.addMemory({
      type: 'system',
      content: `Discovered ${discoveredAgents.length} agents: ${discoveredAgents.map(a => a.name).join(', ')}`,
      importance: 7,
      tags: ['agent-discovery', 'multi-agent', 'system'],
    });

    return discoveredAgents;
  }

  async getAgentCapabilities(agentId: string): Promise<AgentCapability[]> {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) return [];

    // Return capabilities based on agent type
    const capabilityMap: Record<string, AgentCapability[]> = {
      'ollama': [
        {
          name: 'chat',
          description: 'Natural language conversation',
          parameters: ['message'],
          returnType: 'string',
        },
        {
          name: 'code-assistance',
          description: 'Programming help and code generation',
          parameters: ['code', 'request'],
          returnType: 'string',
        },
        {
          name: 'reasoning',
          description: 'Logical analysis and problem solving',
          parameters: ['problem'],
          returnType: 'string',
        },
      ],
      'api': [
        {
          name: 'research',
          description: 'Web research and information gathering',
          parameters: ['query'],
          returnType: 'string',
        },
        {
          name: 'analysis',
          description: 'Deep analysis and synthesis',
          parameters: ['content'],
          returnType: 'string',
        },
      ],
    };

    return capabilityMap[agent.type] || [];
  }

  async getMessageHistory(agentId?: string): Promise<AgentMessage[]> {
    if (agentId) {
      return this.messageHistory.filter(m => 
        m.fromAgent === agentId || m.toAgent === agentId
      );
    }
    return this.messageHistory;
  }

  async clearMessageHistory(agentId?: string): Promise<void> {
    if (agentId) {
      this.messageHistory = this.messageHistory.filter(m => 
        m.fromAgent !== agentId && m.toAgent !== agentId
      );
    } else {
      this.messageHistory = [];
    }
  }

  private async registerSelfAsAgent(): Promise<void> {
    const selfAgent: NovaAgent = {
      id: 'nova-core',
      name: 'NOVA Core',
      type: 'local',
      capabilities: [
        'memory-management',
        'task-execution',
        'plugin-management',
        'system-monitoring',
        'autonomous-operation',
      ],
      status: 'online',
      lastHeartbeat: Date.now(),
    };

    this.agentRegistry.set(selfAgent.id, selfAgent);
  }

  private async startHeartbeat(): Promise<void> {
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeats();
      await this.checkAgentHealth();
    }, 30000); // Every 30 seconds
  }

  private async sendHeartbeats(): Promise<void> {
    const heartbeatMessage: AgentMessage = {
      id: this.generateId(),
      fromAgent: 'nova-core',
      toAgent: 'broadcast',
      content: 'heartbeat',
      timestamp: Date.now(),
      type: 'heartbeat',
    };

    // Update self heartbeat
    const selfAgent = this.agentRegistry.get('nova-core');
    if (selfAgent) {
      selfAgent.lastHeartbeat = Date.now();
    }
  }

  private async checkAgentHealth(): Promise<void> {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    for (const [agentId, agent] of this.agentRegistry.entries()) {
      if (agent.id === 'nova-core') continue; // Skip self
      
      if (agent.lastHeartbeat && agent.lastHeartbeat < fiveMinutesAgo) {
        agent.status = 'offline';
        
        await this.nova.addMemory({
          type: 'system',
          content: `Agent ${agent.name} appears to be offline (no heartbeat for 5+ minutes)`,
          importance: 6,
          tags: ['agent-health', 'offline', agentId],
        });
      }
    }
  }

  private async selectBestAgent(request: string): Promise<NovaAgent | null> {
    const activeAgents = Array.from(this.agentRegistry.values()).filter(a => 
      a.status === 'online' && a.id !== 'nova-core'
    );

    if (activeAgents.length === 0) return null;

    // Simple agent selection based on capabilities and request content
    const requestLower = request.toLowerCase();
    
    // Prefer Ollama for code-related requests
    if (requestLower.includes('code') || requestLower.includes('programming')) {
      const ollamaAgent = activeAgents.find(a => a.type === 'ollama');
      if (ollamaAgent) return ollamaAgent;
    }

    // Prefer API agents for research
    if (requestLower.includes('research') || requestLower.includes('search')) {
      const apiAgent = activeAgents.find(a => a.type === 'api');
      if (apiAgent) return apiAgent;
    }

    // Return first available agent
    return activeAgents[0];
  }

  private async sendToOllama(content: string, agent: NovaAgent): Promise<string> {
    const endpoint = agent.config?.endpoint || 'http://localhost:11434';
    const model = agent.model || 'llama3.1';

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: content,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  private async sendToApiAgent(content: string, agent: NovaAgent): Promise<string> {
    if (agent.id === 'gemini-api') {
      const apiKey = agent.config?.apiKey;
      const model = agent.config?.model || 'gemini-1.5-flash';

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: content }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error(`Unknown API agent: ${agent.id}`);
  }

  private async sendToRemoteAgent(content: string, agent: NovaAgent): Promise<string> {
    const endpoint = agent.endpoint;
    if (!endpoint) {
      throw new Error(`No endpoint configured for remote agent: ${agent.id}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content }),
    });

    if (!response.ok) {
      throw new Error(`Remote agent error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.message || 'No response';
  }

  private async sendToLocalAgent(content: string, agent: NovaAgent): Promise<string> {
    // Handle local agent communication (placeholder)
    return `Local agent ${agent.name} received: ${content}`;
  }

  private async discoverNetworkAgents(): Promise<void> {
    // Placeholder for network agent discovery
    // In a real implementation, this would scan the network for other NOVA instances
    // or compatible AI agents
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default MultiAgentCommunicator;