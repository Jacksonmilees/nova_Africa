import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Enhanced memory system with persistent storage
export class MemorySystem {
  constructor() {
    this.memoryDir = './nova_memory';
    this.ensureMemoryDir();
    this.userMemories = new Map();
    this.globalMemory = this.loadGlobalMemory();
    this.loadAllUserMemories();
  }

  ensureMemoryDir() {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  loadGlobalMemory() {
    const globalPath = path.join(this.memoryDir, 'global_memory.json');
    if (fs.existsSync(globalPath)) {
      try {
        return JSON.parse(fs.readFileSync(globalPath, 'utf8'));
      } catch (error) {
        console.error('Error loading global memory:', error.message);
      }
    }
    return {
      startTime: Date.now(),
      totalUsers: 0,
      totalMessages: 0,
      insights: [],
      patterns: {},
      knowledge: {},
      systemStats: {
        uptime: 0,
        averageResponseTime: 0,
        mostPopularTopics: [],
        userEngagement: {}
      }
    };
  }

  loadAllUserMemories() {
    const files = fs.readdirSync(this.memoryDir);
    files.forEach(file => {
      if (file.startsWith('user_') && file.endsWith('.json')) {
        const userId = file.replace('user_', '').replace('.json', '');
        try {
          const userData = JSON.parse(fs.readFileSync(path.join(this.memoryDir, file), 'utf8'));
          this.userMemories.set(userId, userData);
        } catch (error) {
          console.error(`Error loading memory for user ${userId}:`, error.message);
        }
      }
    });
  }

  saveGlobalMemory() {
    const globalPath = path.join(this.memoryDir, 'global_memory.json');
    try {
      // Update system stats
      this.globalMemory.systemStats.uptime = Date.now() - this.globalMemory.startTime;
      fs.writeFileSync(globalPath, JSON.stringify(this.globalMemory, null, 2));
    } catch (error) {
      console.error('Error saving global memory:', error.message);
    }
  }

  saveUserMemory(userId, userData) {
    const userPath = path.join(this.memoryDir, `user_${userId}.json`);
    try {
      fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
      this.userMemories.set(userId, userData);
    } catch (error) {
      console.error(`Error saving memory for user ${userId}:`, error.message);
    }
  }

  getUserMemory(userId) {
    return this.userMemories.get(userId) || {
      id: userId,
      firstName: '',
      username: '',
      conversations: [],
      preferences: {},
      topics: [],
      mood: 'neutral',
      lastActive: Date.now(),
      personality: {},
      knowledge: {},
      relationships: {},
      goals: [],
      achievements: [],
      learningProgress: {},
      interactionPatterns: {
        responseTime: [],
        messageLength: [],
        topicPreferences: {},
        timeOfDay: {},
        engagementLevel: 0
      }
    };
  }

  addConversation(userId, message, response, metadata = {}) {
    const userMemory = this.getUserMemory(userId);
    const conversation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message,
      response,
      context: this.analyzeContext(message),
      sentiment: this.analyzeSentiment(message),
      topics: this.extractTopics(message),
      metadata: {
        responseTime: metadata.responseTime || 0,
        messageLength: message.length,
        responseLength: response.length,
        ...metadata
      }
    };
    
    userMemory.conversations.push(conversation);
    if (userMemory.conversations.length > 1000) {
      userMemory.conversations = userMemory.conversations.slice(-1000);
    }
    
    this.updateUserProfile(userId, conversation);
    this.updateInteractionPatterns(userId, conversation);
    this.saveUserMemory(userId, userMemory);
    
    // Update global memory
    this.globalMemory.totalMessages++;
    this.updateGlobalPatterns(conversation);
    this.saveGlobalMemory();
  }

