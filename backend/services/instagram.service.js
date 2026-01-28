import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Publish a post to Instagram
 * @param {string} accessToken - Instagram access token (Page access token)
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} caption - Post caption
 * @param {string} mediaUrl - Media URL (required for Instagram, must be publicly accessible)
 * @returns {Promise<Object>} Published post data
 */
export const publishToInstagram = async (accessToken, instagramAccountId, caption, mediaUrl) => {
  try {
    if (!mediaUrl) {
      throw new Error('Instagram requires media for posts');
    }

    // Check if mediaUrl is a localhost URL or local file path
    const isLocalhost = mediaUrl.includes('localhost') || mediaUrl.includes('127.0.0.1') || (!mediaUrl.startsWith('http'));
    
    let imageUrl = mediaUrl;
    
    if (isLocalhost || !mediaUrl.startsWith('http')) {
      // For local files, we need to construct a publicly accessible URL
      // Instagram's API requires a publicly accessible URL, not localhost
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
      
      if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        throw new Error(
          'Instagram requires a publicly accessible image URL. ' +
          'Your BACKEND_URL is set to localhost, which Instagram\'s servers cannot access. ' +
          'Please set BACKEND_URL to a publicly accessible URL (e.g., using ngrok for development or a cloud server for production).'
        );
      }
      
      // Construct public URL
      if (mediaUrl.startsWith('http')) {
        // Extract path from localhost URL
        const urlObj = new URL(mediaUrl);
        imageUrl = `${baseUrl}${urlObj.pathname}`;
      } else {
        // It's already a file path - decode URL-encoded characters
        const cleanPath = mediaUrl.replace(/^[/\\]+/, '');
        const decodedPath = decodeURIComponent(cleanPath);
        imageUrl = `${baseUrl}/${decodedPath}`;
      }
      
      // Verify the file exists locally (for debugging)
      let filePath;
      if (mediaUrl.startsWith('http')) {
        const urlObj = new URL(mediaUrl);
        filePath = path.join(process.cwd(), decodeURIComponent(urlObj.pathname));
      } else {
        const cleanPath = mediaUrl.replace(/^[/\\]+/, '');
        const decodedPath = decodeURIComponent(cleanPath);
        filePath = path.join(process.cwd(), decodedPath);
      }
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Image file not found at: ${filePath}. Please ensure the file exists.`);
      }
      
      console.log('[Instagram] Using public URL:', imageUrl);
      console.log('[Instagram] Local file path:', filePath);
    }

    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
      {
        image_url: imageUrl,
        caption: caption.substring(0, 2200), // Instagram caption limit
        access_token: accessToken
      }
    );

    const creationId = containerResponse.data.id;

    if (!creationId) {
      throw new Error('Failed to create media container. No creation ID returned.');
    }

    // Step 2: Publish the media container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
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

