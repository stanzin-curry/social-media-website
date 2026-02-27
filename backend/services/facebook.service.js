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
 * Fetch Facebook post insights/metrics
 * @param {string} pageAccessToken - Page Access Token
 * @param {string} postId - Facebook Post ID
 * @param {string[]} metrics - Array of metric names to fetch
 * @returns {Promise<Object>} Object with metric names as keys and values
 */
const fetchFacebookPostInsights = async (pageAccessToken, postId, metrics) => {
  const reqId = `fb-insights-${postId}-${Date.now()}`;
  const results = {};
  
  for (const metric of metrics) {
    try {
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${postId}/insights`,
        {
          params: {
            metric: metric,
            access_token: pageAccessToken
          }
        }
      );
      
      if (insightsResponse.data?.data && insightsResponse.data.data.length > 0) {
        const insight = insightsResponse.data.data[0];
        let value = 0;
        
        if (insight.values && insight.values.length > 0) {
          value = insight.values[0].value || 0;
        } else if (insight.value !== undefined) {
          value = insight.value;
        }
        
        results[metric] = value;
        console.log(`[${reqId}] ✅ Fetched ${metric}: ${value}`);
      }
    } catch (metricError) {
      const errorMessage = metricError.response?.data?.error?.message || metricError.message;
      const errorCode = metricError.response?.data?.error?.code;
      const errorSubcode = metricError.response?.data?.error?.error_subcode;
      const fbtraceId = metricError.response?.data?.error?.fbtrace_id;
      
      if (errorMessage.includes('valid insights metric') || errorMessage.includes('INVALID_METRIC')) {
        console.log(`[${reqId}] ❌ INVALID_METRIC: ${metric} - ${errorMessage} (code: ${errorCode}, subcode: ${errorSubcode}, trace: ${fbtraceId})`);
        // Drop this metric and continue
        continue;
      } else {
        console.log(`[${reqId}] ⚠️  Error for ${metric}: ${errorMessage} (code: ${errorCode}, subcode: ${errorSubcode}, trace: ${fbtraceId})`);
        // Log full error for diagnostic
        console.log(`[${reqId}] Full error JSON:`, JSON.stringify(metricError.response?.data, null, 2));
        // Continue to next metric
        continue;
      }
    }
  }
  
  return results;
};

/**
 * Get Facebook post analytics/insights
 * @param {string} pageId - Facebook Page ID
 * @param {string} postId - Facebook Post ID (format: {pageId}_{postId})
 * @param {string} pageAccessToken - Page Access Token (required for insights)
 * @returns {Promise<Object>} Analytics data with reactionsCount, commentsCount, sharesCount, impressionsUnique, reach, engagedUsers
 */
export const getPostStats = async (pageId, postId, pageAccessToken) => {
  // Request correlation ID for better log tracking
  const reqId = `fb-analytics-${postId}-${Date.now()}`;
  console.log(`[${reqId}] Starting analytics refresh for post ${postId} on page ${pageId}`);
  
  // Development/Testing Mode: Return mock data if ENABLE_MOCK_ANALYTICS is set
  if (process.env.ENABLE_MOCK_ANALYTICS === 'true' || process.env.NODE_ENV === 'development' && process.env.USE_MOCK_ANALYTICS === 'true') {
    console.log(`[${reqId}] Using MOCK analytics data (Development Mode)`);
    // Generate realistic mock data with some randomness
    const baseReactions = Math.floor(Math.random() * 100) + 10;
    const baseComments = Math.floor(Math.random() * 20) + 2;
    const baseShares = Math.floor(Math.random() * 15) + 1;
    const baseReach = Math.floor(baseReactions * (1.5 + Math.random() * 0.5)); // Reach is typically higher than reactions
    
    return {
      reactionsCount: baseReactions,
      commentsCount: baseComments,
      sharesCount: baseShares,
      reach: baseReach,
      impressionsUnique: baseReach,
      engagedUsers: Math.floor(baseReactions * 0.8)
    };
  }

  // Debug: Check token permissions and validate it's a Page token
  try {
    const debugResponse = await axios.get('https://graph.facebook.com/v19.0/debug_token', {
      params: {
        input_token: pageAccessToken,
        access_token: `${process.env.FACEBOOK_CLIENT_ID}|${process.env.FACEBOOK_CLIENT_SECRET}`
      }
    });
    const tokenData = debugResponse.data.data;
    console.log(`[${reqId}] Token Debug:`);
    console.log(`[${reqId}]   - Token Type: ${tokenData?.type || 'unknown'}`);
    console.log(`[${reqId}]   - Scopes:`, tokenData?.scopes);
    console.log(`[${reqId}]   - Granular Scopes:`, tokenData?.granular_scopes);
    
    // Check if this is actually a Page token
    if (tokenData?.type !== 'PAGE') {
      console.warn(`[${reqId}] WARNING: Token type is ${tokenData?.type}, expected PAGE token for analytics`);
    }
    
    // Check page-specific permissions
    const hasReadEngagement = tokenData?.scopes?.includes('pages_read_engagement');
    let hasReadEngagementForPage = false;
    
    if (tokenData?.granular_scopes) {
      const readEngagementScope = tokenData.granular_scopes.find(
        gs => gs.scope === 'pages_read_engagement'
      );
      if (readEngagementScope && readEngagementScope.target_ids) {
        hasReadEngagementForPage = readEngagementScope.target_ids.includes(pageId);
        console.log(`[${reqId}]   - pages_read_engagement for page ${pageId}:`, hasReadEngagementForPage);
        console.log(`[${reqId}]   - pages_read_engagement target_ids:`, readEngagementScope.target_ids);
      }
    }
    
    console.log(`[${reqId}]   - Has read_insights:`, tokenData?.scopes?.includes('read_insights'));
    console.log(`[${reqId}]   - Has pages_read_engagement (general):`, hasReadEngagement);
    console.log(`[${reqId}]   - Has pages_read_engagement (for this page):`, hasReadEngagementForPage);
    
    if (!hasReadEngagementForPage && pageId) {
      console.warn(`[${reqId}] WARNING: pages_read_engagement not found for page ${pageId} in granular_scopes`);
    }
  } catch (debugError) {
    console.warn(`[${reqId}] Could not debug token:`, debugError.message);
  }

  try {
    // Step 1: Detect post type with minimal safe call
    let postType = 'unknown';
    try {
      const postMetaResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${postId}`,
        {
          params: {
            fields: 'permalink_url,status_type,type',
            access_token: pageAccessToken
          }
        }
      );
      const postMeta = postMetaResponse.data;
      postType = postMeta.status_type || postMeta.type || 'unknown';
      console.log(`[${reqId}] Post type detected: ${postType}`, {
        status_type: postMeta.status_type,
        type: postMeta.type,
        permalink_url: postMeta.permalink_url
      });
    } catch (metaError) {
      const errorCode = metaError.response?.data?.error?.code;
      const errorSubcode = metaError.response?.data?.error?.error_subcode;
      const fbtraceId = metaError.response?.data?.error?.fbtrace_id;
      const errorMessage = metaError.response?.data?.error?.message || metaError.message;
      
      console.warn(`[${reqId}] Could not detect post type:`, errorMessage);
      console.warn(`[${reqId}] Error details: code=${errorCode}, subcode=${errorSubcode}, trace=${fbtraceId}`);
      console.warn(`[${reqId}] Full error JSON:`, JSON.stringify(metaError.response?.data, null, 2));
      // Continue with unknown type - don't block stats/insights fetching
      postType = 'unknown';
    }
    
    // Step 2: Fetch basic stats using reactions instead of likes
    let reactionsCount = 0;
    let commentsCount = 0;
    let sharesCount = 0;
    
    try {
      // Primary method: Use reactions.limit(0).summary(true) instead of likes
      console.log(`[${reqId}] Requesting basic stats: GET /${postId}?fields=shares,reactions.limit(0).summary(true),comments.limit(0).summary(true)`);
      const postResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${postId}`,
        {
          params: {
            fields: 'shares,reactions.limit(0).summary(true),comments.limit(0).summary(true)',
            access_token: pageAccessToken
          }
        }
      );
      const postData = postResponse.data;
      
      reactionsCount = postData.reactions?.summary?.total_count ?? 0;
      commentsCount = postData.comments?.summary?.total_count ?? 0;
      sharesCount = postData.shares?.count ?? 0;
      
      console.log(`[${reqId}] Basic stats retrieved: reactions=${reactionsCount}, comments=${commentsCount}, shares=${sharesCount}`);
    } catch (primaryError) {
      const errorMessage = primaryError.response?.data?.error?.message || primaryError.message;
      const errorCode = primaryError.response?.data?.error?.code;
      const errorSubcode = primaryError.response?.data?.error?.error_subcode;
      const fbtraceId = primaryError.response?.data?.error?.fbtrace_id;
      
      console.log(`[${reqId}] Primary request failed: ${errorMessage} (code: ${errorCode}, subcode: ${errorSubcode}, trace: ${fbtraceId})`);
      console.log(`[${reqId}] Full error JSON:`, JSON.stringify(primaryError.response?.data, null, 2));
      
      // Fallback: Try using edges (reactions/comments endpoints)
      console.log(`[${reqId}] Trying fallback: individual edge requests`);
      try {
        const [reactionsRes, commentsRes, sharesRes] = await Promise.allSettled([
          axios.get(`https://graph.facebook.com/v19.0/${postId}/reactions`, {
            params: { summary: true, limit: 0, access_token: pageAccessToken }
          }),
          axios.get(`https://graph.facebook.com/v19.0/${postId}/comments`, {
            params: { summary: true, limit: 0, filter: 'stream', access_token: pageAccessToken }
          }),
          axios.get(`https://graph.facebook.com/v19.0/${postId}`, {
            params: { fields: 'shares', access_token: pageAccessToken }
          })
        ]);
        
        if (reactionsRes.status === 'fulfilled') {
          reactionsCount = reactionsRes.value.data.summary?.total_count ?? 0;
        }
        if (commentsRes.status === 'fulfilled') {
          commentsCount = commentsRes.value.data.summary?.total_count ?? 0;
        }
        if (sharesRes.status === 'fulfilled') {
          sharesCount = sharesRes.value.data.shares?.count ?? 0;
        }
        
        console.log(`[${reqId}] Fallback stats: reactions=${reactionsCount}, comments=${commentsCount}, shares=${sharesCount}`);
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError.response?.data?.error?.message || fallbackError.message;
        const fallbackErrorCode = fallbackError.response?.data?.error?.code;
        console.warn(`[${reqId}] Fallback also failed: ${fallbackErrorMessage} (code: ${fallbackErrorCode})`);
        console.warn(`[${reqId}] Full fallback error JSON:`, JSON.stringify(fallbackError.response?.data, null, 2));
        // Set to zeros but continue - we'll try diagnostic mode for comments
        reactionsCount = 0;
        commentsCount = 0;
        sharesCount = 0;
      }
    }
    
    // Step 3: Diagnostic mode for comments - verify if comments exist
    if (commentsCount === 0) {
      console.log(`[${reqId}] Comments show 0, running diagnostic mode...`);
      try {
        // Fetch latest comments to verify existence
        const commentsCheck = await axios.get(
          `https://graph.facebook.com/v19.0/${postId}/comments`,
          {
            params: {
              order: 'reverse_chronological',
              limit: 5,
              filter: 'stream',
              fields: 'from,message,created_time',
              access_token: pageAccessToken
            }
          }
        );
        
        if (commentsCheck.data?.data && commentsCheck.data.data.length > 0) {
          console.log(`[${reqId}] ⚠️  DIAGNOSTIC: Found ${commentsCheck.data.data.length} comments but count was 0!`);
          console.log(`[${reqId}] Latest comments:`, commentsCheck.data.data.map(c => ({
            from: c.from?.name,
            message: c.message?.substring(0, 50),
            created_time: c.created_time
          })));
          // Update count if we found comments
          commentsCount = commentsCheck.data.data.length;
        } else {
          // No comments found, check attachments
          console.log(`[${reqId}] No comments found on main post, checking attachments...`);
          try {
            const attachmentsRes = await axios.get(
              `https://graph.facebook.com/v19.0/${postId}`,
              {
                params: {
                  fields: 'attachments{target{id},media_type,url}',
                  access_token: pageAccessToken
                }
              }
            );
            
            if (attachmentsRes.data?.attachments?.data) {
              for (const attachment of attachmentsRes.data.attachments.data) {
                if (attachment.target?.id) {
                  try {
                    const targetComments = await axios.get(
                      `https://graph.facebook.com/v19.0/${attachment.target.id}/comments`,
                      {
                        params: {
                          summary: true,
                          limit: 0,
                          filter: 'stream',
                          access_token: pageAccessToken
                        }
                      }
                    );
                    const targetCount = targetComments.data.summary?.total_count ?? 0;
                    if (targetCount > 0) {
                      console.log(`[${reqId}] Found ${targetCount} comments on attachment target ${attachment.target.id}`);
                      commentsCount += targetCount;
                    }
                  } catch (targetError) {
                    // Skip this attachment target
                    console.log(`[${reqId}] Could not fetch comments for attachment target ${attachment.target.id}`);
                  }
                }
              }
            }
          } catch (attachmentsError) {
            console.log(`[${reqId}] Could not fetch attachments:`, attachmentsError.message);
          }
        }
      } catch (diagnosticError) {
        const diagErrorCode = diagnosticError.response?.data?.error?.code;
        const diagErrorSubcode = diagnosticError.response?.data?.error?.error_subcode;
        const diagFbtraceId = diagnosticError.response?.data?.error?.fbtrace_id;
        const diagErrorMessage = diagnosticError.response?.data?.error?.message || diagnosticError.message;
        
        console.warn(`[${reqId}] Diagnostic mode failed: ${diagErrorMessage} (code: ${diagErrorCode}, subcode: ${diagErrorSubcode}, trace: ${diagFbtraceId})`);
        console.warn(`[${reqId}] Full diagnostic error JSON:`, JSON.stringify(diagnosticError.response?.data, null, 2));
        // Don't throw - comments might genuinely be 0
      }
    }
    
    // Step 4: Fetch insights using the new function (removed post_impressions)
    const insightsMetrics = ['post_impressions_unique', 'post_reach', 'post_engaged_users'];
    const insightsResults = await fetchFacebookPostInsights(pageAccessToken, postId, insightsMetrics);
    
    const impressionsUnique = insightsResults.post_impressions_unique ?? 0;
    const reach = insightsResults.post_reach ?? 0;
    const engagedUsers = insightsResults.post_engaged_users ?? 0;
    
    console.log(`[${reqId}] ✅ Analytics refresh complete: reactions=${reactionsCount}, comments=${commentsCount}, shares=${sharesCount}, reach=${reach}, impressionsUnique=${impressionsUnique}, engagedUsers=${engagedUsers}`);
    
    return {
      reactionsCount,
      commentsCount,
      sharesCount,
      impressionsUnique,
      reach,
      engagedUsers
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    const errorType = error.response?.data?.error?.type;
    
    console.error(`[${reqId}] ❌ Analytics error:`, {
      message: errorMessage,
      code: errorCode,
      type: errorType,
      fullError: error.response?.data
    });
    
    // Check if it's a permissions/auth error (both code 200 and 10)
    if ((errorCode === 200 || errorCode === 10) && errorType === 'OAuthException') {
      if (errorMessage.includes('pages_read_engagement') || 
          errorMessage.includes('Missing Permissions') ||
          errorMessage.includes('requires the')) {
        
        // Provide specific guidance based on error
        let guidance = '';
        if (errorMessage.includes('Page Public Content Access')) {
          guidance = 'Enable "Page Public Content Access" feature in Facebook App Dashboard → Settings → Advanced. ';
        }
        if (errorMessage.includes('MODERATE') || errorMessage.includes('task')) {
          guidance += 'Ensure the user has MODERATE task/role on the Page. ';
        }
        guidance += 'Try disconnecting and reconnecting your Facebook account to refresh tokens.';
        
        const permissionError = new Error(
          `Facebook Page Access Token missing required permissions: ${errorMessage}. ${guidance}`
        );
        permissionError.isPermissionError = true;
        permissionError.requiresAppReview = errorMessage.includes('read_insights') || 
                                           errorMessage.includes('insights') ||
                                           errorMessage.includes('App Review');
        throw permissionError;
      } else if (errorMessage.includes('does not exist') || errorMessage.includes('cannot be loaded')) {
        // Post might not exist yet or token doesn't have access
        throw new Error(`Facebook post not accessible: ${errorMessage}. The post may be too new (analytics may not be available immediately after publishing), or your access token may need to be refreshed. Try disconnecting and reconnecting your Facebook account.`);
      }
    }
    
    // For other errors, check if it's a post access issue
    if (errorCode === 100 || errorMessage.includes('does not exist') || errorMessage.includes('cannot be loaded')) {
      throw new Error(`Facebook post not accessible: ${errorMessage}. The post may be too new (analytics may not be available immediately after publishing), or your access token may need to be refreshed.`);
    }
    
    throw new Error(`Facebook analytics error: ${errorMessage}`);
  }
};

