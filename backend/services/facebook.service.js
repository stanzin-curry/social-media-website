import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

/**
 * Post to Facebook using Page Access Token
 * Fetches user's Facebook pages, extracts Page Access Token, and posts to the page
 * @param {string} userAccessToken - User's Facebook access token (used to fetch pages)
 * @param {string} message - Post caption/content
 * @param {string|Array} mediaUrl - Optional media URL (string) or array of media URLs for multiple images
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
      // Check if mediaUrl is an array (multiple images) or single string
      if (Array.isArray(mediaUrl) && mediaUrl.length > 1) {
        // Post multiple images as an album
        console.log(`[Facebook] Posting ${mediaUrl.length} images as album`);
        
        // First, upload all images and get their IDs
        const uploadedPhotoIds = [];
        
        for (const url of mediaUrl) {
          let photoResponse;
          const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1') || (!url.startsWith('http'));
          
          if (isLocalhost || !url.startsWith('http')) {
            // Local file - read and upload
            let filePath;
            if (url.startsWith('http')) {
              const urlObj = new URL(url);
              const decodedPath = decodeURIComponent(urlObj.pathname);
              filePath = path.join(process.cwd(), decodedPath);
            } else {
              const cleanPath = url.replace(/^[/\\]+/, '');
              const decodedPath = decodeURIComponent(cleanPath);
              filePath = path.join(process.cwd(), decodedPath);
            }
            
            if (!fs.existsSync(filePath)) {
              throw new Error(`File not found at: ${filePath}. Original path: ${url}`);
            }
            
            const fileStream = fs.createReadStream(filePath);
            const formData = new FormData();
            formData.append('source', fileStream);
            formData.append('published', 'false'); // Don't publish yet, just upload
            formData.append('access_token', pageAccessToken);
            
            photoResponse = await axios.post(
              `https://graph.facebook.com/v19.0/${pageId}/photos`,
              formData,
              {
                headers: formData.getHeaders()
              }
            );
          } else {
            // Public URL
            photoResponse = await axios.post(
              `https://graph.facebook.com/v19.0/${pageId}/photos`,
              {
                url: url,
                published: 'false', // Don't publish yet, just upload
                access_token: pageAccessToken
              }
            );
          }
          
          uploadedPhotoIds.push({ media_fbid: photoResponse.data.id });
        }
        
        // Now create a post with all images attached
        const response = await axios.post(
          `https://graph.facebook.com/v19.0/${pageId}/feed`,
          {
            message: message,
            attached_media: uploadedPhotoIds,
            access_token: pageAccessToken
          }
        );
        
        return {
          success: true,
          postId: response.data.id,
          platform: 'facebook',
          pageId: pageId
        };
      } else {
        // Single image - use existing logic
        const singleUrl = Array.isArray(mediaUrl) ? mediaUrl[0] : mediaUrl;
        let photoResponse;
        
        // Check if mediaUrl is a localhost URL or local file path
        const isLocalhost = singleUrl.includes('localhost') || singleUrl.includes('127.0.0.1') || (!singleUrl.startsWith('http'));
        
        if (isLocalhost || !singleUrl.startsWith('http')) {
          // Local file - read and upload directly using FormData
          let filePath;
          if (singleUrl.startsWith('http')) {
            // Extract path from localhost URL and decode URL-encoded characters
            const urlObj = new URL(singleUrl);
            const decodedPath = decodeURIComponent(urlObj.pathname);
            filePath = path.join(process.cwd(), decodedPath);
          } else {
            // It's already a file path - decode URL-encoded characters
            const cleanPath = singleUrl.replace(/^[/\\]+/, '');
            const decodedPath = decodeURIComponent(cleanPath);
            filePath = path.join(process.cwd(), decodedPath);
          }
          
          console.log('[Facebook] Uploading local file:', filePath);
          
          if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at: ${filePath}. Original path: ${singleUrl}`);
          }
          
          // Read file and upload using FormData
          const fileStream = fs.createReadStream(filePath);
          const formData = new FormData();
          formData.append('source', fileStream);
          formData.append('message', message);
          formData.append('access_token', pageAccessToken);
          
          photoResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${pageId}/photos`,
            formData,
            {
              headers: formData.getHeaders()
            }
          );
        } else {
          // Public URL - use it directly
          console.log('[Facebook] Using public URL:', singleUrl);
          photoResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${pageId}/photos`,
            {
              url: singleUrl,
              caption: message,
              access_token: pageAccessToken // CRITICAL: Use Page Access Token, not User Token
            }
          );
        }

        return {
          success: true,
          postId: photoResponse.data.id,
          platform: 'facebook',
          pageId: pageId
        };
      }
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
 * @param {string|Array} mediaUrl - Optional media URL (string) or array of media URLs for multiple images
 * @returns {Promise<Object>} Published post data
 */
