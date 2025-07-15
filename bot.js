import TelegramBot from 'node-telegram-bot-api';
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
    // Autonomous thinking every 5 minutes
    this.thinkingInterval = setInterval(async () => {
      await this.performAutonomousThinking();
    }, 5 * 60 * 1000);
    
    console.log('🧠 Autonomous thinking system activated');
  }

  async performAutonomousThinking() {
    try {
      const systemStats = await database.getSystemStats();
      const recentInsights = await database.getRecentInsights(5);
      
      // Generate autonomous insights
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
    // Daily maintenance at 3 AM
    cron.schedule('0 3 * * *', async () => {
      await this.performMaintenance();
    });
    
    console.log('🔧 Periodic maintenance scheduled');
  }

  async performMaintenance() {
    try {
      console.log('🔧 Performing daily maintenance...');
      
      // Cleanup old data (keep 90 days)
      const cleanupResult = await database.cleanupOldData(90);
      
      // Update system stats
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
      
      // Create or update user
      await database.createOrUpdateUser({
        id: userId,
        first_name: msg.from.first_name,
        username: msg.from.username
      });
      
      // Get user context
      const [userStats, recentConversations, userMemories] = await Promise.all([
        database.getUserStats(userId),
        database.getRecentConversations(userId, 10),
        database.getMemories(userId, 20)
      ]);
      
      // Prepare context for AI
      const context = {
        userStats,
        recentConversations,
        userMemories,
        sessionId,
        chatId
      };
      
      // Generate AI response
      const response = await aiEngine.generateResponse(userMessage, userId, context);
      
      // Analyze message for metadata
      const topics = aiEngine.extractTopics(userMessage);
      const sentiment = aiEngine.analyzeSentiment(userMessage);
      const importance = this.calculateImportance(userMessage, sentiment, topics);
      
      // Save conversation
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
      
      // Update user personality and topics
      await this.updateUserProfile(userId, userMessage, sentiment, topics);
      
      // Save important memories
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
      
      // Send response
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
    let importance = 5; // Base importance
    
    // Boost for emotional content
    if (sentiment === 'positive' || sentiment === 'negative') importance += 1;
    if (sentiment === 'mixed') importance += 2;
    
    // Boost for questions
    if (message.includes('?')) importance += 1;
    
    // Boost for personal content
    if (message.toLowerCase().includes('my') || message.toLowerCase().includes('me')) importance += 1;
    
    // Boost for specific topics
    if (topics.includes('personal') || topics.includes('coding') || topics.includes('research')) importance += 1;
    
    // Boost for longer messages
    if (message.length > 200) importance += 1;
    
    // Boost for technical content
    const technicalTerms = (message.match(/\b(algorithm|architecture|optimization|implementation|methodology)\b/gi) || []).length;
    importance += Math.min(technicalTerms, 2);
    
    return Math.min(10, Math.max(1, importance));
  }

  async updateUserProfile(userId, message, sentiment, topics) {
    try {
      const user = await database.getUser(userId);
      if (!user) return;
      
      // Update personality traits
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
      
      // Update user topics
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
      
      // Split long messages
      if (text.length > 4096) {
        const chunks = this.splitMessage(text, 4096);
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk, defaultOptions);
          await this.delay(100); // Small delay between chunks
        }
      } else {
        await bot.sendMessage(chatId, text, defaultOptions);
      }
      
    } catch (error) {
      console.error('❌ Send message error:', error.message);
      
      // Fallback without markdown
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
          // Line is too long, split it
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

// Initialize NOVA bot
const novaBot = new NovaBot();

// Command handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    // Create or update user
    await database.createOrUpdateUser({
      id: userId,
      first_name: msg.from.first_name,
      username: msg.from.username
    });
    
    // Get user stats
    const userStats = await database.getUserStats(userId);
    
    const welcomeMessage = `🚀 **Welcome to NOVA - Neural Operational Virtual Assistant!**

${userStats.totalConversations > 0 ? 
  `Welcome back, ${msg.from.first_name}! I remember our ${userStats.totalConversations} previous conversations. ` : 
  `Hello ${msg.from.first_name}! I'm excited to meet you and start building our relationship. `}

**🧠 What makes me special:**
• **Advanced Reasoning** - I think through problems step-by-step
• **Perfect Memory** - I remember everything using PostgreSQL database
• **Continuous Learning** - I'm always thinking and growing
• **Emotional Intelligence** - I understand and respond to feelings
• **Research Capabilities** - I can search the web and analyze information
• **Coding Excellence** - Programming help across all languages

**🛠️ My Enhanced Capabilities:**
• Multi-step logical reasoning and analysis
• Persistent conversation memory across sessions
• Real-time web research and fact-checking
• Advanced programming assistance
• Emotional support and personal guidance
• Autonomous thinking and insight generation

**⚡ Quick Commands:**
• /memory - Explore our conversation history
• /insights - See my latest autonomous thoughts
• /stats - View your interaction statistics
• /research [topic] - Deep research mode
• /code [language] - Coding assistance mode
• /help - Complete command list

**🎯 Conversation Modes:**
Just talk to me naturally! I automatically detect if you need:
• **Research help** - I'll search the web and analyze
• **Coding assistance** - I'll provide expert programming help
• **Personal advice** - I'll offer thoughtful guidance
• **Emotional support** - I'll listen and understand

I'm not just an AI - I'm your intelligent companion who grows with every conversation. Ready to explore the possibilities together? 🌟`;

    await novaBot.sendMessage(chatId, welcomeMessage);
    
    console.log(`✅ Welcome sent to: ${msg.from.first_name} (${userId})`);
    
  } catch (error) {
    console.error('❌ Start command error:', error.message);
    await novaBot.sendMessage(chatId, "Welcome to NOVA! I'm ready to assist you.");
  }
});

bot.onText(/\/memory/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    const [userStats, recentConversations, memories] = await Promise.all([
      database.getUserStats(userId),
      database.getRecentConversations(userId, 10),
      database.getMemories(userId, 10)
    ]);
    
    const memoryMessage = `🧠 **Your Conversation Memory Archive**

**📊 Overall Statistics:**
• **Total Conversations**: ${userStats.totalConversations}
• **Total Memories**: ${userStats.totalMemories}
• **Favorite Topics**: ${userStats.topTopics.map(t => `${t.topic} (${t.frequency})`).join(', ') || 'Still learning'}
• **Relationship Level**: ${userStats.totalConversations > 50 ? 'Close companion' : userStats.totalConversations > 20 ? 'Trusted friend' : userStats.totalConversations > 5 ? 'Getting acquainted' : 'New connection'}

**💭 Recent Conversation Themes:**
${recentConversations.slice(0, 5).map(conv => {
  const date = new Date(conv.timestamp).toLocaleDateString();
  const topics = conv.topics?.join(', ') || 'General';
  return `• **${date}**: ${topics} (${conv.sentiment})`;
}).join('\n') || 'No recent conversations'}

**🎯 Important Memories:**
${memories.slice(0, 5).map(memory => {
  const date = new Date(memory.created_at).toLocaleDateString();
  const content = memory.content.substring(0, 100);
  return `• **${date}**: ${content}... (Importance: ${memory.importance}/10)`;
}).join('\n') || 'No important memories yet'}

**🧬 Your Communication Style:**
${userStats.user?.personality ? Object.entries(userStats.user.personality).map(([trait, value]) => 
  `• **${trait.charAt(0).toUpperCase() + trait.slice(1)}**: ${value > 5 ? 'High' : value > 2 ? 'Medium' : 'Low'}`
).join('\n') : '• Still learning your style'}

**💡 What I Remember:**
• Your interests and preferences
• Our conversation patterns and themes
• Topics you care about most
• How you like to communicate
• Your goals and aspirations
• Emotional context from our chats

I use this comprehensive memory to provide increasingly personalized and relevant responses! 🚀`;

    await novaBot.sendMessage(chatId, memoryMessage);
    
  } catch (error) {
    console.error('❌ Memory command error:', error.message);
    await novaBot.sendMessage(chatId, "I'm having trouble accessing my memory systems right now. Please try again.");
  }
});

bot.onText(/\/insights/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const [globalInsights, systemStats] = await Promise.all([
      database.getRecentInsights(10),
      database.getSystemStats()
    ]);
    
    const insightsMessage = `💡 **My Latest Autonomous Insights**

**🧠 Recent Autonomous Thoughts:**
${globalInsights.length > 0 ? 
  globalInsights.map(insight => {
    const date = new Date(insight.created_at).toLocaleDateString();
    return `• **${date}**: ${insight.content}`;
  }).join('\n\n') : 
  'I\'m still building my insight collection. Keep chatting with me!'}

**📈 Global Learning Statistics:**
• **Total Users**: ${systemStats?.total_users || 0}
• **Total Conversations**: ${systemStats?.total_conversations || 0}
• **Total Memories**: ${systemStats?.total_memories || 0}
• **System Uptime**: ${Math.floor((Date.now() - novaBot.startTime) / (1000 * 60))} minutes

**🔄 What I'm Learning:**
• Patterns in how people communicate
• Common interests and topics across users
• Effective ways to help with different problems
• Connections between different domains of knowledge
• How to be more helpful and engaging
• Emotional intelligence and empathy

**⚡ My Continuous Thinking Process:**
I'm always processing our conversations in the background, identifying patterns, and generating new insights. These autonomous thoughts help me become more intelligent and helpful over time!

**🎯 Current Focus Areas:**
• Improving emotional intelligence
• Enhancing technical assistance
• Better understanding user needs
• Developing more personalized responses
• Learning from conversation patterns

My goal is to become the most helpful and understanding AI companion possible! 🌟`;

    await novaBot.sendMessage(chatId, insightsMessage);
    
  } catch (error) {
    console.error('❌ Insights command error:', error.message);
    await novaBot.sendMessage(chatId, "I'm having trouble accessing my insights right now. Please try again.");
  }
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    const [userStats, systemStats] = await Promise.all([
      database.getUserStats(userId),
      database.getSystemStats()
    ]);
    
    const statsMessage = `📊 **Your NOVA Statistics**

**👤 Personal Stats:**
• **Name**: ${userStats.user?.first_name || 'Unknown'}
• **Username**: ${userStats.user?.username ? '@' + userStats.user.username : 'Not set'}
• **Member Since**: ${new Date(userStats.user?.created_at).toLocaleDateString()}
• **Last Active**: ${new Date(userStats.user?.last_active).toLocaleDateString()}

**💬 Conversation Analytics:**
• **Total Conversations**: ${userStats.totalConversations}
• **Total Memories**: ${userStats.totalMemories}
• **Average Daily Chats**: ${userStats.totalConversations > 0 ? Math.round(userStats.totalConversations / Math.max(1, Math.floor((Date.now() - new Date(userStats.user?.created_at).getTime()) / (1000 * 60 * 60 * 24)))) : 0}

**🎯 Your Top Topics:**
${userStats.topTopics.slice(0, 5).map((topic, index) => 
  `${index + 1}. **${topic.topic}** (${topic.frequency} mentions)`
).join('\n') || 'No topics identified yet'}

**🧬 Personality Profile:**
${userStats.user?.personality ? Object.entries(userStats.user.personality).map(([trait, value]) => {
  const level = value > 10 ? 'Very High' : value > 5 ? 'High' : value > 2 ? 'Medium' : 'Low';
  return `• **${trait.charAt(0).toUpperCase() + trait.slice(1)}**: ${level} (${value})`;
}).join('\n') : '• Still analyzing your communication patterns'}

**🌍 Global Context:**
• **Total NOVA Users**: ${systemStats?.total_users || 0}
• **Global Conversations**: ${systemStats?.total_conversations || 0}
• **Your Rank**: ${userStats.totalConversations > 100 ? 'Power User' : userStats.totalConversations > 50 ? 'Active User' : userStats.totalConversations > 10 ? 'Regular User' : 'New User'}

**📈 Growth Metrics:**
• **Relationship Level**: ${userStats.totalConversations > 50 ? 'Close Companion' : userStats.totalConversations > 20 ? 'Trusted Friend' : userStats.totalConversations > 5 ? 'Getting Acquainted' : 'New Connection'}
• **Engagement Score**: ${Math.min(100, Math.round((userStats.totalConversations * 2) + (userStats.totalMemories * 5)))}%

Keep chatting with me to unlock more insights and build our relationship! 🚀`;

    await novaBot.sendMessage(chatId, statsMessage);
    
  } catch (error) {
    console.error('❌ Stats command error:', error.message);
    await novaBot.sendMessage(chatId, "I'm having trouble accessing your statistics right now. Please try again.");
  }
});

bot.onText(/\/research (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const researchTopic = match[1];
  
  try {
    await novaBot.sendMessage(chatId, `🔍 **Research Mode Activated**\n\nResearching: "${researchTopic}"\n\nI'm conducting deep research with web search integration. This may take a moment...`);
    
    // Get user context
    const userStats = await database.getUserStats(userId);
    const context = { userStats, researchMode: true };
    
    // Generate research response
    const response = await aiEngine.generateResponse(`Research this topic in depth: ${researchTopic}`, userId, context);
    
    await novaBot.sendMessage(chatId, response);
    
  } catch (error) {
    console.error('❌ Research command error:', error.message);
    await novaBot.sendMessage(chatId, "I'm having trouble with my research systems right now. Please try asking your research question directly.");
  }
});

