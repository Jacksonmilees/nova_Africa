# 🚀 NOVA Enhanced Bot - Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### 1. Configure Bot Token
Edit the `.env` file and replace the bot token:

```bash
# Open .env file
notepad .env
```

Change this line:
```
BOT_TOKEN=your_telegram_bot_token_here
```

To your actual bot token:
```
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. Get Your Bot Token
1. Open Telegram
2. Search for "@BotFather"
3. Send `/newbot`
4. Follow instructions to create your bot
5. Copy the token provided

### 3. Start the Bot
```bash
npm run bot:enhanced
```

### 4. Test the Bot
1. Open Telegram
2. Search for your bot username
3. Send `/start`

## 🎯 Features to Try

### Basic Commands
- `/start` - Welcome message
- `/help` - Show help
- `/modes` - Show available modes

### Memory Features
- `/fact I'm a developer from Kenya` - Add personal fact
- `/memory` - Show what I remember
- `/think` - Deep analytical thinking

### Mode Switching
- `/code` - Programming assistance
- `/research` - Research mode
- `/reasoning` - Logical reasoning
- `/general` - General conversation

## 🔧 Configuration Options

### MongoDB (Optional)
For persistent memory across bot restarts:

```env
MONGO_URI=mongodb://localhost:27017/nova_bot
```

### Without MongoDB
The bot will run with in-memory storage (resets when bot restarts).

## 🐛 Troubleshooting

### "Telegram Bot Token not provided"
- Check your `.env` file has the correct BOT_TOKEN
- Make sure there are no spaces around the `=` sign

### "MongoDB connection error"
- The bot will run in memory-only mode
- Install MongoDB locally or use MongoDB Atlas

### Bot not responding
- Check if the bot is running
- Verify your bot token is correct
- Make sure you've started a conversation with the bot

## 📱 Test Your Bot

Visit: https://t.me/NovaAfrika_bot (if using the shared bot)

Or use your own bot: https://t.me/YourBotUsername

## 🎉 Success!

Your enhanced NOVA bot is now running with:
- ✅ Continuous memory (with MongoDB) or in-memory storage
- ✅ Deep thinking capabilities
- ✅ Mode-aware responses
- ✅ Personal fact storage
- ✅ Context awareness

Happy chatting! 🤖✨ 