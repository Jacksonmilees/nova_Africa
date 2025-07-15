import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Memory from './src/models/Memory.js';
import EnhancedAI from './src/services/EnhancedAI.js';

dotenv.config();

// Initialize enhanced AI
const novaAI = new EnhancedAI();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nova_bot';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Running in memory-only mode (no persistent storage)');
    return false;
  }
};

// Initialize bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// In-memory fallback for when MongoDB is not available
const inMemorySessions = new Map();

// Memory management functions
const getSession = async (userId) => {
  try {
    // Try MongoDB first
    let session = await Memory.findOne({ userId: userId.toString() });
    if (!session) {
      session = new Memory({
        userId: userId.toString(),
        context: [],
        mode: 'general',
        messageCount: 0,
        facts: [],
        insights: []
      });
      await session.save();
    }
    return session;
  } catch (error) {
    console.error('Error getting session from MongoDB:', error);
    // Fallback to in-memory storage
    const userIdStr = userId.toString();
    if (!inMemorySessions.has(userIdStr)) {
      inMemorySessions.set(userIdStr, {
        userId: userIdStr,
        context: [],
        mode: 'general',
        messageCount: 0,
        facts: [],
        insights: [],
        lastInteraction: new Date()
      });
    }
    return inMemorySessions.get(userIdStr);
  }
};

