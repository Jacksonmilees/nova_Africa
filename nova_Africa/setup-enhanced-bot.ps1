# NOVA Enhanced Bot Setup Script
# This script helps you set up the enhanced NOVA bot with MongoDB

Write-Host "🤖 NOVA Enhanced Bot Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    
    if (Test-Path "env.enhanced.example") {
        Copy-Item "env.enhanced.example" ".env"
        Write-Host "✅ .env file created from template" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env file with your configuration" -ForegroundColor Yellow
    } else {
        Write-Host "❌ env.enhanced.example not found" -ForegroundColor Red
        exit 1
    }
}

# Check dependencies
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow

$dependencies = @("mongoose", "node-telegram-bot-api", "dotenv")
$missingDeps = @()

foreach ($dep in $dependencies) {
    try {
        $null = Get-Command "npm" -ErrorAction Stop
        $installed = npm list $dep --depth=0 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $dep is installed" -ForegroundColor Green
        } else {
            Write-Host "❌ $dep is missing" -ForegroundColor Red
            $missingDeps += $dep
        }
    } catch {
        Write-Host "❌ npm not found" -ForegroundColor Red
        exit 1
    }
}

# Install missing dependencies
if ($missingDeps.Count -gt 0) {
    Write-Host "`n📦 Installing missing dependencies..." -ForegroundColor Yellow
    foreach ($dep in $missingDeps) {
        Write-Host "Installing $dep..." -ForegroundColor Yellow
        npm install $dep
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $dep installed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install $dep" -ForegroundColor Red
        }
    }
}

# Check MongoDB connection
Write-Host "`n🗄️  Checking MongoDB connection..." -ForegroundColor Yellow

# Read .env file to get MongoDB URI
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $mongoUri = $envContent | Where-Object { $_ -match "^MONGO_URI=" } | ForEach-Object { $_.Split("=", 2)[1] }
    
    if ($mongoUri) {
        Write-Host "✅ MongoDB URI found in .env" -ForegroundColor Green
        Write-Host "🔗 URI: $mongoUri" -ForegroundColor Gray
    } else {
        Write-Host "❌ MONGO_URI not found in .env" -ForegroundColor Red
        Write-Host "📝 Please add your MongoDB connection string to .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

# Check bot token
Write-Host "`n🤖 Checking bot token..." -ForegroundColor Yellow

if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $botToken = $envContent | Where-Object { $_ -match "^BOT_TOKEN=" } | ForEach-Object { $_.Split("=", 2)[1] }
    
    if ($botToken -and $botToken -ne "your_telegram_bot_token_here") {
        Write-Host "✅ Bot token found in .env" -ForegroundColor Green
    } else {
        Write-Host "❌ Bot token not configured" -ForegroundColor Red
        Write-Host "📝 Please add your Telegram bot token to .env" -ForegroundColor Yellow
    }
}

# Create necessary directories
Write-Host "`n📁 Creating directories..." -ForegroundColor Yellow

$directories = @("logs", "src/models", "src/services")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "✅ Directory exists: $dir" -ForegroundColor Green
    }
}

# Final setup instructions
Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file with your configuration:" -ForegroundColor White
Write-Host "   - Add your Telegram bot token" -ForegroundColor Gray
Write-Host "   - Configure MongoDB connection" -ForegroundColor Gray
Write-Host "   - Add optional API keys (OpenAI, Bing)" -ForegroundColor Gray

Write-Host "`n2. Start the enhanced bot:" -ForegroundColor White
Write-Host "   npm run bot:enhanced" -ForegroundColor Gray

Write-Host "`n3. Test the bot:" -ForegroundColor White
Write-Host "   https://t.me/NovaAfrika_bot" -ForegroundColor Gray

Write-Host "`n🚀 Enhanced Features:" -ForegroundColor Cyan
Write-Host "• Continuous memory across sessions" -ForegroundColor White
Write-Host "• Deep thinking with /think" -ForegroundColor White
Write-Host "• Mode switching (/code, /research, /reasoning)" -ForegroundColor White
Write-Host "• Fact storage with /fact" -ForegroundColor White
Write-Host "• Personalized responses" -ForegroundColor White
Write-Host "• MongoDB persistent storage" -ForegroundColor White

Write-Host "`n💡 Commands to try:" -ForegroundColor Yellow
Write-Host "• /start - Welcome message" -ForegroundColor Gray
Write-Host "• /think - Deep analytical thinking" -ForegroundColor Gray
Write-Host "• /fact I'm a developer - Add personal fact" -ForegroundColor Gray
Write-Host "• /memory - Show what I remember" -ForegroundColor Gray
Write-Host "• /modes - Show available modes" -ForegroundColor Gray

Write-Host "`n✅ Setup complete! Ready to launch NOVA Enhanced Bot!" -ForegroundColor Green 