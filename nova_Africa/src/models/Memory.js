import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  context: {
    type: [String],
    default: []
  },
  mode: {
    type: String,
    enum: ['general', 'code', 'research', 'reasoning'],
    default: 'general'
  },
  messageCount: {
    type: Number,
    default: 0
  },
  username: String,
  firstName: String,
  facts: {
    type: [String],
    default: []
  },
  insights: {
    type: [String],
    default: []
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  preferences: {
    type: Map,
    of: String,
    default: new Map()
  }
}, { 
  timestamps: true 
});

// Index for faster queries
memorySchema.index({ userId: 1 });
memorySchema.index({ lastInteraction: -1 });

export default mongoose.model('Memory', memorySchema); 