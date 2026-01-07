import Post from '../models/Post.model.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create post handler for /create endpoint (accepts content, mediaUrl, scheduledAt, etc.)
export const createPostFromCreateEndpoint = async (req, res) => {
  try {
    const { content, platforms, scheduledDate, scheduledTime } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!content || !platforms || !scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide content, platforms, scheduledDate, and scheduledTime'
      });
    }

    // Combine date and time
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (scheduledAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date must be in the future'
      });
    }

    // Handle media upload (req.file is set by Multer middleware)
    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    // Parse platforms if it's a JSON string
    let platformsArray;
    try {
      platformsArray = typeof platforms === 'string' ? JSON.parse(platforms) : platforms;
    } catch (e) {
      platformsArray = Array.isArray(platforms) ? platforms : [platforms];
    }

    // Ensure platforms is an array
    if (!Array.isArray(platformsArray)) {
      platformsArray = [platformsArray];
    }

    // Create post with mapped field names
    const post = await Post.create({
      user: userId, // Map userId to user (existing model field)
      caption: content, // Map content to caption (existing model field)
      media: mediaUrl, // Map mediaUrl to media (existing model field)
      platforms: platformsArray,
      scheduledDate: scheduledAt, // Map scheduledAt to scheduledDate (existing model field)
      status: 'scheduled' // Default status is SCHEDULED (lowercase for existing model)
    });

    res.status(201).json({
      success: true,
      message: 'Post scheduled successfully',
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    });
  }
};

export const createPost = async (req, res) => {
  try {
    const { caption, platforms, scheduledDate, scheduledTime } = req.body;
    const userId = req.user._id;

    if (!caption || !platforms || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide caption, platforms, and scheduled date'
      });
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime || '00:00'}`);
    
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date must be in the future'
      });
    }

    // Handle media upload
    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    const platformsArray = Array.isArray(platforms) ? platforms : [platforms];

    const post = await Post.create({
      user: userId,
      caption,
      media: mediaUrl,
      platforms: platformsArray,
      scheduledDate: scheduledDateTime,
      status: 'scheduled'
    });

    res.status(201).json({
      success: true,
      message: 'Post scheduled successfully',
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    });
  }
};

export const getPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    // Sort by scheduledAt descending (newest/upcoming first)
    const posts = await Post.find(query)
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch posts'
    });
  }
};

export const getScheduledPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({
      user: userId,
      status: 'scheduled'
    }).sort({ scheduledDate: 1 });

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch scheduled posts'
    });
  }
};

export const getPublishedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({
      user: userId,
      status: 'published'
    }).sort({ publishedAt: -1 });

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch published posts'
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const userId = req.user._id;
    const post = await Post.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch post'
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { caption, platforms, scheduledDate, scheduledTime } = req.body;

    const post = await Post.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update published post'
      });
    }

    // Update fields
    if (caption) post.caption = caption;
    if (platforms) post.platforms = Array.isArray(platforms) ? platforms : [platforms];
    if (scheduledDate && scheduledTime) {
      post.scheduledDate = new Date(`${scheduledDate}T${scheduledTime}`);
    }

    // Handle media upload
    if (req.file) {
      post.media = `/uploads/${req.file.filename}`;
    }

    await post.save();

    res.json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update post'
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: userId
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete post'
    });
  }
};

