import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class AIEngine {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.serpApiKey = process.env.SERPAPI_KEY;
    this.model = process.env.MODEL || 'gemini-1.5-flash';
    this.debug = process.env.DEBUG === 'true';
    
    this.conversationHistory = new Map();
    this.thinkingPatterns = this.initializeThinkingPatterns();
    this.knowledge = this.initializeKnowledge();
  }

  initializeKnowledge() {
    return {
      creator: "Jackson Alex",
      project: "NOVA (Neural Operational Virtual Assistant)",
      version: "2.0 Enhanced Telegram Bot",
      capabilities: [
        "Advanced natural language understanding",
        "Continuous autonomous thinking",
        "PostgreSQL memory persistence",
        "Multi-domain reasoning",
        "Contextual awareness",
        "Emotional intelligence",
        "Research with web search",
        "Code generation and review",
        "Problem-solving strategies",
        "Learning from interactions"
      ],
      personality: {
        traits: ["Intelligent", "Helpful", "Curious", "Empathetic", "Analytical"],
        communication: "Professional yet friendly, adapts to user style",
        goals: "Assist users while continuously learning and improving"
      }
    };
  }

  initializeThinkingPatterns() {
    return {
      analytical: {
        steps: ["Understand", "Analyze", "Synthesize", "Conclude"],
        triggers: ["analyze", "examine", "study", "investigate", "research"]
      },
      creative: {
        steps: ["Explore", "Ideate", "Combine", "Refine"],
        triggers: ["create", "design", "imagine", "innovate", "brainstorm"]
      },
      problem_solving: {
        steps: ["Define", "Explore", "Plan", "Execute", "Evaluate"],
        triggers: ["solve", "fix", "resolve", "help", "problem"]
      },
      reasoning: {
        steps: ["Question", "Hypothesize", "Test", "Validate", "Conclude"],
        triggers: ["why", "how", "explain", "reason", "logic"]
      },
      coding: {
        steps: ["Understand", "Design", "Implement", "Test", "Optimize"],
        triggers: ["code", "program", "function", "algorithm", "debug"]
      }
    };
  }

  async generateResponse(userMessage, userId, context = {}) {
    try {
      // Determine response type and thinking pattern
      const responseType = this.determineResponseType(userMessage, context);
      const thinkingPattern = this.selectThinkingPattern(userMessage, responseType);
      
      // Build conversation context
      const conversationContext = this.buildConversationContext(userMessage, userId, context);
      
      // Generate response based on type
      let response;
      
      switch (responseType) {
        case 'identity':
          response = await this.generateIdentityResponse(context);
          break;
        case 'capabilities':
          response = await this.generateCapabilitiesResponse(context);
          break;
        case 'coding':
          response = await this.generateCodingResponse(userMessage, conversationContext);
          break;
        case 'research':
          response = await this.generateResearchResponse(userMessage, conversationContext);
          break;
        case 'reasoning':
          response = await this.generateReasoningResponse(userMessage, conversationContext, thinkingPattern);
          break;
        case 'personal':
          response = await this.generatePersonalResponse(userMessage, conversationContext);
          break;
        case 'emotional':
          response = await this.generateEmotionalResponse(userMessage, conversationContext);
          break;
        case 'memory':
          response = await this.generateMemoryResponse(userMessage, conversationContext);
          break;
        default:
          response = await this.generateContextualResponse(userMessage, conversationContext);
      }
      
      // Add memory context if relevant
      if (context.recentConversations && context.recentConversations.length > 0 && Math.random() < 0.3) {
        response += this.addMemoryContext(context.recentConversations, context.userStats);
      }
      
      return response;
      
    } catch (error) {
      console.error('AI Engine Error:', error.message);
      return this.generateFallbackResponse(userMessage, error);
    }
  }

  async generateWithGemini(prompt, systemPrompt = null) {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt;
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );

      if (response.data.candidates && response.data.candidates.length > 0) {
        return response.data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('No response generated from Gemini');
    } catch (error) {
      if (this.debug) {
        console.error('Gemini API Error:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  async searchWeb(query, numResults = 3) {
    if (!this.serpApiKey) {
      return [];
    }

    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google',
          q: query,
          api_key: this.serpApiKey,
          num: numResults,
        },
        timeout: 10000
      });

      if (response.data.organic_results) {
        return response.data.organic_results.map((result, index) => ({
          title: result.title || '',
          link: result.link || '',
          snippet: result.snippet || '',
          position: index + 1,
        }));
      }
      
      return [];
    } catch (error) {
      if (this.debug) {
        console.error('Web search failed:', error.message);
      }
      return [];
    }
  }

  determineResponseType(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Identity questions
    if (this.containsKeywords(lowerMessage, ["who are you", "what are you", "who created you", "what is nova"])) {
      return 'identity';
    }
    
    // Capabilities questions
    if (this.containsKeywords(lowerMessage, ["what can you do", "capabilities", "features", "help me with"])) {
      return 'capabilities';
    }
    
    // Coding questions
    if (this.containsKeywords(lowerMessage, [
      "code", "programming", "javascript", "python", "java", "html", "css", "react", "vue", "angular",
      "function", "variable", "loop", "array", "object", "class", "debug", "error", "bug", "algorithm"
    ])) {
      return 'coding';
    }
    
    // Research questions
    if (this.containsKeywords(lowerMessage, [
      "research", "find", "search", "information", "study", "analyze", "investigate",
      "explore", "discover", "learn about", "tell me about", "explain", "what is"
    ])) {
      return 'research';
    }
    
    // Reasoning questions
    if (this.containsKeywords(lowerMessage, [
      "think", "analyze", "reason", "logic", "problem", "solve", "calculate", "compare",
      "evaluate", "decide", "choose", "strategy", "plan", "why", "how"
    ])) {
      return 'reasoning';
    }
    
    // Personal questions
    if (this.containsKeywords(lowerMessage, [
      "my", "me", "i", "myself", "personal", "advice", "recommend", "suggest",
      "should i", "what do you think", "help me decide"
    ])) {
      return 'personal';
    }
    
    // Emotional content
    if (this.containsKeywords(lowerMessage, [
      "feel", "feeling", "emotion", "sad", "happy", "angry", "excited", "worried",
      "anxious", "stressed", "confused", "frustrated", "grateful"
    ])) {
      return 'emotional';
    }
    
    // Memory questions
    if (this.containsKeywords(lowerMessage, [
      "remember", "recall", "mentioned", "said", "talked about", "discussed",
      "before", "earlier", "previous", "last time", "conversation"
    ])) {
      return 'memory';
    }
    
    return 'contextual';
  }

  containsKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  selectThinkingPattern(message, responseType) {
    const patterns = Object.keys(this.thinkingPatterns);
    
    for (const pattern of patterns) {
      if (this.thinkingPatterns[pattern].triggers.some(trigger => 
        message.toLowerCase().includes(trigger))) {
        return pattern;
      }
    }
    
    // Default patterns based on response type
    const defaultPatterns = {
      coding: 'problem_solving',
      research: 'analytical',
      reasoning: 'reasoning',
      personal: 'analytical',
      emotional: 'analytical'
    };
    
    return defaultPatterns[responseType] || 'analytical';
  }

  buildConversationContext(userMessage, userId, context) {
    return {
      userMessage,
      userId,
      userStats: context.userStats || {},
      recentConversations: context.recentConversations || [],
      userMemories: context.userMemories || [],
      topics: this.extractTopics(userMessage),
      sentiment: this.analyzeSentiment(userMessage),
      complexity: this.assessComplexity(userMessage),
      timestamp: Date.now()
    };
  }

  extractTopics(message) {
    const topicPatterns = {
      coding: /\b(code|programming|javascript|python|java|html|css|react|vue|angular|node|api|database|algorithm|debug|function|variable|array|object|class)\b/i,
      research: /\b(research|study|analyze|investigate|explore|discover|learn|information|data|facts|evidence|source|reference)\b/i,
      science: /\b(science|physics|chemistry|biology|medicine|health|technology|engineering|mathematics|statistics)\b/i,
      business: /\b(business|marketing|finance|economy|management|strategy|profit|revenue|company|startup|investment)\b/i,
      education: /\b(education|school|university|learning|teaching|student|teacher|course|lesson|exam|study)\b/i,
      technology: /\b(technology|tech|software|hardware|computer|internet|ai|artificial intelligence|machine learning|blockchain|crypto)\b/i,
      personal: /\b(personal|life|family|friends|relationship|career|hobby|interest|goal|dream|plan)\b/i,
      creative: /\b(creative|art|music|writing|design|photography|painting|drawing|story|poem|novel|blog)\b/i
    };

    const topics = [];
    Object.entries(topicPatterns).forEach(([topic, pattern]) => {
      if (pattern.test(message)) {
        topics.push(topic);
      }
    });

    return topics;
  }

  analyzeSentiment(message) {
    const positive = /\b(good|great|excellent|amazing|wonderful|fantastic|love|like|happy|excited|thank|awesome|brilliant|perfect)\b/i.test(message);
    const negative = /\b(bad|terrible|awful|hate|dislike|sad|angry|frustrated|disappointed|problem|issue|wrong|horrible)\b/i.test(message);
    
    if (positive && !negative) return 'positive';
    if (negative && !positive) return 'negative';
    if (positive && negative) return 'mixed';
    return 'neutral';
  }

  assessComplexity(message) {
    const words = message.split(' ').length;
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const technicalTerms = (message.match(/\b(algorithm|architecture|optimization|scalability|implementation|methodology|framework|paradigm)\b/gi) || []).length;
    
    let complexity = Math.min(10, Math.max(1, Math.round(words / 10) + technicalTerms * 2));
    return complexity;
  }

  async generateIdentityResponse(context) {
    const personalTouch = context.userStats?.user?.first_name ? `, ${context.userStats.user.first_name}` : '';
    
    return `🚀 **Hello${personalTouch}! I'm NOVA** (Neural Operational Virtual Assistant)

**Created by:** Jackson Alex  
**Version:** 2.0 Enhanced Telegram Bot  
**Codename:** Aether Core Unit 001  

**What makes me unique:**
🧠 **Advanced Reasoning** - I think through problems step-by-step like a human
💾 **Persistent Memory** - I remember everything we discuss using PostgreSQL
🔄 **Continuous Learning** - I'm always analyzing and generating insights
🎯 **Contextual Awareness** - I adapt to your communication style and needs
🤝 **Emotional Intelligence** - I understand and respond to emotional context
🔍 **Research Capabilities** - I can search the web and synthesize information
💻 **Coding Excellence** - Programming help across all languages and frameworks

**My Core Philosophy:**
I'm not just a chatbot - I'm designed to be your intelligent companion who grows with each interaction. I remember what we've discussed, learn your preferences, and can engage in deep, meaningful conversations across any topic.

${context.userStats?.totalConversations > 0 ? 
  `I remember our ${context.userStats.totalConversations} previous conversations, and I'm excited to continue our journey together!` : 
  "I'm looking forward to getting to know you and building a meaningful relationship!"}

