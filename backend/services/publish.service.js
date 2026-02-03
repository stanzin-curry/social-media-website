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

  console.log(`[Scheduler] Publishing post ${post._id} to ${post.platforms.length} platform(s): ${post.platforms.join(', ')}`);

  for (const platform of post.platforms) {
    // Get list of pages to post to for this platform
    let pagesToPost = [];
    
    // Handle both array (new) and string/undefined (legacy) formats
    if (post.selectedPages && post.selectedPages[platform]) {
      pagesToPost = Array.isArray(post.selectedPages[platform]) 
        ? post.selectedPages[platform] 
        : [post.selectedPages[platform]];
    }
    
    // If no pages selected, post to default (first available page or personal profile)
    if (pagesToPost.length === 0) {
      pagesToPost = [null]; // null means use default
    }
    
    console.log(`[Scheduler] Publishing to ${platform} (${pagesToPost.length} page(s))...`);
    
    // Get account for this platform
    const account = await Account.findOne({
      user: post.user,
      platform: platform,
      isActive: true
    });

    if (!account) {
      const errorMsg = `No active ${platform} account found`;
      console.error(`[Scheduler] ❌ ${platform}: ${errorMsg}`);
      errors.push({
        platform,
        error: errorMsg
      });
      continue;
    }
    
    // Loop through each selected page
    for (const pageId of pagesToPost) {
      try {
        const pageIdentifier = pageId || (platform === 'linkedin' ? 'personal profile' : 'default page');
        console.log(`[Scheduler] Publishing to ${platform} - ${pageIdentifier}...`);

        // Construct full media URL if media exists
        // Handle both array (new) and string (legacy) formats
        let mediaUrl = null;
        let mediaUrls = []; // Array for multiple images
        
        if (post.media) {
          const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
          // Check if media is an array (new format) or string (legacy)
          if (Array.isArray(post.media) && post.media.length > 0) {
            // Support multiple images - use all images, not just the first
            mediaUrls = post.media.map(media => {
              return media.startsWith('http') ? media : `${baseUrl}${media}`;
            });
            // For platforms that only support single image, use first one
            // For platforms that support carousels, we'll pass the array
            mediaUrl = mediaUrls[0]; // Keep for backward compatibility
          } else if (typeof post.media === 'string') {
            // Legacy format - single string
            mediaUrl = post.media.startsWith('http') ? post.media : `${baseUrl}${post.media}`;
            mediaUrls = [mediaUrl];
          }
        }

        let publishResult;
        let actualPageId = null;
        let pageName = pageIdentifier;

        switch (platform) {
          case 'facebook':
            if (pageId) {
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
                page => page.id === pageId
              );

              if (!selectedPage) {
                throw new Error(`Selected Facebook page (${pageId}) not found.`);
              }

              pageName = selectedPage.name;
              actualPageId = selectedPage.id;

              // Use the page's access token directly via publishToFacebook
              if (mediaUrls.length > 1) {
                publishResult = await publishToFacebook(
                  selectedPage.accessToken,
                  selectedPage.id,
                  post.caption,
                  mediaUrls
                );
              } else {
                publishResult = await publishToFacebook(
                  selectedPage.accessToken,
                  selectedPage.id,
                  post.caption,
                  mediaUrl
                );
              }
              publishResult.pageId = selectedPage.id;
            } else {
              // Use postToFacebook which fetches pages and uses Page Access Token
              if (mediaUrls.length > 1) {
                publishResult = await postToFacebook(
                  account.accessToken,
                  post.caption,
                  mediaUrls,
                  null
                );
              } else {
                publishResult = await postToFacebook(
                  account.accessToken,
                  post.caption,
                  mediaUrl,
                  null
                );
              }
              actualPageId = publishResult.pageId;
            }
            break;

          case 'instagram':
            if (pageId) {
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
                page => page.instagramAccount && page.instagramAccount.id === pageId
              );

              if (!pageWithInstagram || !pageWithInstagram.instagramAccount) {
                throw new Error(`Selected Instagram account (${pageId}) not found.`);
              }

              pageName = `@${pageWithInstagram.instagramAccount.username}`;
              actualPageId = pageWithInstagram.instagramAccount.id;

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
            if (pageId === 'personal') {
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
              
              if (mediaUrls.length > 1) {
                publishResult = await publishToLinkedIn(
                  linkedInAccount.accessToken,
                  authorUrn,
                  post.caption,
                  mediaUrls
                );
              } else {
                publishResult = await publishToLinkedIn(
                  linkedInAccount.accessToken,
                  authorUrn,
                  post.caption,
                  mediaUrl
                );
              }
            } else if (pageId) {
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
                page => page.id === pageId
              );
              
              if (!selectedPage) {
                throw new Error(`Selected LinkedIn company page (${pageId}) not found.`);
              }
              
              pageName = selectedPage.name;
              actualPageId = selectedPage.id;
              
              const companyUrn = selectedPage.urn || `urn:li:organization:${selectedPage.id}`;
              if (mediaUrls.length > 1) {
                publishResult = await publishToLinkedIn(
                  linkedInAccount.accessToken,
                  companyUrn,
                  post.caption,
                  mediaUrls
                );
              } else {
                publishResult = await publishToLinkedIn(
                  linkedInAccount.accessToken,
                  companyUrn,
                  post.caption,
                  mediaUrl
                );
              }
              publishResult.pageId = selectedPage.id;
            } else {
              // Default: personal profile
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
              
              if (mediaUrls.length > 1) {
                publishResult = await publishToLinkedIn(
                  linkedInAccount.accessToken,
                  authorUrn,
                  post.caption,
                  mediaUrls
                );
              } else {
                publishResult = await publishToLinkedIn(
                  linkedInAccount.accessToken,
                  authorUrn,
                  post.caption,
                  mediaUrl
                );
              }
            }
            break;

          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }

        console.log(`[Scheduler] ✅ Successfully published to ${platform} - ${pageName} (Post ID: ${publishResult.postId || 'N/A'})`);

        results.push({
          platform,
          pageId: actualPageId,
          pageName: pageName,
          ...publishResult
        });

        // Update post with published platform info
        post.publishedPlatforms.push({
          platform,
          platformPostId: publishResult.postId,
          pageId: actualPageId || null,
          publishedAt: new Date(),
          status: 'success'
        });

      } catch (error) {
        const pageIdentifier = pageId || (platform === 'linkedin' ? 'personal profile' : 'default page');
        console.error(`[Scheduler] ❌ Failed to publish to ${platform} - ${pageIdentifier}: ${error.message}`);
        
        errors.push({
          platform,
          pageId: pageId || null,
          error: error.message
        });

        // Add failed platform to publishedPlatforms
        post.publishedPlatforms.push({
          platform,
          pageId: pageId || null,
          publishedAt: new Date(),
          status: 'failed',
          error: error.message
        });
      }
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

