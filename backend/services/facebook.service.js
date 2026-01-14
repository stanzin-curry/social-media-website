import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

/**
 * Post to Facebook using Page Access Token
 * Fetches user's Facebook pages, extracts Page Access Token, and posts to the page
 * @param {string} userAccessToken - User's Facebook access token (used to fetch pages)
 * @param {string} message - Post caption/content
 * @param {string} mediaUrl - Optional media URL
 * @param {string} targetPageId - Optional specific page ID to post to (if not provided, uses first page)
 * @returns {Promise<Object>} Published post data
 */
export const postToFacebook = async (userAccessToken, message, mediaUrl = null, targetPageId = null) => {
  try {
    // Step 1: Fetch user's Facebook pages using their access token
    const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: userAccessToken,
        fields: 'id,name,access_token' // Request page ID, name, and most importantly: access_token
      }
    });

    const pages = pagesResponse.data.data;

    // Step 2: Check if pages exist
    if (!pages || pages.length === 0) {
      throw new Error('No Facebook Page found. Please connect a Page.');
    }

    // Step 3: Find the target page (or use first page)
    let selectedPage = null;
    if (targetPageId) {
      selectedPage = pages.find(page => page.id === targetPageId);
      if (!selectedPage) {
        throw new Error(`Facebook Page with ID ${targetPageId} not found.`);
      }
    } else {
      // Use the first page if no specific page ID provided
      selectedPage = pages[0];
    }

    // Step 4: Extract Page Access Token and Page ID
    const pageId = selectedPage.id;
    const pageAccessToken = selectedPage.access_token;

    if (!pageAccessToken) {
      throw new Error('Page Access Token not found. Please reconnect your Facebook Page.');
    }

    // Step 5: Post to Facebook using Page Access Token
    if (mediaUrl) {
      let imageUrl = mediaUrl;
      let filePath = null;

      // Check if mediaUrl is a local file path or a URL
      if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
        // It's already a full URL - use it directly
        imageUrl = mediaUrl;
        console.log('[Facebook] Using provided URL:', imageUrl);
      } else {
        // It's a local file path (e.g., "/uploads/image.jpg" or "uploads/image.jpg")
        // Clean up the path - remove leading slashes/backslashes
        const cleanPath = mediaUrl.replace(/^[/\\]+/, '');
        
        // Construct absolute file path using process.cwd()
        filePath = path.join(process.cwd(), cleanPath);
        
        // Debug log BEFORE checking file existence
        console.log('[Facebook] Looking for file at:', filePath);
        console.log('[Facebook] Original mediaUrl:', mediaUrl);
        console.log('[Facebook] Cleaned path:', cleanPath);
        console.log('[Facebook] Process CWD:', process.cwd());
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found at: ${filePath}. Original path: ${mediaUrl}`);
        }
        
        console.log('[Facebook] File found! File size:', fs.statSync(filePath).size, 'bytes');
        
        // Construct the full URL using BACKEND_URL
        // Note: Facebook's servers cannot access localhost URLs
        // For production, ensure BACKEND_URL is publicly accessible
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        imageUrl = `${baseUrl}/${cleanPath}`;
        
        console.log('[Facebook] Using image URL:', imageUrl);
        console.log('[Facebook] WARNING: If BACKEND_URL is localhost, Facebook cannot access it. Use a publicly accessible URL in production.');
      }

      // Image post: POST to /{pageId}/photos
      // Facebook API requires a publicly accessible URL
      const photoResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${pageId}/photos`,
        {
          url: imageUrl,
          caption: message,
          access_token: pageAccessToken // CRITICAL: Use Page Access Token, not User Token
        }
      );

      return {
        success: true,
        postId: photoResponse.data.id,
        platform: 'facebook',
        pageId: pageId
      };
    } else {
      // Text-only post: POST to /{pageId}/feed
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          message: message,
          access_token: pageAccessToken // CRITICAL: Use Page Access Token, not User Token
        }
      );

      return {
        success: true,
        postId: response.data.id,
        platform: 'facebook',
        pageId: pageId
      };
    }
  } catch (error) {
    // Handle specific error messages
    if (error.message.includes('No Facebook Page found')) {
      throw error;
    }
    if (error.message.includes('Page Access Token not found')) {
      throw error;
    }
    throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Publish a post to Facebook (legacy function - uses provided page token)
 * @param {string} accessToken - Facebook Page access token
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
        `https://graph.facebook.com/v19.0/${pageId}/photos`,
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
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
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