export const publishToFacebook = async (accessToken, pageId, message, mediaUrl = null) => {
  try {
    if (mediaUrl) {
      // Check if mediaUrl is an array (multiple images) or single string
      if (Array.isArray(mediaUrl) && mediaUrl.length > 1) {
        // Post multiple images as an album
        console.log(`[Facebook] Posting ${mediaUrl.length} images as album`);
        
        const uploadedPhotoIds = [];
        
        for (const url of mediaUrl) {
          let photoResponse;
          const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1') || (!url.startsWith('http'));
          
          if (isLocalhost || !url.startsWith('http')) {
            // Local file - read and upload
            let filePath;
            if (url.startsWith('http')) {
              const urlObj = new URL(url);
              const decodedPath = decodeURIComponent(urlObj.pathname);
              filePath = path.join(process.cwd(), decodedPath);
            } else {
              const cleanPath = url.replace(/^[/\\]+/, '');
              const decodedPath = decodeURIComponent(cleanPath);
              filePath = path.join(process.cwd(), decodedPath);
            }
            
            if (!fs.existsSync(filePath)) {
              throw new Error(`File not found at: ${filePath}`);
            }
            
            const fileStream = fs.createReadStream(filePath);
            const formData = new FormData();
            formData.append('source', fileStream);
            formData.append('published', 'false');
            formData.append('access_token', accessToken);
            
            photoResponse = await axios.post(
              `https://graph.facebook.com/v19.0/${pageId}/photos`,
              formData,
              {
                headers: formData.getHeaders()
              }
            );
          } else {
            // Public URL
            photoResponse = await axios.post(
              `https://graph.facebook.com/v19.0/${pageId}/photos`,
              {
                url: url,
                published: 'false',
                access_token: accessToken
              }
            );
          }
          
          uploadedPhotoIds.push({ media_fbid: photoResponse.data.id });
        }
        
        // Create post with all images
        const response = await axios.post(
          `https://graph.facebook.com/v19.0/${pageId}/feed`,
          {
            message: message,
            attached_media: uploadedPhotoIds,
            access_token: accessToken
          }
        );
        
        return {
          success: true,
          postId: response.data.id,
          platform: 'facebook'
        };
      } else {
        // Single image - use existing logic
        const singleUrl = Array.isArray(mediaUrl) ? mediaUrl[0] : mediaUrl;
        let photoResponse;
        
        // Check if mediaUrl is a localhost URL or local file path
        const isLocalhost = singleUrl.includes('localhost') || singleUrl.includes('127.0.0.1') || (!singleUrl.startsWith('http'));
        
        if (isLocalhost || !singleUrl.startsWith('http')) {
          // Local file - read and upload directly using FormData
          let filePath;
          if (singleUrl.startsWith('http')) {
            // Extract path from localhost URL and decode URL-encoded characters
            const urlObj = new URL(singleUrl);
            const decodedPath = decodeURIComponent(urlObj.pathname);
            filePath = path.join(process.cwd(), decodedPath);
          } else {
            // It's already a file path - decode URL-encoded characters
            const cleanPath = singleUrl.replace(/^[/\\]+/, '');
            const decodedPath = decodeURIComponent(cleanPath);
            filePath = path.join(process.cwd(), decodedPath);
          }
          
          if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at: ${filePath}`);
          }
          
          // Read file and upload using FormData
          const fileStream = fs.createReadStream(filePath);
          const formData = new FormData();
          formData.append('source', fileStream);
          formData.append('message', message);
          formData.append('access_token', accessToken);
          
          photoResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${pageId}/photos`,
            formData,
            {
              headers: formData.getHeaders()
            }
          );
        } else {
          // Public URL - use it directly
          photoResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${pageId}/photos`,
            {
              url: singleUrl,
              caption: message,
              access_token: accessToken
            }
          );
        }

        return {
          success: true,
          postId: photoResponse.data.id,
          platform: 'facebook'
        };
      }
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

/**
 * Get Facebook post analytics/insights
 * @param {string} pageId - Facebook Page ID
 * @param {string} postId - Facebook Post ID (format: {pageId}_{postId})
 * @param {string} pageAccessToken - Page Access Token (required for insights)
 * @returns {Promise<Object>} Analytics data with likes, comments, reach, shares
 */
export const getPostStats = async (pageId, postId, pageAccessToken) => {
  // Development/Testing Mode: Return mock data if ENABLE_MOCK_ANALYTICS is set
  if (process.env.ENABLE_MOCK_ANALYTICS === 'true' || process.env.NODE_ENV === 'development' && process.env.USE_MOCK_ANALYTICS === 'true') {
    console.log(`[Facebook] Using MOCK analytics data for post ${postId} (Development Mode)`);
    // Generate realistic mock data with some randomness
    const baseLikes = Math.floor(Math.random() * 100) + 10;
    const baseComments = Math.floor(Math.random() * 20) + 2;
    const baseShares = Math.floor(Math.random() * 15) + 1;
    const baseReach = Math.floor(baseLikes * (1.5 + Math.random() * 0.5)); // Reach is typically higher than likes
    
    return {
      likes: baseLikes,
      comments: baseComments,
      shares: baseShares,
      reach: baseReach
    };
  }

  try {
    // First, get basic post stats (likes, comments, shares)
    const postResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${postId}`,
      {
        params: {
          fields: 'shares,likes.summary(true),comments.summary(true)',
          access_token: pageAccessToken
        }
      }
    );

    const postData = postResponse.data;
    
    // Get basic metrics
    const likes = postData.likes?.summary?.total_count || 0;
    const comments = postData.comments?.summary?.total_count || 0;
    const shares = postData.shares?.count || 0;
    
    // Try to get insights (reach/impressions) - this might fail if post is too new or missing permissions
    let reach = 0;
    try {
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${postId}/insights`,
        {
          params: {
            metric: 'post_impressions',
            access_token: pageAccessToken
          }
        }
      );
      
      if (insightsResponse.data?.data && insightsResponse.data.data.length > 0) {
        const insight = insightsResponse.data.data[0];
        // Insights can have different structures - check for values array
        if (insight.values && insight.values.length > 0) {
          reach = insight.values[0].value || 0;
        } else if (insight.value !== undefined) {
          reach = insight.value;
        }
      }
    } catch (insightsError) {
      const errorCode = insightsError.response?.data?.error?.code;
      const errorType = insightsError.response?.data?.error?.type;
      const errorMessage = insightsError.response?.data?.error?.message || insightsError.message;
      
      // Check if it's a permissions error for insights
      if (errorCode === 200 && errorType === 'OAuthException' && errorMessage.includes('Missing Permissions')) {
        // Don't throw - just log and continue with reach = 0
        // The read_insights permission requires App Review approval from Facebook
        // For now, we'll return basic stats (likes, comments, shares) without reach
        console.warn(`[Facebook] Insights permission missing for post ${postId}. The read_insights permission requires Facebook App Review approval. Basic stats (likes, comments, shares) are still available.`);
        // Set reach to 0 and continue - don't fail the entire request
        reach = 0;
      } else {
        // Insights might not be available immediately after posting or for other reasons
        // This is not a critical error, we'll just use 0 for reach
        console.log(`[Facebook] Insights not available for post ${postId}:`, errorMessage);
        reach = 0;
      }
    }
    
    return {
      likes,
      comments,
      shares,
      reach
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    const errorType = error.response?.data?.error?.type;
    
    console.error(`[Facebook] Analytics error for post ${postId}:`, {
      message: errorMessage,
      code: errorCode,
      type: errorType,
      fullError: error.response?.data
    });
    
    // Check if it's a permissions error for basic stats (likes, comments, shares)
    // This is more critical than insights permission
    if (errorCode === 200 && errorType === 'OAuthException' && errorMessage.includes('Missing Permissions')) {
      const permissionError = new Error('Missing required Facebook permissions. The read_insights permission requires Facebook App Review approval. Please check your Facebook App settings and ensure the app has the necessary permissions approved.');
      permissionError.isPermissionError = true;
      permissionError.requiresAppReview = true;
      throw permissionError;
    }
    
    throw new Error(`Facebook analytics error: ${errorMessage}`);
  }
};

