import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Publish a post to LinkedIn
 * @param {string} accessToken - LinkedIn access token
 * @param {string} authorUrn - LinkedIn author URN (e.g., "urn:li:person:123456")
 * @param {string} text - Post text
 * @param {string} mediaUrl - Optional media URL
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
      const isLocalhost = mediaUrl.includes('localhost') || mediaUrl.includes('127.0.0.1') || (!mediaUrl.startsWith('http'));
      
      if (isLocalhost || !mediaUrl.startsWith('http')) {
        // Local file - read from disk
        let filePath;
        if (mediaUrl.startsWith('http')) {
          // Extract path from localhost URL and decode URL-encoded characters
          const urlObj = new URL(mediaUrl);
          const decodedPath = decodeURIComponent(urlObj.pathname);
          filePath = path.join(process.cwd(), decodedPath);
        } else {
          // It's already a file path - decode URL-encoded characters
          const cleanPath = mediaUrl.replace(/^[/\\]+/, '');
          const decodedPath = decodeURIComponent(cleanPath);
          filePath = path.join(process.cwd(), decodedPath);
        }
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found at: ${filePath}`);
        }
        
        imageData = fs.readFileSync(filePath);
      } else {
        // Public URL - fetch the image
        const imageResponse = await axios.get(mediaUrl, {
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

      // Add media to post
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        media: asset,
        title: {
          text: 'Shared Image'
        }
      }];
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

