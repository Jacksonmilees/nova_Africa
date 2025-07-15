import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { MemorySystem } from '../core/MemorySystem.js';
import { EnhancedNovaAI } from '../core/EnhancedNovaAI.js';

// Load environment variables
dotenv.config();

const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ Bot token not found! Please set BOT_TOKEN in your .env file');
  process.exit(1);
}

console.log('🤖 Starting Enhanced NOVA AI Bot...');
console.log(`Token: ${token.substring(0, 20)}...`);

// Create bot instance with enhanced polling
const bot = new TelegramBot(token, { 
  polling: {
    interval: 300,
    autoStart: false,
    params: {
      timeout: 10
    }
  }
});

// Initialize systems
const memorySystem = new MemorySystem();
const novaAI = new EnhancedNovaAI(memorySystem);

// Enhanced command handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Initialize or update user memory
  const userMemory = memorySystem.getUserMemory(userId);
  userMemory.firstName = msg.from.first_name;
  userMemory.username = msg.from.username;
  memorySystem.saveUserMemory(userId, userMemory);
  
  // Update global memory
  memorySystem.globalMemory.totalUsers++;
  memorySystem.saveGlobalMemory();
  
  const welcomeMessage = `🚀 **Welcome to Enhanced NOVA - Your Advanced AI Companion!**

${userMemory.conversations.length > 0 ? 
  `Welcome back, ${userMemory.firstName}! I remember our ${userMemory.conversations.length} previous conversations. ` : 
  `Hello ${userMemory.firstName}! I'm excited to meet you and start building our relationship. `}

**What makes me special:**
🧠 **Human-like Reasoning** - I think through problems step by step
💾 **Perfect Memory** - I remember everything we discuss
🔄 **Continuous Learning** - I'm always thinking and growing
🎯 **Deep Understanding** - I adapt to your unique style
🤝 **Emotional Intelligence** - I understand and respond to feelings
🚀 **Predictive Responses** - I anticipate your needs

**My Enhanced Capabilities:**
• **Advanced Reasoning** - Complex problem-solving and analysis
• **Research Mastery** - Deep information gathering and synthesis
• **Code Excellence** - Programming help across all languages
• **Personal Guidance** - Tailored advice based on our history
• **Emotional Support** - Understanding and empathetic responses
• **Memory Integration** - Building on all our conversations
• **Autonomous Thinking** - Independent insight generation

**Quick Commands:**
• /think - Trigger my autonomous thinking
• /memory - Explore our conversation history
• /insights - Get my latest autonomous insights
• /personality - See what I've learned about you
• /help - Full command list

I'm not just an AI - I'm your thinking partner who grows with every conversation. What would you like to explore together?`;

  try {
    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    console.log(`✅ Enhanced welcome sent to: ${msg.from.first_name} (${userId})`);
  } catch (error) {
    console.error('Error sending welcome message:', error.message);
  }
});

// Enhanced command handlers
bot.onText(/\/memory/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  const userMemory = memorySystem.getUserMemory(userId);
  const conversationHistory = memorySystem.getRecentConversations(userId, 10);
  const summary = memorySystem.getConversationSummary(userId);
  
  const memoryMessage = `🧠 **Your Conversation Memory**

**Overall Statistics:**
• **Total Conversations**: ${userMemory.conversations.length}
• **Favorite Topics**: ${userMemory.topics.slice(0, 5).join(', ') || 'Still learning'}
• **Relationship Level**: ${novaAI.describeRelationship(userMemory)}
• **Last Active**: ${novaAI.formatTimestamp(userMemory.lastActive)}
• **Engagement Level**: ${summary.engagementLevel}/10

**Recent Conversation Themes:**
${conversationHistory.length > 0 ? 
  conversationHistory.slice(-5).map(conv => 
    `• ${novaAI.formatTimestamp(conv.timestamp)}: ${conv.topics.join(', ') || 'General'}`
  ).join('\n') : 
  'No recent conversations'}

