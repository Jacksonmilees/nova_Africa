import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import winston from 'winston';
import cron from 'node-cron';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { TelegramMessage, BotSession, BotResponse } from './types/TelegramTypes';
import { TelegramSessionManager } from './services/TelegramSessionManager';
import { TelegramCommandHandler } from './services/TelegramCommandHandler';
import NovaCore from '../services/NovaCore';
import AIProviderManager from '../services/AIProviderManager';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NovaTelegramBot {
  private bot: TelegramBot;
  private app: express.Application;
  private sessionManager: TelegramSessionManager;
  private commandHandler: TelegramCommandHandler;
  private nova: NovaCore;
  private aiManager: AIProviderManager;
  private logger: winston.Logger;
  private rateLimiter: RateLimiterMemory;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.initializeLogger();
    this.initializeRateLimiter();
    this.initializeNova();
    this.initializeBot();
    this.initializeExpress();
    this.initializeCommandHandler();
    this.setupCronJobs();
  }

  private initializeLogger(): void {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'nova-telegram-bot' },
      transports: [
        new winston.transports.File({ 
          filename: process.env.LOG_FILE || 'logs/nova-bot.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  private initializeRateLimiter(): void {
    this.rateLimiter = new RateLimiterMemory({
      keyGenerator: (req) => req.ip,
      points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    });
  }

  private async initializeNova(): Promise<void> {
    try {
      this.nova = new NovaCore();
      this.aiManager = new AIProviderManager(this.nova);
      
      // Initialize NOVA system
      await this.nova.initialize();
      await this.aiManager.initialize();
      
      this.logger.info('NOVA system initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize NOVA system:', error);
      throw error;
    }
  }

  private initializeBot(): void {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new TelegramBot(token, { polling: !this.isProduction });
    this.sessionManager = new TelegramSessionManager();

    // Set bot commands
    this.setBotCommands();

    // Handle polling errors
    if (!this.isProduction) {
      this.bot.on('polling_error', (error) => {
        this.logger.error('Polling error:', error);
      });
    }

    this.logger.info('Telegram bot initialized');
  }

  private initializeExpress(): void {
    this.app = express();
    
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(async (req, res, next) => {
      try {
        await this.rateLimiter.consume(req.ip);
        next();
      } catch (error) {
        res.status(429).json({ error: 'Too many requests' });
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        sessions: this.sessionManager.getSessionCount()
      });
    });

    // Webhook endpoint for production
    if (this.isProduction) {
      this.app.post('/webhook', (req, res) => {
        this.bot.handleUpdate(req.body);
        res.sendStatus(200);
      });
    }

    // Admin dashboard endpoint
    this.app.get('/admin', (req, res) => {
      const stats = this.sessionManager.getSessionStats();
      res.json({
        bot: {
          status: 'running',
          uptime: process.uptime(),
          sessions: stats
        },
        nova: {
          status: this.nova.currentStatus,
          memoryCount: this.nova.getMemories().length,
          taskCount: this.nova.allTasks.length,
          pluginCount: this.nova.allPlugins.length
        }
      });
    });

    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      this.logger.info(`Express server running on port ${port}`);
    });
  }

  private initializeCommandHandler(): void {
    this.commandHandler = new TelegramCommandHandler(
      this.sessionManager,
      this.nova,
      this.aiManager
    );

    // Override the sendResponse method to actually send messages
    this.commandHandler['sendResponse'] = async (chatId: number, text: string, options: Partial<BotResponse> = {}) => {
      try {
        await this.bot.sendMessage(chatId, text, {
          parse_mode: options.parseMode,
          reply_to_message_id: options.replyToMessageId,
          reply_markup: options.keyboard,
          disable_web_page_preview: options.disableWebPagePreview,
          disable_notification: options.disableNotification,
        });
      } catch (error) {
        this.logger.error(`Failed to send message to ${chatId}:`, error);
      }
    };

    this.setupMessageHandlers();
  }

  private async setBotCommands(): Promise<void> {
    const commands = this.commandHandler.getCommands().map(cmd => ({
      command: cmd.command.substring(1), // Remove leading slash
      description: cmd.description
    }));

    try {
      await this.bot.setMyCommands(commands);
      this.logger.info('Bot commands set successfully');
    } catch (error) {
      this.logger.error('Failed to set bot commands:', error);
    }
  }

  private setupMessageHandlers(): void {
    // Handle text messages
    this.bot.on('message', async (message: TelegramMessage) => {
      try {
        await this.handleMessage(message);
      } catch (error) {
        this.logger.error('Error handling message:', error);
        await this.sendErrorMessage(message.chat.id);
      }
    });

    // Handle callback queries (inline keyboard buttons)
    this.bot.on('callback_query', async (callbackQuery) => {
      try {
        await this.handleCallbackQuery(callbackQuery);
      } catch (error) {
        this.logger.error('Error handling callback query:', error);
        await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Error processing request' });
      }
    });

    // Handle errors
    this.bot.on('error', (error) => {
      this.logger.error('Bot error:', error);
    });
  }

  private async handleMessage(message: TelegramMessage): Promise<void> {
    const { chat, from, text } = message;
    
    if (!from || !text) return;

    // Get or create user session
    let session = this.sessionManager.getSession(from.id);
    if (!session) {
      session = this.sessionManager.createSession(
        from.id,
        chat.id,
        from.username,
        from.first_name,
        from.last_name
      );
      this.logger.info(`New session created for user ${from.id}`);
    }

    // Check if it's a command
    if (text.startsWith('/')) {
      await this.handleCommand(message, session);
      return;
    }

    // Handle regular message
    await this.handleRegularMessage(message, session);
  }

  private async handleCommand(message: TelegramMessage, session: BotSession): Promise<void> {
    try {
      const response = await this.commandHandler.handleCommand(message, session);
      if (response.text) {
        await this.bot.sendMessage(message.chat.id, response.text, {
          parse_mode: response.parseMode,
          reply_to_message_id: response.replyToMessageId,
          reply_markup: response.keyboard,
          disable_web_page_preview: response.disableWebPagePreview,
          disable_notification: response.disableNotification,
        });
      }
    } catch (error) {
      this.logger.error('Error handling command:', error);
      await this.sendErrorMessage(message.chat.id);
    }
  }

  private async handleRegularMessage(message: TelegramMessage, session: BotSession): Promise<void> {
    const { text, chat, from } = message;
    if (!text || !from) return;

    // Update session
    this.sessionManager.incrementMessageCount(from.id);
    this.sessionManager.addMemoryContext(from.id, `User: ${text}`);

    // Send typing indicator
    await this.bot.sendChatAction(chat.id, 'typing');

    try {
      // Process with NOVA AI
      const aiResponse = await this.aiManager.processRequest(text, session.conversationMode);
      
      // Add context to memory
      this.sessionManager.addMemoryContext(from.id, `NOVA (${aiResponse.provider}): ${aiResponse.content.substring(0, 200)}...`);

      // Store in NOVA memory
      await this.nova.addMemory({
        type: 'interaction',
        content: `User: ${text} | NOVA (${aiResponse.provider}): ${aiResponse.content.substring(0, 200)}...`,
        importance: 6,
        tags: ['conversation', session.conversationMode, aiResponse.provider, 'telegram'],
        userId: from.id.toString(),
      });

      // Send response
      await this.bot.sendMessage(chat.id, aiResponse.content, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      // Add provider info if not fallback
      if (aiResponse.provider !== 'fallback') {
        await this.bot.sendMessage(chat.id, `💡 *Response generated by ${aiResponse.provider} (${aiResponse.model})*`, {
          parse_mode: 'Markdown',
          disable_notification: true,
        });
      }

    } catch (error) {
      this.logger.error('Error processing message with AI:', error);
      await this.sendErrorMessage(chat.id);
    }
  }

  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    const { data, message, from } = callbackQuery;
    
    if (!data || !message || !from) return;

    // Get user session
    let session = this.sessionManager.getSession(from.id);
    if (!session) {
      session = this.sessionManager.createSession(
        from.id,
        message.chat.id,
        from.username,
        from.first_name,
        from.last_name
      );
    }

    // Handle different callback data types
    if (data.startsWith('mode_')) {
      const mode = data.replace('mode_', '') as 'general' | 'code' | 'research' | 'reasoning';
      this.sessionManager.setConversationMode(from.id, mode);
      await this.bot.answerCallbackQuery(callbackQuery.id, { text: `Switched to ${mode} mode` });
      await this.bot.editMessageText(`✅ Mode: ${mode}`, {
        chat_id: message.chat.id,
        message_id: message.message_id,
      });
    } else if (data.startsWith('model_')) {
      const model = data.replace('model_', '');
      try {
        this.aiManager.getOllamaIntegration().setDefaultModel(model);
        await this.bot.answerCallbackQuery(callbackQuery.id, { text: `Switched to ${model}` });
        await this.bot.editMessageText(`✅ Model: ${model}`, {
          chat_id: message.chat.id,
          message_id: message.message_id,
        });
      } catch (error) {
        await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Error switching model' });
      }
    }
  }

  private async sendErrorMessage(chatId: number): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, '❌ Sorry, I encountered an error. Please try again later.');
    } catch (error) {
      this.logger.error('Failed to send error message:', error);
    }
  }

  private setupCronJobs(): void {
    // Autonomous thinking every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      if (process.env.AUTONOMOUS_THINKING_ENABLED === 'true') {
        await this.runAutonomousThinking();
      }
    });

    // Session cleanup every hour
    cron.schedule('0 * * * *', () => {
      this.logger.info('Running scheduled session cleanup');
    });

    // System health check every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.logger.info('System health check', {
        sessions: this.sessionManager.getSessionCount(),
        novaStatus: this.nova.currentStatus.status,
        uptime: process.uptime()
      });
    });
  }

  private async runAutonomousThinking(): Promise<void> {
    try {
      const activeSessions = this.sessionManager.getActiveSessions();
      
      for (const session of activeSessions) {
        try {
          const insights = await this.nova.generateAutonomousInsights(session.userId.toString());
          
          if (insights.length > 0) {
            // Send insights to user
            let insightsMessage = `💡 *Autonomous Insights*\n\n`;
            insights.forEach((insight, index) => {
              insightsMessage += `${index + 1}. *${insight.type}:* ${insight.content}\n\n`;
            });
            
            await this.bot.sendMessage(session.chatId, insightsMessage, {
              parse_mode: 'Markdown',
              disable_notification: true,
            });
          }
        } catch (error) {
          this.logger.error(`Error generating insights for user ${session.userId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in autonomous thinking:', error);
    }
  }

  async start(): Promise<void> {
    try {
      if (this.isProduction) {
        // Set webhook for production
        const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
        if (webhookUrl) {
          await this.bot.setWebhook(webhookUrl);
          this.logger.info(`Webhook set to ${webhookUrl}`);
        }
      }

      this.logger.info('NOVA Telegram Bot started successfully');
      this.logger.info(`Environment: ${this.isProduction ? 'Production' : 'Development'}`);
      this.logger.info(`NOVA Status: ${this.nova.currentStatus.status}`);
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.isProduction) {
        await this.bot.deleteWebhook();
      }
      
      this.sessionManager.destroy();
      this.logger.info('NOVA Telegram Bot stopped');
    } catch (error) {
      this.logger.error('Error stopping bot:', error);
    }
  }

  getBotInfo(): any {
    return {
      status: 'running',
      environment: this.isProduction ? 'production' : 'development',
      sessions: this.sessionManager.getSessionStats(),
      nova: this.nova.currentStatus,
      uptime: process.uptime()
    };
  }
}

// Start the bot if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const bot = new NovaTelegramBot();
  
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