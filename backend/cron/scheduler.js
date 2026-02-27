import cron from 'node-cron';
import Post from '../models/Post.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import { publishPost } from '../services/publish.service.js';

/**
 * Check for scheduled posts that are ready to publish
 */
const checkScheduledPosts = async () => {
  try {
    const now = new Date();
    
    // Find posts that are scheduled and the scheduled time has passed
    const postsToPublish = await Post.find({
      status: 'scheduled',
      scheduledDate: { $lte: now }
    }).populate('user');

    console.log(`[Scheduler] Found ${postsToPublish.length} posts ready to publish`);

    for (const post of postsToPublish) {
      try {
        // Atomic claim: Update status to 'publishing' only if currently 'scheduled'
        // This prevents duplicate publishes if scheduler runs multiple times
        const updateResult = await Post.updateOne(
          { _id: post._id, status: 'scheduled' },
          { $set: { status: 'publishing' } }
        );
        
        // If no document was updated, it means another scheduler instance already claimed it
        if (updateResult.modifiedCount === 0) {
          console.log(`[Scheduler] ⏭️  Post ${post._id} already being published or not in scheduled status, skipping`);
          continue;
        }
        
        console.log(`[Scheduler] Publishing post ${post._id}...`);
        
        // Reload post to get fresh data after status update
        const freshPost = await Post.findById(post._id);
        if (!freshPost) {
          console.error(`[Scheduler] ❌ Post ${post._id} not found after claim`);
          continue;
        }
        
        // Check if already published to avoid duplicate
        const hasSuccessfulPublish = freshPost.publishedPlatforms?.some(
          pp => pp.status === 'success' && pp.platformPostId
        );
        
        if (hasSuccessfulPublish) {
          console.log(`[Scheduler] ⏭️  Post ${post._id} already has successful publishes, skipping to avoid duplicate`);
          // Reset status back to published if it was already published
          await Post.updateOne(
            { _id: post._id },
            { $set: { status: 'published' } }
          );
          continue;
        }
        
        const result = await publishPost(freshPost);
        
        if (result.success) {
          console.log(`[Scheduler] ✅ Post ${post._id} published successfully`);
        } else {
          console.error(`[Scheduler] ❌ Post ${post._id} failed to publish:`, result.errors);
        }
      } catch (error) {
        console.error(`[Scheduler] Error publishing post ${post._id}:`, error.message);
        // Reset status on error
        await Post.updateOne(
          { _id: post._id },
          { $set: { status: 'failed' } }
        );
        
        // Create notification for failed post if user has preference enabled
        try {
          const userId = typeof post.user === 'object' ? post.user._id : post.user;
          const user = await User.findById(userId);
          
          if (user && user.notificationPreferences?.postFailed !== false) {
            await Notification.create({
              user: user._id,
              type: 'postFailed',
              message: `Your post failed to publish: ${error.message}`,
              post: post._id
            });
          }
        } catch (notificationError) {
          console.error('[Scheduler] Error creating failure notification:', notificationError);
        }
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error checking scheduled posts:', error);
  }
};

/**
 * Start the cron scheduler
 * Runs every minute to check for posts ready to publish
 */
export const startScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', () => {
    console.log('[Scheduler] Running scheduled post check...');
    checkScheduledPosts();
  });

  console.log('[Scheduler] Cron job scheduled to run every minute');
  
  // Also run immediately on startup
  checkScheduledPosts();
};

