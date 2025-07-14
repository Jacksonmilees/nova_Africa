export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    index: number;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export class GeminiIntegration {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private serpApiKey: string;
  private debug: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.model = import.meta.env.VITE_MODEL || 'gemini-1.5-flash';
    this.serpApiKey = import.meta.env.VITE_SERPAPI_KEY || '';
    this.debug = import.meta.env.VITE_DEBUG === 'true';
  }

  async checkConnection(): Promise<boolean> {
    if (!this.apiKey) {
      if (this.debug) console.log('Gemini API key not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      if (this.debug) console.log('Gemini not available:', error);
      return false;
    }
  }

  async generateResponse(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}`
        : prompt;

      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('No response generated');
    } catch (error) {
      if (this.debug) console.error('Gemini generation failed:', error);
      throw error;
    }
  }

  async searchWeb(query: string, numResults = 5): Promise<SearchResult[]> {
    if (!this.serpApiKey) {
      throw new Error('SERPAPI key not configured');
    }

    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: query,
        api_key: this.serpApiKey,
        num: numResults.toString(),
      });

      const response = await fetch(`https://serpapi.com/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`SERPAPI error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.organic_results) {
        return data.organic_results.map((result: any, index: number) => ({
          title: result.title || '',
          link: result.link || '',
          snippet: result.snippet || '',
          position: index + 1,
        }));
      }
      
      return [];
    } catch (error) {
      if (this.debug) console.error('Web search failed:', error);
      throw error;
    }
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

    return this.generateResponse(userPrompt, systemPrompt);
  }

  async processResearchRequest(query: string, useWebSearch = true): Promise<string> {
    let context = '';
    
    if (useWebSearch && this.serpApiKey) {
      try {
        const searchResults = await this.searchWeb(query, 3);
        context = `Recent web search results for "${query}":\n\n` +
          searchResults.map(result => 
            `${result.position}. ${result.title}\n${result.snippet}\nSource: ${result.link}`
          ).join('\n\n') + '\n\n';
      } catch (error) {
        if (this.debug) console.log('Web search failed, proceeding without:', error);
      }
    }

    const systemPrompt = `You are an expert researcher and analyst. You provide comprehensive, well-researched responses with deep analysis and insights. You consider multiple perspectives and provide balanced, evidence-based information.

Your capabilities include:
- In-depth research and analysis
- Critical thinking and evaluation
- Synthesis of complex information
- Identification of patterns and trends
- Evidence-based reasoning

Provide thorough, insightful responses that demonstrate deep understanding.`;

    const userPrompt = context 
      ? `${context}Research Query: ${query}\n\nPlease provide a comprehensive analysis based on the search results and your knowledge.`
      : `Research Query: ${query}\n\nPlease provide a comprehensive analysis.`;

    return this.generateResponse(userPrompt, systemPrompt);
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

    return this.generateResponse(query, systemPrompt);
  }

  async analyzeMemoryForInsights(memories: any[]): Promise<string> {
    const memoryContext = memories.slice(0, 10).map(m => 
      `[${m.type}] ${m.content} (importance: ${m.importance})`
    ).join('\n');

    const systemPrompt = `You are NOVA's memory analysis system. Analyze the provided memories to generate insights, patterns, and learning opportunities. Focus on identifying trends, important information, and actionable insights.`;

    const userPrompt = `Recent memories:
${memoryContext}

Please analyze these memories and provide insights about patterns, important information, and potential learning opportunities.`;

    return this.generateResponse(userPrompt, systemPrompt);
  }

  async generateTaskSuggestions(context: string): Promise<string[]> {
    const systemPrompt = `You are NOVA's task generation system. Based on the provided context, suggest relevant, actionable tasks that would be beneficial to complete. Focus on practical, achievable tasks.`;

    const userPrompt = `Context: ${context}

Please suggest 3-5 relevant tasks that would be beneficial to complete based on this context. Format your response as a JSON array of task objects with 'title', 'description', and 'priority' fields.`;

    const response = await this.generateResponse(userPrompt, systemPrompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback to parsing text response
      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  isSerpApiConfigured(): boolean {
    return !!this.serpApiKey;
  }

  getModel(): string {
    return this.model;
  }

  setModel(model: string): void {
    this.model = model;
  }
}

export default GeminiIntegration;