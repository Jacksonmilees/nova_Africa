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
export declare class GeminiIntegration {
    private apiKey;
    private model;
    private baseUrl;
    private serpApiKey;
    private debug;
    constructor();
    checkConnection(): Promise<boolean>;
    generateResponse(prompt: string, systemPrompt?: string): Promise<string>;
    searchWeb(query: string, numResults?: number): Promise<SearchResult[]>;
    processCodeRequest(code: string, request: string, language?: string): Promise<string>;
    processResearchRequest(query: string, useWebSearch?: boolean): Promise<string>;
    processGeneralQuery(query: string): Promise<string>;
    analyzeMemoryForInsights(memories: any[]): Promise<string>;
    generateTaskSuggestions(context: string): Promise<string[]>;
    isConfigured(): boolean;
    isSerpApiConfigured(): boolean;
    getModel(): string;
    setModel(model: string): void;
}
export default GeminiIntegration;
//# sourceMappingURL=GeminiIntegration.d.ts.map