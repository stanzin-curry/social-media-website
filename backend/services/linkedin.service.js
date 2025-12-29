import axios from 'axios';

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

      // Upload the image
      await axios.put(uploadUrl, mediaUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
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
 * Get LinkedIn user profile
 */
export const getLinkedInProfile = async (accessToken) => {
  try {
    const response = await axios.get(
      'https://api.linkedin.com/v2/me',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`LinkedIn API error: ${error.response?.data?.message || error.message}`);
  }
};

