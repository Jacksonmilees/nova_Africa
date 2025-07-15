import AIProviderManager from '../services/AIProviderManager';

// Inside your bot's command/message handler:
if (text === '/ollama_test') {
  try {
    const aiManager = new AIProviderManager(nova); // or use existing instance
    const ollama = aiManager.getOllamaIntegration();
    const response = await ollama.generateResponse('Say hello from Ollama!');
    await bot.sendMessage(chatId, `Ollama response: ${response}`);
    console.log('[SimpleNovaBot] /ollama_test response:', response);
  } catch (err) {
    await bot.sendMessage(chatId, `Ollama error: ${(err as Error).message}`);
    console.error('[SimpleNovaBot] /ollama_test error:', err);
  }
  return;
} 