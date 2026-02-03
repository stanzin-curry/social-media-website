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
    type: [String], // Array of URLs to uploaded images
    default: []
  },
  platforms: [{
    type: String,
    enum: ['instagram', 'facebook', 'linkedin'],
    required: true
  }],
  selectedPages: {
    facebook: [String],    // Array of selected Facebook Page IDs
    instagram: [String],   // Array of selected Instagram Account IDs
    linkedin: [String]     // Array of selected LinkedIn Company Page IDs
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

