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
  private ollamaOnly: boolean;

  constructor(nova: NovaCore) {
    this.nova = nova;
    this.ollama = new OllamaIntegration(nova);
    this.gemini = new GeminiIntegration();
    // Use process.env for Node.js, fallback to import.meta.env for Vite/browser
    this.debug = (typeof process !== 'undefined' && process.env.VITE_DEBUG !== undefined)
      ? process.env.VITE_DEBUG === 'true'
      : (typeof import !== 'undefined' && import.meta.env && import.meta.env.VITE_DEBUG === 'true');
    this.ollamaOnly = (typeof process !== 'undefined' && process.env.VITE_OLLAMA_ONLY !== undefined)
      ? process.env.VITE_OLLAMA_ONLY === 'true'
      : (typeof import !== 'undefined' && import.meta.env && import.meta.env.VITE_OLLAMA_ONLY === 'true');
    console.log('[AIProviderManager] VITE_OLLAMA_ONLY:', this.ollamaOnly, '| VITE_DEBUG:', this.debug);
  }

  async initialize(): Promise<void> {
    // Check provider availability
    const ollamaAvailable = await this.ollama.checkConnection();
    const geminiAvailable = await this.gemini.checkConnection();

    console.log('[AIProviderManager] Provider Status:', {
      ollama: ollamaAvailable,
      gemini: geminiAvailable,
      serpApi: this.gemini.isSerpApiConfigured(),
      ollamaOnly: this.ollamaOnly,
    });

    // Set preferred provider based on availability and ollamaOnly flag
    if (ollamaAvailable) {
      this.preferredProvider = 'ollama';
      console.log('[AIProviderManager] Ollama is available and set as the main provider.');
    } else if (!this.ollamaOnly && geminiAvailable) {
      this.preferredProvider = 'gemini';
      console.log('[AIProviderManager] Ollama unavailable, Gemini set as fallback provider.');
    } else {
      this.preferredProvider = 'fallback';
      console.log('[AIProviderManager] No AI providers available, using fallback.');
    }

    if (this.ollamaOnly && !ollamaAvailable) {
      console.error('[AIProviderManager] OLLAMA ONLY mode is enabled, but Ollama is not available! No AI responses will be possible.');
    }
  }

  async processRequest(
    input: string, 
    mode: 'general' | 'code' | 'research' | 'reasoning' = 'general',
    forceProvider?: AIProvider
  ): Promise<AIResponse> {
    const provider = forceProvider || this.preferredProvider;
    console.log(`[AIProviderManager] processRequest called. Provider: ${provider}, OllamaOnly: ${this.ollamaOnly}`);
    try {
      if (this.ollamaOnly) {
        if (provider !== 'ollama') {
          console.error('[AIProviderManager] OLLAMA ONLY mode: refusing to use non-Ollama provider.');
          throw new Error('[AIProviderManager] OLLAMA ONLY mode: refusing to use non-Ollama provider.');
        }
        return await this.processWithOllama(input, mode);
      }
      switch (provider) {
        case 'ollama':
          console.log('[AIProviderManager] Using Ollama for this request.');
          return await this.processWithOllama(input, mode);
        case 'gemini':
          console.warn('[AIProviderManager] Using Gemini as fallback provider.');
          return await this.processWithGemini(input, mode);
        default:
          console.warn('[AIProviderManager] Using fallback (NOVA core) provider.');
          return await this.processWithFallback(input, mode);
      }
    } catch (error) {
      if (this.debug) {
        console.error(`[AIProviderManager] ${provider} processing failed:`, error);
      }
      // Try fallback providers
      if (provider === 'ollama') {
        if (!this.ollamaOnly) {
          try {
            console.warn('[AIProviderManager] Ollama failed, falling back to Gemini.');
            return await this.processWithGemini(input, mode);
          } catch (geminiError) {
            console.warn('[AIProviderManager] Gemini also failed, falling back to NOVA core.');
            return await this.processWithFallback(input, mode);
          }
        } else {
          console.error('[AIProviderManager] OLLAMA ONLY mode: Ollama failed, no fallback allowed.');
          throw new Error('[AIProviderManager] OLLAMA ONLY mode: Ollama failed, no fallback allowed.');
        }
      } else if (provider === 'gemini') {
        console.warn('[AIProviderManager] Gemini failed, falling back to NOVA core.');
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