  analyzeContext(message) {
    const context = {
      isQuestion: message.includes('?'),
      isRequest: message.toLowerCase().includes('please') || message.toLowerCase().includes('can you'),
      isGreeting: /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(message),
      isEmotional: /\b(feel|feeling|emotion|sad|happy|angry|excited|worried|anxious)\b/i.test(message),
      isUrgent: /\b(urgent|asap|quickly|now|immediately)\b/i.test(message),
      isPersonal: /\b(my|me|i|myself|personal)\b/i.test(message),
      isTechnical: /\b(code|program|function|algorithm|database|api|debug)\b/i.test(message),
      isCreative: /\b(create|design|imagine|art|music|write|story)\b/i.test(message),
      length: message.length,
      complexity: this.calculateComplexity(message),
      language: this.detectLanguage(message)
    };
    return context;
  }

  analyzeSentiment(message) {
    const positive = /\b(good|great|excellent|amazing|wonderful|fantastic|love|like|happy|excited|thank|awesome|brilliant|perfect)\b/i.test(message);
    const negative = /\b(bad|terrible|awful|hate|dislike|sad|angry|frustrated|disappointed|problem|difficult|hard|struggle)\b/i.test(message);
    const neutral = /\b(okay|fine|alright|normal|usual|regular|standard)\b/i.test(message);
    
    if (positive && !negative) return 'positive';
    if (negative && !positive) return 'negative';
    if (neutral && !positive && !negative) return 'neutral';
    if (positive && negative) return 'mixed';
    return 'neutral';
  }

  extractTopics(message) {
    const topics = [];
    const topicPatterns = {
      coding: /\b(code|programming|javascript|python|java|html|css|react|vue|angular|node|api|database|algorithm|debug|function|variable|array|object|class|git|deployment)\b/i,
      research: /\b(research|study|analyze|investigate|explore|discover|learn|information|data|facts|evidence|source|reference|survey|experiment)\b/i,
      science: /\b(science|physics|chemistry|biology|medicine|health|technology|engineering|mathematics|statistics|experiment|theory)\b/i,
      business: /\b(business|marketing|finance|economy|management|strategy|profit|revenue|company|startup|investment|market|sales)\b/i,
      education: /\b(education|school|university|learning|teaching|student|teacher|course|lesson|exam|study|academic|degree)\b/i,
      technology: /\b(technology|tech|software|hardware|computer|internet|ai|artificial intelligence|machine learning|blockchain|crypto|automation)\b/i,
      personal: /\b(personal|life|family|friends|relationship|career|hobby|interest|goal|dream|plan|future|past)\b/i,
      creative: /\b(creative|art|music|writing|design|photography|painting|drawing|story|poem|novel|blog|content)\b/i,
      health: /\b(health|fitness|exercise|diet|nutrition|wellness|mental|physical|therapy|doctor|medical|treatment)\b/i,
      travel: /\b(travel|trip|vacation|destination|country|city|culture|adventure|explore|visit|tour|journey)\b/i
    };

    Object.entries(topicPatterns).forEach(([topic, pattern]) => {
      if (pattern.test(message)) {
        topics.push(topic);
      }
    });

    return topics;
  }

  calculateComplexity(message) {
    const words = message.split(' ').length;
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / sentences;
    const technicalTerms = (message.match(/\b(algorithm|architecture|optimization|scalability|concurrency|database|security|performance|framework|library|api|protocol|interface)\b/gi) || []).length;
    const complexity = Math.min(10, Math.max(1, Math.round((avgWordsPerSentence / 2) + (technicalTerms * 0.5))));
    return complexity;
  }