/**
 * Edit an existing Facebook post
 * Note: Facebook only allows editing text/caption for certain post types (text posts and some photo posts)
 * Media/images cannot be edited - the post must be deleted and reposted
 * @param {string} postId - Facebook Post ID (format: {pageId}_{postId} or just postId)
 * @param {string} pageAccessToken - Facebook Page Access Token
 * @param {string} newCaption - New caption/text for the post
 * @returns {Promise<Object>} Updated post data
 */
export const editFacebookPost = async (postId, pageAccessToken, newCaption) => {
  try {
    // Facebook Graph API allows editing posts via POST to the post ID
    // Note: This only works for certain post types (text posts, some photo posts)
    // It does NOT work for all post types (e.g., link posts, video posts may not support editing)
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${postId}`,
      {
        message: newCaption,
        access_token: pageAccessToken
      }
    );

    return {
      success: true,
      postId: postId,
      platform: 'facebook',
      message: 'Post updated successfully'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    
    // Facebook may return specific errors for posts that can't be edited
    if (errorCode === 100 || errorMessage.includes('cannot be edited') || errorMessage.includes('not editable')) {
      throw new Error(`This Facebook post type does not support editing. Only text posts and some photo posts can be edited. Media/images cannot be changed.`);
    }
    
    throw new Error(`Facebook edit error: ${errorMessage}`);
  }
};

