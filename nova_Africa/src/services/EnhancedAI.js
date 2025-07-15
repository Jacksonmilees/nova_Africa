import axios from 'axios';

class EnhancedAI {
  constructor() {
    this.patterns = {
      coding: [
        'code', 'program', 'function', 'class', 'variable', 'loop', 'if', 'else',
        'javascript', 'python', 'java', 'typescript', 'react', 'node', 'api',
        'bug', 'error', 'debug', 'algorithm', 'data structure', 'database'
      ],
      research: [
        'research', 'study', 'find', 'search', 'information', 'data', 'statistics',
        'analysis', 'report', 'survey', 'investigation', 'explore', 'discover'
      ],
      reasoning: [
        'think', 'reason', 'logic', 'why', 'how', 'explain', 'analyze', 'compare',
        'conclude', 'inference', 'deduction', 'hypothesis', 'theory', 'philosophy'
      ]
    };
  }

  // Enhanced thinking with pattern analysis
  async thinkDeeply(context, userFacts = []) {
    const contextText = context.join('\n');
    const factsText = userFacts.join('\n');
    
    // Analyze patterns in the conversation
    const patterns = this.analyzePatterns(contextText);
    
    // Generate insights based on patterns and context
    const insights = this.generateInsights(patterns, contextText, factsText);
    
    return {
      insights,
      patterns,
      recommendations: this.generateRecommendations(patterns, contextText)
    };
  }

  analyzePatterns(text) {
    const patterns = {
      coding: 0,
      research: 0,
      reasoning: 0,
      general: 0
    };

    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (this.patterns.coding.some(p => word.includes(p))) patterns.coding++;
      if (this.patterns.research.some(p => word.includes(p))) patterns.research++;
      if (this.patterns.reasoning.some(p => word.includes(p))) patterns.reasoning++;
    }

    // Determine dominant pattern
    const max = Math.max(...Object.values(patterns));
    const dominant = Object.keys(patterns).find(key => patterns[key] === max);
    
