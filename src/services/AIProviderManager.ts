import OllamaIntegration from './OllamaIntegration';
import GeminiIntegration from './GeminiIntegration';
import NovaCore from './NovaCore';

export type AIProvider = 'ollama' | 'gemini' | 'fallback';

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model?: string;
  tokens?: number;
}

export class AIProviderManager {
  private ollama: OllamaIntegration;
  private gemini: GeminiIntegration;
  private nova: NovaCore;
  private preferredProvider: AIProvider = 'ollama';
  private debug: boolean;

  constructor(nova: NovaCore) {
    this.nova = nova;
    this.ollama = new OllamaIntegration(nova);
    this.gemini = new GeminiIntegration();
    this.debug = import.meta.env.VITE_DEBUG === 'true';
  }

  async initialize(): Promise<void> {
    // Check provider availability
    const ollamaAvailable = await this.ollama.checkConnection();
    const geminiAvailable = await this.gemini.checkConnection();

    if (this.debug) {
      console.log('AI Provider Status:', {
        ollama: ollamaAvailable,
        gemini: geminiAvailable,
        serpApi: this.gemini.isSerpApiConfigured(),
      });
    }

    // Set preferred provider based on availability
    if (ollamaAvailable) {
      this.preferredProvider = 'ollama';
    } else if (geminiAvailable) {
      this.preferredProvider = 'gemini';
    } else {
      this.preferredProvider = 'fallback';
    }

    if (this.debug) {
      console.log('Preferred AI provider:', this.preferredProvider);
    }
  }

  async processRequest(
    input: string, 
    mode: 'general' | 'code' | 'research' | 'reasoning' = 'general',
    forceProvider?: AIProvider
  ): Promise<AIResponse> {
    const provider = forceProvider || this.preferredProvider;

    try {
      switch (provider) {
        case 'ollama':
          return await this.processWithOllama(input, mode);
        case 'gemini':
          return await this.processWithGemini(input, mode);
        default:
          return await this.processWithFallback(input, mode);
      }
    } catch (error) {
      if (this.debug) {
        console.error(`${provider} processing failed:`, error);
      }
      
      // Try fallback providers
      if (provider === 'ollama') {
        try {
          return await this.processWithGemini(input, mode);
        } catch (geminiError) {
          return await this.processWithFallback(input, mode);
        }
      } else if (provider === 'gemini') {
        return await this.processWithFallback(input, mode);
      } else {
        throw error;
      }
    }
  }

  private async processWithOllama(input: string, mode: string): Promise<AIResponse> {
    let response: string;
    
    switch (mode) {
      case 'code':
        response = await this.ollama.processCodeRequest('', input);
        break;
      case 'research':
        response = await this.ollama.processResearchRequest(input);
        break;
      case 'reasoning':
        response = await this.ollama.processGeneralQuery(`Please analyze this logically and provide detailed reasoning: ${input}`);
        break;
      default:
        response = await this.ollama.processGeneralQuery(input);
    }

    return {
      content: response,
      provider: 'ollama',
      model: this.ollama.getDefaultModel(),
    };
  }

  private async processWithGemini(input: string, mode: string): Promise<AIResponse> {
    let response: string;
    
    switch (mode) {
      case 'code':
        response = await this.gemini.processCodeRequest('', input);
        break;
      case 'research':
        response = await this.gemini.processResearchRequest(input, true);
        break;
      case 'reasoning':
        response = await this.gemini.processGeneralQuery(`Please analyze this logically and provide detailed reasoning: ${input}`);
        break;
      default:
        response = await this.gemini.processGeneralQuery(input);
    }

    return {
      content: response,
      provider: 'gemini',
      model: this.gemini.getModel(),
    };
  }

  private async processWithFallback(input: string, mode: string): Promise<AIResponse> {
    // Basic NOVA processing as fallback
    const response = await this.nova.processCommand(input);
    
    return {
      content: response,
      provider: 'fallback',
      model: 'nova-core',
    };
  }

  async getAvailableProviders(): Promise<{ provider: AIProvider; available: boolean; model?: string }[]> {
    const providers = [
      {
        provider: 'ollama' as AIProvider,
        available: await this.ollama.checkConnection(),
        model: this.ollama.getDefaultModel(),
      },
      {
        provider: 'gemini' as AIProvider,
        available: await this.gemini.checkConnection(),
        model: this.gemini.getModel(),
      },
      {
        provider: 'fallback' as AIProvider,
        available: true,
        model: 'nova-core',
      },
    ];

    return providers;
  }

  setPreferredProvider(provider: AIProvider): void {
    this.preferredProvider = provider;
    if (this.debug) {
      console.log('Preferred provider changed to:', provider);
    }
  }

  getPreferredProvider(): AIProvider {
    return this.preferredProvider;
  }

  async searchWeb(query: string): Promise<any[]> {
    if (this.gemini.isSerpApiConfigured()) {
      try {
        return await this.gemini.searchWeb(query);
      } catch (error) {
        if (this.debug) {
          console.error('Web search failed:', error);
        }
        return [];
      }
    }
    return [];
  }

  getOllamaIntegration(): OllamaIntegration {
    return this.ollama;
  }

  getGeminiIntegration(): GeminiIntegration {
    return this.gemini;
  }
}

export default AIProviderManager;