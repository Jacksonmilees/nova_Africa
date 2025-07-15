# NOVA Telegram Bot Startup Script
# PowerShell script to start the NOVA Telegram bot

Write-Host "🚀 Starting NOVA Telegram Bot..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "📝 Please edit .env file with your bot token and other settings" -ForegroundColor Cyan
    Write-Host "   Required: TELEGRAM_BOT_TOKEN" -ForegroundColor Cyan
    Write-Host "   Optional: GEMINI_API_KEY, SERP_API_KEY" -ForegroundColor Cyan
    pause
}

# Check if logs directory exists
if (-not (Test-Path "logs")) {
    Write-Host "📁 Creating logs directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if bot token is set
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$hasToken = $envContent | Where-Object { $_ -match "TELEGRAM_BOT_TOKEN=" -and $_ -notmatch "your-bot-token-here" }

if (-not $hasToken) {
    Write-Host "❌ TELEGRAM_BOT_TOKEN not set in .env file" -ForegroundColor Red
    Write-Host "   Please edit .env file and set your bot token" -ForegroundColor Cyan
    Write-Host "   Get your token from @BotFather on Telegram" -ForegroundColor Cyan
    pause
    exit 1
}

Write-Host "✅ Environment check passed" -ForegroundColor Green

# Load environment variables
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

Write-Host "🔧 Starting bot in development mode..." -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the bot" -ForegroundColor Gray

try {
    # Start the bot
    npm run bot:dev
} catch {
    Write-Host "❌ Error starting bot: $_" -ForegroundColor Red
    Write-Host "   Make sure all dependencies are installed: npm install" -ForegroundColor Cyan
    pause
} 