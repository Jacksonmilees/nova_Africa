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
export declare class AIProviderManager {
    private ollama;
    private gemini;
    private nova;
    private preferredProvider;
    private debug;
    constructor(nova: NovaCore);
    initialize(): Promise<void>;
    processRequest(input: string, mode?: 'general' | 'code' | 'research' | 'reasoning', forceProvider?: AIProvider): Promise<AIResponse>;
    private processWithOllama;
    private processWithGemini;
    private processWithFallback;
    getAvailableProviders(): Promise<{
        provider: AIProvider;
        available: boolean;
        model?: string;
    }[]>;
    setPreferredProvider(provider: AIProvider): void;
    getPreferredProvider(): AIProvider;
    searchWeb(query: string): Promise<any[]>;
    getOllamaIntegration(): OllamaIntegration;
    getGeminiIntegration(): GeminiIntegration;
}
export default AIProviderManager;
//# sourceMappingURL=AIProviderManager.d.ts.map