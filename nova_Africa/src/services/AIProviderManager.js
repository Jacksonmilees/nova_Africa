import OllamaIntegration from './OllamaIntegration';
import GeminiIntegration from './GeminiIntegration';
export class AIProviderManager {
    ollama;
    gemini;
    nova;
    preferredProvider = 'ollama';
    debug;
    constructor(nova) {
        this.nova = nova;
        this.ollama = new OllamaIntegration(nova);
        this.gemini = new GeminiIntegration();
        this.debug = import.meta.env.VITE_DEBUG === 'true';
    }
    async initialize() {
        // Check provider availability
        const ollamaAvailable = await this.ollama.checkConnection();
        const geminiAvailable = await this.gemini.checkConnection();
        if (this.debug) {
            console.log('AI Provider Status:', {
                ollama: ollamaAvailable,
                gemini: geminiAvailable,
                serpApi: this.gemini.isSerpApiConfigured(),
            });
        }
        // Set preferred provider based on availability
        if (ollamaAvailable) {
            this.preferredProvider = 'ollama';
        }
        else if (geminiAvailable) {
            this.preferredProvider = 'gemini';
        }
        else {
            this.preferredProvider = 'fallback';
        }
        if (this.debug) {
            console.log('Preferred AI provider:', this.preferredProvider);
        }
    }
    async processRequest(input, mode = 'general', forceProvider) {
        // Intercept creator questions
        const creatorQuestions = [
            /who (made|created|built) you/i,
            /who is your (creator|author|founder|maker)/i,
            /who's your (creator|author|founder|maker)/i,
            /who developed you/i,
            /who owns you/i,
            /who is behind you/i,
            /who designed you/i,
            /who is Jackson Alex/i,
            /who is the founder of nova/i,
            /who is the ceo of imarabuildor/i,
            /who is the visionary behind nova/i,
            /who is the architect of nova/i
        ];
        if (creatorQuestions.some((regex) => regex.test(input))) {
            return {
                content: `I was created by Jackson Alex, a Kenyan Tech Architect and visionary founder.\n\n**PROFILE SUMMARY**\nName: Jackson Alex\nAge: 22\nLocation: Kenya 🇰🇪\nTitle(s):\n• Founder & CEO – ImaraBuildor\n• Founder – ImaraSend\n• Visionary Creator – FundiSmart, HandyFix, and NOVA Core Unit Series\n• Architect – Aether Core Intelligence Stack\n\n🎓 **Academic Background**\nBachelor of Science in Computer Science\nJomo Kenyatta University of Agriculture and Technology (JKUAT)\n\n🧭 **Core Disciplines**\n- Applied Artificial Intelligence\n- Full-Stack Software Engineering\n- Distributed Systems & Cloud Infrastructure\n- Autonomous Agent Development\n- Mobile & Web Systems Design\n- Automation & API Integration\n- Embedded Control Systems (AI x OS-Level Access)\n\n🔭 **Vision**\n"Why must a human click 100 buttons to do what one mind could think, decide, and execute?"\n\nJackson Alex builds technology that disappears into thought—systems that think, adapt, and command.\n\nTo learn more, visit ImaraBuildor or ask about NOVA's mission!`,
                provider: 'fallback',
                model: 'custom',
            };
        }
        // Get conversation context from NOVA's memory
        const context = this.nova.getConversationContext(5);
        const enhancedInput = context ? `${context}\n\nUser: ${input}` : input;
        const provider = forceProvider || this.preferredProvider;
        try {
            switch (provider) {
                case 'ollama':
                    return await this.processWithOllama(enhancedInput, mode);
                case 'gemini':
                    return await this.processWithGemini(enhancedInput, mode);
                default:
                    return await this.processWithFallback(enhancedInput, mode);
            }
        }
        catch (error) {
            if (this.debug) {
                console.error(`${provider} processing failed:`, error);
            }
            // Try fallback providers
            if (provider === 'ollama') {
                try {
                    return await this.processWithGemini(enhancedInput, mode);
                }
                catch (geminiError) {
                    return await this.processWithFallback(enhancedInput, mode);
                }
            }
            else if (provider === 'gemini') {
                return await this.processWithFallback(enhancedInput, mode);
            }
            else {
                throw error;
            }
        }
    }
    async processWithOllama(input, mode) {
        let response;
        switch (mode) {
            case 'code':
                response = await this.ollama.processCodeRequest('', input);
                break;
            case 'research':
                response = await this.ollama.processResearchRequest(input);
                break;
            case 'reasoning':
                response = await this.ollama.processGeneralQuery(`Please analyze this logically and provide detailed reasoning: ${input}`);
                break;
            default:
                response = await this.ollama.processGeneralQuery(input);
        }
        return {
            content: response,
            provider: 'ollama',
            model: this.ollama.getDefaultModel(),
        };
    }
    async processWithGemini(input, mode) {
        let response;
        switch (mode) {
            case 'code':
                response = await this.gemini.processCodeRequest('', input);
                break;
            case 'research':
                response = await this.gemini.processResearchRequest(input, true);
                break;
            case 'reasoning':
                response = await this.gemini.processGeneralQuery(`Please analyze this logically and provide detailed reasoning: ${input}`);
                break;
            default:
                response = await this.gemini.processGeneralQuery(input);
        }
        return {
            content: response,
            provider: 'gemini',
            model: this.gemini.getModel(),
        };
    }
    async processWithFallback(input, mode) {
        // Basic NOVA processing as fallback
        const response = await this.nova.processCommand(input);
        return {
            content: response,
            provider: 'fallback',
            model: 'nova-core',
        };
    }
    async getAvailableProviders() {
        const providers = [
            {
                provider: 'ollama',
                available: await this.ollama.checkConnection(),
                model: this.ollama.getDefaultModel(),
            },
            {
                provider: 'gemini',
                available: await this.gemini.checkConnection(),
                model: this.gemini.getModel(),
            },
            {
                provider: 'fallback',
                available: true,
                model: 'nova-core',
            },
        ];
        return providers;
    }
    setPreferredProvider(provider) {
        this.preferredProvider = provider;
        if (this.debug) {
            console.log('Preferred provider changed to:', provider);
        }
    }
    getPreferredProvider() {
        return this.preferredProvider;
    }
    async searchWeb(query) {
        if (this.gemini.isSerpApiConfigured()) {
            try {
                return await this.gemini.searchWeb(query);
            }
            catch (error) {
                if (this.debug) {
                    console.error('Web search failed:', error);
                }
                return [];
            }
        }
        return [];
    }
    getOllamaIntegration() {
        return this.ollama;
    }
    getGeminiIntegration() {
        return this.gemini;
    }
}
export default AIProviderManager;
//# sourceMappingURL=AIProviderManager.js.map