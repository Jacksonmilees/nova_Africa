// Simple test script to verify Telegram bot token
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || '7816999039:AAEzXbWCYS7v6yp5jdR-E3--shtuzaPdxiU';

console.log('🤖 Testing NOVA Telegram Bot...');
console.log(`Token: ${token.substring(0, 20)}...`);

async function testBot() {
  try {
    const bot = new TelegramBot(token, { polling: false });
    
    // Test bot info
    const botInfo = await bot.getMe();
    console.log('✅ Bot connection successful!');
    console.log(`Bot Name: ${botInfo.first_name}`);
    console.log(`Bot Username: @${botInfo.username}`);
    console.log(`Bot ID: ${botInfo.id}`);
    
    // Test webhook info
    try {
      const webhookInfo = await bot.getWebhookInfo();
      console.log('📡 Webhook Info:');
      console.log(`  URL: ${webhookInfo.url || 'Not set'}`);
      console.log(`  Has custom certificate: ${webhookInfo.has_custom_certificate}`);
      console.log(`  Pending update count: ${webhookInfo.pending_update_count}`);
    } catch (error) {
      console.log('⚠️  Could not get webhook info:', error.message);
    }
    
    console.log('\n🎉 Bot is ready to use!');
    console.log('📱 Find your bot at: https://t.me/' + botInfo.username);
    
  } catch (error) {
    console.error('❌ Bot test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the token is correct');
    console.log('2. Make sure the bot is not already running');
    console.log('3. Verify internet connection');
    console.log('4. Check if the bot was created properly with @BotFather');
  }
}

testBot(); 