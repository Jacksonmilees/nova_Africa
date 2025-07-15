import NovaCore from './NovaCore';
import { ChatMessage } from '../types';

export interface ConversationContext {
  id: string;
  messages: ChatMessage[];
  summary: string;
  topics: string[];
  sentiment: string;
  lastActivity: number;
  messageCount: number;
  participants: string[];
}

export class ConversationManager {
  private nova: NovaCore;
  private conversations: Map<string, ConversationContext> = new Map();
  private contextWindow = 20; // Number of messages to keep in active context

  constructor(nova: NovaCore) {
    this.nova = nova;
  }

  async initialize(): Promise<void> {
    await this.loadConversationsFromStorage();
    console.log('💬 Conversation Manager initialized');
  }

  async getConversationContext(conversationId: string): Promise<ConversationContext> {
    if (!this.conversations.has(conversationId)) {
      await this.createConversation(conversationId);
    }
    
    return this.conversations.get(conversationId)!;
  }

  async createConversation(conversationId: string): Promise<ConversationContext> {
    const context: ConversationContext = {
      id: conversationId,
      messages: [],
      summary: '',
      topics: [],
      sentiment: 'neutral',
      lastActivity: Date.now(),
      messageCount: 0,
      participants: ['user', 'nova'],
    };

    this.conversations.set(conversationId, context);
    await this.saveConversationsToStorage();
    
    return context;
  }

  async updateConversation(conversationId: string, userMessage: string, novaResponse: string): Promise<void> {
    const context = await this.getConversationContext(conversationId);
    
    // Add messages
    const userMsg: ChatMessage = {
      id: this.generateId(),
      content: userMessage,
      sender: 'user',
      timestamp: Date.now(),
      type: 'message',
    };

    const novaMsg: ChatMessage = {
      id: this.generateId(),
      content: novaResponse,
      sender: 'nova',
      timestamp: Date.now(),
      type: 'message',
    };

    context.messages.push(userMsg, novaMsg);
    context.messageCount += 2;
    context.lastActivity = Date.now();

    // Maintain context window
    if (context.messages.length > this.contextWindow * 2) {
      context.messages = context.messages.slice(-this.contextWindow * 2);
    }

    // Update topics and sentiment
    await this.updateContextAnalysis(context);
    
    this.conversations.set(conversationId, context);
    await this.saveConversationsToStorage();
  }

  async getHistory(conversationId: string): Promise<ChatMessage[]> {
    const context = await this.getConversationContext(conversationId);
    return context.messages;
  }

  async clearConversation(conversationId: string): Promise<void> {
    if (this.conversations.has(conversationId)) {
      const context = this.conversations.get(conversationId)!;
      context.messages = [];
      context.summary = '';
      context.topics = [];
      context.messageCount = 0;
      
      this.conversations.set(conversationId, context);
      await this.saveConversationsToStorage();
    }
  }

  async getConversationSummary(conversationId: string): Promise<string> {
    const context = await this.getConversationContext(conversationId);
    
    if (!context.summary && context.messages.length > 0) {
      context.summary = await this.generateSummary(context.messages);
      this.conversations.set(conversationId, context);
      await this.saveConversationsToStorage();
    }
    
    return context.summary;
  }

  async searchConversations(query: string): Promise<ConversationContext[]> {
    const results: ConversationContext[] = [];
    
    for (const context of this.conversations.values()) {
      const relevantMessages = context.messages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      
      if (relevantMessages.length > 0 || 
          context.topics.some(topic => topic.toLowerCase().includes(query.toLowerCase()))) {
        results.push(context);
      }
    }
    
    return results.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async getActiveConversations(): Promise<ConversationContext[]> {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    return Array.from(this.conversations.values())
      .filter(context => context.lastActivity > oneDayAgo)
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async archiveOldConversations(): Promise<number> {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    let archivedCount = 0;
    
    for (const [id, context] of this.conversations.entries()) {
      if (context.lastActivity < oneWeekAgo && context.messageCount < 10) {
        this.conversations.delete(id);
        archivedCount++;
      }
    }
    
    if (archivedCount > 0) {
      await this.saveConversationsToStorage();
    }
    
    return archivedCount;
  }

  private async updateContextAnalysis(context: ConversationContext): Promise<void> {
    // Extract topics from recent messages
    const recentMessages = context.messages.slice(-10);
    const text = recentMessages.map(m => m.content).join(' ');
    
    // Simple topic extraction (in a real implementation, you'd use NLP)
    const words = text.toLowerCase().split(/\s+/);
    const topicWords = words.filter(word => 
      word.length > 4 && 
      !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)
    );
    
    const topicCounts = topicWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    context.topics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'problem', 'issue', 'error'];
    
    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
    
    if (positiveCount > negativeCount) {
      context.sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      context.sentiment = 'negative';
    } else {
      context.sentiment = 'neutral';
    }
  }

  private async generateSummary(messages: ChatMessage[]): Promise<string> {
    if (messages.length === 0) return '';
    
    const text = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
    
    // Simple summary generation (in a real implementation, you'd use an LLM)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ') + '.';
    
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
  }

  private async saveConversationsToStorage(): Promise<void> {
    try {
      const data = Array.from(this.conversations.entries());
      localStorage.setItem('nova-conversations', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  private async loadConversationsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('nova-conversations');
      if (stored) {
        const data = JSON.parse(stored);
        this.conversations = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      this.conversations = new Map();
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default ConversationManager;