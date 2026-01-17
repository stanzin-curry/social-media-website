import Post from '../models/Post.model.js';
import Account from '../models/Account.model.js';
import { getPostStats } from '../services/facebook.service.js';
import axios from 'axios';
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

    // Handle media upload - robust file check
    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    // Parse platforms if it's a JSON string (from FormData)
    let platformsArray;
    try {
      platformsArray = typeof platforms === 'string' ? JSON.parse(platforms) : platforms;
    } catch (e) {
      // If parsing fails, treat as single platform string
      platformsArray = [platforms];
    }
    
    // Ensure platforms is an array
    if (!Array.isArray(platformsArray)) {
      platformsArray = [platformsArray];
    }

    const post = await Post.create({
      user: userId,
      caption,
      media: mediaUrl, // Can be null for text-only posts
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

export const refreshPostAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    // Find the post
    const post = await Post.findOne({
      _id: postId,
      user: userId
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is published
    if (post.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Can only refresh analytics for published posts'
      });
    }

    // Find Facebook platform entry
    const facebookPlatform = post.publishedPlatforms?.find(
      p => p.platform === 'facebook' && p.status === 'success'
    );

    // Check if Facebook platform entry exists
    if (!facebookPlatform) {
      return res.status(400).json({
        success: false,
        message: 'Analytics not available for this post. This post was not published to Facebook or the publishing record is missing.'
      });
    }

    // Validate that platformPostId exists and is not empty
    if (!facebookPlatform.platformPostId || facebookPlatform.platformPostId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Analytics not available for this post (Facebook Post ID missing). This may be an older post created before ID tracking was implemented.'
      });
    }

    // Get Facebook account to retrieve access token
    const account = await Account.findOne({
      user: userId,
      platform: 'facebook',
      isActive: true
    });

    if (!account) {
      return res.status(400).json({
        success: false,
        message: 'No active Facebook account found'
      });
    }

    // Fetch pages to get page access token first
    const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: account.accessToken,
        fields: 'id,access_token'
      }
    });

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No Facebook pages found'
      });
    }

    // Determine pageId and postId
    // Facebook post IDs are typically in format: {pageId}_{postId}
    let pageId;
    let postIdOnly = facebookPlatform.platformPostId.trim(); // Ensure no whitespace

    // Validate postId format
    if (!postIdOnly || postIdOnly.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Analytics not available for this post (Invalid Facebook Post ID).'
      });
    }

    try {
      if (facebookPlatform.pageId) {
        // Use stored pageId if available
        pageId = facebookPlatform.pageId;
      } else if (postIdOnly.includes('_')) {
        // Extract pageId from postId format
        const parts = postIdOnly.split('_');
        if (parts.length >= 2 && parts[0] && parts[1]) {
          pageId = parts[0];
          postIdOnly = postIdOnly; // Already in correct format
        } else {
          return res.status(400).json({
            success: false,
            message: 'Analytics not available for this post (Invalid Facebook Post ID format).'
          });
        }
      } else {
        // If no pageId and postId doesn't have underscore, use first available page
        // This shouldn't normally happen, but handle gracefully
        if (pagesResponse.data.data.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Analytics not available for this post (No Facebook pages found).'
          });
        }
        pageId = pagesResponse.data.data[0].id;
        postIdOnly = `${pageId}_${postIdOnly}`;
      }
    } catch (error) {
      console.error('[Refresh Analytics] Error parsing post ID:', error);
      return res.status(400).json({
        success: false,
        message: 'Analytics not available for this post (Error processing Facebook Post ID).'
      });
    }

    // Find the page (we already validated pagesResponse.data.data exists above)
    const selectedPage = pagesResponse.data.data.find(p => p.id === pageId) || pagesResponse.data.data[0];
    
    if (!selectedPage || !selectedPage.access_token) {
      return res.status(400).json({
        success: false,
        message: 'Page Access Token not found. Please reconnect your Facebook Page.'
      });
    }

    const pageAccessToken = selectedPage.access_token;

    // Fetch analytics from Facebook
    const analytics = await getPostStats(pageId, postIdOnly, pageAccessToken);

    // Update post analytics
    post.analytics = {
      likes: analytics.likes,
      comments: analytics.comments,
      reach: analytics.reach,
      shares: analytics.shares
    };

    await post.save();

    res.json({
      success: true,
      message: 'Analytics refreshed successfully',
      post
    });
  } catch (error) {
    console.error('[Refresh Analytics] Error:', {
      postId: req.params.id,
      userId: req.user._id,
      error: error.message,
      isPermissionError: error.isPermissionError,
      stack: error.stack
    });
    
    // Handle permission errors specifically
    if (error.isPermissionError) {
      let message = error.message || 'Missing required Facebook permissions.';
      
      if (error.requiresAppReview) {
        message += ' The read_insights permission requires Facebook App Review approval. Please check your Facebook App Dashboard > App Review to ensure the permission is approved.';
      } else {
        message += ' Please disconnect and reconnect your Facebook account to grant the required permissions.';
      }
      
      return res.status(403).json({
        success: false,
        message: message
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh analytics'
    });
  }
};

