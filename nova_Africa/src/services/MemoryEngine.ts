import NovaCore from './NovaCore';
import { NovaMemory } from '../types';

export interface MemoryCluster {
  id: string;
  topic: string;
  memories: NovaMemory[];
  importance: number;
  lastAccessed: number;
  connections: string[];
}

export class MemoryEngine {
  private nova: NovaCore;
  private clusters: Map<string, MemoryCluster> = new Map();
  private memoryIndex: Map<string, string[]> = new Map(); // word -> memory IDs

  constructor(nova: NovaCore) {
    this.nova = nova;
  }

  async initialize(): Promise<void> {
    await this.buildMemoryIndex();
    await this.createMemoryClusters();
    console.log('🧠 Memory Engine initialized');
  }

  async calculateImportance(memory: NovaMemory): Promise<number> {
    let importance = memory.importance || 5;

    // Boost importance based on content analysis
    const content = memory.content.toLowerCase();
    
    // Important keywords
    const importantKeywords = ['error', 'critical', 'urgent', 'important', 'remember', 'learn', 'insight'];
    const keywordBoost = importantKeywords.filter(keyword => content.includes(keyword)).length;
    importance += keywordBoost;

    // Boost for questions and learning
    if (content.includes('?') || content.includes('how') || content.includes('why')) {
      importance += 1;
    }

    // Boost for code and technical content
    if (content.includes('function') || content.includes('class') || content.includes('import')) {
      importance += 1;
    }

    // Boost for emotional content
    const emotionalWords = ['love', 'hate', 'excited', 'frustrated', 'happy', 'sad'];
    if (emotionalWords.some(word => content.includes(word))) {
      importance += 1;
    }

    // Boost for user interactions
    if (memory.type === 'interaction') {
      importance += 1;
    }

    // Boost for system events
    if (memory.type === 'system' && content.includes('error')) {
      importance += 2;
    }

    return Math.min(10, Math.max(1, importance));
  }

  async enhanceTags(memory: NovaMemory): Promise<string[]> {
    const tags = [...memory.tags];
    const content = memory.content.toLowerCase();

    // Auto-generate tags based on content
    const autoTags = [];

    // Technical tags
    if (content.includes('function') || content.includes('method')) autoTags.push('programming');
    if (content.includes('error') || content.includes('bug')) autoTags.push('debugging');
    if (content.includes('api') || content.includes('endpoint')) autoTags.push('api');
    if (content.includes('database') || content.includes('sql')) autoTags.push('database');

    // Learning tags
    if (content.includes('learn') || content.includes('understand')) autoTags.push('learning');
    if (content.includes('research') || content.includes('study')) autoTags.push('research');

    // Emotional tags
    if (content.includes('problem') || content.includes('issue')) autoTags.push('problem-solving');
    if (content.includes('success') || content.includes('completed')) autoTags.push('achievement');

    // Time-based tags
    const now = new Date();
    autoTags.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    // Merge and deduplicate
    return [...new Set([...tags, ...autoTags])];
  }

