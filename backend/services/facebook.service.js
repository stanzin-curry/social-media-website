import axios from 'axios';

/**
 * Publish a post to Facebook
 * @param {string} accessToken - Facebook access token
 * @param {string} pageId - Facebook page ID
 * @param {string} message - Post caption
 * @param {string} mediaUrl - Optional media URL
 * @returns {Promise<Object>} Published post data
 */
export const publishToFacebook = async (accessToken, pageId, message, mediaUrl = null) => {
  try {
    if (mediaUrl) {
      // First, upload the photo
      const photoResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/photos`,
        {
          url: mediaUrl,
          caption: message,
          access_token: accessToken
        }
      );

      return {
        success: true,
        postId: photoResponse.data.id,
        platform: 'facebook'
      };
    } else {
      // Text-only post
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          message,
          access_token: accessToken
        }
      );

      return {
        success: true,
        postId: response.data.id,
        platform: 'facebook'
      };
    }
  } catch (error) {
    throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Get Facebook page information
 */
export const getFacebookPageInfo = async (accessToken) => {
  try {
    const response = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
      params: {
        access_token: accessToken
      }
    });

    return response.data.data;
  } catch (error) {
    throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Create a Facebook post
 * Fetches user's pages, selects the first one, and posts to it using the page's access token
 * @param {string} accessToken - User's Facebook access token
 * @param {string} message - Post message content
 * @returns {Promise<Object>} API response including post id
 */
export const createFacebookPost = async (accessToken, message) => {
  try {
    // Fetch user's pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: accessToken
      }
    });

    const pages = pagesResponse.data.data;

    // Check if pages exist
    if (!pages || pages.length === 0) {
      throw new Error('No Facebook pages found. Please create a Facebook page first.');
    }

    // Select the first page
    const firstPage = pages[0];
    const pageId = firstPage.id;
    const pageAccessToken = firstPage.access_token;

    // Post to the page using the page's access token
    const postResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      {
        message: message,
        access_token: pageAccessToken
      }
    );

    // Return the API response (including id of the post)
    return postResponse.data;
  } catch (error) {
    if (error.message === 'No Facebook pages found. Please create a Facebook page first.') {
      throw error;
    }
    throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Post to Instagram
 * Creates a media container and publishes it to Instagram
 * @param {string} accessToken - Instagram Business Account access token (Page access token)
 * @param {string} instagramId - Instagram Business Account ID
 * @param {string} imageUrl - URL of the image to post
 * @param {string} caption - Caption for the post
 * @returns {Promise<Object>} Published post data
 */
export const postToInstagram = async (accessToken, instagramId, imageUrl, caption) => {
  try {
    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramId}/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      }
    );

    const creationId = containerResponse.data.id;

    if (!creationId) {
      throw new Error('Failed to create media container. No creation ID returned.');
    }

    // Step 2: Publish the media
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      }
    );

    return {
      success: true,
      postId: publishResponse.data.id,
      platform: 'instagram',
      creationId: creationId
    };
  } catch (error) {
    throw new Error(`Instagram API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

