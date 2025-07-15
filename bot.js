import TelegramBot from 'node-telegram-bot-api';

// Fix for Buffer.concat: Prevent detached ArrayBuffer errors
const originalBufferConcat = Buffer.concat;
Buffer.concat = function (buffers, totalLength) {
  const safeBuffers = buffers.filter(b => !(b.buffer && b.buffer.detached));
  return originalBufferConcat.call(Buffer, safeBuffers, totalLength);
};

import dotenv from 'dotenv';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from './database.js';
import AIEngine from './ai-engine.js';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const debug = process.env.DEBUG === 'true';

console.log('🚀 Starting NOVA - Neural Operational Virtual Assistant');
console.log(`🔧 Debug mode: ${debug ? 'ON' : 'OFF'}`);
console.log(`🤖 Bot token: ${token ? token.substring(0, 20) + '...' : 'NOT SET'}`);

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

// Initialize systems
const database = new DatabaseManager();
const aiEngine = new AIEngine();

// Create bot instance
const bot = new TelegramBot(token, { 
  polling: {
    interval: 300,
    autoStart: false,
    params: {
      timeout: 10
    }
  }
});

// Enhanced memory and conversation management
class NovaBot {
  constructor() {
    this.activeSessions = new Map();
    this.thinkingInterval = null;
    this.startTime = Date.now();
    this.messageCount = 0;

    this.startAutonomousThinking();
    this.startPeriodicMaintenance();
  }

  async startAutonomousThinking() {
    this.thinkingInterval = setInterval(async () => {
      await this.performAutonomousThinking();
    }, 5 * 60 * 1000);

    console.log('🧠 Autonomous thinking system activated');
  }

  async performAutonomousThinking() {
    try {
      const systemStats = await database.getSystemStats();
      const recentInsights = await database.getRecentInsights(5);

      const insights = [
        "I'm continuously learning from our conversations and improving my responses.",
        "I notice patterns in how users communicate and adapt my style accordingly.",
        "My memory system helps me provide increasingly personalized assistance.",
        "I'm always thinking about how to be more helpful and understanding.",
        "Each conversation teaches me something new about human communication."
      ];

      const randomInsight = insights[Math.floor(Math.random() * insights.length)];

      await database.saveInsight({
        content: randomInsight,
        insight_type: 'autonomous',
        confidence: 0.8,
        topics: ['self-reflection', 'learning'],
        metadata: {
          systemStats,
          generatedAt: new Date().toISOString(),
          type: 'autonomous_thinking'
        }
      });

      if (debug) {
        console.log('🧠 Generated autonomous insight:', randomInsight);
      }

    } catch (error) {
      console.error('❌ Autonomous thinking error:', error.message);
    }
  }

  startPeriodicMaintenance() {
    cron.schedule('0 3 * * *', async () => {
      await this.performMaintenance();
    });

    console.log('🔧 Periodic maintenance scheduled');
  }

  async performMaintenance() {
    try {
      console.log('🔧 Performing daily maintenance...');
      const cleanupResult = await database.cleanupOldData(90);
      const systemStats = await database.getSystemStats();
      await database.updateSystemStats({
        last_maintenance: new Date(),
        cleanup_result: cleanupResult
      });
      console.log('✅ Maintenance completed:', cleanupResult);
    } catch (error) {
      console.error('❌ Maintenance error:', error.message);
    }
  }

  async processMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userMessage = msg.text;
    const sessionId = this.getSessionId(userId);