    return { patterns, dominant };
  }

  generateInsights(patterns, context, facts) {
    const insights = [];
    
    if (patterns.dominant === 'coding') {
      insights.push("🔧 I notice you're working on code. Consider breaking complex problems into smaller functions.");
      insights.push("💡 Code patterns suggest you might benefit from design patterns or refactoring.");
    }
    
    if (patterns.dominant === 'research') {
      insights.push("🔍 Your questions indicate a research mindset. I can help gather and analyze information.");
      insights.push("📊 Consider using multiple sources to validate findings.");
    }
    
    if (patterns.dominant === 'reasoning') {
      insights.push("🧠 You're engaging in deep reasoning. Let's explore the logical implications together.");
      insights.push("🤔 Consider both inductive and deductive reasoning approaches.");
    }

    if (facts.length > 0) {
      insights.push(`📝 I remember: ${facts.slice(-2).join(', ')}`);
    }

    return insights;
  }

  generateRecommendations(patterns, context) {
    const recommendations = [];
    
    switch (patterns.dominant) {
      case 'coding':
        recommendations.push("Try /code mode for specialized programming assistance");
        recommendations.push("Consider using /think to analyze your code architecture");
        break;
      case 'research':
        recommendations.push("Use /research mode for web-based information gathering");
        recommendations.push("I can help you find reliable sources and data");
        break;
      case 'reasoning':
        recommendations.push("Use /reasoning mode for deep analytical thinking");
        recommendations.push("Let's explore the logical implications together");
        break;
      default:
        recommendations.push("I'm here to help with any topic. Use /modes to see available modes");
    }
    
    return recommendations;
  }

  // Mode-aware response generation
  async getModeResponse(text, mode, context = []) {
    switch (mode) {
      case 'code':
        return this.getCodingResponse(text, context);
      case 'research':
        return await this.getResearchResponse(text, context);
      case 'reasoning':
        return await this.getReasoningResponse(text, context);
      default:
        return this.getGeneralResponse(text, context);
    }
  }

  getCodingResponse(text, context) {
    const codingKeywords = ['function', 'class', 'variable', 'error', 'bug', 'api'];
    const hasCodingKeywords = codingKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (hasCodingKeywords) {
      return {
        response: `💻 I see you're working on code! Here's my analysis:\n\n${this.analyzeCodeRequest(text)}`,
        mode: 'code',
        suggestions: [
          "Consider using TypeScript for better type safety",
          "Implement error handling for robust code",
          "Follow clean code principles for maintainability"
        ]
      };
    }

    return {
      response: `💻 I'm in coding mode! How can I help with your programming needs?\n\nYou can ask me about:\n• Code reviews and optimization\n• Debugging assistance\n• Architecture patterns\n• Best practices`,
      mode: 'code'
    };
  }

  async getResearchResponse(text, context) {
    // Simulate web research (in a real implementation, you'd use actual APIs)
    const researchTopics = this.extractResearchTopics(text);
    
    return {
      response: `🔍 Research Mode: Analyzing "${researchTopics.join(', ')}"\n\n${this.generateResearchInsights(researchTopics)}`,
      mode: 'research',
      topics: researchTopics,
      suggestions: [
        "I can help you find reliable sources",
        "Let me analyze the latest data on this topic",
        "Consider multiple perspectives for comprehensive research"
      ]
    };
  }

  async getReasoningResponse(text, context) {
    const reasoning = await this.thinkDeeply(context);
    
    return {
      response: `🧠 Deep Reasoning Analysis:\n\n${reasoning.insights.join('\n\n')}\n\n${reasoning.recommendations.join('\n')}`,
      mode: 'reasoning',
      insights: reasoning.insights,
      patterns: reasoning.patterns
    };
  }

  getGeneralResponse(text, context) {
    const patterns = this.analyzePatterns(text);
    
    return {
      response: `🤖 General Mode: I understand you're asking about "${text}". Let me help you with that!\n\n${this.generateGeneralInsights(text, patterns)}`,
      mode: 'general',
      patterns: patterns
    };
  }

  analyzeCodeRequest(text) {
    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('bug')) {
      return "🐛 For debugging, let's:\n1. Identify the error type\n2. Check the error location\n3. Review recent changes\n4. Test with minimal examples";
    }
    
    if (text.toLowerCase().includes('function') || text.toLowerCase().includes('method')) {
      return "⚙️ For function design:\n1. Keep functions small and focused\n2. Use descriptive names\n3. Handle edge cases\n4. Add proper documentation";
    }
    
    return "💡 I can help with code optimization, best practices, and problem-solving approaches.";
  }

  extractResearchTopics(text) {
    // Simple topic extraction - in a real implementation, use NLP
    const words = text.toLowerCase().split(/\s+/);
    const topics = words.filter(word => word.length > 4);
    return topics.slice(0, 3); // Return top 3 topics
  }

  generateResearchInsights(topics) {
    return `Based on your research request, I recommend:\n\n` +
           `• Exploring multiple sources for comprehensive understanding\n` +
           `• Checking recent publications and data\n` +
           `• Considering different perspectives on ${topics.join(', ')}\n\n` +
           `Would you like me to help you find specific information on any of these topics?`;
  }

  generateGeneralInsights(text, patterns) {
    return `I can help you with:\n` +
           `• General questions and discussions\n` +
           `• Information and explanations\n` +
           `• Creative problem solving\n` +
           `• Learning and education\n\n` +
           `Use /modes to switch to specialized modes for better assistance!`;
  }

  // Add facts about users
  addUserFact(userId, fact) {
    // This would be implemented with the Memory model
    return `📝 Added fact: "${fact}" to your memory. I'll remember this for future conversations!`;
  }

  // Get personalized response based on user facts
  getPersonalizedResponse(text, userFacts = []) {
    if (userFacts.length === 0) {
      return null; // No personalization available
    }

    const relevantFacts = userFacts.filter(fact => 
      text.toLowerCase().includes(fact.toLowerCase().split(' ')[0])
    );

    if (relevantFacts.length > 0) {
      return `💭 Based on what I remember about you: ${relevantFacts.join(', ')}\n\n`;
    }

    return null;
  }
}

export default EnhancedAI; 