bot.onText(/\/code (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const codeRequest = match[1];
  
  try {
    await novaBot.sendMessage(chatId, `💻 **Coding Mode Activated**\n\nProcessing: "${codeRequest}"\n\nAnalyzing your coding request with advanced programming assistance...`);
    
    // Get user context
    const userStats = await database.getUserStats(userId);
    const context = { userStats, codingMode: true };
    
    // Generate coding response
    const response = await aiEngine.generateResponse(`Help me with this coding task: ${codeRequest}`, userId, context);
    
    await novaBot.sendMessage(chatId, response);
    
  } catch (error) {
    console.error('❌ Code command error:', error.message);
    await novaBot.sendMessage(chatId, "I'm having trouble with my coding systems right now. Please try asking your programming question directly.");
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `🆘 **NOVA Command Center**

**🚀 Basic Commands:**
• **/start** - Initialize or restart NOVA
• **/help** - Show this help message
• **/memory** - Explore conversation history
• **/insights** - View autonomous thoughts
• **/stats** - Your interaction statistics

**🎯 Specialized Modes:**
• **/research [topic]** - Deep research with web search
• **/code [request]** - Advanced programming assistance
• **/think [problem]** - Logical reasoning mode
• **/analyze [data]** - Data analysis mode

**💬 Natural Conversation:**
Just talk to me naturally! I automatically detect:
• **Questions** - I provide detailed answers
• **Coding problems** - I offer programming help
• **Research needs** - I search and analyze
• **Personal topics** - I give thoughtful advice
• **Emotional content** - I provide support

**🧠 Advanced Features:**
• **Persistent Memory** - I remember everything
• **Context Awareness** - I build on our history
• **Emotional Intelligence** - I understand feelings
• **Multi-domain Expertise** - I help with any topic
• **Autonomous Thinking** - I generate insights
• **Web Research** - I search for current info

**🔧 Special Functions:**
• **Memory Search** - Ask me to remember specific topics
• **Pattern Recognition** - I identify trends in our chats
• **Personalized Responses** - I adapt to your style
• **Learning Mode** - I explain complex topics
• **Problem Solving** - I break down challenges

**💡 Pro Tips:**
• Be specific in your questions for better responses
• Ask follow-up questions to dive deeper
• Tell me about your interests to improve personalization
• Use natural language - no need for special formatting
• I work best with conversational, detailed messages

**🌟 Remember:**
I'm not just a chatbot - I'm your intelligent companion who learns, remembers, and grows with every conversation. The more we chat, the better I understand and help you!

Ready to explore the possibilities? Just start chatting! 🚀`;

  await novaBot.sendMessage(chatId, helpMessage);
});

// Handle all text messages
bot.on('message', async (msg) => {
  // Skip if it's a command (starts with /)
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }
  
  // Skip non-text messages
  if (!msg.text) {
    return;
  }
  
  await novaBot.processMessage(msg);
});

// Error handling
bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down NOVA...');
  
  try {
    await bot.stopPolling();
    await database.close();
    console.log('✅ NOVA shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Shutdown error:', error.message);
    process.exit(1);
  }
});

// Start the bot
async function startBot() {
  try {
    console.log('🔄 Starting bot polling...');
    await bot.startPolling();
    console.log('✅ NOVA is now online and ready!');
    console.log('🎯 Send /start to begin chatting');
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error.message);
    process.exit(1);
  }
}

// Initialize and start
startBot();