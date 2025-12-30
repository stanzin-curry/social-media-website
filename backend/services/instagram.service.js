import axios from 'axios';

/**
 * Publish a post to Instagram
 * @param {string} accessToken - Instagram access token
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} caption - Post caption
 * @param {string} mediaUrl - Media URL (required for Instagram)
 * @returns {Promise<Object>} Published post data
 */
export const publishToInstagram = async (accessToken, instagramAccountId, caption, mediaUrl) => {
  try {
    if (!mediaUrl) {
      throw new Error('Instagram requires media for posts');
    }

    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
      {
        image_url: mediaUrl,
        caption: caption.substring(0, 2200), // Instagram caption limit
        access_token: accessToken
      }
    );

    const creationId = containerResponse.data.id;

    // Step 2: Publish the media container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      }
    );

    return {
      success: true,
      postId: publishResponse.data.id,
      platform: 'instagram'
    };
  } catch (error) {
    throw new Error(`Instagram API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Get Instagram account information
 */
export const getInstagramAccountInfo = async (accessToken, instagramAccountId) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${instagramAccountId}`,
      {
        params: {
          fields: 'username,account_type,profile_picture_url',
          access_token: accessToken
        }
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Instagram API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

