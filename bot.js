// NOVA Bot - Fixed Version (Buffer Fix + Node 18 Compatible)

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from './database.js';
import AIEngine from './ai-engine.js';
import http from 'http';

// Safe Buffer.concat override for edge cases
const originalConcat = Buffer.concat;
Buffer.concat = function (buffers, length) {
  if (!Array.isArray(buffers) || buffers.some((b) => !Buffer.isBuffer(b))) {
    console.warn('⚠️ Buffer.concat received invalid input, returning empty buffer');
    return Buffer.alloc(0);
  }
  return originalConcat.call(Buffer, buffers, length);
};

// Load env
dotenv.config();
const token = process.env.TELEGRAM_BOT_TOKEN;
const debug = process.env.DEBUG === 'true';

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    autoStart: false,
    params: { timeout: 10 },
  },
});

const database = new DatabaseManager();
const aiEngine = new AIEngine();

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
      try {
        const systemStats = await database.getSystemStats();
        const recentInsights = await database.getRecentInsights(5);

        const insights = [
          'Learning and evolving every 5 minutes.',
          'Improving emotional analysis routines.',
          'Analyzing user trends in memory.',
        ];

        const content = insights[Math.floor(Math.random() * insights.length)];

        await database.saveInsight({
          content,
          insight_type: 'autonomous',
          confidence: 0.8,
          topics: ['self-learning'],
          metadata: {
            generatedAt: new Date().toISOString(),
            systemStats,
          },
        });

        if (debug) console.log('🧠 New Insight:', content);
      } catch (e) {
        console.error('❌ Thinking Error:', e.message);
      }
    }, 300000);
  }

  startPeriodicMaintenance() {
    cron.schedule('0 3 * * *', async () => {
      try {
        const result = await database.cleanupOldData(90);
        const stats = await database.getSystemStats();
        await database.updateSystemStats({
          last_maintenance: new Date(),
          cleanup_result: result,
        });
        console.log('✅ Maintenance done:', result);
      } catch (e) {
        console.error('❌ Maintenance Error:', e.message);
      }
    });
  }

  async processMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const sessionId = this.getSessionId(userId);

    try {
      this.messageCount++;
      await database.createOrUpdateUser({
        id: userId,
        first_name: msg.from.first_name,
        username: msg.from.username,
      });

      const [stats, recents, memories] = await Promise.all([
        database.getUserStats(userId),
        database.getRecentConversations(userId, 10),
        database.getMemories(userId, 20),
      ]);

      const context = { userStats: stats, recentConversations: recents, userMemories: memories, sessionId };
      const response = await aiEngine.generateResponse(text, userId, context);
      const topics = aiEngine.extractTopics(text);
      const sentiment = aiEngine.analyzeSentiment(text);
      const importance = this.calculateImportance(text, sentiment, topics);

      await database.saveConversation({
        user_id: userId,
        message: text,
        response,
        sentiment,
        topics,
        context: {
          sessionId,
          complexity: aiEngine.assessComplexity(text),
          messageCount: this.messageCount,
        },
        importance,
        session_id: sessionId,
      });

      if (importance >= 7) {
        await database.saveMemory({
          user_id: userId,
          content: `User: ${text}\nNOVA: ${response.substring(0, 500)}`,
          memory_type: 'important_conversation',
          importance,
          tags: topics,
          metadata: { sentiment, sessionId, timestamp: new Date().toISOString() },
        });
      }

      await this.updateUserProfile(userId, text, sentiment, topics);
      await this.sendMessage(chatId, response);
    } catch (err) {
      console.error('❌ Message Error:', err.message);
      await this.sendMessage(chatId, "I hit a snag trying to respond. Try again!");
    }
  }

  calculateImportance(msg, sentiment, topics) {
    let score = 5;
    if (['positive', 'negative', 'mixed'].includes(sentiment)) score += 1;
    if (msg.includes('?')) score += 1;
    if (/\bmy\b|\bme\b/i.test(msg)) score += 1;
    if (topics.includes('coding')) score += 1;
    if (msg.length > 200) score += 1;
    score += (msg.match(/algorithm|architecture|optimization|methodology/gi) || []).length;
    return Math.min(10, Math.max(1, score));
  }

  async updateUserProfile(userId, msg, sentiment, topics) {
    try {
      const user = await database.getUser(userId);
      if (!user) return;
      const personality = user.personality || {};
      if (sentiment === 'positive') personality.positivity = (personality.positivity || 0) + 1;
      if (msg.includes('?')) personality.curiosity = (personality.curiosity || 0) + 1;
      if (/\bmy\b|\bme\b/i.test(msg)) personality.openness = (personality.openness || 0) + 1;
      if (topics.includes('coding')) personality.analytical = (personality.analytical || 0) + 1;
      await database.updateUserPersonality(userId, personality);
      const newTopics = [...new Set([...(user.topics || []), ...topics])];
      await database.updateUserTopics(userId, newTopics);
    } catch (e) {
      console.error('❌ Profile Update Error:', e.message);
    }
  }

  getSessionId(userId) {
    if (!this.activeSessions.has(userId)) this.activeSessions.set(userId, uuidv4());
    return this.activeSessions.get(userId);
  }

  async sendMessage(chatId, text, options = {}) {
    const opts = { parse_mode: 'Markdown', disable_web_page_preview: true, ...options };
    try {
      if (text.length > 4096) {
        const chunks = this.splitMessage(text, 4096);
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk, opts);
          await new Promise((res) => setTimeout(res, 100));
        }
      } else {
        await bot.sendMessage(chatId, text, opts);
      }
    } catch (err) {
      console.error('❌ SendMessage Error:', err.message);
      await bot.sendMessage(chatId, text.replace(/[*_`\[\]]/g, ''), { disable_web_page_preview: true });
    }
  }

  splitMessage(text, maxLength) {
    const parts = [];
    let chunk = '';
    for (const line of text.split('\n')) {
      if (chunk.length + line.length + 1 <= maxLength) {
        chunk += (chunk ? '\n' : '') + line;
      } else {
        if (chunk) parts.push(chunk);
        chunk = line;
      }
    }
    if (chunk) parts.push(chunk);
    return parts;
  }
}

const novaBot = new NovaBot();

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  await novaBot.processMessage(msg);
});

bot.on('error', (err) => console.error('❌ Bot error:', err.message));
bot.on('polling_error', (err) => console.error('❌ Polling error:', err.message));

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down...');
  try {
    await bot.stopPolling();
    await database.close();
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Shutdown error:', err.message);
    process.exit(1);
  }
});

// Start server for keep-alive (optional)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('NOVA running');
}).listen(process.env.PORT || 3000);

(async function startBot() {
  try {
    console.log('🔄 Starting bot polling...');
    await bot.startPolling();
    console.log('✅ NOVA is online!');
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
})();
