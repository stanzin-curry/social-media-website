import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'linkedin'],
    required: true
  },
  platformUserId: {
    type: String,
    required: true
  },
  platformUsername: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  tokenExpiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  followers: {
    type: Number,
    default: 0
  },
  lastSync: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one account per platform per user
accountSchema.index({ user: 1, platform: 1 }, { unique: true });

export default mongoose.model('Account', accountSchema);

