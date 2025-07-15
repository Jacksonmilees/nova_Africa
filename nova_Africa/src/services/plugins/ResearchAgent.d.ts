import { NovaPlugin } from '../../types';
export declare class ResearchAgentPlugin {
    private plugin;
    constructor();
    searchWeb(query: string): Promise<string>;
    analyzeData(data: string): Promise<string>;
    summarizeContent(content: string): Promise<string>;
    factCheck(claim: string): Promise<string>;
    gatherInformation(topic: string): Promise<string>;
    private detectDataType;
    private analyzeStructure;
    private generateInsights;
    private generateRecommendations;
    private extractKeyPoints;
    private generateSummary;
    getPlugin(): NovaPlugin;
}
export default ResearchAgentPlugin;
//# sourceMappingURL=ResearchAgent.d.ts.map