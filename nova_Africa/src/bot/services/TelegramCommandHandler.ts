import { TelegramMessage, BotSession, BotCommand, BotResponse } from '../types/TelegramTypes';
import { TelegramSessionManager } from './TelegramSessionManager';
import NovaCore from '../../services/NovaCore';
import AIProviderManager from '../../services/AIProviderManager';

export class TelegramCommandHandler {
  private commands: Map<string, BotCommand> = new Map();
  private sessionManager: TelegramSessionManager;
  private nova: NovaCore;
  private aiManager: AIProviderManager;

  constructor(sessionManager: TelegramSessionManager, nova: NovaCore, aiManager: AIProviderManager) {
    this.sessionManager = sessionManager;
    this.nova = nova;
    this.aiManager = aiManager;
    this.initializeCommands();
  }

  private initializeCommands(): void {
    // Basic commands
    this.registerCommand({
      command: '/start',
      description: 'Start NOVA and initialize your session',
      handler: this.handleStart.bind(this),
    });

    this.registerCommand({
      command: '/help',
      description: 'Show available commands and features',
      handler: this.handleHelp.bind(this),
    });

    this.registerCommand({
      command: '/status',
      description: 'Show NOVA system status and your session info',
      handler: this.handleStatus.bind(this),
    });

    this.registerCommand({
      command: '/mode',
      description: 'Switch conversation mode (general/code/research/reasoning)',
      handler: this.handleMode.bind(this),
    });

    this.registerCommand({
      command: '/memory',
      description: 'Show your conversation memory and autonomous thoughts',
      handler: this.handleMemory.bind(this),
    });

    this.registerCommand({
      command: '/think',
      description: 'Trigger autonomous thinking and insights',
      handler: this.handleThink.bind(this),
    });

    this.registerCommand({
      command: '/code',
      description: 'Switch to code assistance mode',
      handler: this.handleCodeMode.bind(this),
    });

    this.registerCommand({
      command: '/research',
      description: 'Switch to research mode with web search',
      handler: this.handleResearchMode.bind(this),
    });

    this.registerCommand({
      command: '/reasoning',
      description: 'Switch to advanced reasoning mode',
      handler: this.handleReasoningMode.bind(this),
    });

    this.registerCommand({
      command: '/preferences',
      description: 'Manage your preferences (language, response length, etc.)',
      handler: this.handlePreferences.bind(this),
    });

    this.registerCommand({
      command: '/stats',
      description: 'Show your usage statistics',
      handler: this.handleStats.bind(this),
    });

    this.registerCommand({
      command: '/clear',
      description: 'Clear your conversation memory',
      handler: this.handleClear.bind(this),
    });

    this.registerCommand({
      command: '/models',
      description: 'List available AI models and switch between them',
      handler: this.handleModels.bind(this),
    });

    this.registerCommand({
      command: '/tasks',
      description: 'Show and manage autonomous tasks',
      handler: this.handleTasks.bind(this),
    });

    this.registerCommand({
      command: '/plugins',
      description: 'Show available plugins and their status',
      handler: this.handlePlugins.bind(this),
    });

    // Admin commands
    this.registerCommand({
      command: '/admin',
      description: 'Admin panel (admin only)',
      handler: this.handleAdmin.bind(this),
      adminOnly: true,
    });

    this.registerCommand({
      command: '/broadcast',
      description: 'Broadcast message to all users (admin only)',
      handler: this.handleBroadcast.bind(this),
      adminOnly: true,
    });
  }

  registerCommand(command: BotCommand): void {
    this.commands.set(command.command, command);
  }