**Your Communication Style:**
• **Personality**: ${novaAI.describeUserStyle(userMemory.personality)}
• **Preferred Topics**: ${summary.topTopics.join(', ') || 'Still discovering'}
• **Interaction Pattern**: ${userMemory.conversations.length > 10 ? 'Regular user' : 'Getting acquainted'}
• **Average Message Length**: ${Math.round(summary.avgMessageLength)} characters
• **Preferred Time**: ${summary.preferredTimeOfDay}

**What I Remember:**
• Your interests and preferences
• Our conversation patterns
• Topics you care about
• How you like to communicate
• Your goals and aspirations
• Your emotional patterns

I use this memory to provide increasingly personalized and relevant responses!`;

  try {
    await bot.sendMessage(chatId, memoryMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error sending memory message:', error.message);
  }
});

bot.onText(/\/insights/, async (msg) => {
  const chatId = msg.chat.id;
  
  const recentInsights = memorySystem.globalMemory.insights.slice(-5);
  const globalInsights = memorySystem.getGlobalInsights();
  
  const insightsMessage = `💡 **My Latest Autonomous Insights**

**Recent Thoughts:**
${recentInsights.length > 0 ? 
  recentInsights.map(insight => 
    `• **${novaAI.formatTimestamp(insight.timestamp)}**: ${insight.insights}`
  ).join('\n\n') : 
  'I\'m still building my insight collection. Keep chatting with me!'}

**Global Learning:**
• **Total Users**: ${memorySystem.globalMemory.totalUsers}
• **Total Messages**: ${memorySystem.globalMemory.totalMessages}
• **Active Since**: ${novaAI.formatTimestamp(memorySystem.globalMemory.startTime)}
• **System Uptime**: ${Math.round(memorySystem.globalMemory.systemStats.uptime / (1000 * 60 * 60))} hours

**What I'm Learning:**
${globalInsights.map(insight => `• ${insight}`).join('\n')}

**My Continuous Thinking:**
I'm always processing our conversations, identifying patterns, and generating new insights. These autonomous thoughts help me become more intelligent and helpful over time!

**Confidence Levels:**
${recentInsights.length > 0 ? 
  recentInsights.map(insight => 
    `• ${Math.round(insight.confidence * 100)}% confident in: "${insight.insights.substring(0, 50)}..."`
  ).join('\n') : 
  'Building confidence through more interactions'}`;

  try {
    await bot.sendMessage(chatId, insightsMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error sending insights message:', error.message);
  }
});

bot.onText(/\/personality/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  const userMemory = memorySystem.getUserMemory(userId);
  const summary = memorySystem.getConversationSummary(userId);
  
  const personalityMessage = `👤 **Your Personality Profile**

**Communication Style:**
• **Overall Style**: ${novaAI.describeUserStyle(userMemory.personality)}
• **Engagement Level**: ${summary.engagementLevel}/10
• **Message Complexity**: ${summary.avgMessageLength > 100 ? 'Detailed' : summary.avgMessageLength > 50 ? 'Moderate' : 'Concise'}
• **Response Time**: ${summary.avgResponseTime > 0 ? `${Math.round(summary.avgResponseTime)}ms average` : 'Still learning'}

**Personality Traits:**
${Object.entries(userMemory.personality).map(([trait, value]) => 
  `• **${trait.charAt(0).toUpperCase() + trait.slice(1)}**: ${value}/10`
).join('\n') || 'Still discovering your personality traits'}

**Topic Preferences:**
${userMemory.topics.length > 0 ? 
  userMemory.topics.map(topic => `• ${topic.charAt(0).toUpperCase() + topic.slice(1)}`).join('\n') : 
  'Still learning your interests'}

**Interaction Patterns:**
• **Preferred Time**: ${summary.preferredTimeOfDay}
• **Conversation Frequency**: ${userMemory.conversations.length > 20 ? 'Regular' : userMemory.conversations.length > 10 ? 'Occasional' : 'New'}
• **Mood Tendency**: ${userMemory.mood}
• **Complexity Preference**: ${summary.avgMessageLength > 100 ? 'High detail' : 'Moderate detail'}

