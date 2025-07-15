import { NovaPlugin, NovaMemory } from '../../types';

export class MemoryManagerPlugin {
  private plugin: NovaPlugin;

  constructor() {
    this.plugin = {
      id: 'memory-manager',
      name: 'Memory Manager',
      version: '1.0.0',
      description: 'Advanced memory management and pattern recognition',
      enabled: true,
      capabilities: ['memory-optimization', 'pattern-recognition', 'learning', 'consolidation'],
      performance: {
        totalCalls: 0,
        averageResponseTime: 0,
        successRate: 1,
      },
    };
  }

  async optimizeMemory(memories: NovaMemory[]): Promise<NovaMemory[]> {
    // Remove duplicate memories
    const uniqueMemories = this.removeDuplicates(memories);
    
    // Consolidate related memories
    const consolidatedMemories = this.consolidateRelatedMemories(uniqueMemories);
    
    // Update importance scores
    const optimizedMemories = this.updateImportanceScores(consolidatedMemories);
    
    return optimizedMemories;
  }

  async findPatterns(memories: NovaMemory[]): Promise<any> {
    const patterns = {
      commonTypes: this.findCommonTypes(memories),
      timePatterns: this.findTimePatterns(memories),
      tagPatterns: this.findTagPatterns(memories),
      contentPatterns: this.findContentPatterns(memories),
    };

    return patterns;
  }

  async generateInsights(memories: NovaMemory[]): Promise<string[]> {
    const insights = [];
    
    // Analyze memory distribution
    const typeDistribution = this.analyzeTypeDistribution(memories);
    insights.push(`Most common memory type: ${typeDistribution.mostCommon}`);
    
    // Analyze importance trends
    const importanceTrend = this.analyzeImportanceTrend(memories);
    insights.push(`Average importance score: ${importanceTrend.average.toFixed(2)}`);
    
    // Analyze temporal patterns
    const temporalPatterns = this.analyzeTemporalPatterns(memories);
    insights.push(`Most active time period: ${temporalPatterns.mostActive}`);
    
    return insights;
  }

  async consolidateMemories(memories: NovaMemory[]): Promise<NovaMemory[]> {
    const consolidated = [];
    const processed = new Set();
    
    for (const memory of memories) {
      if (processed.has(memory.id)) continue;
      
      const related = this.findRelatedMemories(memory, memories);
      if (related.length > 1) {
        const consolidatedMemory = this.mergeMemories(related);
        consolidated.push(consolidatedMemory);
        related.forEach(m => processed.add(m.id));
      } else {
        consolidated.push(memory);
        processed.add(memory.id);
      }
    }
    
    return consolidated;
  }

  async pruneMemories(memories: NovaMemory[], maxRetentionDays: number): Promise<NovaMemory[]> {
    const cutoffTime = Date.now() - (maxRetentionDays * 24 * 60 * 60 * 1000);
    
    return memories.filter(memory => {
      // Keep important memories regardless of age
      if (memory.importance >= 8) return true;
      
      // Keep recent memories
      if (memory.timestamp > cutoffTime) return true;
      
      // Keep memories with high learning value
      if (memory.type === 'learning' && memory.importance >= 6) return true;
      
      return false;
    });
  }

