import { BotSession } from '../types/TelegramTypes';

export class TelegramSessionManager {
  private sessions: Map<number, BotSession> = new Map();
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up inactive sessions every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 10 * 60 * 1000);
  }

  createSession(userId: number, chatId: number, username?: string, firstName?: string, lastName?: string): BotSession {
    const session: BotSession = {
      userId,
      chatId,
      username,
      firstName: firstName || 'User',
      lastName,
      isActive: true,
      lastActivity: new Date(),
      conversationMode: 'general',
      memoryContext: [],
      autonomousTasks: [],
      preferences: {
        language: 'en',
        responseLength: 'medium',
        includeCode: true,
        includeLinks: true,
      },
      usageStats: {
        messagesSent: 0,
        commandsUsed: 0,
        lastCommand: '',
        sessionStart: new Date(),
      },
    };

    this.sessions.set(userId, session);
    return session;
  }

  getSession(userId: number): BotSession | undefined {
    const session = this.sessions.get(userId);
    if (session) {
      session.lastActivity = new Date();
      session.isActive = true;
    }
    return session;
  }

  updateSession(userId: number, updates: Partial<BotSession>): void {
    const session = this.sessions.get(userId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = new Date();
    }
  }

  addMemoryContext(userId: number, context: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.memoryContext.push(context);
      // Keep only last 10 context items
      if (session.memoryContext.length > 10) {
        session.memoryContext = session.memoryContext.slice(-10);
      }
      session.lastActivity = new Date();
    }
  }

  addAutonomousTask(userId: number, task: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.autonomousTasks.push(task);
      session.lastActivity = new Date();
    }
  }

  incrementMessageCount(userId: number): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.usageStats.messagesSent++;
      session.lastActivity = new Date();
    }
  }

  incrementCommandCount(userId: number, command: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.usageStats.commandsUsed++;
      session.usageStats.lastCommand = command;
      session.lastActivity = new Date();
    }
  }

  setConversationMode(userId: number, mode: 'general' | 'code' | 'research' | 'reasoning'): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.conversationMode = mode;
      session.lastActivity = new Date();
    }
  }

  updatePreferences(userId: number, preferences: Partial<BotSession['preferences']>): void {
    const session = this.sessions.get(userId);
    if (session) {
      Object.assign(session.preferences, preferences);
      session.lastActivity = new Date();
    }
  }

  deactivateSession(userId: number): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.isActive = false;
    }
  }

  removeSession(userId: number): void {
    this.sessions.delete(userId);
  }

  getAllSessions(): BotSession[] {
    return Array.from(this.sessions.values());
  }

  getActiveSessions(): BotSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  private cleanupInactiveSessions(): void {
    const now = new Date();
    const inactiveUserIds: number[] = [];

    for (const [userId, session] of this.sessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      if (timeSinceLastActivity > this.sessionTimeout) {
        inactiveUserIds.push(userId);
      }
    }

    inactiveUserIds.forEach(userId => {
      this.sessions.delete(userId);
    });

    if (inactiveUserIds.length > 0) {
      console.log(`Cleaned up ${inactiveUserIds.length} inactive sessions`);
    }
  }

  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    averageMessagesPerSession: number;
    mostUsedCommands: { command: string; count: number }[];
  } {
    const sessions = this.getAllSessions();
    const activeSessions = this.getActiveSessions();
    
    const totalMessages = sessions.reduce((sum, session) => sum + session.usageStats.messagesSent, 0);
    const averageMessages = sessions.length > 0 ? totalMessages / sessions.length : 0;

    // Count command usage
    const commandCounts = new Map<string, number>();
    sessions.forEach(session => {
      if (session.usageStats.lastCommand) {
        const count = commandCounts.get(session.usageStats.lastCommand) || 0;
        commandCounts.set(session.usageStats.lastCommand, count + 1);
      }
    });

    const mostUsedCommands = Array.from(commandCounts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      averageMessagesPerSession: Math.round(averageMessages * 100) / 100,
      mostUsedCommands,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
  }
} 