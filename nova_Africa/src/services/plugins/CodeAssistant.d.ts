import { NovaPlugin } from '../../types';
export declare class CodeAssistantPlugin {
    private plugin;
    constructor();
    analyzeCode(code: string, language: string): Promise<string>;
    generateCode(prompt: string, language: string): Promise<string>;
    refactorCode(code: string, suggestions: string[]): Promise<string>;
    debugCode(code: string, error: string): Promise<string>;
    private calculateComplexity;
    private generateSuggestions;
    private findIssues;
    getPlugin(): NovaPlugin;
}
export default CodeAssistantPlugin;
//# sourceMappingURL=CodeAssistant.d.ts.map