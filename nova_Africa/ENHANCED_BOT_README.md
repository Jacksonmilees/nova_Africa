# 🤖 NOVA Enhanced Bot - Advanced AI Assistant

## Overview

NOVA Enhanced Bot is an advanced Telegram AI assistant with **continuous memory**, **deep thinking capabilities**, and **mode-aware responses**. Built with MongoDB for persistent storage and enhanced AI services for intelligent interactions.

## 🚀 Key Features

### 🧠 Continuous Memory
- **Persistent Storage**: Remembers conversations across bot restarts
- **User Facts**: Stores important facts about users
- **Context Awareness**: Maintains conversation context
- **Insights Storage**: Saves analytical insights for future reference

### 🤔 Deep Thinking
- **Pattern Analysis**: Analyzes conversation patterns
- **Intelligent Insights**: Generates contextual insights
- **Recommendations**: Provides personalized recommendations
- **Reasoning Mode**: Dedicated logical reasoning capabilities

### 🎛️ Mode Switching
- **Code Mode**: Programming assistance and debugging
- **Research Mode**: Information gathering and analysis
- **Reasoning Mode**: Logical thinking and problem solving
- **General Mode**: Casual conversation and general help

### 📝 Personalization
- **Fact Storage**: Users can add personal facts
- **Memory Retrieval**: Shows what the bot remembers
- **Personalized Responses**: Tailored responses based on user history
- **Preference Learning**: Adapts to user preferences over time

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Telegram Bot Token

### Quick Setup

1. **Clone and Navigate**
   ```bash
   cd nova_Africa
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Setup Script**
   ```powershell
   .\setup-enhanced-bot.ps1
   ```

4. **Configure Environment**
   - Copy `env.enhanced.example` to `.env`
   - Add your Telegram bot token
   - Configure MongoDB connection

5. **Start the Bot**
   ```bash
   npm run bot:enhanced
   ```

### Manual Setup

1. **Install Dependencies**
   ```bash
   npm install mongoose node-telegram-bot-api dotenv
   ```

2. **Create .env File**
   ```env
   BOT_TOKEN=your_telegram_bot_token_here
   MONGO_URI=mongodb://localhost:27017/nova_bot
   ```

3. **Start the Bot**
   ```bash
   npm run bot:enhanced
   ```

## 📋 Available Commands

### Basic Commands
- `/start` - Welcome message and bot introduction
- `/help` - Show help information
- `/modes` - Display available modes

### Memory Commands
- `/think` - Deep analytical thinking about conversation context
- `/fact [fact]` - Add a fact about yourself
- `/memory` - Show what the bot remembers about you

### Mode Commands
- `/code` - Switch to programming assistance mode
- `/research` - Switch to research and information mode
- `/reasoning` - Switch to logical reasoning mode
- `/general` - Switch to general conversation mode

## 🗄️ Database Schema

### Memory Model
```javascript
{
  userId: String,           // Unique user identifier
  context: [String],        // Conversation context
  mode: String,            // Current mode (general/code/research/reasoning)
  messageCount: Number,     // Total messages from user
  username: String,         // Telegram username
  firstName: String,        // Telegram first name
  facts: [String],         // User facts
  insights: [String],      // Generated insights
  lastInteraction: Date,   // Last interaction timestamp
  preferences: Map         // User preferences
}
```

## 🔧 Configuration Options

### Environment Variables
```env
# Required
BOT_TOKEN=your_telegram_bot_token
MONGO_URI=your_mongodb_connection_string

# Optional
OPENAI_API_KEY=your_openai_api_key
BING_API_KEY=your_bing_search_api_key
LOG_LEVEL=info
MAX_CONTEXT_LENGTH=50
MAX_FACTS_PER_USER=20
```

### MongoDB Setup Options

#### Local MongoDB
```env
MONGO_URI=mongodb://localhost:27017/nova_bot
```

#### MongoDB Atlas (Cloud)
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nova_bot?retryWrites=true&w=majority
```

