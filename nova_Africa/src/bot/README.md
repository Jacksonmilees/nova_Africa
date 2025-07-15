# NOVA Telegram Bot

A powerful Telegram bot integration for NOVA (Neural Operational Virtual Assistant) with advanced AI capabilities, autonomous thinking, and memory retention.

## Features

### 🤖 Core AI Capabilities
- **Multi-Modal AI Processing**: Integration with Ollama, Gemini, and fallback systems
- **Autonomous Thinking**: Generates insights and learns from conversations
- **Memory Retention**: Remembers conversations across sessions
- **Context Awareness**: Maintains conversation context and user preferences

### 💬 Conversation Modes
- **General Mode**: Casual conversation and assistance
- **Code Mode**: Programming and development help
- **Research Mode**: Web search and information gathering
- **Reasoning Mode**: Advanced logical analysis

### 🧠 Advanced Features
- **Session Management**: Per-user session tracking and preferences
- **Autonomous Tasks**: Background task execution and insights
- **Plugin System**: Extensible plugin architecture
- **Rate Limiting**: Built-in rate limiting and security
- **Admin Panel**: Administrative controls and monitoring

### 🔧 Technical Features
- **Webhook Support**: Production-ready webhook handling
- **Express Server**: Built-in web server for health checks and admin
- **Logging**: Comprehensive logging with Winston
- **Error Handling**: Robust error handling and recovery
- **TypeScript**: Full TypeScript support with type safety

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn
- Telegram Bot Token (from @BotFather)
- Optional: Domain with SSL for webhook (production)

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### 3. Environment Configuration

Edit `.env` file with your configuration:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/nova-bot.log

# AI Provider Configuration
GEMINI_API_KEY=your-gemini-api-key
SERP_API_KEY=your-serp-api-key

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.1

# Memory and Storage
MEMORY_RETENTION_DAYS=30
MAX_MEMORY_ENTRIES=10000

# Autonomous Features
AUTONOMOUS_THINKING_ENABLED=true
AUTONOMOUS_TASK_INTERVAL_MINUTES=30
MAX_AUTONOMOUS_TASKS_PER_SESSION=5
```

### 4. Build and Run

```bash
# Development mode
npm run bot:dev

# Build for production
npm run build:bot

# Run in production
npm run bot
```

### 5. Webhook Setup (Production)

For production deployment, set up webhook:

```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook"}'
```

## Usage

### Basic Commands

- `/start` - Initialize your session
- `/help` - Show available commands
- `/status` - System status and session info
- `/mode` - Switch conversation mode
- `/memory` - View conversation memory
- `/think` - Trigger autonomous thinking

### Mode Commands

- `/code` - Switch to code assistance mode
- `/research` - Switch to research mode  
- `/reasoning` - Switch to reasoning mode

### Personalization

- `/preferences` - Manage your preferences
- `/stats` - View usage statistics
- `/clear` - Clear conversation memory

### System Commands

- `/models` - List and switch AI models
- `/tasks` - Manage autonomous tasks
- `/plugins` - View available plugins

### Admin Commands

- `/admin` - Admin panel
- `/broadcast` - Broadcast to all users

## Architecture

### File Structure

```
src/bot/
├── NovaTelegramBot.ts          # Main bot class
├── types/
│   └── TelegramTypes.ts        # TypeScript type definitions
├── services/
│   ├── TelegramSessionManager.ts    # Session management
│   └── TelegramCommandHandler.ts    # Command processing
└── utils/
    └── TelegramUtils.ts        # Utility functions
```

### Key Components

1. **NovaTelegramBot**: Main bot class handling Telegram API integration
2. **TelegramSessionManager**: Manages user sessions and preferences
3. **TelegramCommandHandler**: Processes commands and AI interactions
4. **TelegramUtils**: Utility functions for formatting and validation

### Integration with NOVA Core

The bot integrates with your existing NOVA system:

- **NovaCore**: Core AI processing and memory management
- **AIProviderManager**: Multi-provider AI integration
- **Plugins**: Extensible plugin system
- **Memory System**: Persistent conversation memory

## Development

### Adding New Commands

1. Add command to `TelegramCommandHandler.ts`:

```typescript
this.registerCommand({
  command: '/newcommand',
  description: 'Description of new command',
  handler: this.handleNewCommand.bind(this),
});
```

2. Implement handler method:

```typescript
private async handleNewCommand(message: TelegramMessage, session: BotSession): Promise<void> {
  // Command implementation
  await this.sendResponse(message.chat.id, 'Command response');
}
```

### Adding New Features

1. Extend `BotSession` type in `TelegramTypes.ts`
2. Add methods to `TelegramSessionManager`
3. Update command handlers as needed
4. Add utility functions to `TelegramUtils`

### Testing

```bash
# Run in development mode with hot reload
npm run bot:dev

# Test specific commands
# Send messages to your bot in Telegram
```

## Deployment

### Local Development

```bash
npm run bot:dev
```

### Production Deployment

1. Build the bot:
```bash
npm run build:bot
```

2. Set up environment variables
3. Run with PM2 or similar:
```bash
pm2 start dist/bot/NovaTelegramBot.js --name nova-bot
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/bot ./dist/bot
CMD ["node", "dist/bot/NovaTelegramBot.js"]
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Admin Dashboard

```bash
curl http://localhost:3000/admin
```

### Logs

```bash
# View logs
tail -f logs/nova-bot.log

# Log levels: error, warn, info, debug
```

## Security

- Rate limiting on all endpoints
- Input sanitization
- Admin-only commands
- Secure webhook handling
- Environment variable protection

## Troubleshooting

### Common Issues

1. **Bot not responding**: Check token and webhook configuration
2. **AI not working**: Verify Ollama/Gemini API keys
3. **Memory issues**: Check database configuration
4. **Rate limiting**: Adjust rate limit settings

### Debug Mode

```bash
LOG_LEVEL=debug npm run bot:dev
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**NOVA Telegram Bot** - Powered by NOVA (Neural Operational Virtual Assistant)
Built by Jackson Alex 