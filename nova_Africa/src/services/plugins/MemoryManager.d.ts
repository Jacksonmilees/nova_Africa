import { NovaPlugin, NovaMemory } from '../../types';
export declare class MemoryManagerPlugin {
    private plugin;
    constructor();
    optimizeMemory(memories: NovaMemory[]): Promise<NovaMemory[]>;
    findPatterns(memories: NovaMemory[]): Promise<any>;
    generateInsights(memories: NovaMemory[]): Promise<string[]>;
    consolidateMemories(memories: NovaMemory[]): Promise<NovaMemory[]>;
    pruneMemories(memories: NovaMemory[], maxRetentionDays: number): Promise<NovaMemory[]>;
    private removeDuplicates;
    private consolidateRelatedMemories;
    private updateImportanceScores;
    private findCommonTypes;
    private findTimePatterns;
    private findTagPatterns;
    private findContentPatterns;
    private analyzeTypeDistribution;
    private analyzeImportanceTrend;
    private analyzeTemporalPatterns;
    private groupSimilarMemories;
    private areSimilar;
    private calculateContentSimilarity;
    private calculateTagSimilarity;
    private findRelatedMemories;
    private mergeMemories;
    getPlugin(): NovaPlugin;
}
export default MemoryManagerPlugin;
//# sourceMappingURL=MemoryManager.d.ts.map