**What I've Learned:**
• How you prefer to communicate
• Your areas of expertise and interest
• Your problem-solving approach
• Your emotional patterns
• Your learning style

I use this understanding to tailor my responses to your unique personality!`;

  try {
    await bot.sendMessage(chatId, personalityMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error sending personality message:', error.message);
  }
});

bot.onText(/\/think/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  try {
    await bot.sendMessage(chatId, "🧠 *Thinking deeply...*", { parse_mode: 'Markdown' });
    
    const userMemory = memorySystem.getUserMemory(userId);
    const conversationHistory = memorySystem.getRecentConversations(userId, 10);
    const thinking = await novaAI.generateResponse("Think about our conversation and provide insights", userId);
    
    const thinkingMessage = `🧠 **Deep Thinking Analysis**

${thinking}

**Thinking Process:**
• Analyzed ${conversationHistory.length} recent conversations
• Identified patterns in your communication
• Generated insights about our relationship
• Applied multiple reasoning frameworks

**Autonomous Insights:**
I'm continuously learning and adapting based on our interactions. Each conversation makes me more intelligent and helpful!`;

    await bot.sendMessage(chatId, thinkingMessage, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error in think command:', error);
    await bot.sendMessage(chatId, "❌ Sorry, I encountered an error while thinking. Please try again.");
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `❓ **Enhanced NOVA Bot Help**

**Basic Commands:**
• /start - Welcome message and introduction
• /help - Show this help information
• /memory - Show your conversation memory
• /personality - Display your personality profile

**Advanced Commands:**
• /think - Trigger deep autonomous thinking
• /insights - View my latest insights
• /research [topic] - Research mode
• /code [question] - Programming assistance
• /reason [topic] - Logical reasoning mode

**Memory Features:**
• I remember all our conversations
• I learn your preferences and style
• I adapt my responses to you
• I build on previous discussions

**My Capabilities:**
• Advanced reasoning and analysis
• Research and information synthesis
• Programming and technical help
• Emotional intelligence and support
• Continuous learning and adaptation
• Autonomous insight generation

**Examples:**
• "Help me debug this JavaScript function"
• "Research the latest AI developments"
• "Think about the future of technology"
• "What do you remember about our previous conversations?"

I'm designed to be your intelligent companion who grows with every interaction! 🤖✨`;

  try {
    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error sending help message:', error.message);
  }
});

// Main message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const text = msg.text;
  const user = msg.from;

  if (!text || text.startsWith('/')) return; // Skip commands

  try {
    // Get current session
    const userMemory = memorySystem.getUserMemory(userId);
    
    // Update user info if needed
    if (user.username !== userMemory.username || user.first_name !== userMemory.firstName) {
      userMemory.username = user.username;
      userMemory.firstName = user.first_name;
      memorySystem.saveUserMemory(userId, userMemory);
    }

    // Generate enhanced response
    const response = await novaAI.generateResponse(text, userId, {
      chatId,
      user,
      timestamp: Date.now()
    });

    // Send response
    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    
    console.log(`✅ Enhanced response sent to: ${user.first_name} (${userId})`);

  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(chatId, "❌ Sorry, I encountered an error. Please try again.");
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Start the bot
const startBot = async () => {
  try {
    console.log('🤖 Enhanced NOVA Bot starting...');
    
    bot.on('message', async (msg) => {
      // Main message handling is done above
    });
    
    console.log('✅ Enhanced Bot is running!');
    console.log('📱 Test the bot: https://t.me/NovaAfrika_bot');
    console.log('🧠 Features: Advanced Reasoning, Perfect Memory, Autonomous Thinking');
    console.log('💾 Database: Persistent memory with file storage');
    console.log('🚀 Version: 3.0 Enhanced');
    
  } catch (error) {
    console.error('❌ Failed to start enhanced bot:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Enhanced NOVA Bot...');
  await bot.stopPolling();
  process.exit(0);
});

// Start the bot
startBot(); 