  async handleCommand(message: TelegramMessage, session: BotSession): Promise<BotResponse> {
    const text = message.text || '';
    const commandMatch = text.match(/^\/(\w+)(?:\s+(.*))?$/);
    
    if (!commandMatch) {
      return { text: 'Invalid command format. Use /help to see available commands.' };
    }

    const [, commandName, args] = commandMatch;
    const command = this.commands.get(`/${commandName}`);

    if (!command) {
      return { text: `Unknown command: /${commandName}. Use /help to see available commands.` };
    }

    try {
      await command.handler(message, session);
      return { text: 'Command executed successfully.' };
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      return { text: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async handleStart(message: TelegramMessage, session: BotSession): Promise<void> {
    const welcomeMessage = `🚀 *Welcome to NOVA - Neural Operational Virtual Assistant*

I'm your advanced AI companion with autonomous thinking capabilities. Here's what I can do:

🧠 *Core Features:*
• Autonomous thinking and insights
• Advanced code assistance
• Intelligent research with web search
• Complex reasoning and problem-solving
• Memory retention across conversations
• Multi-modal AI processing

💡 *Quick Start:*
• Just send me a message to start chatting
• Use /mode to switch conversation modes
• Use /think to trigger autonomous insights
• Use /memory to see your conversation history

🔧 *Available Modes:*
• General: Casual conversation and assistance
• Code: Programming and development help
• Research: Web search and information gathering
• Reasoning: Advanced logical analysis

Ready to explore? Send me anything!`;

    await this.sendResponse(message.chat.id, welcomeMessage, { parseMode: 'Markdown' });
  }

  private async handleHelp(message: TelegramMessage, session: BotSession): Promise<void> {
    const helpMessage = `📚 *NOVA Bot Commands*

*Basic Commands:*
/start - Initialize your session
/help - Show this help message
/status - System status and session info
/mode - Switch conversation mode
/memory - View conversation memory
/think - Trigger autonomous thinking

*Mode Commands:*
/code - Switch to code assistance mode
/research - Switch to research mode
/reasoning - Switch to reasoning mode

*Personalization:*
/preferences - Manage your preferences
/stats - View your usage statistics
/clear - Clear conversation memory

*System Commands:*
/models - List and switch AI models
/tasks - Manage autonomous tasks
/plugins - View available plugins

*Admin Commands:*
/admin - Admin panel
/broadcast - Broadcast to all users

💡 *Tips:*
• I remember our conversations across sessions
• I can think autonomously and provide insights
• I adapt to your conversation style
• Use different modes for specialized assistance`;

    await this.sendResponse(message.chat.id, helpMessage, { parseMode: 'Markdown' });
  }

  private async handleStatus(message: TelegramMessage, session: BotSession): Promise<void> {
    const novaStatus = this.nova.currentStatus;
    const aiProviders = await this.aiManager.getAvailableProviders();
    
    const statusMessage = `📊 *NOVA System Status*

*Your Session:*
• User: ${session.firstName} ${session.lastName || ''}
• Username: @${session.username || 'N/A'}
• Session ID: ${session.userId}
• Active: ${session.isActive ? '✅' : '❌'}
• Mode: ${session.conversationMode}
• Messages: ${session.usageStats.messagesSent}
• Commands: ${session.usageStats.commandsUsed}

*NOVA Core:*
• Status: ${novaStatus.status}
• Memory Entries: ${novaStatus.memoryCount}
• Active Tasks: ${novaStatus.activeTaskCount}
• Loaded Plugins: ${novaStatus.loadedPluginCount}

*AI Providers:*
${aiProviders.map(provider => 
  `• ${provider.provider}: ${provider.available ? '✅' : '❌'}`
).join('\n')}

*System Health:*
• Uptime: ${this.formatUptime(session.usageStats.sessionStart)}
• Last Activity: ${this.formatTime(session.lastActivity)}`;

    await this.sendResponse(message.chat.id, statusMessage, { parseMode: 'Markdown' });
  }

  private async handleMode(message: TelegramMessage, session: BotSession): Promise<void> {
    const text = message.text || '';
    const modeMatch = text.match(/\/mode\s+(\w+)/);
    
    if (!modeMatch) {
      const modeMessage = `🎛️ *Conversation Mode*

Current mode: *${session.conversationMode}*

Available modes:
• *general* - Casual conversation and assistance
• *code* - Programming and development help
• *research* - Web search and information gathering
• *reasoning* - Advanced logical analysis

Usage: /mode <mode_name>
Example: /mode code`;

      await this.sendResponse(message.chat.id, modeMessage, { parseMode: 'Markdown' });
      return;
    }

    const newMode = modeMatch[1] as 'general' | 'code' | 'research' | 'reasoning';
    if (!['general', 'code', 'research', 'reasoning'].includes(newMode)) {
      await this.sendResponse(message.chat.id, '❌ Invalid mode. Available modes: general, code, research, reasoning');
      return;
    }

    this.sessionManager.setConversationMode(session.userId, newMode);
    await this.sendResponse(message.chat.id, `✅ Switched to *${newMode}* mode`, { parseMode: 'Markdown' });
  }

  private async handleMemory(message: TelegramMessage, session: BotSession): Promise<void> {
    const memories = await this.nova.getMemories({ userId: session.userId.toString() });
    const autonomousThoughts = await this.nova.getMemories({ 
      userId: session.userId.toString(), 
      tags: ['autonomous', 'insight'] 
    });

    let memoryMessage = `🧠 *Your Memory & Thoughts*\n\n`;

    if (session.memoryContext.length > 0) {
      memoryMessage += `*Recent Context:*\n`;
      session.memoryContext.slice(-5).forEach((context, index) => {
        memoryMessage += `${index + 1}. ${context.substring(0, 100)}...\n`;
      });
      memoryMessage += '\n';
    }

    if (autonomousThoughts.length > 0) {
      memoryMessage += `*Autonomous Thoughts:*\n`;
      autonomousThoughts.slice(-3).forEach((thought, index) => {
        memoryMessage += `${index + 1}. ${thought.content.substring(0, 150)}...\n`;
      });
      memoryMessage += '\n';
    }

    if (session.autonomousTasks.length > 0) {
      memoryMessage += `*Autonomous Tasks:*\n`;
      session.autonomousTasks.slice(-3).forEach((task, index) => {
        memoryMessage += `${index + 1}. ${task}\n`;
      });
      memoryMessage += '\n';
    }

    memoryMessage += `*Memory Stats:*\n`;
    memoryMessage += `• Total Memories: ${memories.length}\n`;
    memoryMessage += `• Context Items: ${session.memoryContext.length}\n`;
    memoryMessage += `• Autonomous Tasks: ${session.autonomousTasks.length}\n`;

    await this.sendResponse(message.chat.id, memoryMessage, { parseMode: 'Markdown' });
  }

  private async handleThink(message: TelegramMessage, session: BotSession): Promise<void> {
    await this.sendResponse(message.chat.id, '🤔 *Triggering autonomous thinking...*', { parseMode: 'Markdown' });

    try {
      // Trigger autonomous thinking
      const insights = await this.nova.generateAutonomousInsights(session.userId.toString());
      
      if (insights.length > 0) {
        let insightsMessage = `💡 *Autonomous Insights*\n\n`;
        insights.forEach((insight, index) => {
          insightsMessage += `${index + 1}. *${insight.type}:* ${insight.content}\n\n`;
        });
        
        await this.sendResponse(message.chat.id, insightsMessage, { parseMode: 'Markdown' });
      } else {
        await this.sendResponse(message.chat.id, 'No new insights generated at this time.');
      }
    } catch (error) {
      await this.sendResponse(message.chat.id, `❌ Error generating insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleCodeMode(message: TelegramMessage, session: BotSession): Promise<void> {
    this.sessionManager.setConversationMode(session.userId, 'code');
    await this.sendResponse(message.chat.id, `💻 *Code Mode Activated*\n\nI'm now in code assistance mode. I can help you with:\n\n• Code review and optimization\n• Debugging and troubleshooting\n• Architecture and design patterns\n• Best practices and conventions\n• Language-specific guidance\n\nSend me your code or programming questions!`, { parseMode: 'Markdown' });
  }

  private async handleResearchMode(message: TelegramMessage, session: BotSession): Promise<void> {
    this.sessionManager.setConversationMode(session.userId, 'research');
    await this.sendResponse(message.chat.id, `🔍 *Research Mode Activated*\n\nI'm now in research mode with web search capabilities. I can help you with:\n\n• Current information and news\n• Academic research and papers\n• Technical documentation\n• Market analysis and trends\n• Fact-checking and verification\n\nWhat would you like me to research?`, { parseMode: 'Markdown' });
  }

  private async handleReasoningMode(message: TelegramMessage, session: BotSession): Promise<void> {
    this.sessionManager.setConversationMode(session.userId, 'reasoning');
    await this.sendResponse(message.chat.id, `🧮 *Reasoning Mode Activated*\n\nI'm now in advanced reasoning mode. I can help you with:\n\n• Complex problem-solving\n• Logical analysis and deduction\n• Mathematical reasoning\n• Philosophical discussions\n• Strategic planning\n• Critical thinking exercises\n\nPresent me with complex problems to solve!`, { parseMode: 'Markdown' });
  }

  private async handlePreferences(message: TelegramMessage, session: BotSession): Promise<void> {
    const text = message.text || '';
    const prefMatch = text.match(/\/preferences\s+(\w+)\s+(.+)/);
    
    if (!prefMatch) {
      const prefMessage = `⚙️ *Your Preferences*\n\nCurrent settings:\n• Language: ${session.preferences.language}\n• Response Length: ${session.preferences.responseLength}\n• Include Code: ${session.preferences.includeCode ? 'Yes' : 'No'}\n• Include Links: ${session.preferences.includeLinks ? 'Yes' : 'No'}\n\nUsage: /preferences <setting> <value>\nExamples:\n• /preferences language en\n• /preferences responseLength long\n• /preferences includeCode false`;
      
      await this.sendResponse(message.chat.id, prefMessage, { parseMode: 'Markdown' });
      return;
    }

    const [, setting, value] = prefMatch;
    const updates: Partial<BotSession['preferences']> = {};

    switch (setting) {
      case 'language':
        updates.language = value;
        break;
      case 'responseLength':
        if (['short', 'medium', 'long'].includes(value)) {
          updates.responseLength = value as 'short' | 'medium' | 'long';
        }
        break;
      case 'includeCode':
        updates.includeCode = value === 'true';
        break;
      case 'includeLinks':
        updates.includeLinks = value === 'true';
        break;
      default:
        await this.sendResponse(message.chat.id, '❌ Invalid preference setting');
        return;
    }

    this.sessionManager.updatePreferences(session.userId, updates);
    await this.sendResponse(message.chat.id, `✅ Updated ${setting} to ${value}`);
  }

  private async handleStats(message: TelegramMessage, session: BotSession): Promise<void> {
    const stats = this.sessionManager.getSessionStats();
    const sessionDuration = Date.now() - session.usageStats.sessionStart.getTime();
    
    const statsMessage = `📈 *Your Usage Statistics*\n\n*Session Stats:*\n• Session Duration: ${this.formatDuration(sessionDuration)}\n• Messages Sent: ${session.usageStats.messagesSent}\n• Commands Used: ${session.usageStats.commandsUsed}\n• Last Command: ${session.usageStats.lastCommand || 'None'}\n\n*Global Stats:*\n• Total Sessions: ${stats.totalSessions}\n• Active Sessions: ${stats.activeSessions}\n• Avg Messages/Session: ${stats.averageMessagesPerSession}\n\n*Most Used Commands:*\n${stats.mostUsedCommands.map(cmd => `• ${cmd.command}: ${cmd.count} times`).join('\n')}`;

    await this.sendResponse(message.chat.id, statsMessage, { parseMode: 'Markdown' });
  }

  private async handleClear(message: TelegramMessage, session: BotSession): Promise<void> {
    // Clear memory context
    this.sessionManager.updateSession(session.userId, { memoryContext: [], autonomousTasks: [] });
    
    // Clear NOVA memories for this user
    await this.nova.clearMemories({ userId: session.userId.toString() });
    
    await this.sendResponse(message.chat.id, '🧹 *Memory Cleared*\n\nYour conversation memory and autonomous tasks have been cleared.', { parseMode: 'Markdown' });
  }

  private async handleModels(message: TelegramMessage, session: BotSession): Promise<void> {
    try {
      const models = await this.aiManager.getOllamaIntegration().listModels();
      const currentModel = this.aiManager.getOllamaIntegration().getDefaultModel();
      
      let modelsMessage = `🤖 *Available AI Models*\n\n*Current Model:* ${currentModel}\n\n*Available Models:*\n`;
      
      models.forEach((model, index) => {
        const isCurrent = model.name === currentModel;
        modelsMessage += `${index + 1}. ${model.name} ${isCurrent ? '✅' : ''}\n`;
      });
      
      modelsMessage += '\nTo switch models, use: /models switch <model_name>';
      
      await this.sendResponse(message.chat.id, modelsMessage, { parseMode: 'Markdown' });
    } catch (error) {
      await this.sendResponse(message.chat.id, `❌ Error fetching models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleTasks(message: TelegramMessage, session: BotSession): Promise<void> {
    const tasks = this.nova.allTasks.filter(task => task.userId === session.userId.toString());
    
    if (tasks.length === 0) {
      await this.sendResponse(message.chat.id, '📋 No autonomous tasks found for your session.');
      return;
    }

    let tasksMessage = `📋 *Your Autonomous Tasks*\n\n`;
    tasks.forEach((task, index) => {
      tasksMessage += `${index + 1}. *${task.title}*\n`;
      tasksMessage += `   Status: ${task.status}\n`;
      tasksMessage += `   Priority: ${task.priority}\n`;
      tasksMessage += `   Created: ${this.formatTime(new Date(task.createdAt))}\n\n`;
    });

    await this.sendResponse(message.chat.id, tasksMessage, { parseMode: 'Markdown' });
  }

  private async handlePlugins(message: TelegramMessage, session: BotSession): Promise<void> {
    const plugins = this.nova.allPlugins;
    
    let pluginsMessage = `🔌 *Available Plugins*\n\n`;
    plugins.forEach((plugin, index) => {
      pluginsMessage += `${index + 1}. *${plugin.name}*\n`;
      pluginsMessage += `   Status: ${plugin.enabled ? '✅ Enabled' : '❌ Disabled'}\n`;
      pluginsMessage += `   Description: ${plugin.description}\n\n`;
    });

    await this.sendResponse(message.chat.id, pluginsMessage, { parseMode: 'Markdown' });
  }

  private async handleAdmin(message: TelegramMessage, session: BotSession): Promise<void> {
    // TODO: Implement admin authentication
    const adminMessage = `🔧 *Admin Panel*\n\nThis feature is under development.`;
    await this.sendResponse(message.chat.id, adminMessage, { parseMode: 'Markdown' });
  }

  private async handleBroadcast(message: TelegramMessage, session: BotSession): Promise<void> {
    // TODO: Implement broadcast functionality
    const broadcastMessage = `📢 *Broadcast Feature*\n\nThis feature is under development.`;
    await this.sendResponse(message.chat.id, broadcastMessage, { parseMode: 'Markdown' });
  }

  private async sendResponse(chatId: number, text: string, options: Partial<BotResponse> = {}): Promise<void> {
    // This will be implemented in the main bot class
    console.log(`[BOT] Sending to ${chatId}: ${text.substring(0, 100)}...`);
  }

  private formatTime(date: Date): string {
    return date.toLocaleString();
  }

  private formatUptime(startTime: Date): string {
    const duration = Date.now() - startTime.getTime();
    return this.formatDuration(duration);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getCommands(): BotCommand[] {
    return Array.from(this.commands.values());
  }
} 