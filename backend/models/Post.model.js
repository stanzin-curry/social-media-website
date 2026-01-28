import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    required: true,
    maxlength: 2200
  },
  media: {
    type: String, // URL to uploaded image/video
    default: null
  },
  platforms: [{
    type: String,
    enum: ['instagram', 'facebook', 'linkedin'],
    required: true
  }],
  selectedPages: {
    facebook: String,    // Selected Facebook Page ID
    instagram: String    // Selected Instagram Account ID
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'scheduled'
  },
  publishedAt: {
    type: Date
  },
  publishedPlatforms: [{
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'linkedin']
    },
    platformPostId: String,
    pageId: String, // Facebook Page ID (for Facebook posts)
    publishedAt: Date,
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    },
    error: String
  }],
  analytics: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for efficient querying of scheduled posts
postSchema.index({ status: 1, scheduledDate: 1 });
postSchema.index({ user: 1, status: 1 });

export default mongoose.model('Post', postSchema);

