import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import NovaCore from '../services/NovaCore';
import AIProviderManager from '../services/AIProviderManager';

// Load environment variables
dotenv.config();

interface UserSession {
  userId: number;
  chatId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  conversationMode: 'general' | 'code' | 'research' | 'reasoning';
  lastActivity: Date;
  messageCount: number;
}

export class SimpleNovaBot {
  private bot: TelegramBot;
  private nova: NovaCore;
  private aiManager: AIProviderManager;
  private sessions: Map<number, UserSession> = new Map();
  private isRunning: boolean = false;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN || '7816999039:AAEzXbWCYS7v6yp5jdR-E3--shtuzaPdxiU';
    this.bot = new TelegramBot(token, { polling: true });
    this.nova = new NovaCore();
    this.aiManager = new AIProviderManager(this.nova);
    
    this.setupEventHandlers();
  }

  private async setupEventHandlers(): Promise<void> {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelp(msg);
    });

    // Handle /mode command
    this.bot.onText(/\/mode (.+)/, async (msg, match) => {
      if (match) {
        await this.handleMode(msg, match[1]);
      }
    });

    // Handle /status command
    this.bot.onText(/\/status/, async (msg) => {
      await this.handleStatus(msg);
    });

    // Handle /memory command
    this.bot.onText(/\/memory/, async (msg) => {
      await this.handleMemory(msg);
    });

    // Handle /think command
    this.bot.onText(/\/think/, async (msg) => {
      await this.handleThink(msg);
    });

    // Handle regular messages
    this.bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        await this.handleMessage(msg);
      }
    });

    // Handle errors
    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  private getOrCreateSession(msg: TelegramBot.Message): UserSession {
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    
    let session = this.sessions.get(userId);
    if (!session) {
      session = {
        userId,
        chatId,
        username: msg.from!.username,
        firstName: msg.from!.first_name,
        lastName: msg.from!.last_name,
        conversationMode: 'general',
        lastActivity: new Date(),
        messageCount: 0
      };
      this.sessions.set(userId, session);
    }
    
    session.lastActivity = new Date();
    session.messageCount++;
    return session;
  }

  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const session = this.getOrCreateSession(msg);
    
    const welcomeMessage = `🚀 *Welcome to NOVA - Neural Operational Virtual Assistant*

I'm your advanced AI companion with autonomous thinking capabilities!

🧠 *What I can do:*
• Chat and assist with any questions
• Help with coding and development
• Research information from the web
• Advanced reasoning and problem-solving
• Remember our conversations
• Think autonomously and provide insights

💡 *Quick Commands:*
• /help - Show all commands
• /mode <mode> - Switch modes (general/code/research/reasoning)
• /status - Check system status
• /memory - View conversation memory
• /think - Trigger autonomous thinking

🔧 *Current Mode:* ${session.conversationMode}

Ready to explore? Just send me a message!`;

    await this.bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });
  }

  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const helpMessage = `📚 *NOVA Bot Commands*

*Basic Commands:*
/start - Initialize your session
/help - Show this help message
/status - System status and session info
/mode <mode> - Switch conversation mode
/memory - View conversation memory
/think - Trigger autonomous thinking

*Available Modes:*
• general - Casual conversation and assistance
• code - Programming and development help
• research - Web search and information gathering
• reasoning - Advanced logical analysis

*Examples:*
/mode code - Switch to code mode
/mode research - Switch to research mode

💡 *Tips:*
• I remember our conversations
• I can think autonomously
• I adapt to your conversation style
• Use different modes for specialized help`;

    await this.bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
  }

  private async handleMode(msg: TelegramBot.Message, mode: string): Promise<void> {
    const session = this.getOrCreateSession(msg);
    const validModes = ['general', 'code', 'research', 'reasoning'];
    
    if (!validModes.includes(mode)) {
      await this.bot.sendMessage(msg.chat.id, 
        `❌ Invalid mode. Available modes: ${validModes.join(', ')}`);
      return;
    }

    session.conversationMode = mode as any;
    
    const modeMessages = {
      general: '💬 *General Mode Activated*\n\nI\'m ready for casual conversation and general assistance!',
      code: '💻 *Code Mode Activated*\n\nI\'m now in code assistance mode. Send me your code or programming questions!',
      research: '🔍 *Research Mode Activated*\n\nI\'m now in research mode with web search capabilities. What would you like me to research?',
      reasoning: '🧮 *Reasoning Mode Activated*\n\nI\'m now in advanced reasoning mode. Present me with complex problems to solve!'
    };

    await this.bot.sendMessage(msg.chat.id, modeMessages[mode as keyof typeof modeMessages], { 
      parse_mode: 'Markdown' 
    });
  }

  private async handleStatus(msg: TelegramBot.Message): Promise<void> {
    const session = this.getOrCreateSession(msg);
    const novaStatus = this.nova.currentStatus;
    
    const statusMessage = `📊 *NOVA System Status*

*Your Session:*
• User: ${session.firstName} ${session.lastName || ''}
• Username: @${session.username || 'N/A'}
• Mode: ${session.conversationMode}
• Messages: ${session.messageCount}
• Last Activity: ${session.lastActivity.toLocaleString()}

*NOVA Core:*
• Status: ${novaStatus.status}
• Memory Entries: ${novaStatus.memoryCount}
• Active Tasks: ${novaStatus.activeTaskCount}
• Loaded Plugins: ${novaStatus.loadedPluginCount}

*Bot Info:*
• Active Sessions: ${this.sessions.size}
• Uptime: ${this.formatUptime()}`;

    await this.bot.sendMessage(msg.chat.id, statusMessage, { parse_mode: 'Markdown' });
  }

  private async handleMemory(msg: TelegramBot.Message): Promise<void> {
    const session = this.getOrCreateSession(msg);
    
    try {
      const memories = await this.nova.getMemories({ userId: session.userId.toString() });
      
      if (memories.length === 0) {
        await this.bot.sendMessage(msg.chat.id, '🧠 No memories found for your session yet.');
        return;
      }

      let memoryMessage = `🧠 *Your Conversation Memory*\n\n`;
      
      // Show last 5 memories
      const recentMemories = memories.slice(-5);
      recentMemories.forEach((memory, index) => {
        const content = memory.content.length > 100 
          ? memory.content.substring(0, 100) + '...' 
          : memory.content;
        memoryMessage += `${index + 1}. ${content}\n\n`;
      });

      memoryMessage += `*Total Memories:* ${memories.length}`;

      await this.bot.sendMessage(msg.chat.id, memoryMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      await this.bot.sendMessage(msg.chat.id, '❌ Error retrieving memory.');
    }
  }

  private async handleThink(msg: TelegramBot.Message): Promise<void> {
    const session = this.getOrCreateSession(msg);
    
    await this.bot.sendMessage(msg.chat.id, '🤔 *Generating autonomous insights...*', { 
      parse_mode: 'Markdown' 
    });

    try {
      // Generate autonomous insights
      const insights = await this.nova.generateAutonomousInsights(session.userId.toString());
      
      if (insights.length > 0) {
        let insightsMessage = `💡 *Autonomous Insights*\n\n`;
        insights.forEach((insight, index) => {
          insightsMessage += `${index + 1}. *${insight.type}:* ${insight.content}\n\n`;
        });
        
        await this.bot.sendMessage(msg.chat.id, insightsMessage, { parse_mode: 'Markdown' });
      } else {
        await this.bot.sendMessage(msg.chat.id, 'No new insights generated at this time.');
      }
    } catch (error) {
      await this.bot.sendMessage(msg.chat.id, '❌ Error generating insights.');
    }
  }

  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    const session = this.getOrCreateSession(msg);
    const text = msg.text!;

    // Send typing indicator
    await this.bot.sendChatAction(msg.chat.id, 'typing');

    try {
      // Process with NOVA AI
      const aiResponse = await this.aiManager.processRequest(text, session.conversationMode);
      
      // Store in NOVA memory
      await this.nova.addMemory({
        type: 'interaction',
        content: `User: ${text} | NOVA (${aiResponse.provider}): ${aiResponse.content.substring(0, 200)}...`,
        importance: 6,
        tags: ['conversation', session.conversationMode, aiResponse.provider, 'telegram'],
        userId: session.userId.toString(),
      });

      // Send response
      await this.bot.sendMessage(msg.chat.id, aiResponse.content, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      // Add provider info if not fallback
      if (aiResponse.provider !== 'fallback') {
        await this.bot.sendMessage(msg.chat.id, 
          `💡 *Response generated by ${aiResponse.provider} (${aiResponse.model})*`, {
          parse_mode: 'Markdown',
          disable_notification: true,
        });
      }

    } catch (error) {
      console.error('Error processing message:', error);
      await this.bot.sendMessage(msg.chat.id, 
        '❌ Sorry, I encountered an error processing your message. Please try again.');
    }
  }

  private formatUptime(): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async start(): Promise<void> {
    try {
      // Initialize NOVA system
      await this.nova.initialize();
      await this.aiManager.initialize();
      
      this.isRunning = true;
      console.log('🤖 NOVA Telegram Bot started successfully!');
      console.log('📱 Bot is ready to receive messages');
      console.log('🔗 Find your bot at: https://t.me/NovaAfrika_bot');
      
      // Set bot commands
      await this.bot.setMyCommands([
        { command: 'start', description: 'Start NOVA and initialize your session' },
        { command: 'help', description: 'Show available commands and features' },
        { command: 'status', description: 'Show NOVA system status and your session info' },
        { command: 'mode', description: 'Switch conversation mode (general/code/research/reasoning)' },
        { command: 'memory', description: 'Show your conversation memory and autonomous thoughts' },
        { command: 'think', description: 'Trigger autonomous thinking and insights' }
      ]);
      
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.bot.stopPolling();
    console.log('🤖 NOVA Telegram Bot stopped');
  }

  getStatus(): any {
    return {
      isRunning: this.isRunning,
      sessions: this.sessions.size,
      novaStatus: this.nova.currentStatus,
      uptime: process.uptime()
    };
  }
}

// Start the bot if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const bot = new SimpleNovaBot();
  
  bot.start().catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await bot.stop();
    process.exit(0);
  });
} 