#### Neon PostgreSQL (Alternative)
```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

## 🧠 AI Capabilities

### Pattern Analysis
The bot analyzes conversation patterns to:
- Identify dominant topics (coding, research, reasoning)
- Generate contextual insights
- Provide personalized recommendations
- Adapt responses based on user behavior

### Deep Thinking
The `/think` command provides:
- Pattern analysis of conversation context
- Intelligent insights based on user facts
- Personalized recommendations
- Logical reasoning about topics

### Mode-Aware Responses
Each mode provides specialized responses:
- **Code Mode**: Programming assistance, debugging help, best practices
- **Research Mode**: Information gathering, source validation, data analysis
- **Reasoning Mode**: Logical thinking, problem solving, critical analysis
- **General Mode**: Casual conversation, general assistance

## 📊 Usage Examples

### Adding Personal Facts
```
User: /fact I'm a software developer from Kenya
Bot: ✅ Fact added to memory: "I'm a software developer from Kenya"
     I'll remember this for future conversations!
```

### Deep Thinking
```
User: /think
Bot: 🧠 Deep Thinking Analysis:

     Insights:
     • I notice you're working on code. Consider breaking complex problems into smaller functions.
     • I remember: I'm a software developer from Kenya

     Pattern Analysis:
     • Dominant pattern: coding
     • Coding mentions: 5
     • Research mentions: 1
     • Reasoning mentions: 2

     Recommendations:
     • Try /code mode for specialized programming assistance
     • Consider using /think to analyze your code architecture
```

### Mode Switching
```
User: /code
Bot: 💻 Code Mode Activated!

     I'm now in programming assistance mode. I can help with:
     • Code reviews and optimization
     • Debugging assistance
     • Architecture patterns
     • Best practices
     • Algorithm design

User: help me debug this function
Bot: 💻 I see you're working on code! Here's my analysis:

     🐛 For debugging, let's:
     1. Identify the error type
     2. Check the error location
     3. Review recent changes
     4. Test with minimal examples
```

## 🔍 Advanced Features

### Research Mode
- Topic extraction from user queries
- Information gathering recommendations
- Source validation suggestions
- Data analysis capabilities

### Reasoning Mode
- Logical pattern analysis
- Deductive and inductive reasoning
- Hypothesis testing
- Critical evaluation

### Memory Management
- Automatic context pruning
- Fact deduplication
- Insight storage and retrieval
- User preference learning

## 🚀 Deployment

### Local Development
```bash
npm run bot:enhanced
```

### Production Deployment
1. Set up MongoDB database
2. Configure environment variables
3. Use process manager (PM2, Docker, etc.)
4. Set up monitoring and logging

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "bot:enhanced"]
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MONGO_URI in .env file
   - Ensure MongoDB is running
   - Verify network connectivity

2. **Bot Token Error**
   - Verify BOT_TOKEN in .env file
   - Check bot token validity
   - Ensure bot is not already running

3. **Memory Issues**
   - Check MongoDB connection
   - Verify database permissions
   - Monitor memory usage

### Debug Mode
```bash
LOG_LEVEL=debug npm run bot:enhanced
```

## 📈 Performance Optimization

### Memory Management
- Context length limits
- Automatic cleanup of old data
- Efficient database queries
- Connection pooling

### Response Optimization
- Caching frequently used responses
- Pattern matching optimization
- Async processing for heavy operations
- Rate limiting for API calls

## 🔮 Future Enhancements

### Planned Features
- [ ] OpenAI GPT integration for enhanced responses
- [ ] Web scraping capabilities for research mode
- [ ] Voice message processing
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom capabilities

### Integration Possibilities
- [ ] Slack integration
- [ ] Discord bot version
- [ ] Web interface
- [ ] Mobile app
- [ ] API endpoints for external access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Jackson Alex** - Creator of NOVA Neural Operational Virtual Assistant

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

**NOVA Enhanced Bot** - Making AI conversations more intelligent and memorable! 🤖✨ 