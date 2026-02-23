import Post from '../models/Post.model.js';
import Account from '../models/Account.model.js';
import { getPostStats, editFacebookPost } from '../services/facebook.service.js';
import { getLinkedInPostStats, editLinkedInPost } from '../services/linkedin.service.js';
import { getInstagramPostStats, editInstagramPost } from '../services/instagram.service.js';
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

    // Handle scheduled date: if it's already an ISO string, use it directly
    // Otherwise, combine date and time (for backward compatibility)
    let scheduledAt;
    if (scheduledDate.includes('T') || scheduledDate.includes('Z')) {
      // Already an ISO string from frontend
      scheduledAt = new Date(scheduledDate);
    } else {
      // Legacy format: combine date and time
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    }
    
    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduled date format'
      });
    }
    
    if (scheduledAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date must be in the future'
      });
    }

    // Handle media upload (req.files is set by Multer middleware)
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      mediaUrls = req.files.map(file => `/uploads/${file.filename}`);
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

    // Parse and validate selectedPages if provided
    let selectedPages = {};
    if (req.body.selectedPages) {
      try {
        const parsedSelectedPages = typeof req.body.selectedPages === 'string' 
          ? JSON.parse(req.body.selectedPages) 
          : req.body.selectedPages;
        
        // Validate selected pages exist in user's Account
        // Handle both array (new) and string (legacy) formats
        if (parsedSelectedPages.facebook || parsedSelectedPages.instagram) {
          const facebookAccount = await Account.findOne({
            user: userId,
            platform: 'facebook',
            isActive: true
          });

          if (facebookAccount && facebookAccount.pages && facebookAccount.pages.length > 0) {
            // Validate Facebook page selection (handle arrays)
            if (parsedSelectedPages.facebook) {
              const facebookPages = Array.isArray(parsedSelectedPages.facebook) 
                ? parsedSelectedPages.facebook 
                : [parsedSelectedPages.facebook];
              
              const validPages = [];
              for (const pageId of facebookPages) {
                const pageExists = facebookAccount.pages.some(
                  page => page.id === pageId
                );
                if (pageExists) {
                  validPages.push(pageId);
                } else {
                  return res.status(400).json({
                    success: false,
                    message: `Selected Facebook page (${pageId}) not found in your connected pages`
                  });
                }
              }
              selectedPages.facebook = validPages.length > 0 ? validPages : undefined;
            }

            // Validate Instagram account selection (handle arrays)
            if (parsedSelectedPages.instagram) {
              const instagramAccounts = Array.isArray(parsedSelectedPages.instagram) 
                ? parsedSelectedPages.instagram 
                : [parsedSelectedPages.instagram];
              
              const validAccounts = [];
              for (const accountId of instagramAccounts) {
                const instagramExists = facebookAccount.pages.some(
                  page => page.instagramAccount && page.instagramAccount.id === accountId
                );
                if (instagramExists) {
                  validAccounts.push(accountId);
                } else {
                  return res.status(400).json({
                    success: false,
                    message: `Selected Instagram account (${accountId}) not found in your connected accounts`
                  });
                }
              }
              selectedPages.instagram = validAccounts.length > 0 ? validAccounts : undefined;
            }
          } else if (parsedSelectedPages.facebook || parsedSelectedPages.instagram) {
            return res.status(400).json({
              success: false,
              message: 'No Facebook pages found. Please reconnect your Facebook account.'
            });
          }
        }
        
        // Validate LinkedIn page selection (handle arrays)
        if (parsedSelectedPages.linkedin) {
          // Check if linkedin is actually selected (not empty array)
          const hasLinkedInSelection = Array.isArray(parsedSelectedPages.linkedin) 
            ? parsedSelectedPages.linkedin.length > 0
            : parsedSelectedPages.linkedin;
          
          if (hasLinkedInSelection) {
            const linkedInAccount = await Account.findOne({
              user: userId,
              platform: 'linkedin-company',
              isActive: true
            });
            
            const linkedInPages = Array.isArray(parsedSelectedPages.linkedin) 
              ? parsedSelectedPages.linkedin 
              : [parsedSelectedPages.linkedin];
            
            if (linkedInAccount && linkedInAccount.pages && linkedInAccount.pages.length > 0) {
              const validPages = [];
              for (const pageId of linkedInPages) {
                // 'personal' is a special value for personal profile
                if (pageId === 'personal') {
                  validPages.push(pageId);
                } else {
                  const pageExists = linkedInAccount.pages.some(
                    page => page.id === pageId
                  );
                  if (pageExists) {
                    validPages.push(pageId);
                  } else {
                    return res.status(400).json({
                      success: false,
                      message: `Selected LinkedIn page (${pageId}) not found in your connected pages`
                    });
                  }
                }
              }
              selectedPages.linkedin = validPages.length > 0 ? validPages : undefined;
            } else {
              // Check if any non-personal pages were selected
              const hasNonPersonalSelection = linkedInPages.some(pageId => pageId !== 'personal');
              
              if (hasNonPersonalSelection) {
                return res.status(400).json({
                  success: false,
                  message: 'No LinkedIn company pages found. Please connect your LinkedIn company account or select personal profile.'
                });
              }
              // If only personal profile selected, that's fine
              selectedPages.linkedin = linkedInPages.filter(pageId => pageId === 'personal');
            }
          }
        }
      } catch (e) {
        console.error('Error parsing selectedPages:', e);
        // Continue without selectedPages if parsing fails
      }
    }

    // Create post with mapped field names
    const post = await Post.create({
      user: userId, // Map userId to user (existing model field)
      caption: content, // Map content to caption (existing model field)
      media: mediaUrls, // Array of media URLs
      platforms: platformsArray,
      selectedPages: Object.keys(selectedPages).length > 0 ? selectedPages : undefined,
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

    // Handle scheduled date: if it's already an ISO string, use it directly
    // Otherwise, combine date and time (for backward compatibility)
    let scheduledDateTime;
    if (scheduledDate.includes('T') || scheduledDate.includes('Z')) {
      // Already an ISO string from frontend
      scheduledDateTime = new Date(scheduledDate);
    } else {
      // Legacy format: combine date and time
      scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime || '00:00'}`);
    }
    
    if (isNaN(scheduledDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduled date format'
      });
    }
    
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date must be in the future'
      });
    }

    // Handle media upload - robust file check
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      mediaUrls = req.files.map(file => `/uploads/${file.filename}`);
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

    // Parse and validate selectedPages if provided
    let selectedPages = {};
    if (req.body.selectedPages) {
      try {
        const parsedSelectedPages = typeof req.body.selectedPages === 'string' 
          ? JSON.parse(req.body.selectedPages) 
          : req.body.selectedPages;
        
        // Validate selected pages exist in user's Account
        // Handle both array (new) and string (legacy) formats
        if (parsedSelectedPages.facebook || parsedSelectedPages.instagram) {
          const facebookAccount = await Account.findOne({
            user: userId,
            platform: 'facebook',
            isActive: true
          });

          if (facebookAccount && facebookAccount.pages && facebookAccount.pages.length > 0) {
            // Validate Facebook page selection (handle arrays)
            if (parsedSelectedPages.facebook) {
              const facebookPages = Array.isArray(parsedSelectedPages.facebook) 
                ? parsedSelectedPages.facebook 
                : [parsedSelectedPages.facebook];
              
              const validPages = [];
              for (const pageId of facebookPages) {
                const pageExists = facebookAccount.pages.some(
                  page => page.id === pageId
                );
                if (pageExists) {
                  validPages.push(pageId);
                } else {
                  return res.status(400).json({
                    success: false,
                    message: `Selected Facebook page (${pageId}) not found in your connected pages`
                  });
                }
              }
              selectedPages.facebook = validPages.length > 0 ? validPages : undefined;
            }

            // Validate Instagram account selection (handle arrays)
            if (parsedSelectedPages.instagram) {
              const instagramAccounts = Array.isArray(parsedSelectedPages.instagram) 
                ? parsedSelectedPages.instagram 
                : [parsedSelectedPages.instagram];
              
              const validAccounts = [];
              for (const accountId of instagramAccounts) {
                const instagramExists = facebookAccount.pages.some(
                  page => page.instagramAccount && page.instagramAccount.id === accountId
                );
                if (instagramExists) {
                  validAccounts.push(accountId);
                } else {
                  return res.status(400).json({
                    success: false,
                    message: `Selected Instagram account (${accountId}) not found in your connected accounts`
                  });
                }
              }
              selectedPages.instagram = validAccounts.length > 0 ? validAccounts : undefined;
            }
          } else if (parsedSelectedPages.facebook || parsedSelectedPages.instagram) {
            return res.status(400).json({
              success: false,
              message: 'No Facebook pages found. Please reconnect your Facebook account.'
            });
          }
        }
        
        // Validate LinkedIn page selection (handle arrays)
        if (parsedSelectedPages.linkedin) {
          // Check if linkedin is actually selected (not empty array)
          const hasLinkedInSelection = Array.isArray(parsedSelectedPages.linkedin) 
            ? parsedSelectedPages.linkedin.length > 0
            : parsedSelectedPages.linkedin;
          
          if (hasLinkedInSelection) {
            const linkedInAccount = await Account.findOne({
              user: userId,
              platform: 'linkedin-company',
              isActive: true
            });
            
            const linkedInPages = Array.isArray(parsedSelectedPages.linkedin) 
              ? parsedSelectedPages.linkedin 
              : [parsedSelectedPages.linkedin];
            
            if (linkedInAccount && linkedInAccount.pages && linkedInAccount.pages.length > 0) {
              const validPages = [];
              for (const pageId of linkedInPages) {
                // 'personal' is a special value for personal profile
                if (pageId === 'personal') {
                  validPages.push(pageId);
                } else {
                  const pageExists = linkedInAccount.pages.some(
                    page => page.id === pageId
                  );
                  if (pageExists) {
                    validPages.push(pageId);
                  } else {
                    return res.status(400).json({
                      success: false,
                      message: `Selected LinkedIn page (${pageId}) not found in your connected pages`
                    });
                  }
                }
              }
              selectedPages.linkedin = validPages.length > 0 ? validPages : undefined;
            } else {
              // Check if any non-personal pages were selected
              const hasNonPersonalSelection = linkedInPages.some(pageId => pageId !== 'personal');
              
              if (hasNonPersonalSelection) {
                return res.status(400).json({
                  success: false,
                  message: 'No LinkedIn company pages found. Please connect your LinkedIn company account or select personal profile.'
                });
              }
              // If only personal profile selected, that's fine
              selectedPages.linkedin = linkedInPages.filter(pageId => pageId === 'personal');
            }
          }
        }
      } catch (e) {
        console.error('Error parsing selectedPages:', e);
        // Continue without selectedPages if parsing fails
      }
    }

    const post = await Post.create({
      user: userId,
      caption,
      media: mediaUrls, // Array of media URLs, can be empty for text-only posts
      platforms: platformsArray,
      selectedPages: Object.keys(selectedPages).length > 0 ? selectedPages : undefined,
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

    // Track if this is a published post being edited
    const isPublishedPost = post.status === 'published';
    const editResults = {
      success: [],
      failed: []
    };

    // If post is published, try to edit on platforms
    if (isPublishedPost && caption && post.publishedPlatforms && post.publishedPlatforms.length > 0) {
      console.log(`[Update Post] Editing published post ${post._id} on platforms...`);
      
      for (const platformEntry of post.publishedPlatforms) {
        // Only try to edit posts that were successfully published
        if (platformEntry.status === 'success' && platformEntry.platformPostId) {
          try {
            let editResult;
            
            switch (platformEntry.platform) {
              case 'facebook':
                // Get Facebook account and page access token
                const facebookAccount = await Account.findOne({
                  user: userId,
                  platform: 'facebook',
                  isActive: true
                });
                
                if (!facebookAccount) {
                  throw new Error('Facebook account not found');
                }
                
                // Get page access token
                const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
                  params: {
                    access_token: facebookAccount.accessToken,
                    fields: 'id,access_token'
                  }
                });
                
                const pageId = platformEntry.pageId || (pagesResponse.data.data?.[0]?.id);
                const selectedPage = pagesResponse.data.data?.find(p => p.id === pageId) || pagesResponse.data.data?.[0];
                
                if (!selectedPage || !selectedPage.access_token) {
                  throw new Error('Page access token not found');
                }
                
                editResult = await editFacebookPost(
                  platformEntry.platformPostId,
                  selectedPage.access_token,
                  caption
                );
                editResults.success.push({
                  platform: 'facebook',
                  message: editResult.message || 'Post updated successfully'
                });
                break;
                
              case 'instagram':
                // Instagram doesn't support editing
                editResult = await editInstagramPost(
                  platformEntry.platformPostId,
                  '', // accessToken not needed since it will throw
                  caption
                );
                break;
                
              case 'linkedin':
                // LinkedIn doesn't support editing
                editResult = await editLinkedInPost(
                  platformEntry.platformPostId,
                  '', // accessToken not needed since it will throw
                  caption
                );
                break;
                
              default:
                throw new Error(`Unknown platform: ${platformEntry.platform}`);
            }
          } catch (error) {
            // Log the error but continue with other platforms
            const errorMessage = error.message || 'Failed to edit post';
            editResults.failed.push({
              platform: platformEntry.platform,
              error: errorMessage
            });
            console.error(`[Update Post] Failed to edit ${platformEntry.platform} post:`, errorMessage);
          }
        }
      }
      
      // If all platforms failed, return error
      if (editResults.success.length === 0 && editResults.failed.length > 0) {
        const allErrors = editResults.failed.map(f => `${f.platform}: ${f.error}`).join('; ');
        return res.status(400).json({
          success: false,
          message: `Failed to edit post on all platforms: ${allErrors}`,
          editResults
        });
      }
      
      // If some platforms succeeded and some failed, return partial success
      if (editResults.failed.length > 0) {
        console.warn(`[Update Post] Partial success: ${editResults.success.length} succeeded, ${editResults.failed.length} failed`);
      }
    }

    // Update fields in database
    if (caption) post.caption = caption;
    if (platforms) post.platforms = Array.isArray(platforms) ? platforms : [platforms];
    if (scheduledDate && scheduledTime) {
      post.scheduledDate = new Date(`${scheduledDate}T${scheduledTime}`);
    }

    // Handle selectedPages update
    if (req.body.selectedPages) {
      try {
        const parsedSelectedPages = typeof req.body.selectedPages === 'string' 
          ? JSON.parse(req.body.selectedPages) 
          : req.body.selectedPages;
        
        // Validate selected pages exist in user's Account
        if (parsedSelectedPages.facebook || parsedSelectedPages.instagram) {
          const facebookAccount = await Account.findOne({
            user: userId,
            platform: 'facebook',
            isActive: true
          });

          if (facebookAccount && facebookAccount.pages && facebookAccount.pages.length > 0) {
            const newSelectedPages = {};
            
            // Validate Facebook page selection
            if (parsedSelectedPages.facebook) {
              const pageExists = facebookAccount.pages.some(
                page => page.id === parsedSelectedPages.facebook
              );
              if (!pageExists) {
                return res.status(400).json({
                  success: false,
                  message: `Selected Facebook page (${parsedSelectedPages.facebook}) not found in your connected pages`
                });
              }
              newSelectedPages.facebook = parsedSelectedPages.facebook;
            }

            // Validate Instagram account selection
            if (parsedSelectedPages.instagram) {
              const instagramExists = facebookAccount.pages.some(
                page => page.instagramAccount && page.instagramAccount.id === parsedSelectedPages.instagram
              );
              if (!instagramExists) {
                return res.status(400).json({
                  success: false,
                  message: `Selected Instagram account (${parsedSelectedPages.instagram}) not found in your connected accounts`
                });
              }
              newSelectedPages.instagram = parsedSelectedPages.instagram;
            }

            post.selectedPages = Object.keys(newSelectedPages).length > 0 ? newSelectedPages : undefined;
          } else if (parsedSelectedPages.facebook || parsedSelectedPages.instagram) {
            return res.status(400).json({
              success: false,
              message: 'No Facebook pages found. Please reconnect your Facebook account.'
            });
          }
        }
      } catch (e) {
        console.error('Error parsing selectedPages:', e);
        // Continue without updating selectedPages if parsing fails
      }
    }

    // Handle media upload
    if (req.files && req.files.length > 0) {
      post.media = req.files.map(file => `/uploads/${file.filename}`);
    }

    await post.save();

    // Build response message
    let message = 'Post updated successfully';
    if (isPublishedPost) {
      if (editResults.success.length > 0 && editResults.failed.length === 0) {
        message = `Post updated successfully on all platforms: ${editResults.success.map(s => s.platform).join(', ')}`;
      } else if (editResults.success.length > 0 && editResults.failed.length > 0) {
        const successPlatforms = editResults.success.map(s => s.platform).join(', ');
        const failedPlatforms = editResults.failed.map(f => `${f.platform} (${f.error})`).join('; ');
        message = `Post updated on: ${successPlatforms}. Failed on: ${failedPlatforms}`;
      }
    }

    res.json({
      success: true,
      message: message,
      post,
      editResults: isPublishedPost ? editResults : undefined
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
    const { platform } = req.query; // Optional: specify which platform to refresh

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

    // Get all successfully published platforms
    const successfulPlatforms = post.publishedPlatforms?.filter(
      p => p.status === 'success' && p.platformPostId && p.platformPostId.trim() !== ''
    ) || [];

    if (successfulPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Analytics not available for this post. This post was not published to any platform or the publishing record is missing.'
      });
    }

    // Filter by requested platform if specified
    const platformsToRefresh = platform 
      ? successfulPlatforms.filter(p => p.platform === platform)
      : successfulPlatforms;

    if (platformsToRefresh.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Analytics not available for ${platform || 'the specified platform'}. This post was not published to that platform.`
      });
    }

    // Initialize analytics object (will aggregate or use first platform's data)
    let aggregatedAnalytics = {
      likes: 0,
      comments: 0,
      reach: 0,
      shares: 0
    };

    const errors = [];
    const successes = [];

    // Process each platform
    for (const platformEntry of platformsToRefresh) {
      try {
        let analytics = null;

        if (platformEntry.platform === 'facebook') {
          // Get Facebook account
          const account = await Account.findOne({
            user: userId,
            platform: 'facebook',
            isActive: true
          });

          if (!account) {
            errors.push('Facebook: No active Facebook account found');
            continue;
          }

          // Fetch pages to get page access token
          const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
            params: {
              access_token: account.accessToken,
              fields: 'id,access_token'
            }
          });

          if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
            errors.push('Facebook: No Facebook pages found');
            continue;
          }

          // Determine pageId and postId
          let pageId;
          let postIdOnly = platformEntry.platformPostId.trim();

          if (platformEntry.pageId) {
            pageId = platformEntry.pageId;
          } else if (postIdOnly.includes('_')) {
            const parts = postIdOnly.split('_');
            if (parts.length >= 2 && parts[0] && parts[1]) {
              pageId = parts[0];
            } else {
              errors.push('Facebook: Invalid post ID format');
              continue;
            }
          } else {
            pageId = pagesResponse.data.data[0].id;
            postIdOnly = `${pageId}_${postIdOnly}`;
          }

          const selectedPage = pagesResponse.data.data.find(p => p.id === pageId) || pagesResponse.data.data[0];
          
          if (!selectedPage || !selectedPage.access_token) {
            errors.push('Facebook: Page Access Token not found');
            continue;
          }

          analytics = await getPostStats(pageId, postIdOnly, selectedPage.access_token);
          successes.push('Facebook');

        } else if (platformEntry.platform === 'linkedin') {
          // Get LinkedIn account
          const account = await Account.findOne({
            user: userId,
            platform: 'linkedin',
            isActive: true
          });

          if (!account) {
            errors.push('LinkedIn: No active LinkedIn account found');
            continue;
          }

          analytics = await getLinkedInPostStats(platformEntry.platformPostId, account.accessToken);
          successes.push('LinkedIn');

        } else if (platformEntry.platform === 'instagram') {
          // Get Facebook account (Instagram uses Facebook OAuth)
          const account = await Account.findOne({
            user: userId,
            platform: 'facebook',
            isActive: true
          });

          if (!account) {
            errors.push('Instagram: No active Facebook account found (Instagram uses Facebook OAuth)');
            continue;
          }

          // Get Instagram account ID from the post or account
          // For now, we'll need to find the Instagram account ID
          // This might need to be stored in publishedPlatforms or retrieved from account
          const instagramAccountId = platformEntry.instagramAccountId || account.pages?.[0]?.instagramAccount?.id;

          if (!instagramAccountId) {
            errors.push('Instagram: Instagram account ID not found');
            continue;
          }

          // Fetch pages to get page access token (needed for Instagram)
          const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
            params: {
              access_token: account.accessToken,
              fields: 'id,access_token'
            }
          });

          if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
            errors.push('Instagram: No Facebook pages found');
            continue;
          }

          // Use the first page's access token (or find the one connected to Instagram)
          const pageAccessToken = pagesResponse.data.data[0].access_token;

          analytics = await getInstagramPostStats(platformEntry.platformPostId, pageAccessToken);
          successes.push('Instagram');
        }

        // Aggregate analytics (for multi-platform posts, sum the metrics)
        if (analytics) {
          aggregatedAnalytics.likes += analytics.likes || 0;
          aggregatedAnalytics.comments += analytics.comments || 0;
          aggregatedAnalytics.reach += analytics.reach || 0;
          aggregatedAnalytics.shares += analytics.shares || 0;
        }

      } catch (platformError) {
        // Handle LinkedIn API limitations gracefully
        if (platformError.linkedinApiLimitation) {
          const errorMsg = `${platformEntry.platform}: ${platformError.message}`;
          errors.push(errorMsg);
          console.warn(`[Refresh Analytics] LinkedIn API limitation for ${platformEntry.platform}:`, platformError.message);
          // Don't treat LinkedIn limitations as critical - continue with other platforms
        } else {
          const errorMsg = platformError.isPermissionError 
            ? `${platformEntry.platform}: ${platformError.message}`
            : `${platformEntry.platform}: ${platformError.message || 'Failed to fetch analytics'}`;
          errors.push(errorMsg);
          console.error(`[Refresh Analytics] Error for ${platformEntry.platform}:`, platformError);
        }
      }
    }

    // Update post analytics
    post.analytics = aggregatedAnalytics;
    await post.save();

    // Return response based on results
    if (successes.length > 0 && errors.length === 0) {
      return res.json({
        success: true,
        message: `Analytics refreshed successfully for ${successes.join(', ')}`,
        post
      });
    } else if (successes.length > 0 && errors.length > 0) {
      return res.json({
        success: true,
        message: `Analytics refreshed for ${successes.join(', ')}. Some errors: ${errors.join('; ')}`,
        post,
        warnings: errors
      });
    } else {
      // All platforms failed
      const firstError = errors[0] || 'Failed to refresh analytics';
      const isPermissionError = errors.some(e => e.includes('permission') || e.includes('Permission'));
      
      return res.status(isPermissionError ? 403 : 500).json({
        success: false,
        message: firstError,
        errors: errors
      });
    }

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
      let message = error.message || 'Missing required permissions.';
      
      if (error.requiresAppReview) {
        message += ' Some permissions require App Review approval. Please check your app settings.';
      } else {
        message += ' Please disconnect and reconnect your account to grant the required permissions.';
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