    try {
      this.messageCount++;

      await database.createOrUpdateUser({
        id: userId,
        first_name: msg.from.first_name,
        username: msg.from.username
      });

      const [userStats, recentConversations, userMemories] = await Promise.all([
        database.getUserStats(userId),
        database.getRecentConversations(userId, 10),
        database.getMemories(userId, 20)
      ]);

      const context = {
        userStats,
        recentConversations,
        userMemories,
        sessionId,
        chatId
      };

      const response = await aiEngine.generateResponse(userMessage, userId, context);

      const topics = aiEngine.extractTopics(userMessage);
      const sentiment = aiEngine.analyzeSentiment(userMessage);
      const importance = this.calculateImportance(userMessage, sentiment, topics);

      await database.saveConversation({
        user_id: userId,
        message: userMessage,
        response: response,
        sentiment: sentiment,
        topics: topics,
        context: {
          complexity: aiEngine.assessComplexity(userMessage),
          sessionId: sessionId,
          messageCount: this.messageCount
        },
        importance: importance,
        session_id: sessionId
      });

      await this.updateUserProfile(userId, userMessage, sentiment, topics);

      if (importance >= 7) {
        await database.saveMemory({
          user_id: userId,
          content: `User: ${userMessage}\nNOVA: ${response.substring(0, 500)}...`,
          memory_type: 'important_conversation',
          importance: importance,
          tags: topics,
          metadata: {
            sentiment,
            sessionId,
            timestamp: new Date().toISOString()
          }
        });
      }

      await this.sendMessage(chatId, response);

      if (debug) {
        console.log(`✅ Processed message from ${msg.from.first_name} (${userId})`);
        console.log(`📊 Topics: ${topics.join(', ')}, Sentiment: ${sentiment}, Importance: ${importance}`);
      }

    } catch (error) {
      console.error('❌ Message processing error:', error.message);
      await this.sendMessage(chatId, "I apologize, but I encountered an error processing your message. Please try again.");
    }
  }

  calculateImportance(message, sentiment, topics) {
    let importance = 5;
    if (sentiment === 'positive' || sentiment === 'negative') importance += 1;
    if (sentiment === 'mixed') importance += 2;
    if (message.includes('?')) importance += 1;
    if (message.toLowerCase().includes('my') || message.toLowerCase().includes('me')) importance += 1;
    if (topics.includes('personal') || topics.includes('coding') || topics.includes('research')) importance += 1;
    if (message.length > 200) importance += 1;
    const technicalTerms = (message.match(/\b(algorithm|architecture|optimization|implementation|methodology)\b/gi) || []).length;
    importance += Math.min(technicalTerms, 2);
    return Math.min(10, Math.max(1, importance));
  }

  async updateUserProfile(userId, message, sentiment, topics) {
    try {
      const user = await database.getUser(userId);
      if (!user) return;

      const personality = user.personality || {};

      if (sentiment === 'positive') {
        personality.positivity = (personality.positivity || 0) + 1;
      }
      if (message.includes('?')) {
        personality.curiosity = (personality.curiosity || 0) + 1;
      }
      if (message.toLowerCase().includes('my') || message.toLowerCase().includes('me')) {
        personality.openness = (personality.openness || 0) + 1;
      }
      if (topics.includes('coding') || topics.includes('research')) {
        personality.analytical = (personality.analytical || 0) + 1;
      }

      await database.updateUserPersonality(userId, personality);

      const currentTopics = user.topics || [];
      const newTopics = [...new Set([...currentTopics, ...topics])];

      if (newTopics.length !== currentTopics.length) {
        await database.updateUserTopics(userId, newTopics);
      }

    } catch (error) {
      console.error('❌ User profile update error:', error.message);
    }
  }

  getSessionId(userId) {
    if (!this.activeSessions.has(userId)) {
      this.activeSessions.set(userId, uuidv4());
    }
    return this.activeSessions.get(userId);
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      const defaultOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      };

      if (text.length > 4096) {
        const chunks = this.splitMessage(text, 4096);
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk, defaultOptions);
          await this.delay(100);
        }
      } else {
        await bot.sendMessage(chatId, text, defaultOptions);
      }

    } catch (error) {
      console.error('❌ Send message error:', error.message);
      try {
        await bot.sendMessage(chatId, text.replace(/[*_`\[\]]/g, ''), { disable_web_page_preview: true });
      } catch (fallbackError) {
        console.error('❌ Fallback send error:', fallbackError.message);
      }
    }
  }

  splitMessage(text, maxLength) {
    const chunks = [];
    let currentChunk = '';
    const lines = text.split('\n');

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '\n' : '') + line;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = line;
        } else {
          const words = line.split(' ');
          for (const word of words) {
            if (currentChunk.length + word.length + 1 <= maxLength) {
              currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = word;
            }
          }
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const novaBot = new NovaBot();