const updateSession = async (userId, updates) => {
  try {
    await Memory.findOneAndUpdate(
      { userId: userId.toString() },
      { 
        $set: { ...updates, lastInteraction: new Date() },
        $inc: { messageCount: 1 }
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error updating session in MongoDB:', error);
    // Fallback to in-memory storage
    const userIdStr = userId.toString();
    const session = inMemorySessions.get(userIdStr);
    if (session) {
      Object.assign(session, updates, { 
        lastInteraction: new Date(),
        messageCount: (session.messageCount || 0) + 1
      });
    }
  }
};

const addToContext = async (userId, message) => {
  try {
    await Memory.findOneAndUpdate(
      { userId: userId.toString() },
      { 
        $push: { context: message },
        $set: { lastInteraction: new Date() }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error adding to context in MongoDB:', error);
    // Fallback to in-memory storage
    const userIdStr = userId.toString();
    const session = inMemorySessions.get(userIdStr);
    if (session) {
      session.context.push(message);
      session.lastInteraction = new Date();
    }
  }
};

const addUserFact = async (userId, fact) => {
  try {
    await Memory.findOneAndUpdate(
      { userId: userId.toString() },
      { 
        $addToSet: { facts: fact },
        $set: { lastInteraction: new Date() }
      },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error adding fact to MongoDB:', error);
    // Fallback to in-memory storage
    const userIdStr = userId.toString();
    const session = inMemorySessions.get(userIdStr);
    if (session) {
      if (!session.facts.includes(fact)) {
        session.facts.push(fact);
      }
      session.lastInteraction = new Date();
    }
    return true;
  }
};

// Command handlers
const handleStart = async (chatId, user) => {
  const welcomeMessage = `🤖 *Welcome to NOVA - Enhanced AI Assistant!*

I'm NOVA, your intelligent companion with *continuous memory* and *deep thinking* capabilities.

*Key Features:*
🧠 **Continuous Memory** - I remember our conversations across sessions
🤔 **Deep Thinking** - Use /think for analytical insights
🔧 **Mode Switching** - /code, /research, /reasoning, /general
📝 **Fact Storage** - I remember important facts about you
💡 **Smart Responses** - Context-aware and personalized

*Available Commands:*
/start - Show this message
/think - Deep analytical thinking
/code - Programming assistance mode
/research - Research and information mode
/reasoning - Logical reasoning mode
/general - General conversation mode
/modes - Show all available modes
/fact - Add a fact about yourself
/memory - Show what I remember about you
/help - Show help information

*Example:* Try saying "Hello" and then use /think to see my analytical capabilities!`;

  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  
  // Initialize user session
  await getSession(user.id);
};

const handleThink = async (chatId, userId) => {
  try {
    const session = await getSession(userId);
    const context = session.context.slice(-10); // Last 10 messages for context
    
    await bot.sendMessage(chatId, "🧠 *Thinking deeply...*", { parse_mode: 'Markdown' });
    
    const thinking = await novaAI.thinkDeeply(context, session.facts);
    
    let response = "🧠 *Deep Thinking Analysis:*\n\n";
    
    // Add insights
    if (thinking.insights.length > 0) {
      response += "*Insights:*\n";
      thinking.insights.forEach(insight => {
        response += `• ${insight}\n`;
      });
      response += "\n";
    }
    
    // Add pattern analysis
    if (thinking.patterns) {
      response += "*Pattern Analysis:*\n";
      response += `• Dominant pattern: ${thinking.patterns.dominant}\n`;
      response += `• Coding mentions: ${thinking.patterns.patterns.coding}\n`;
      response += `• Research mentions: ${thinking.patterns.patterns.research}\n`;
      response += `• Reasoning mentions: ${thinking.patterns.patterns.reasoning}\n\n`;
    }
    
    // Add recommendations
    if (thinking.recommendations.length > 0) {
      response += "*Recommendations:*\n";
      thinking.recommendations.forEach(rec => {
        response += `• ${rec}\n`;
      });
    }
    
    // Store insights in memory
    try {
      await Memory.findOneAndUpdate(
        { userId: userId.toString() },
        { $addToSet: { insights: thinking.insights[0] } }
      );
    } catch (error) {
      console.error('Error storing insight in MongoDB:', error);
      // Fallback to in-memory storage
      const userIdStr = userId.toString();
      const session = inMemorySessions.get(userIdStr);
      if (session && thinking.insights[0]) {
        if (!session.insights.includes(thinking.insights[0])) {
          session.insights.push(thinking.insights[0]);
        }
      }
    }
    
    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error in think command:', error);
    await bot.sendMessage(chatId, "❌ Sorry, I encountered an error while thinking. Please try again.");
  }
};

const handleModeSwitch = async (chatId, userId, mode) => {
  try {
    await updateSession(userId, { mode });
    
    const modeMessages = {
      code: "💻 *Code Mode Activated!*\n\nI'm now in programming assistance mode. I can help with:\n• Code reviews and optimization\n• Debugging assistance\n• Architecture patterns\n• Best practices\n• Algorithm design",
      research: "🔍 *Research Mode Activated!*\n\nI'm now in research mode. I can help with:\n• Information gathering\n• Data analysis\n• Source validation\n• Topic exploration\n• Fact checking",
      reasoning: "🧠 *Reasoning Mode Activated!*\n\nI'm now in logical reasoning mode. I can help with:\n• Deep analysis\n• Logical thinking\n• Problem solving\n• Critical evaluation\n• Hypothesis testing",
      general: "🤖 *General Mode Activated!*\n\nI'm now in general conversation mode. I can help with:\n• General questions\n• Casual conversation\n• Information sharing\n• Creative discussions\n• Learning assistance"
    };
    
    await bot.sendMessage(chatId, modeMessages[mode], { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error switching mode:', error);
    await bot.sendMessage(chatId, "❌ Error switching mode. Please try again.");
  }
};

const handleFact = async (chatId, userId, fact) => {
  if (!fact) {
    await bot.sendMessage(chatId, "📝 *Add a fact about yourself:*\n\nUsage: /fact [your fact]\n\nExample: /fact I'm a software developer from Kenya");
    return;
  }
  
  const success = await addUserFact(userId, fact);
  if (success) {
    await bot.sendMessage(chatId, `✅ *Fact added to memory:*\n\n"${fact}"\n\nI'll remember this for future conversations!`, { parse_mode: 'Markdown' });
  } else {
    await bot.sendMessage(chatId, "❌ Error adding fact. Please try again.");
  }
};

const handleMemory = async (chatId, userId) => {
  try {
    const session = await getSession(userId);
    
    let response = "🧠 *What I Remember About You:*\n\n";
    
    if (session.facts && session.facts.length > 0) {
      response += "*Facts:*\n";
      session.facts.forEach(fact => {
        response += `• ${fact}\n`;
      });
      response += "\n";
    }
    
    if (session.insights && session.insights.length > 0) {
      response += "*Recent Insights:*\n";
      session.insights.slice(-3).forEach(insight => {
        response += `• ${insight}\n`;
      });
      response += "\n";
    }
    
    response += `*Stats:*\n`;
    response += `• Messages: ${session.messageCount}\n`;
    response += `• Current mode: ${session.mode}\n`;
    response += `• Last interaction: ${session.lastInteraction ? new Date(session.lastInteraction).toLocaleString() : 'Never'}\n`;
    
    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error showing memory:', error);
    await bot.sendMessage(chatId, "❌ Error retrieving memory. Please try again.");
  }
};

const handleModes = async (chatId) => {
  const modesMessage = `🎛️ *Available Modes:*\n\n` +
    `💻 */code* - Programming assistance\n` +
    `🔍 */research* - Research and information\n` +
    `🧠 */reasoning* - Logical reasoning\n` +
    `🤖 */general* - General conversation\n\n` +
    `*Current Features:*\n` +
    `• Continuous memory across sessions\n` +
    `• Deep thinking with /think\n` +
    `• Personalized responses\n` +
    `• Context awareness\n` +
    `• Fact storage with /fact\n\n` +
    `Try switching modes to see different capabilities!`;
  
  await bot.sendMessage(chatId, modesMessage, { parse_mode: 'Markdown' });
};

const handleHelp = async (chatId) => {
  const helpMessage = `❓ *NOVA Enhanced Bot Help*\n\n` +
    `*Basic Commands:*\n` +
    `• /start - Welcome message\n` +
    `• /help - Show this help\n` +
    `• /modes - Show available modes\n\n` +
    `*Mode Commands:*\n` +
    `• /code - Switch to programming mode\n` +
    `• /research - Switch to research mode\n` +
    `• /reasoning - Switch to reasoning mode\n` +
    `• /general - Switch to general mode\n\n` +
    `*Memory Commands:*\n` +
    `• /think - Deep analytical thinking\n` +
    `• /fact [fact] - Add fact about yourself\n` +
    `• /memory - Show what I remember\n\n` +
    `*Examples:*\n` +
    `• "Hello" - Start a conversation\n` +
    `• "/fact I love coding" - Add personal fact\n` +
    `• "/think" - Get deep insights\n` +
    `• "/code" then "help me debug this function" - Programming help\n\n` +
    `I remember everything across sessions! 🤖`;
  
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
};

// Main message handler
const handleMessage = async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const user = msg.from;

  if (!text) return;

  try {
    // Get current session
    const session = await getSession(userId);
    
    // Update user info if needed
    if (user.username !== session.username || user.first_name !== session.firstName) {
      await updateSession(userId, {
        username: user.username,
        firstName: user.first_name
      });
    }

    // Handle commands
    if (text.startsWith('/')) {
      const [command, ...args] = text.split(' ');
      
      switch (command.toLowerCase()) {
        case '/start':
          await handleStart(chatId, user);
          break;
        case '/think':
          await handleThink(chatId, userId);
          break;
        case '/code':
          await handleModeSwitch(chatId, userId, 'code');
          break;
        case '/research':
          await handleModeSwitch(chatId, userId, 'research');
          break;
        case '/reasoning':
          await handleModeSwitch(chatId, userId, 'reasoning');
          break;
        case '/general':
          await handleModeSwitch(chatId, userId, 'general');
          break;
        case '/fact':
          await handleFact(chatId, userId, args.join(' '));
          break;
        case '/memory':
          await handleMemory(chatId, userId);
          break;
        case '/modes':
          await handleModes(chatId);
          break;
        case '/help':
          await handleHelp(chatId);
          break;
        default:
          await bot.sendMessage(chatId, "❓ Unknown command. Use /help to see available commands.");
      }
      return;
    }

    // Add message to context
    await addToContext(userId, text);

    // Get personalized response
    const personalized = novaAI.getPersonalizedResponse(text, session.facts);
    
    // Get mode-aware response
    const aiResponse = await novaAI.getModeResponse(text, session.mode, session.context);
    
    // Combine personalized and mode response
    let finalResponse = aiResponse.response;
    if (personalized) {
      finalResponse = personalized + finalResponse;
    }

    // Send response
    await bot.sendMessage(chatId, finalResponse, { parse_mode: 'Markdown' });
    
    // Update session
    await updateSession(userId, { mode: aiResponse.mode || session.mode });

  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(chatId, "❌ Sorry, I encountered an error. Please try again.");
  }
};

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
    console.log('🤖 NOVA Enhanced Bot starting...');
    
    // Try to connect to MongoDB
    const mongoConnected = await connectDB();
    
    bot.on('message', handleMessage);
    
    console.log('✅ Bot is running!');
    console.log('📱 Test the bot: https://t.me/NovaAfrika_bot');
    console.log('🧠 Features: Continuous Memory, Deep Thinking, Mode Switching');
    
    if (mongoConnected) {
      console.log('💾 Database: MongoDB for persistent storage');
    } else {
      console.log('💾 Database: In-memory storage (no persistence)');
    }
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down NOVA Enhanced Bot...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the bot
startBot(); 