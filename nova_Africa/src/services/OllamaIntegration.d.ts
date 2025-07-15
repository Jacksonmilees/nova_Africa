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
export declare class OllamaIntegration {
    private endpoint;
    private defaultModel;
    private nova;
    private debug;
    private connectionChecked;
    private lastConnectionCheck;
    private conversationHistory;
    constructor(nova: NovaCore);
    checkConnection(): Promise<boolean>;
    listModels(): Promise<OllamaModel[]>;
    pullModel(modelName: string): Promise<void>;
    generateResponse(prompt: string, model?: string, options?: any): Promise<string>;
    chatCompletion(messages: ChatMessage[], model?: string, options?: any): Promise<string>;
    streamResponse(prompt: string, model?: string, onChunk?: (chunk: string) => void): Promise<string>;
    embedText(text: string, model?: string): Promise<number[]>;
    processWithContext(input: string, conversationId?: string, systemPrompt?: string): Promise<string>;
    processCodeRequest(code: string, request: string, language?: string): Promise<string>;
    processResearchRequest(query: string, context?: string): Promise<string>;
    processGeneralQuery(query: string): Promise<string>;
    analyzeMemoryForInsights(memories: any[]): Promise<string>;
    generateTaskSuggestions(context: string): Promise<string[]>;
    clearConversationHistory(conversationId?: string): void;
    getConversationHistory(conversationId?: string): ChatMessage[];
    getModelInfo(modelName?: string): Promise<any>;
    setDefaultModel(modelName: string): void;
    getDefaultModel(): string;
    setBaseUrl(url: string): void;
    getBaseUrl(): string;
}
export default OllamaIntegration;
//# sourceMappingURL=OllamaIntegration.d.ts.map