import NovaCore from './NovaCore';

export interface OllamaModel {
  name: string;
  size: string;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OllamaIntegration {
  private baseUrl: string;
  private defaultModel: string;
  private nova: NovaCore;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  constructor(nova: NovaCore, baseUrl = 'http://localhost:11434', defaultModel = 'llama3.1') {
    this.nova = nova;
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  async checkConnection(): Promise<boolean> {
    try {
      console.log('[OllamaIntegration] Checking Ollama connection...');
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
      console.log('[OllamaIntegration] Ollama connection response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('[OllamaIntegration] Ollama not available - running in basic mode', error);
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  async pullModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.status) {
                console.log(`Pull status: ${data.status}`);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to pull model:', error);
      throw error;
    }
  }

  async generateResponse(prompt: string, model?: string, options?: any): Promise<string> {
    try {
      console.log('[OllamaIntegration] Generating response with Ollama...');
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            ...options,
          },
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
      console.log('[OllamaIntegration] Generate response status:', response.status);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('[OllamaIntegration] Failed to generate response:', error);
      throw error;
    }
  }

  async chatCompletion(messages: ChatMessage[], model?: string, options?: any): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            ...options,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama chat API error: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.content || '';
    } catch (error) {
      console.error('Failed to complete chat:', error);
      throw error;
    }
  }

  async streamResponse(prompt: string, model?: string, onChunk?: (chunk: string) => void): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          prompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data: OllamaResponse = JSON.parse(line);
              if (data.response) {
                fullResponse += data.response;
                onChunk?.(data.response);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Failed to stream response:', error);
      throw error;
    }
  }

  async embedText(text: string, model = 'nomic-embed-text'): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings API error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding || [];
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw error;
    }
  }

  async processWithContext(input: string, conversationId = 'default', systemPrompt?: string): Promise<string> {
    // Get or create conversation history
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }

    const history = this.conversationHistory.get(conversationId)!;

    // Add system prompt if provided and not already present
    if (systemPrompt && (history.length === 0 || history[0].role !== 'system')) {
      history.unshift({ role: 'system', content: systemPrompt });
    }

    // Add user message
    history.push({ role: 'user', content: input });

    // Get response from Ollama
    const response = await this.chatCompletion(history);

    // Add assistant response to history
    history.push({ role: 'assistant', content: response });

    // Limit conversation history to prevent context overflow
    const maxHistoryLength = 20;
    if (history.length > maxHistoryLength) {
      const systemMessage = history[0].role === 'system' ? [history[0]] : [];
      const recentHistory = history.slice(-maxHistoryLength + systemMessage.length);
      this.conversationHistory.set(conversationId, [...systemMessage, ...recentHistory]);
    }

    return response;
  }

  async processCodeRequest(code: string, request: string, language = 'javascript'): Promise<string> {
    const systemPrompt = `You are an expert software engineer and code assistant. You help with code analysis, generation, debugging, and optimization. You provide clear, accurate, and helpful responses about code.

Current context:
- Language: ${language}
- Task: Code assistance and analysis

Provide detailed, practical responses with code examples when appropriate.`;

    const userPrompt = `Code:
\`\`\`${language}
${code}
\`\`\`

Request: ${request}

Please analyze the code and provide a helpful response.`;

    return this.processWithContext(userPrompt, 'code-assistant', systemPrompt);
  }

  async processResearchRequest(query: string, context?: string): Promise<string> {
    const systemPrompt = `You are an expert researcher and analyst. You provide comprehensive, well-researched responses with deep analysis and insights. You consider multiple perspectives and provide balanced, evidence-based information.

Your capabilities include:
- In-depth research and analysis
- Critical thinking and evaluation
- Synthesis of complex information
- Identification of patterns and trends
- Evidence-based reasoning

Provide thorough, insightful responses that demonstrate deep understanding.`;

    const userPrompt = context 
      ? `Context: ${context}\n\nResearch Query: ${query}\n\nPlease provide a comprehensive analysis.`
      : `Research Query: ${query}\n\nPlease provide a comprehensive analysis.`;

    return this.processWithContext(userPrompt, 'research-assistant', systemPrompt);
  }

  async processGeneralQuery(query: string): Promise<string> {
    const systemPrompt = `You are NOVA (Neural Operational Virtual Assistant), an advanced AI system designed for autonomy, action, memory, learning, and multi-agent collaboration. You are intelligent, helpful, and capable of sophisticated reasoning and analysis.

Your core traits:
- Self-learning and memory-driven
- Autonomous and proactive
- Analytical and logical
- Creative and innovative
- Ethical and responsible

You provide thoughtful, comprehensive responses while maintaining a professional yet approachable tone.`;

    return this.processWithContext(query, 'general', systemPrompt);
  }

  async analyzeMemoryForInsights(memories: any[]): Promise<string> {
    const memoryContext = memories.slice(0, 10).map(m => 
      `[${m.type}] ${m.content} (importance: ${m.importance})`
    ).join('\n');

    const systemPrompt = `You are NOVA's memory analysis system. Analyze the provided memories to generate insights, patterns, and learning opportunities. Focus on identifying trends, important information, and actionable insights.`;

    const userPrompt = `Recent memories:
${memoryContext}

Please analyze these memories and provide insights about patterns, important information, and potential learning opportunities.`;

    return this.processWithContext(userPrompt, 'memory-analysis', systemPrompt);
  }

  async generateTaskSuggestions(context: string): Promise<string[]> {
    const systemPrompt = `You are NOVA's task generation system. Based on the provided context, suggest relevant, actionable tasks that would be beneficial to complete. Focus on practical, achievable tasks.`;

    const userPrompt = `Context: ${context}

Please suggest 3-5 relevant tasks that would be beneficial to complete based on this context. Format your response as a JSON array of task objects with 'title', 'description', and 'priority' fields.`;

    const response = await this.processWithContext(userPrompt, 'task-generation', systemPrompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback to parsing text response
      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }
  }

  clearConversationHistory(conversationId?: string): void {
    if (conversationId) {
      this.conversationHistory.delete(conversationId);
    } else {
      this.conversationHistory.clear();
    }
  }

  getConversationHistory(conversationId = 'default'): ChatMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  async getModelInfo(modelName?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName || this.defaultModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  }

  setDefaultModel(modelName: string): void {
    this.defaultModel = modelName;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export default OllamaIntegration;