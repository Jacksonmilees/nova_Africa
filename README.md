# NOVA - Neural Operational Virtual Assistant

## Overview
NOVA is an advanced AI system designed for autonomy, action, memory, learning, and multi-agent collaboration. It now uses **Ollama** as the main AI provider, **Gemini** as fallback, and stores all persistent data (memory, tasks, plugins) in local JSON files on your server. **No database is required.**

## Quick Start

1. **Clone and Install**
   ```sh
   git clone https://github.com/Jacksonmilees/nova_Africa.git
   cd nova_Africa
   npm install
   ```
2. **Configure Environment**
   - Copy `.env.example` to `.env` and fill in:
     - `TELEGRAM_BOT_TOKEN`
     - `OLLAMA_BASE_URL` (default: http://localhost:11434)
     - `OLLAMA_DEFAULT_MODEL` (e.g., llama3.1)
     - `GEMINI_API_KEY` (for fallback)
   - **No database config needed.**
3. **Start Ollama**
   ```sh
   ollama serve
   ollama pull llama3.1
   ```
4. **Run the Bot**
   ```sh
   npm run bot
   ```
   or for production:
   ```sh
   npm run build
   npm run bot
   ```

## VPS Deployment
- SSH into your VPS
- Follow the steps above
- Use PM2 for production:
  ```sh
  npm install -g pm2
  pm2 start dist/bot/NovaTelegramBot.js --name nova-bot
  pm2 save
  pm2 startup
  ```

## Persistent Storage
- All data is stored in `nova-memory.json`, `nova-tasks.json`, and `nova-plugins.json` in your project directory.
- No external database is required.

## AI Providers
- **Ollama**: Main brain for all AI requests (local LLM, fast, private)
- **Gemini**: Fallback if Ollama is unavailable (requires API key)

## Security
- Do not share your `.env` or server credentials publicly.

## Support
- For issues, open a GitHub issue or contact the maintainer.