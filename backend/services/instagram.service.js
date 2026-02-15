import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Helper function to process a single media URL (convert localhost to public URL)
 */
const processMediaUrl = (mediaUrl) => {
  const isLocalhost = mediaUrl.includes('localhost') || mediaUrl.includes('127.0.0.1') || (!mediaUrl.startsWith('http'));
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    throw new Error(
      'Instagram requires a publicly accessible image URL. ' +
      'Your BACKEND_URL is set to localhost, which Instagram\'s servers cannot access. ' +
      'Please set BACKEND_URL to a publicly accessible URL (e.g., using ngrok for development or a cloud server for production).'
    );
  }
  
  let imageUrl = mediaUrl;
  
  if (isLocalhost || !mediaUrl.startsWith('http')) {
    if (mediaUrl.startsWith('http')) {
      const urlObj = new URL(mediaUrl);
      imageUrl = `${baseUrl}${urlObj.pathname}`;
    } else {
      const cleanPath = mediaUrl.replace(/^[/\\]+/, '');
      const decodedPath = decodeURIComponent(cleanPath);
      imageUrl = `${baseUrl}/${decodedPath}`;
    }
  }
  
  // Verify file exists locally (for debugging)
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
  
  return imageUrl;
};

/**
 * Poll container status until ready
 */
const pollContainerStatus = async (creationId, accessToken, maxAttempts = 30, pollInterval = 10000) => {
  let status = 'IN_PROGRESS';
  let attempts = 0;

  while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;

    try {
      const statusResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${creationId}`,
        {
          params: {
            fields: 'status_code',
            access_token: accessToken
          }
        }
      );

      status = statusResponse.data.status_code;
      console.log(`[Instagram] Container ${creationId} status (attempt ${attempts}/${maxAttempts}): ${status}`);

      if (status === 'ERROR') {
        throw new Error('Media container processing failed');
      }
    } catch (error) {
      console.warn(`[Instagram] Status check failed (attempt ${attempts}):`, error.message);
      if (error.response?.data?.error?.code === 100) {
        throw new Error(`Invalid container ID: ${creationId}`);
      }
    }
  }

  if (status !== 'FINISHED') {
    throw new Error(`Media container not ready after ${attempts} attempts (${(attempts * pollInterval) / 1000} seconds). Final status: ${status}`);
  }

  return status;
};

/**
 * Publish a post to Instagram
 * @param {string} accessToken - Instagram access token (Page access token)
 * @param {string} instagramAccountId - Instagram Business Account ID
 * @param {string} caption - Post caption
 * @param {string|string[]} mediaUrl - Media URL(s) (required for Instagram, must be publicly accessible)
 * @returns {Promise<Object>} Published post data
 */
export const publishToInstagram = async (accessToken, instagramAccountId, caption, mediaUrl) => {
  try {
    if (!mediaUrl) {
      throw new Error('Instagram requires media for posts');
    }

    // Handle both single image and carousel (multiple images)
    const mediaUrls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    
    if (mediaUrls.length === 0) {
      throw new Error('Instagram requires at least one media item');
    }

    console.log(`[Instagram] Publishing ${mediaUrls.length} image(s) to Instagram...`);

    // Process all media URLs
    const processedUrls = mediaUrls.map(url => processMediaUrl(url));

    // If single image, use existing flow
    if (processedUrls.length === 1) {
      const imageUrl = processedUrls[0];

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

      console.log(`[Instagram] Media container created with ID: ${creationId}. Waiting for processing...`);

      // Step 2: Poll the container status until it's ready
      await pollContainerStatus(creationId, accessToken);

      console.log(`[Instagram] Media container ready. Publishing...`);

      // Step 3: Publish the media container
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
    } else {
      // Multiple images - create carousel post
      console.log(`[Instagram] Creating carousel post with ${processedUrls.length} images...`);

      // Step 1: Create containers for each image (without caption)
      const containerPromises = processedUrls.map(async (imageUrl, index) => {
        console.log(`[Instagram] Creating container ${index + 1}/${processedUrls.length}...`);
        const containerResponse = await axios.post(
          `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
          {
            image_url: imageUrl,
            is_carousel_item: true, // Mark as carousel item
            access_token: accessToken
          }
        );

        const creationId = containerResponse.data.id;
        if (!creationId) {
          throw new Error(`Failed to create media container for image ${index + 1}`);
        }

        console.log(`[Instagram] Container ${index + 1} created with ID: ${creationId}`);
        return creationId;
      });

      const containerIds = await Promise.all(containerPromises);
      console.log(`[Instagram] All ${containerIds.length} containers created. Waiting for processing...`);

      // Step 2: Poll all containers until ready
      const pollPromises = containerIds.map((creationId, index) => {
        console.log(`[Instagram] Polling container ${index + 1}/${containerIds.length}...`);
        return pollContainerStatus(creationId, accessToken);
      });

      await Promise.all(pollPromises);
      console.log(`[Instagram] All containers ready. Creating carousel...`);

      // Step 3: Create carousel container with all images
      const carouselResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
        {
          media_type: 'CAROUSEL',
          children: containerIds.join(','), // Comma-separated list of container IDs
          caption: caption.substring(0, 2200), // Instagram caption limit
          access_token: accessToken
        }
      );

      const carouselCreationId = carouselResponse.data.id;
      if (!carouselCreationId) {
        throw new Error('Failed to create carousel container');
      }

      console.log(`[Instagram] Carousel container created with ID: ${carouselCreationId}. Waiting for processing...`);

      // Step 4: Poll carousel container until ready
      await pollContainerStatus(carouselCreationId, accessToken);

      console.log(`[Instagram] Carousel container ready. Publishing...`);

      // Step 5: Publish the carousel container
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
        {
          creation_id: carouselCreationId,
          access_token: accessToken
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        platform: 'instagram'
      };
    }
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

