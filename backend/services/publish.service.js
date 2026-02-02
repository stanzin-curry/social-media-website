import Post from '../models/Post.model.js';
import Account from '../models/Account.model.js';
import { postToFacebook, publishToFacebook } from './facebook.service.js';
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
      // Handle both array (new) and string (legacy) formats
      let mediaUrl = null;
      if (post.media) {
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        // Check if media is an array (new format) or string (legacy)
        if (Array.isArray(post.media) && post.media.length > 0) {
          // Use the first image for now (can be extended to support carousels later)
          const firstMedia = post.media[0];
          mediaUrl = firstMedia.startsWith('http') ? firstMedia : `${baseUrl}${firstMedia}`;
        } else if (typeof post.media === 'string') {
          // Legacy format - single string
          mediaUrl = post.media.startsWith('http') ? post.media : `${baseUrl}${post.media}`;
        }
      }

      let publishResult;

      switch (platform) {
        case 'facebook':
          // Check if a specific page was selected
          if (post.selectedPages && post.selectedPages.facebook) {
            // Find the Facebook account to get pages
            const facebookAccount = await Account.findOne({
              user: post.user,
              platform: 'facebook',
              isActive: true
            });

            if (!facebookAccount || !facebookAccount.pages || facebookAccount.pages.length === 0) {
              throw new Error('No Facebook pages found. Please reconnect your Facebook account.');
            }

            // Find the selected page
            const selectedPage = facebookAccount.pages.find(
              page => page.id === post.selectedPages.facebook
            );

            if (!selectedPage) {
              throw new Error(`Selected Facebook page (${post.selectedPages.facebook}) not found.`);
            }

            // Use the page's access token directly via publishToFacebook
            publishResult = await publishToFacebook(
              selectedPage.accessToken,
              selectedPage.id,
              post.caption,
              mediaUrl
            );
            publishResult.pageId = selectedPage.id;
          } else {
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
          }
          break;

        case 'instagram':
          // Check if a specific Instagram account was selected
          if (post.selectedPages && post.selectedPages.instagram) {
            // Find the Facebook account to get pages with Instagram accounts
            const facebookAccount = await Account.findOne({
              user: post.user,
              platform: 'facebook',
              isActive: true
            });

            if (!facebookAccount || !facebookAccount.pages || facebookAccount.pages.length === 0) {
              throw new Error('No Facebook pages found. Please reconnect your Facebook account.');
            }

            // Find the page that has the selected Instagram account
            const pageWithInstagram = facebookAccount.pages.find(
              page => page.instagramAccount && page.instagramAccount.id === post.selectedPages.instagram
            );

            if (!pageWithInstagram || !pageWithInstagram.instagramAccount) {
              throw new Error(`Selected Instagram account (${post.selectedPages.instagram}) not found.`);
            }

            // Use the page's access token (required for Instagram API)
            publishResult = await publishToInstagram(
              pageWithInstagram.accessToken,
              pageWithInstagram.instagramAccount.id,
              post.caption,
              mediaUrl
            );
          } else {
            // Use default Instagram account
            publishResult = await publishToInstagram(
              account.accessToken,
              account.platformUserId,
              post.caption,
              mediaUrl
            );
          }
          break;

        case 'linkedin':
          // Check if a specific company page was selected
          if (post.selectedPages && post.selectedPages.linkedin) {
            // Posting to company page - use linkedin-company account
            const linkedInAccount = await Account.findOne({ 
              user: post.user, 
              platform: 'linkedin-company', 
              isActive: true 
            });
            
            if (!linkedInAccount || !linkedInAccount.pages || linkedInAccount.pages.length === 0) {
              throw new Error('LinkedIn company account not found or no company pages available. Please connect your LinkedIn company account.');
            }
            
            const selectedPage = linkedInAccount.pages.find(
              page => page.id === post.selectedPages.linkedin
            );
            
            if (!selectedPage) {
              throw new Error(`Selected LinkedIn company page (${post.selectedPages.linkedin}) not found.`);
            }
            
            const companyUrn = selectedPage.urn || `urn:li:organization:${selectedPage.id}`;
            publishResult = await publishToLinkedIn(
              linkedInAccount.accessToken,
              companyUrn,
              post.caption,
              mediaUrl
            );
            publishResult.pageId = selectedPage.id;
          } else {
            // Posting to personal profile - use linkedin account
            const linkedInAccount = await Account.findOne({ 
              user: post.user, 
              platform: 'linkedin', 
              isActive: true 
            });
            
            if (!linkedInAccount) {
              throw new Error('LinkedIn personal account not found. Please connect your LinkedIn personal account.');
            }
            
            const authorUrn = linkedInAccount.platformUserId.startsWith('urn:li:') 
              ? linkedInAccount.platformUserId 
              : `urn:li:person:${linkedInAccount.platformUserId}`;
            
            publishResult = await publishToLinkedIn(
              linkedInAccount.accessToken,
              authorUrn,
              post.caption,
              mediaUrl
            );
          }
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