  detectLanguage(message) {
    const languagePatterns = {
      english: /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|about|like|as|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|can|may|might)\b/i,
      spanish: /\b(el|la|los|las|y|o|pero|en|con|por|para|de|desde|sobre|como|es|son|era|eran|ser|estar|tener|hacer|hacer|poder|deber|querer)\b/i,
      french: /\b(le|la|les|et|ou|mais|dans|avec|pour|de|du|des|sur|comme|est|sont|était|étaient|être|avoir|faire|pouvoir|devoir|vouloir)\b/i
    };

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(message)) {
        return lang;
      }
    }
    return 'english';
  }

  updateUserProfile(userId, conversation) {
    const userMemory = this.getUserMemory(userId);
    
    // Update topics
    conversation.topics.forEach(topic => {
      if (!userMemory.topics.includes(topic)) {
        userMemory.topics.push(topic);
      }
    });

    // Update personality based on conversation patterns
    if (conversation.sentiment === 'positive') {
      userMemory.personality.positivity = (userMemory.personality.positivity || 0) + 1;
    }
    if (conversation.context.isQuestion) {
      userMemory.personality.curiosity = (userMemory.personality.curiosity || 0) + 1;
    }
    if (conversation.context.isPersonal) {
      userMemory.personality.openness = (userMemory.personality.openness || 0) + 1;
    }
    if (conversation.context.isTechnical) {
      userMemory.personality.technical = (userMemory.personality.technical || 0) + 1;
    }
    if (conversation.context.isCreative) {
      userMemory.personality.creativity = (userMemory.personality.creativity || 0) + 1;
    }

    // Update mood based on recent conversations
    const recentSentiments = userMemory.conversations.slice(-5).map(c => c.sentiment);
    const positiveCount = recentSentiments.filter(s => s === 'positive').length;
    const negativeCount = recentSentiments.filter(s => s === 'negative').length;
    
    if (positiveCount > negativeCount) {
      userMemory.mood = 'positive';
    } else if (negativeCount > positiveCount) {
      userMemory.mood = 'negative';
    } else {
      userMemory.mood = 'neutral';
    }

    userMemory.lastActive = Date.now();
  }

  updateInteractionPatterns(userId, conversation) {
    const userMemory = this.getUserMemory(userId);
    
    // Track response time
    if (conversation.metadata.responseTime) {
      userMemory.interactionPatterns.responseTime.push(conversation.metadata.responseTime);
      if (userMemory.interactionPatterns.responseTime.length > 50) {
        userMemory.interactionPatterns.responseTime = userMemory.interactionPatterns.responseTime.slice(-50);
      }
    }

    // Track message length
    userMemory.interactionPatterns.messageLength.push(conversation.metadata.messageLength);
    if (userMemory.interactionPatterns.messageLength.length > 50) {
      userMemory.interactionPatterns.messageLength = userMemory.interactionPatterns.messageLength.slice(-50);
    }

    // Track topic preferences
    conversation.topics.forEach(topic => {
      userMemory.interactionPatterns.topicPreferences[topic] = 
        (userMemory.interactionPatterns.topicPreferences[topic] || 0) + 1;
    });

    // Track time of day
    const hour = new Date(conversation.timestamp).getHours();
    const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    userMemory.interactionPatterns.timeOfDay[timeSlot] = 
      (userMemory.interactionPatterns.timeOfDay[timeSlot] || 0) + 1;

    // Calculate engagement level
    const avgMessageLength = userMemory.interactionPatterns.messageLength.reduce((a, b) => a + b, 0) / 
                           userMemory.interactionPatterns.messageLength.length;
    const responseFrequency = userMemory.conversations.length / 
                            ((Date.now() - userMemory.lastActive) / (1000 * 60 * 60 * 24)); // conversations per day
    
    userMemory.interactionPatterns.engagementLevel = Math.min(10, Math.max(1, 
      Math.round((avgMessageLength / 50) + (responseFrequency * 2))));
  }

  updateGlobalPatterns(conversation) {
    // Update topic popularity
    conversation.topics.forEach(topic => {
      this.globalMemory.patterns[topic] = (this.globalMemory.patterns[topic] || 0) + 1;
    });

    // Update sentiment patterns
    this.globalMemory.patterns.sentiments = this.globalMemory.patterns.sentiments || {};
    this.globalMemory.patterns.sentiments[conversation.sentiment] = 
      (this.globalMemory.patterns.sentiments[conversation.sentiment] || 0) + 1;

    // Update complexity patterns
    this.globalMemory.patterns.complexity = this.globalMemory.patterns.complexity || {};
    const complexityLevel = conversation.context.complexity <= 3 ? 'low' : 
                           conversation.context.complexity <= 7 ? 'medium' : 'high';
    this.globalMemory.patterns.complexity[complexityLevel] = 
      (this.globalMemory.patterns.complexity[complexityLevel] || 0) + 1;
  }

  getRecentConversations(userId, limit = 10) {
    const userMemory = this.getUserMemory(userId);
    return userMemory.conversations.slice(-limit);
  }

  getConversationSummary(userId) {
    const userMemory = this.getUserMemory(userId);
    const totalConversations = userMemory.conversations.length;
    const recentConversations = this.getRecentConversations(userId, 20);
    
    const sentimentCounts = recentConversations.reduce((acc, conv) => {
      acc[conv.sentiment] = (acc[conv.sentiment] || 0) + 1;
      return acc;
    }, {});

    const topTopics = userMemory.topics.slice(0, 5);
    
    // Calculate average response time
    const responseTimes = userMemory.interactionPatterns.responseTime;
    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    // Get preferred time of day
    const timeOfDay = userMemory.interactionPatterns.timeOfDay;
    const preferredTime = Object.entries(timeOfDay).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    return {
      totalConversations,
      recentSentiment: sentimentCounts,
      topTopics,
      personality: userMemory.personality,
      lastActive: userMemory.lastActive,
      engagementLevel: userMemory.interactionPatterns.engagementLevel,
      avgResponseTime,
      preferredTimeOfDay: preferredTime,
      avgMessageLength: userMemory.interactionPatterns.messageLength.length > 0 ? 
        userMemory.interactionPatterns.messageLength.reduce((a, b) => a + b, 0) / 
        userMemory.interactionPatterns.messageLength.length : 0
    };
  }

  searchMemories(userId, query, limit = 10) {
    const userMemory = this.getUserMemory(userId);
    const searchTerms = query.toLowerCase().split(' ');
    
    const relevantMemories = userMemory.conversations.filter(conversation => {
      const messageWords = conversation.message.toLowerCase();
      const responseWords = conversation.response.toLowerCase();
      
      const matchScore = searchTerms.reduce((score, term) => {
        if (messageWords.includes(term) || responseWords.includes(term)) {
          return score + 1;
        }
        return score;
      }, 0);
      
      return matchScore > 0;
    }).map(conversation => ({
      ...conversation,
      relevance: searchTerms.reduce((score, term) => {
        const messageMatch = (conversation.message.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        const responseMatch = (conversation.response.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        return score + messageMatch + responseMatch;
      }, 0)
    })).sort((a, b) => b.relevance - a.relevance).slice(0, limit);
    
    return relevantMemories;
  }

  getGlobalInsights() {
    const insights = [];
    
    // Topic popularity insights
    const topTopics = Object.entries(this.globalMemory.patterns)
      .filter(([key]) => !['sentiments', 'complexity'].includes(key))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (topTopics.length > 0) {
      insights.push(`Most popular topics: ${topTopics.map(([topic]) => topic).join(', ')}`);
    }

    // Sentiment insights
    if (this.globalMemory.patterns.sentiments) {
      const dominantSentiment = Object.entries(this.globalMemory.patterns.sentiments)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
      insights.push(`Overall user sentiment tends to be ${dominantSentiment}`);
    }

    // Complexity insights
    if (this.globalMemory.patterns.complexity) {
      const complexityLevels = Object.entries(this.globalMemory.patterns.complexity)
        .sort(([,a], [,b]) => b - a);
      insights.push(`Users typically ask ${complexityLevels[0][0]}-complexity questions`);
    }

    return insights;
  }
} 