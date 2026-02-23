import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Publish a post to LinkedIn
 * @param {string} accessToken - LinkedIn access token
 * @param {string} authorUrn - LinkedIn author URN (e.g., "urn:li:person:123456")
 * @param {string} text - Post text
 * @param {string|Array} mediaUrl - Optional media URL (string) or array of media URLs for multiple images
 * @returns {Promise<Object>} Published post data
 */
export const publishToLinkedIn = async (accessToken, authorUrn, text, mediaUrl = null) => {
  try {
    let postData = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text.substring(0, 3000) // LinkedIn text limit
          },
          shareMediaCategory: mediaUrl ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Add media if provided
    if (mediaUrl) {
      // Check if mediaUrl is an array (multiple images) or single string
      const mediaUrls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
      
      console.log(`[LinkedIn] Uploading ${mediaUrls.length} image(s)`);
      
      const mediaArray = [];
      
      // Process each image
      for (let i = 0; i < mediaUrls.length; i++) {
        const url = mediaUrls[i];
        
        // First, register the image
        const registerResponse = await axios.post(
          'https://api.linkedin.com/v2/assets?action=registerUpload',
          {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: authorUrn,
              serviceRelationships: [{
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }]
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
        const asset = registerResponse.data.value.asset;

        // Get image data - handle both local files and URLs
        let imageData;
        const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1') || (!url.startsWith('http'));
        
        if (isLocalhost || !url.startsWith('http')) {
          // Local file - read from disk
          let filePath;
          if (url.startsWith('http')) {
            // Extract path from localhost URL and decode URL-encoded characters
            const urlObj = new URL(url);
            const decodedPath = decodeURIComponent(urlObj.pathname);
            filePath = path.join(process.cwd(), decodedPath);
          } else {
            // It's already a file path - decode URL-encoded characters
            const cleanPath = url.replace(/^[/\\]+/, '');
            const decodedPath = decodeURIComponent(cleanPath);
            filePath = path.join(process.cwd(), decodedPath);
          }
          
          if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at: ${filePath}`);
          }
          
          imageData = fs.readFileSync(filePath);
        } else {
          // Public URL - fetch the image
          const imageResponse = await axios.get(url, {
            responseType: 'arraybuffer'
          });
          imageData = Buffer.from(imageResponse.data);
        }

        // Upload the image binary data
        await axios.put(uploadUrl, imageData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream'
          }
        });

        // Add to media array
        mediaArray.push({
          status: 'READY',
          media: asset,
          title: {
            text: `Image ${i + 1}`
          }
        });
      }

      // Add all media to post
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaArray;
    }

    // Publish the post
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return {
      success: true,
      postId: response.data.id,
      platform: 'linkedin'
    };
  } catch (error) {
    throw new Error(`LinkedIn API error: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Create a text-only post to LinkedIn
 * @param {string} accessToken - LinkedIn access token
 * @param {string} personUrn - LinkedIn person URN (e.g., "urn:li:person:123456")
 * @param {string} text - Post text content
 * @returns {Promise<Object>} Published post data
 */
export const createLinkedInPost = async (accessToken, personUrn, text) => {
  try {
    const postData = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text.substring(0, 3000) // LinkedIn text limit
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return {
      success: true,
      postId: response.data.id,
      platform: 'linkedin',
      data: response.data
    };
  } catch (error) {
    throw new Error(`LinkedIn API error: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get LinkedIn user profile using OpenID Connect
 */
export const getLinkedInProfile = async (accessToken) => {
  try {
    const response = await axios.get(
      'https://api.linkedin.com/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    // Map OIDC response to a consistent format
    const profile = response.data;
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
      // Keep original OIDC fields for compatibility
      sub: profile.sub,
      ...profile
    };
  } catch (error) {
    throw new Error(`LinkedIn API error: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Fetch all LinkedIn company pages (organizations) the user manages
 * @param {string} accessToken - LinkedIn access token
 * @returns {Promise<Array>} Array of company pages
 */
export const getLinkedInCompanyPages = async (accessToken) => {
  try {
    // Fetch organizations the user manages using organizationalEntityAcls
    const response = await axios.get('https://api.linkedin.com/v2/organizationalEntityAcls', {
      params: {
        q: 'roleAssignee',
        role: 'ADMINISTRATOR,CONTENT_ADMINISTRATOR',
        state: 'APPROVED'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    const acls = response.data.elements || [];
    const companyPages = [];

    // Fetch details for each organization
    for (const acl of acls) {
      const organizationUrn = acl.organizationalTarget;
      
      try {
        // Extract organization ID from URN (format: urn:li:organization:123456)
        const orgId = organizationUrn.split(':').pop();
        
        // Fetch organization details
        const orgResponse = await axios.get(`https://api.linkedin.com/v2/organizations/${orgId}`, {
          params: {
            projection: '(id,name,vanityName,logoV2(original~:playableStreams))'
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        });

        const org = orgResponse.data;
        companyPages.push({
          id: orgId,
          urn: organizationUrn,
          name: org.name?.localized?.en_US || org.name || 'Unknown Company',
          vanityName: org.vanityName || null
        });
      } catch (err) {
        console.error(`Error fetching organization ${organizationUrn}:`, err.response?.data || err.message);
        // Continue with other organizations
      }
    }

    return companyPages;
  } catch (error) {
    console.error('Error fetching LinkedIn company pages:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
    
    // Return empty array if no pages found or permission denied
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.log('LinkedIn: User may not have w_organization_social permission or no company pages found');
      console.log('Make sure the LinkedIn app has "Share on LinkedIn" product approved and user granted w_organization_social permission');
      return [];
    }
    throw new Error(`LinkedIn API error: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get LinkedIn post analytics/insights
 * @param {string} postUrn - LinkedIn Post URN (e.g., "urn:li:share:123456")
 * @param {string} accessToken - LinkedIn access token
 * @returns {Promise<Object>} Analytics data with likes, comments, reach, shares
 */
export const getLinkedInPostStats = async (postUrn, accessToken) => {
  // Development/Testing Mode: Return mock data if ENABLE_MOCK_ANALYTICS is set
  if (process.env.ENABLE_MOCK_ANALYTICS === 'true' || (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_ANALYTICS === 'true')) {
    console.log(`[LinkedIn] Using MOCK analytics data for post ${postUrn} (Development Mode)`);
    const baseLikes = Math.floor(Math.random() * 50) + 5;
    const baseComments = Math.floor(Math.random() * 10) + 1;
    const baseShares = Math.floor(Math.random() * 5);
    const baseReach = Math.floor(baseLikes * (2 + Math.random() * 0.5));
    
    return {
      likes: baseLikes,
      comments: baseComments,
      shares: baseShares,
      reach: baseReach
    };
  }

  try {
    // LinkedIn API for getting post engagement metrics
    // Note: LinkedIn's API for getting engagement on UGC posts has limitations:
    // 1. For personal posts: Limited API access, may require different permissions
    // 2. For company page posts: Requires organizationalEntityShareStatistics API
    // 3. The socialActions endpoint may not be available for all post types
    
    // Extract share ID from URN (format: urn:li:share:123456 or urn:li:ugcPost:123456)
    const shareId = postUrn.split(':').pop();
    const urnType = postUrn.split(':')[2]; // 'share' or 'ugcPost'
    
    let likes = 0;
    let comments = 0;
    let shares = 0;
    let reach = 0;
    
    // Try to get engagement metrics using UGC Posts API
    // This works for posts created via the UGC Posts API
    try {
      const ugcResponse = await axios.get(
        `https://api.linkedin.com/v2/ugcPosts/${postUrn}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          params: {
            fields: 'id,lifecycleState'
          }
        }
      );
      
      // If we can access the post, try to get social actions
      // Note: This may not work for all post types or may require special permissions
      try {
        // Try the socialActions endpoint (may not work for all posts)
        const socialActionsResponse = await axios.get(
          `https://api.linkedin.com/v2/socialActions/${shareId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0'
            }
          }
        );

        const socialData = socialActionsResponse.data;
        likes = socialData.likesSummary?.totalLikes || 0;
        comments = socialData.commentsSummary?.totalComments || 0;
        shares = socialData.sharesSummary?.totalShares || 0;
      } catch (socialActionsError) {
        // Social actions endpoint may not be available
        // This is expected for many LinkedIn posts - the API has limited access
        console.log(`[LinkedIn] Social actions not available for post ${postUrn}. LinkedIn API has limited access to engagement metrics for UGC posts.`);
        // Set to 0 - we'll continue without throwing an error
      }
      
      // Try to get analytics/reach for company page posts
      try {
        // Check if this is a company page post by checking the URN structure
        if (postUrn.includes('organization')) {
          const orgUrn = postUrn.split(':').slice(0, 3).join(':'); // Extract org URN
          const analyticsResponse = await axios.get(
            `https://api.linkedin.com/v2/organizationalEntityShareStatistics`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
              },
              params: {
                q: 'organizationalEntity',
                organizationalEntity: orgUrn,
                shares: postUrn
              }
            }
          );
          
          if (analyticsResponse.data?.elements && analyticsResponse.data.elements.length > 0) {
            const stats = analyticsResponse.data.elements[0];
            reach = stats.impressionCount || stats.uniqueImpressions || 0;
          }
        }
      } catch (analyticsError) {
        // Analytics might not be available for personal posts or without proper permissions
        console.log(`[LinkedIn] Analytics not available for post ${postUrn}:`, analyticsError.response?.data?.message || analyticsError.message);
        reach = 0;
      }
      
    } catch (ugcError) {
      // If we can't access the UGC post, LinkedIn API has very limited access to engagement metrics
      // This is a known limitation - LinkedIn doesn't provide public APIs for all engagement data
      console.log(`[LinkedIn] Limited API access for post ${postUrn}. LinkedIn's API has restrictions on accessing engagement metrics for UGC posts.`);
      
      // For now, we'll return zeros with a note that LinkedIn API has limitations
      // In the future, you might need to use LinkedIn's Analytics API which requires
      // special partnerships or use web scraping (not recommended)
    }
    
    return {
      likes,
      comments,
      shares,
      reach
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    const errorCode = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`[LinkedIn] Analytics error for post ${postUrn}:`, {
      message: errorMessage,
      code: errorCode,
      fullError: errorData
    });
    
    // Check if it's a permissions error
    if (errorCode === 403 || errorCode === 401) {
      // LinkedIn's API has very limited access to engagement metrics
      // The socialActions endpoint may not be available for all post types
      // or may require special partnerships with LinkedIn
      const permissionError = new Error('LinkedIn API has limited access to engagement metrics. The socialActions endpoint requires special permissions that may not be available for all LinkedIn apps. For testing, use ENABLE_MOCK_ANALYTICS=true in your .env file.');
      permissionError.isPermissionError = true;
      permissionError.linkedinApiLimitation = true;
      throw permissionError;
    }
    
    // For other errors, still throw but with context
    throw new Error(`LinkedIn analytics error: ${errorMessage}. Note: LinkedIn's API has restrictions on accessing engagement metrics for UGC posts.`);
  }
};

/**
 * Edit an existing LinkedIn post
 * NOTE: LinkedIn does NOT support editing published posts via their API
 * This function exists for consistency but will always throw an error
 * To "edit" a LinkedIn post, you must delete it and create a new one
 * @param {string} postUrn - LinkedIn Post URN (e.g., "urn:li:share:123456" or "urn:li:ugcPost:123456")
 * @param {string} accessToken - LinkedIn access token
 * @param {string} newText - New text content (not used, LinkedIn doesn't support editing)
 * @throws {Error} Always throws an error since LinkedIn doesn't support editing
 */
export const editLinkedInPost = async (postUrn, accessToken, newText) => {
  // LinkedIn UGC Posts API does not provide an endpoint to edit published posts
  // Once a post is published, it cannot be modified
  // The only way to "edit" is to delete the post and create a new one (which loses engagement)
  throw new Error('LinkedIn does not support editing published posts. Once a post is published, it cannot be modified. To change the content, you must delete the post and create a new one (note: this will lose all engagement metrics).');
};

