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
    // LinkedIn uses Social Actions API to get engagement metrics
    // Extract share ID from URN (format: urn:li:share:123456)
    const shareId = postUrn.split(':').pop();
    
    // Get social actions (likes, comments, shares)
    const socialActionsResponse = await axios.get(
      `https://api.linkedin.com/v2/socialActions/${shareId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        params: {
          fields: 'likesSummary,commentsSummary,sharesSummary'
        }
      }
    );

    const socialData = socialActionsResponse.data;
    
    // Extract metrics
    const likes = socialData.likesSummary?.totalLikes || 0;
    const comments = socialData.commentsSummary?.totalComments || 0;
    const shares = socialData.sharesSummary?.totalShares || 0;
    
    // Get impressions/reach - LinkedIn Analytics API
    // Note: This requires the post to be from a Company Page and may require additional permissions
    let reach = 0;
    try {
      // Try to get analytics for the post
      // LinkedIn analytics are available through the Organizational Entity Shares Analytics API
      // This requires the post to be from a company page
      const analyticsResponse = await axios.get(
        `https://api.linkedin.com/v2/organizationalEntityShareStatistics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          params: {
            q: 'organizationalEntity',
            organizationalEntity: postUrn.split(':').slice(0, 3).join(':'), // Extract entity URN
            shares: postUrn
          }
        }
      );
      
      if (analyticsResponse.data?.elements && analyticsResponse.data.elements.length > 0) {
        const stats = analyticsResponse.data.elements[0];
        reach = stats.impressionCount || stats.uniqueImpressions || 0;
      }
    } catch (analyticsError) {
      // Analytics might not be available for personal posts or without proper permissions
      // This is not a critical error - we'll just use 0 for reach
      console.log(`[LinkedIn] Analytics not available for post ${postUrn}:`, analyticsError.response?.data?.message || analyticsError.message);
      reach = 0;
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
    
    console.error(`[LinkedIn] Analytics error for post ${postUrn}:`, {
      message: errorMessage,
      code: errorCode,
      fullError: error.response?.data
    });
    
    // Check if it's a permissions error
    if (errorCode === 403 || errorCode === 401) {
      const permissionError = new Error('Missing required LinkedIn permissions. Please reconnect your LinkedIn account to grant the necessary permissions.');
      permissionError.isPermissionError = true;
      throw permissionError;
    }
    
    throw new Error(`LinkedIn analytics error: ${errorMessage}`);
  }
};

