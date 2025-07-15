# 🚀 NOVA Telegram Bot - Quick Setup Guide

## ✅ Bot Status
Your Telegram bot is ready! Here's what you have:

- **Bot Name**: Nova Afrika
- **Username**: @NovaAfrika_bot
- **Token**: ✅ Working
- **URL**: https://t.me/NovaAfrika_bot

## 🎯 What Your Bot Can Do

### 🤖 Core Features
- **Advanced AI Chat**: Powered by your NOVA system with Ollama integration
- **Autonomous Thinking**: Generates insights and learns from conversations
- **Memory System**: Remembers conversations across sessions
- **Multi-Mode Support**: General, Code, Research, and Reasoning modes

### 💬 Conversation Modes
- **General Mode**: Casual conversation and assistance
- **Code Mode**: Programming and development help
- **Research Mode**: Web search and information gathering
- **Reasoning Mode**: Advanced logical analysis

### 🧠 Autonomous Features
- **Self-Learning**: Improves responses based on conversation history
- **Insight Generation**: Provides autonomous thoughts and observations
- **Task Management**: Handles background tasks and processing
- **Context Awareness**: Maintains conversation context

## 🚀 How to Start Your Bot

### Option 1: Simple Start (Recommended for Testing)
```bash
# In PowerShell, navigate to your project
cd nova_Africa

# Start the simple bot
npm run bot:simple
```

### Option 2: Full Bot with Web Interface
```bash
# Build the full bot
npm run build:bot

# Start the full bot
npm run bot
```

### Option 3: Development Mode
```bash
# Start in development mode with hot reload
npm run bot:dev
```

## 📱 Testing Your Bot

1. **Open Telegram** and search for `@NovaAfrika_bot`
2. **Start the bot** by sending `/start`
3. **Try these commands**:
   - `/help` - See all available commands
   - `/status` - Check system status
   - `/mode code` - Switch to code mode
   - `/memory` - View conversation memory
   - `/think` - Trigger autonomous thinking

4. **Send a message** and see NOVA respond with AI!

## 🔧 Configuration

### Environment Variables
Edit the `.env` file to customize your bot:

```env
# Required
TELEGRAM_BOT_TOKEN=7816999039:AAEzXbWCYS7v6yp5jdR-E3--shtuzaPdxiU

# Optional - for enhanced features
GEMINI_API_KEY=your-gemini-api-key
SERP_API_KEY=your-serp-api-key
OLLAMA_BASE_URL=http://localhost:11434
```

### Ollama Integration
Your bot is configured to work with Ollama models. Make sure Ollama is running:
```bash
# Start Ollama (if not already running)
ollama serve

# Pull a model (optional)
ollama pull llama3.1
```

## 🎨 Customization

### Adding New Commands
Edit `src/bot/SimpleNovaBot.ts` and add new command handlers:

```typescript
// Add new command
this.bot.onText(/\/mycommand/, async (msg) => {
  await this.handleMyCommand(msg);
});

// Implement handler
private async handleMyCommand(msg: TelegramBot.Message): Promise<void> {
  await this.bot.sendMessage(msg.chat.id, 'My custom response!');
}
```

### Customizing Responses
Modify the response logic in the message handlers to customize how NOVA responds.

## 🔍 Monitoring

### Health Check
```bash
# Test bot connection
npm run test:bot
```

### Logs
Check the `logs/` directory for bot activity logs.

### Admin Dashboard
If running the full bot, visit `http://localhost:3000/admin` for system stats.

## 🚨 Troubleshooting

### Bot Not Responding
1. Check if the bot process is running
2. Verify the token in `.env` file
3. Check logs for errors

### AI Not Working
1. Ensure Ollama is running (`ollama serve`)
2. Check if models are available
3. Verify API keys (if using external providers)

### Memory Issues
1. Check if NOVA core is initialized properly
2. Verify database connections
3. Check memory storage configuration

## 🎉 Next Steps

### Immediate Actions
1. **Test the bot** by sending messages
2. **Try different modes** with `/mode` command
3. **Explore autonomous features** with `/think`

### Advanced Features
1. **Add web search** by setting `SERP_API_KEY`
2. **Enable Gemini** by setting `GEMINI_API_KEY`
3. **Customize responses** by editing the bot code
4. **Add new plugins** to extend functionality

### Production Deployment
1. **Set up webhook** for production use
2. **Configure SSL** for secure communication
3. **Set up monitoring** and logging
4. **Scale the bot** for multiple users

## 📞 Support

- **Bot Issues**: Check logs and restart the bot
- **AI Problems**: Verify Ollama and API configurations
- **Development**: Edit the TypeScript files in `src/bot/`

---

**🎯 Your NOVA Telegram Bot is ready to revolutionize AI communication!**

Start chatting with @NovaAfrika_bot and experience the future of AI assistance. 