  private removeDuplicates(memories: NovaMemory[]): NovaMemory[] {
    const seen = new Set();
    return memories.filter(memory => {
      const key = `${memory.type}-${memory.content}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private consolidateRelatedMemories(memories: NovaMemory[]): NovaMemory[] {
    // Group memories by similarity
    const groups = this.groupSimilarMemories(memories);
    
    return groups.map(group => {
      if (group.length === 1) return group[0];
      return this.mergeMemories(group);
    });
  }

  private updateImportanceScores(memories: NovaMemory[]): NovaMemory[] {
    return memories.map(memory => {
      let importance = memory.importance;
      
      // Increase importance for recent memories
      const daysSinceCreation = (Date.now() - memory.timestamp) / (24 * 60 * 60 * 1000);
      if (daysSinceCreation < 1) importance += 1;
      
      // Increase importance for memories with many tags
      importance += Math.min(memory.tags.length * 0.5, 2);
      
      // Increase importance for learning-type memories
      if (memory.type === 'learning') importance += 1;
      
      return {
        ...memory,
        importance: Math.min(importance, 10),
      };
    });
  }

  private findCommonTypes(memories: NovaMemory[]): any {
    const typeCounts = memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [type, count]) => {
        acc[type] = count;
        return acc;
      }, {} as Record<string, number>);
  }

  private findTimePatterns(memories: NovaMemory[]): any {
    const hourCounts = memories.reduce((acc, memory) => {
      const hour = new Date(memory.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return hourCounts;
  }

  private findTagPatterns(memories: NovaMemory[]): any {
    const tagCounts = memories.reduce((acc, memory) => {
      memory.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [tag, count]) => {
        acc[tag] = count;
        return acc;
      }, {} as Record<string, number>);
  }

  private findContentPatterns(memories: NovaMemory[]): any {
    const words = memories.flatMap(memory => 
      memory.content.toLowerCase().split(/\s+/)
    );

    const wordCounts = words.reduce((acc, word) => {
      if (word.length > 3) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [word, count]) => {
        acc[word] = count;
        return acc;
      }, {} as Record<string, number>);
  }

  private analyzeTypeDistribution(memories: NovaMemory[]): any {
    const types = memories.map(m => m.type);
    const typeCounts = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    return { mostCommon, distribution: typeCounts };
  }

  private analyzeImportanceTrend(memories: NovaMemory[]): any {
    const importanceScores = memories.map(m => m.importance);
    const average = importanceScores.reduce((sum, score) => sum + score, 0) / importanceScores.length;
    const max = Math.max(...importanceScores);
    const min = Math.min(...importanceScores);

    return { average, max, min };
  }

  private analyzeTemporalPatterns(memories: NovaMemory[]): any {
    const hourCounts = memories.reduce((acc, memory) => {
      const hour = new Date(memory.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostActiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';

    return { mostActive: `${mostActiveHour}:00`, hourly: hourCounts };
  }

  private groupSimilarMemories(memories: NovaMemory[]): NovaMemory[][] {
    const groups: NovaMemory[][] = [];
    
    for (const memory of memories) {
      const similarGroup = groups.find(group => 
        this.areSimilar(memory, group[0])
      );
      
      if (similarGroup) {
        similarGroup.push(memory);
      } else {
        groups.push([memory]);
      }
    }
    
    return groups;
  }

  private areSimilar(memory1: NovaMemory, memory2: NovaMemory): boolean {
    // Check if memories are similar based on content and tags
    const contentSimilarity = this.calculateContentSimilarity(memory1.content, memory2.content);
    const tagSimilarity = this.calculateTagSimilarity(memory1.tags, memory2.tags);
    
    return contentSimilarity > 0.7 || tagSimilarity > 0.5;
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = content1.toLowerCase().split(/\s+/);
    const words2 = content2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    const intersection = tags1.filter(tag => tags2.includes(tag));
    const union = [...new Set([...tags1, ...tags2])];
    
    return intersection.length / union.length;
  }

  private findRelatedMemories(memory: NovaMemory, memories: NovaMemory[]): NovaMemory[] {
    return memories.filter(m => 
      m.id !== memory.id && this.areSimilar(memory, m)
    );
  }

  private mergeMemories(memories: NovaMemory[]): NovaMemory {
    const merged: NovaMemory = {
      id: memories[0].id,
      timestamp: Math.max(...memories.map(m => m.timestamp)),
      type: memories[0].type,
      content: memories.map(m => m.content).join(' | '),
      importance: Math.max(...memories.map(m => m.importance)),
      tags: [...new Set(memories.flatMap(m => m.tags))],
      metadata: {
        ...memories[0].metadata,
        mergedCount: memories.length,
        originalIds: memories.map(m => m.id),
      },
    };

    return merged;
  }

  getPlugin(): NovaPlugin {
    return this.plugin;
  }
}

export default MemoryManagerPlugin;