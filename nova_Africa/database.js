import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

class DatabaseManager {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
<<<<<<< HEAD
    
    this.initializeDatabase();
=======
    this.connected = false;
    this.init();
  }

  async init() {
    try {
      await this.testConnection();
      this.connected = true;
      await this.initializeDatabase();
    } catch (error) {
      this.connected = false;
      console.error('❌ Database connection failed:', error.message);
      console.error('⚠️  Running in memory-only mode (no persistent storage)');
    }
  }

  async testConnection() {
    try {
      await this.pool.query('SELECT 1');
    } catch (error) {
      throw new Error('Database connection test failed: ' + error.message);
    }
>>>>>>> 43314f1 (Refactor: File-based storage, Ollama as main AI, Gemini fallback, no DB required. Update docs for VPS deployment.)
  }

  async initializeDatabase() {
    try {
      console.log('🗄️ Initializing NOVA database...');
      
      // Create tables if they don't exist
      await this.createTables();
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
    }
  }

  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        first_name VARCHAR(255),
        username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_conversations INTEGER DEFAULT 0,
        personality JSONB DEFAULT '{}',
        preferences JSONB DEFAULT '{}',
        topics TEXT[] DEFAULT ARRAY[]::TEXT[],
        mood VARCHAR(50) DEFAULT 'neutral',
        relationship_level VARCHAR(50) DEFAULT 'new'
      );
    `;

    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id BIGINT REFERENCES users(id),
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sentiment VARCHAR(50) DEFAULT 'neutral',
        topics TEXT[] DEFAULT ARRAY[]::TEXT[],
        context JSONB DEFAULT '{}',
        importance INTEGER DEFAULT 5,
        session_id VARCHAR(255)
      );
    `;

    const createMemoriesTable = `
      CREATE TABLE IF NOT EXISTS memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id BIGINT REFERENCES users(id),
        content TEXT NOT NULL,
        memory_type VARCHAR(50) DEFAULT 'conversation',
        importance INTEGER DEFAULT 5,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 0
      );
    `;

    const createInsightsTable = `
      CREATE TABLE IF NOT EXISTS insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        insight_type VARCHAR(50) DEFAULT 'autonomous',
        confidence FLOAT DEFAULT 0.5,
        topics TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id BIGINT REFERENCES users(id)
      );
    `;

    const createSystemStatsTable = `
      CREATE TABLE IF NOT EXISTS system_stats (
        id SERIAL PRIMARY KEY,
        total_users INTEGER DEFAULT 0,
        total_conversations INTEGER DEFAULT 0,
        total_memories INTEGER DEFAULT 0,
        uptime_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      );
    `;

    // Create indexes for better performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
      CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
    `;

    await this.pool.query(createUsersTable);
    await this.pool.query(createConversationsTable);
    await this.pool.query(createMemoriesTable);
    await this.pool.query(createInsightsTable);
    await this.pool.query(createSystemStatsTable);
    await this.pool.query(createIndexes);

    // Initialize system stats if not exists
    const statsCheck = await this.pool.query('SELECT COUNT(*) FROM system_stats');
    if (parseInt(statsCheck.rows[0].count) === 0) {
      await this.pool.query(`
        INSERT INTO system_stats (total_users, total_conversations, total_memories, metadata)
        VALUES (0, 0, 0, '{"version": "2.0", "features": ["memory", "reasoning", "autonomous"]}')
      `);
    }
  }

  // User management
  async createOrUpdateUser(userData) {
    const { id, first_name, username } = userData;
    
    const query = `
      INSERT INTO users (id, first_name, username, last_active)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        username = EXCLUDED.username,
        last_active = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, [id, first_name, username]);
    return result.rows[0];
  }

  async getUser(userId) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async updateUserPersonality(userId, personality) {
    const query = `
      UPDATE users 
      SET personality = $2, last_active = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, [userId, JSON.stringify(personality)]);
    return result.rows[0];
  }

  async updateUserTopics(userId, topics) {
    const query = `
      UPDATE users 
      SET topics = $2, last_active = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, [userId, topics]);
    return result.rows[0];
  }

  // Conversation management
  async saveConversation(conversationData) {
    const { user_id, message, response, sentiment, topics, context, importance, session_id } = conversationData;
    
    const query = `
      INSERT INTO conversations (user_id, message, response, sentiment, topics, context, importance, session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, [
      user_id, message, response, sentiment, topics, JSON.stringify(context), importance, session_id
    ]);

    // Update user conversation count
    await this.pool.query(
      'UPDATE users SET total_conversations = total_conversations + 1 WHERE id = $1',
      [user_id]
    );

    // Update system stats
    await this.pool.query(
      'UPDATE system_stats SET total_conversations = total_conversations + 1, last_updated = CURRENT_TIMESTAMP'
    );

    return result.rows[0];
  }

  async getRecentConversations(userId, limit = 10) {
    const query = `
      SELECT * FROM conversations 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2;
    `;
    
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  async searchConversations(userId, searchTerm, limit = 5) {
    const query = `
      SELECT * FROM conversations 
      WHERE user_id = $1 
      AND (message ILIKE $2 OR response ILIKE $2)
      ORDER BY timestamp DESC 
      LIMIT $3;
    `;
    
    const result = await this.pool.query(query, [userId, `%${searchTerm}%`, limit]);
    return result.rows;
  }

  // Memory management
  async saveMemory(memoryData) {
    const { user_id, content, memory_type, importance, tags, metadata } = memoryData;
    
    const query = `
      INSERT INTO memories (user_id, content, memory_type, importance, tags, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, [
      user_id, content, memory_type, importance, tags, JSON.stringify(metadata)
    ]);

    // Update system stats
    await this.pool.query(
      'UPDATE system_stats SET total_memories = total_memories + 1, last_updated = CURRENT_TIMESTAMP'
    );

    return result.rows[0];
  }

  async getMemories(userId, limit = 20) {
    const query = `
      SELECT * FROM memories 
      WHERE user_id = $1 
      ORDER BY importance DESC, created_at DESC 
      LIMIT $2;
    `;
    
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  async searchMemories(userId, searchTerm, limit = 10) {
    const query = `
      SELECT * FROM memories 
      WHERE user_id = $1 
      AND (content ILIKE $2 OR $3 = ANY(tags))
      ORDER BY importance DESC, last_accessed DESC 
      LIMIT $4;
    `;
    
    const result = await this.pool.query(query, [userId, `%${searchTerm}%`, searchTerm, limit]);
    
    // Update access count and last accessed
    if (result.rows.length > 0) {
      const memoryIds = result.rows.map(row => row.id);
      await this.pool.query(
        'UPDATE memories SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ANY($1)',
        [memoryIds]
      );
    }
    
    return result.rows;
  }

  // Insights management
  async saveInsight(insightData) {
    const { content, insight_type, confidence, topics, metadata, user_id } = insightData;
    
    const query = `
      INSERT INTO insights (content, insight_type, confidence, topics, metadata, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, [
      content, insight_type, confidence, topics, JSON.stringify(metadata), user_id
    ]);

    return result.rows[0];
  }

  async getRecentInsights(limit = 10, userId = null) {
    let query = `
      SELECT * FROM insights 
      ${userId ? 'WHERE user_id = $1' : ''}
      ORDER BY created_at DESC 
      LIMIT ${userId ? '$2' : '$1'};
    `;
    
    const params = userId ? [userId, limit] : [limit];
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // Analytics and stats
  async getUserStats(userId) {
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const conversationQuery = 'SELECT COUNT(*) as count FROM conversations WHERE user_id = $1';
    const memoryQuery = 'SELECT COUNT(*) as count FROM memories WHERE user_id = $1';
    const topTopicsQuery = `
      SELECT unnest(topics) as topic, COUNT(*) as frequency 
      FROM conversations 
      WHERE user_id = $1 
      GROUP BY topic 
      ORDER BY frequency DESC 
      LIMIT 5;
    `;

    const [user, conversations, memories, topics] = await Promise.all([
      this.pool.query(userQuery, [userId]),
      this.pool.query(conversationQuery, [userId]),
      this.pool.query(memoryQuery, [userId]),
      this.pool.query(topTopicsQuery, [userId])
    ]);

    return {
      user: user.rows[0],
      totalConversations: parseInt(conversations.rows[0].count),
      totalMemories: parseInt(memories.rows[0].count),
      topTopics: topics.rows.map(row => ({ topic: row.topic, frequency: parseInt(row.frequency) }))
    };
  }

  async getSystemStats() {
    const query = 'SELECT * FROM system_stats ORDER BY id DESC LIMIT 1';
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async updateSystemStats(updates) {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    
    const query = `
      UPDATE system_stats 
      SET ${setClause}, last_updated = CURRENT_TIMESTAMP 
      WHERE id = (SELECT id FROM system_stats ORDER BY id DESC LIMIT 1)
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Cleanup and maintenance
  async cleanupOldData(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Clean up old conversations (keep important ones)
    const conversationCleanup = `
      DELETE FROM conversations 
      WHERE timestamp < $1 
      AND importance < 7;
    `;

    // Clean up old memories (keep important ones)
    const memoryCleanup = `
      DELETE FROM memories 
      WHERE created_at < $1 
      AND importance < 6 
      AND access_count < 3;
    `;

    const [conversationResult, memoryResult] = await Promise.all([
      this.pool.query(conversationCleanup, [cutoffDate]),
      this.pool.query(memoryCleanup, [cutoffDate])
    ]);

    return {
      conversationsDeleted: conversationResult.rowCount,
      memoriesDeleted: memoryResult.rowCount
    };
  }

  async close() {
    await this.pool.end();
  }
}

export default DatabaseManager;