import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceInfo: {
    type: String,
    default: 'Unknown Device'
  },
  ipAddress: {
    type: String
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // For efficient cleanup of old sessions
  }
}, {
  timestamps: true
});

// Index for efficient queries
sessionSchema.index({ user: 1, createdAt: -1 });

// Auto-delete sessions older than 30 days
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Session', sessionSchema);





