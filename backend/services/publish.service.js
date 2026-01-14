import Post from '../models/Post.model.js';
import Account from '../models/Account.model.js';
import { postToFacebook } from './facebook.service.js';
import { publishToInstagram } from './instagram.service.js';
import { publishToLinkedIn } from './linkedin.service.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Publish a post to all specified platforms
 */
export const publishPost = async (post) => {
  const results = [];
  const errors = [];

  for (const platform of post.platforms) {
    try {
      // Get account for this platform
      const account = await Account.findOne({
        user: post.user,
        platform: platform,
        isActive: true
      });

      if (!account) {
        errors.push({
          platform,
          error: `No active ${platform} account found`
        });
        continue;
      }

      // Construct full media URL if media exists
      let mediaUrl = null;
      if (post.media) {
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        mediaUrl = post.media.startsWith('http') ? post.media : `${baseUrl}${post.media}`;
      }

      let publishResult;

      switch (platform) {
        case 'facebook':
          // Use postToFacebook which fetches pages and uses Page Access Token
          // account.accessToken is the user's token, which will be used to fetch pages
          // postToFacebook will extract the Page Access Token and post to the page
          // Note: account.platformUserId is the user's Facebook ID, not the page ID
          // So we pass null to use the first available page
          publishResult = await postToFacebook(
            account.accessToken,  // User's access token (used to fetch pages)
            post.caption,         // Post message
            mediaUrl,             // Optional media URL
            null                  // Use first available page (account.platformUserId is user ID, not page ID)
          );
          break;

        case 'instagram':
          publishResult = await publishToInstagram(
            account.accessToken,
            account.platformUserId,
            post.caption,
            mediaUrl
          );
          break;

        case 'linkedin':
          // LinkedIn requires author URN format: "urn:li:person:123456"
          const authorUrn = account.platformUserId.startsWith('urn:li:') 
            ? account.platformUserId 
            : `urn:li:person:${account.platformUserId}`;
          
          publishResult = await publishToLinkedIn(
            account.accessToken,
            authorUrn,
            post.caption,
            mediaUrl
          );
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      results.push({
        platform,
        ...publishResult
      });

      // Update post with published platform info
      post.publishedPlatforms.push({
        platform,
        platformPostId: publishResult.postId,
        pageId: publishResult.pageId || null, // Save page ID for Facebook posts
        publishedAt: new Date(),
        status: 'success'
      });

    } catch (error) {
      errors.push({
        platform,
        error: error.message
      });

      // Add failed platform to publishedPlatforms
      post.publishedPlatforms.push({
        platform,
        publishedAt: new Date(),
        status: 'failed',
        error: error.message
      });
    }
  }

  // Update post status
  if (errors.length === 0) {
    post.status = 'published';
    post.publishedAt = new Date();
  } else if (results.length > 0) {
    // Partially published
    post.status = 'published';
    post.publishedAt = new Date();
  } else {
    // All failed
    post.status = 'failed';
  }

  await post.save();

  return {
    success: results.length > 0,
    results,
    errors
  };
};