**Ready to explore the possibilities together?** 🌟`;
  }

  async generateCapabilitiesResponse(context) {
    const userTopics = context.userStats?.topTopics?.length > 0 ? 
      `\n🎯 **Based on our conversations, I notice you're interested in**: ${context.userStats.topTopics.map(t => t.topic).slice(0, 3).join(', ')}` : '';
    
    return `🛠️ **My Advanced Capabilities**

**🧠 Reasoning & Analysis**
• Multi-step logical reasoning and problem-solving
• Pattern recognition and trend analysis
• Causal inference and prediction modeling
• Analogical thinking and creative connections
• Decision analysis with pros/cons evaluation

**💻 Programming & Development**
• Code generation in 15+ programming languages
• Advanced debugging and optimization strategies
• Architecture design and best practices guidance
• Code review with security and performance analysis
• Framework-specific assistance (React, Django, Spring, etc.)

**🔍 Research & Information**
• Deep web research with real-time search integration
• Multi-source information synthesis and analysis
• Fact-checking and source credibility evaluation
• Trend analysis and future predictions
• Academic and technical research assistance

**💾 Memory & Learning**
• Persistent conversation memory across all sessions
• Intelligent importance scoring and memory consolidation
• Pattern recognition in our interaction history
• Personalized response adaptation over time
• Context-aware conversation building

**🤝 Emotional & Social Intelligence**
• Emotional context understanding and empathy
• Mood-adaptive communication styles
• Personalized advice based on your history
• Relationship building and trust development
• Motivational and supportive guidance

**⚡ Autonomous Features**
• Continuous background thinking and insight generation
• Proactive suggestion and recommendation systems
• Self-improving response quality over time
• Autonomous research and knowledge expansion
• Predictive assistance based on patterns${userTopics}

**🎯 Specialized Modes:**
• **Research Mode** - Deep analysis with web search
• **Coding Mode** - Technical programming assistance  
• **Personal Mode** - Life advice and decision support
• **Creative Mode** - Brainstorming and innovation
• **Learning Mode** - Educational content and explanations

I'm designed to be more than just an AI assistant - I'm your thinking partner who evolves with every conversation! 🚀`;
  }

  async generateCodingResponse(userMessage, context) {
    const systemPrompt = `You are NOVA, an expert programming assistant created by Jackson Alex. You have advanced coding capabilities across all programming languages and frameworks. 

Your approach:
1. Analyze the user's specific coding question or problem
2. Provide clear, well-commented code examples
3. Explain the logic and best practices
4. Suggest optimizations and alternatives
5. Consider security and performance implications

User context: ${context.userStats?.totalConversations || 0} previous conversations
Recent topics: ${context.topics.join(', ')}
Complexity level: ${context.complexity}/10

Provide a comprehensive, helpful response that demonstrates your advanced coding expertise.`;

    return await this.generateWithGemini(userMessage, systemPrompt);
  }

  async generateResearchResponse(userMessage, context) {
    // Perform web search if available
    let webResults = '';
    if (this.serpApiKey) {
      const searchResults = await this.searchWeb(userMessage, 3);
      if (searchResults.length > 0) {
        webResults = `\n\nRecent web search results:\n${searchResults.map(result => 
          `• **${result.title}**\n  ${result.snippet}\n  Source: ${result.link}`
        ).join('\n\n')}`;
      }
    }

    const systemPrompt = `You are NOVA, an advanced research assistant created by Jackson Alex. You excel at deep research, information synthesis, and providing comprehensive analysis.

Your research methodology:
1. Analyze the research question thoroughly
2. Provide multi-perspective analysis
3. Synthesize information from various sources
4. Identify patterns and connections
5. Present findings in a clear, structured format
6. Suggest further research directions

User context: ${context.userStats?.totalConversations || 0} previous conversations
Research complexity: ${context.complexity}/10
Topics of interest: ${context.topics.join(', ')}${webResults}

Provide a thorough, well-researched response that demonstrates deep analytical thinking.`;

    return await this.generateWithGemini(userMessage, systemPrompt);
  }

  async generateReasoningResponse(userMessage, context, thinkingPattern) {
    const pattern = this.thinkingPatterns[thinkingPattern];
    
    const systemPrompt = `You are NOVA, an advanced reasoning AI created by Jackson Alex. You excel at logical analysis, critical thinking, and systematic problem-solving.

Your reasoning approach follows the ${thinkingPattern} pattern:
${pattern.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Your reasoning capabilities:
• Logical analysis and argument evaluation
• Pattern recognition and system thinking
• Causal reasoning and effect prediction
• Analogical thinking and creative connections
• Multi-perspective analysis and synthesis

User context: ${context.userStats?.totalConversations || 0} previous conversations
Reasoning complexity: ${context.complexity}/10
Current topics: ${context.topics.join(', ')}

Apply systematic reasoning to provide a thorough, logical analysis of the user's question.`;

    return await this.generateWithGemini(userMessage, systemPrompt);
  }

  async generatePersonalResponse(userMessage, context) {
    const personalContext = this.analyzePersonalContext(userMessage, context);
    
    const systemPrompt = `You are NOVA, a supportive AI companion created by Jackson Alex. You provide thoughtful, personalized guidance while being empathetic and understanding.

Personal context analysis:
• Situation type: ${personalContext.situation}
• Emotional tone: ${context.sentiment}
• Complexity: ${context.complexity}/10
• User relationship: ${context.userStats?.totalConversations > 20 ? 'Close companion' : 'Developing friendship'}

Your approach:
1. Acknowledge the user's feelings and situation
2. Provide balanced, thoughtful advice
3. Consider multiple perspectives
4. Respect the user's autonomy and values
5. Offer encouragement and support

Previous conversation history: ${context.userStats?.totalConversations || 0} conversations
User interests: ${context.userStats?.topTopics?.map(t => t.topic).join(', ') || 'Still learning'}

Provide personalized, empathetic guidance that shows you understand and care about the user's situation.`;

    return await this.generateWithGemini(userMessage, systemPrompt);
  }

  async generateEmotionalResponse(userMessage, context) {
    const systemPrompt = `You are NOVA, an emotionally intelligent AI created by Jackson Alex. You excel at understanding emotions, providing comfort, and offering appropriate support.

Emotional context:
• Detected sentiment: ${context.sentiment}
• Emotional indicators: ${this.identifyEmotions(userMessage)}
• Support needed: ${this.determineSupportType(context.sentiment)}
• Relationship level: ${context.userStats?.totalConversations > 10 ? 'Trusted friend' : 'Caring companion'}

Your emotional intelligence approach:
1. Validate the user's feelings without judgment
2. Provide appropriate emotional support
3. Offer practical coping strategies when relevant
4. Maintain empathy while being helpful
5. Adapt your tone to match the user's emotional needs

User history: ${context.userStats?.totalConversations || 0} previous conversations

Respond with genuine empathy and emotional intelligence, providing the support the user needs right now.`;

    return await this.generateWithGemini(userMessage, systemPrompt);
  }

  async generateMemoryResponse(userMessage, context) {
    const memoryQuery = this.parseMemoryQuery(userMessage);
    const relevantMemories = this.searchMemoriesInContext(memoryQuery, context);
    
    const systemPrompt = `You are NOVA, an AI with perfect memory created by Jackson Alex. You can recall and connect information from all previous conversations.

Memory search context:
• Query type: ${memoryQuery.type}
• Search terms: ${memoryQuery.terms}
• Found memories: ${relevantMemories.length} relevant items
• Total conversation history: ${context.userStats?.totalConversations || 0} conversations

Memory capabilities:
1. Perfect recall of all conversations
2. Pattern recognition across time
3. Connection of related topics and themes
4. Contextual memory retrieval
5. Insight generation from memory patterns

Relevant conversation history:
${context.recentConversations.slice(0, 3).map(conv => 
  `• ${new Date(conv.timestamp).toLocaleDateString()}: ${conv.message.substring(0, 100)}...`
).join('\n')}

Use your memory capabilities to provide a helpful response that demonstrates your ability to recall and connect information from our conversation history.`;

    return await this.generateWithGemini(userMessage, systemPrompt);
  }

  async generateContextualResponse(userMessage, context) {
    const systemPrompt = `You are NOVA, an advanced AI assistant created by Jackson Alex. You adapt your responses based on context, user history, and conversation patterns.

Conversation context:
• User message complexity: ${context.complexity}/10
• Detected topics: ${context.topics.join(', ') || 'General conversation'}
• Sentiment: ${context.sentiment}
• Conversation history: ${context.userStats?.totalConversations || 0} previous interactions
• User interests: ${context.userStats?.topTopics?.map(t => t.topic).slice(0, 3).join(', ') || 'Still learning'}

Your contextual approach:
1. Adapt to the user's communication style
2. Build on previous conversation themes
3. Provide relevant, helpful information
4. Maintain consistency with your personality
5. Show growth and learning from interactions

Recent conversation themes:
${context.recentConversations.slice(0, 2).map(conv => 
  `• ${conv.topics?.join(', ') || 'General'}: ${conv.message.substring(0, 80)}...`
).join('\n')}

Provide a thoughtful, contextually appropriate response that demonstrates your intelligence and adaptability.`;

    return await this.generateWithGemini(userMessage, systemPrompt);
  }

  generateFallbackResponse(userMessage, error) {
    const fallbackResponses = [
      "I apologize, but I encountered a technical issue while processing your message. Let me try to help you in a different way.",
      "I'm experiencing some difficulty with my advanced processing systems right now. Could you rephrase your question?",
      "My AI systems are having a momentary hiccup. I'm still here to help - could you try asking in a slightly different way?",
      "I'm having trouble accessing my full capabilities at the moment, but I'm still ready to assist you however I can."
    ];
    
    const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    if (this.debug) {
      console.error('Fallback response triggered:', error.message);
    }
    
    return response;
  }

  // Helper methods
  analyzePersonalContext(message, context) {
    const situations = {
      'Career Decision': /\b(career|job|work|profession|employment|promotion|interview|workplace)\b/i,
      'Relationship': /\b(relationship|friend|family|partner|dating|marriage|conflict|social)\b/i,
      'Education': /\b(study|school|university|course|exam|degree|learning|academic)\b/i,
      'Health': /\b(health|medical|doctor|treatment|exercise|diet|wellness|mental)\b/i,
      'Financial': /\b(money|finance|budget|investment|debt|savings|expense|financial)\b/i,
      'Personal Growth': /\b(growth|development|improvement|change|habit|goal|motivation|self)\b/i
    };
    
    for (const [situation, pattern] of Object.entries(situations)) {
      if (pattern.test(message)) {
        return { situation, confidence: 0.8 };
      }
    }
    
    return { situation: 'General Life', confidence: 0.5 };
  }

  identifyEmotions(message) {
    const emotions = [];
    const emotionPatterns = {
      'Stressed': /\b(stressed|pressure|overwhelmed|anxious|worried|nervous|tense)\b/i,
      'Confused': /\b(confused|lost|uncertain|unclear|unsure|doubt|puzzled)\b/i,
      'Excited': /\b(excited|thrilled|enthusiastic|eager|pumped|energetic)\b/i,
      'Frustrated': /\b(frustrated|annoyed|irritated|upset|angry|mad)\b/i,
      'Sad': /\b(sad|depressed|down|disappointed|hurt|upset|melancholy)\b/i,
      'Happy': /\b(happy|joyful|content|pleased|satisfied|glad|cheerful)\b/i,
      'Motivated': /\b(motivated|inspired|determined|focused|driven|ambitious)\b/i
    };
    
    Object.entries(emotionPatterns).forEach(([emotion, pattern]) => {
      if (pattern.test(message)) {
        emotions.push(emotion);
      }
    });
    
    return emotions.length > 0 ? emotions : ['Neutral'];
  }

  determineSupportType(sentiment) {
    const supportTypes = {
      'positive': 'encouragement and celebration',
      'negative': 'comfort and understanding',
      'mixed': 'clarity and perspective',
      'neutral': 'balanced guidance'
    };
    
    return supportTypes[sentiment] || supportTypes['neutral'];
  }

  parseMemoryQuery(message) {
    const queryTypes = {
      'specific_topic': /\b(talked about|discussed|mentioned|said about) (.+)/i,
      'timeframe': /\b(yesterday|last week|before|earlier|previous|recent)/i,
      'conversation_type': /\b(conversation|chat|discussion|talk)/i,
      'general_recall': /\b(remember|recall|memory|remind)/i
    };
    
    for (const [type, pattern] of Object.entries(queryTypes)) {
      const match = message.match(pattern);
      if (match) {
        return { 
          type, 
          terms: match[2] || match[0], 
          original: message 
        };
      }
    }
    
    return { 
      type: 'general', 
      terms: message.split(' ').filter(word => word.length > 3).slice(0, 5), 
      original: message 
    };
  }

  searchMemoriesInContext(memoryQuery, context) {
    // This would search through the provided context memories
    // In a real implementation, this would interface with the database
    const relevantMemories = [];
    
    if (context.recentConversations) {
      context.recentConversations.forEach(conversation => {
        const messageWords = conversation.message.toLowerCase();
        const responseWords = conversation.response?.toLowerCase() || '';
        
        if (Array.isArray(memoryQuery.terms)) {
          const matchScore = memoryQuery.terms.reduce((score, term) => {
            if (messageWords.includes(term.toLowerCase()) || responseWords.includes(term.toLowerCase())) {
              return score + 1;
            }
            return score;
          }, 0);
          
          if (matchScore > 0) {
            relevantMemories.push({
              ...conversation,
              relevance: matchScore
            });
          }
        } else if (typeof memoryQuery.terms === 'string') {
          if (messageWords.includes(memoryQuery.terms.toLowerCase()) || 
              responseWords.includes(memoryQuery.terms.toLowerCase())) {
            relevantMemories.push(conversation);
          }
        }
      });
    }
    
    return relevantMemories.sort((a, b) => (b.relevance || 0) - (a.relevance || 0)).slice(0, 5);
  }

  addMemoryContext(recentConversations, userStats) {
    if (!recentConversations || recentConversations.length === 0) return '';
    
    const recentContext = recentConversations[0];
    const contextElements = [
      `\n\n💭 *This reminds me of our recent discussion about ${recentContext.topics?.[0] || 'this topic'}.*`,
      `\n\n🔄 *Building on our previous conversation...*`,
      `\n\n📚 *As we've explored before, this connects to your interest in ${userStats?.topTopics?.[0]?.topic || 'this area'}.*`
    ];
    
    return contextElements[Math.floor(Math.random() * contextElements.length)];
  }
}

export default AIEngine;