  async findRelatedMemories(memory: NovaMemory): Promise<NovaMemory[]> {
    const allMemories = this.nova.allMemories;
    const related: { memory: NovaMemory; score: number }[] = [];

    for (const otherMemory of allMemories) {
      if (otherMemory.id === memory.id) continue;

      let score = 0;

      // Tag similarity
      const commonTags = memory.tags.filter(tag => otherMemory.tags.includes(tag));
      score += commonTags.length * 2;

      // Content similarity (simple word overlap)
      const words1 = memory.content.toLowerCase().split(/\s+/);
      const words2 = otherMemory.content.toLowerCase().split(/\s+/);
      const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
      score += commonWords.length;

      // Type similarity
      if (memory.type === otherMemory.type) score += 1;

      // Time proximity (recent memories are more related)
      const timeDiff = Math.abs(memory.timestamp - otherMemory.timestamp);
      const daysDiff = timeDiff / (24 * 60 * 60 * 1000);
      if (daysDiff < 1) score += 2;
      else if (daysDiff < 7) score += 1;

      if (score > 3) {
        related.push({ memory: otherMemory, score });
      }
    }

    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.memory);
  }

  async searchMemories(query: string): Promise<NovaMemory[]> {
    const allMemories = this.nova.allMemories;
    const queryWords = query.toLowerCase().split(/\s+/);
    const results: { memory: NovaMemory; score: number }[] = [];

    for (const memory of allMemories) {
      let score = 0;
      const content = memory.content.toLowerCase();

      // Exact phrase match
      if (content.includes(query.toLowerCase())) {
        score += 10;
      }

      // Word matches
      for (const word of queryWords) {
        if (content.includes(word)) {
          score += 2;
        }
        if (memory.tags.some(tag => tag.toLowerCase().includes(word))) {
          score += 3;
        }
      }

      // Importance boost
      score += memory.importance;

      if (score > 5) {
        results.push({ memory, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.memory);
  }

  async getCodeContext(): Promise<NovaMemory[]> {
    return this.nova.allMemories.filter(m => 
      m.tags.includes('programming') || 
      m.tags.includes('code') || 
      m.content.includes('function') ||
      m.content.includes('class')
    ).slice(0, 10);
  }

  async getResearchContext(): Promise<NovaMemory[]> {
    return this.nova.allMemories.filter(m => 
      m.tags.includes('research') || 
      m.tags.includes('learning') || 
      m.type === 'learning'
    ).slice(0, 10);
  }

  async getReasoningContext(): Promise<NovaMemory[]> {
    return this.nova.allMemories.filter(m => 
      m.tags.includes('reasoning') || 
      m.tags.includes('analysis') || 
      m.content.includes('because') ||
      m.content.includes('therefore')
    ).slice(0, 10);
  }

  async getRecentMemories(count: number): Promise<NovaMemory[]> {
    return this.nova.allMemories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  async consolidateMemories(): Promise<void> {
    const memories = this.nova.allMemories;
    const duplicates = this.findDuplicateMemories(memories);
    
    for (const duplicateGroup of duplicates) {
      if (duplicateGroup.length > 1) {
        const consolidated = this.mergeDuplicateMemories(duplicateGroup);
        // Remove duplicates and add consolidated memory
        // This would require access to the core memory array
      }
    }
  }

  async performMaintenance(): Promise<void> {
    console.log('🔧 Performing memory maintenance...');
    
    // Archive old, low-importance memories
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const memories = this.nova.allMemories;
    
    const toArchive = memories.filter(m => 
      m.timestamp < oneMonthAgo && 
      m.importance < 5 && 
      !m.tags.includes('important')
    );

    console.log(`Archiving ${toArchive.length} old memories`);
    
    // Rebuild indexes
    await this.buildMemoryIndex();
    await this.createMemoryClusters();
  }

  async identifyLearningOpportunities(): Promise<string[]> {
    const memories = this.nova.allMemories;
    const opportunities = [];

    // Find repeated questions
    const questions = memories.filter(m => m.content.includes('?'));
    const questionTopics = this.extractTopics(questions.map(q => q.content));
    
    for (const topic of questionTopics) {
      if (questionTopics.filter(t => t === topic).length > 2) {
        opportunities.push(`Deep dive into ${topic} - multiple questions detected`);
      }
    }

    // Find error patterns
    const errors = memories.filter(m => 
      m.content.toLowerCase().includes('error') || 
      m.content.toLowerCase().includes('problem')
    );
    
    if (errors.length > 5) {
      opportunities.push('Error pattern analysis - investigate common failure modes');
    }

    // Find knowledge gaps
    const researchMemories = memories.filter(m => m.type === 'learning');
    if (researchMemories.length < memories.length * 0.1) {
      opportunities.push('Increase learning activities - low research memory ratio');
    }

    return opportunities;
  }

  async compressMemories(memories: NovaMemory[]): Promise<string> {
    // Simple compression - in production, use actual compression
    return JSON.stringify(memories);
  }

  async decompressMemories(compressed: string): Promise<NovaMemory[]> {
    try {
      return JSON.parse(compressed);
    } catch (error) {
      console.error('Failed to decompress memories:', error);
      return [];
    }
  }

  private async buildMemoryIndex(): Promise<void> {
    this.memoryIndex.clear();
    
    for (const memory of this.nova.allMemories) {
      const words = this.extractWords(memory.content);
      
      for (const word of words) {
        if (!this.memoryIndex.has(word)) {
          this.memoryIndex.set(word, []);
        }
        this.memoryIndex.get(word)!.push(memory.id);
      }
    }
  }

  private async createMemoryClusters(): Promise<void> {
    this.clusters.clear();
    const memories = this.nova.allMemories;
    
    // Group memories by topic similarity
    const topicGroups = this.groupMemoriesByTopic(memories);
    
    for (const [topic, groupMemories] of topicGroups.entries()) {
      const cluster: MemoryCluster = {
        id: this.generateId(),
        topic,
        memories: groupMemories,
        importance: Math.max(...groupMemories.map(m => m.importance)),
        lastAccessed: Math.max(...groupMemories.map(m => m.timestamp)),
        connections: [],
      };
      
      this.clusters.set(cluster.id, cluster);
    }
  }

  private groupMemoriesByTopic(memories: NovaMemory[]): Map<string, NovaMemory[]> {
    const groups = new Map<string, NovaMemory[]>();
    
    for (const memory of memories) {
      const primaryTag = memory.tags[0] || 'general';
      
      if (!groups.has(primaryTag)) {
        groups.set(primaryTag, []);
      }
      groups.get(primaryTag)!.push(memory);
    }
    
    return groups;
  }

  private findDuplicateMemories(memories: NovaMemory[]): NovaMemory[][] {
    const duplicateGroups: NovaMemory[][] = [];
    const processed = new Set<string>();
    
    for (const memory of memories) {
      if (processed.has(memory.id)) continue;
      
      const duplicates = memories.filter(m => 
        m.id !== memory.id && 
        !processed.has(m.id) &&
        this.areSimilar(memory, m)
      );
      
      if (duplicates.length > 0) {
        duplicateGroups.push([memory, ...duplicates]);
        processed.add(memory.id);
        duplicates.forEach(d => processed.add(d.id));
      }
    }
    
    return duplicateGroups;
  }

  private areSimilar(memory1: NovaMemory, memory2: NovaMemory): boolean {
    // Check content similarity
    const similarity = this.calculateContentSimilarity(memory1.content, memory2.content);
    return similarity > 0.8;
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = this.extractWords(content1);
    const words2 = this.extractWords(content2);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private mergeDuplicateMemories(memories: NovaMemory[]): NovaMemory {
    const merged: NovaMemory = {
      ...memories[0],
      content: memories.map(m => m.content).join(' | '),
      importance: Math.max(...memories.map(m => m.importance)),
      tags: [...new Set(memories.flatMap(m => m.tags))],
      metadata: {
        ...memories[0].metadata,
        mergedFrom: memories.map(m => m.id),
        mergedAt: Date.now(),
      },
    };
    
    return merged;
  }

  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private extractTopics(texts: string[]): string[] {
    const allWords = texts.flatMap(text => this.extractWords(text));
    const wordCounts = allWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default MemoryEngine;