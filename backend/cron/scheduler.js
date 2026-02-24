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
        console.log(`[Scheduler] Publishing post ${post._id}...`);
        const result = await publishPost(post);
        
        if (result.success) {
          console.log(`[Scheduler] ✅ Post ${post._id} published successfully`);
        } else {
          console.error(`[Scheduler] ❌ Post ${post._id} failed to publish:`, result.errors);
        }
      } catch (error) {
        console.error(`[Scheduler] Error publishing post ${post._id}:`, error.message);
        post.status = 'failed';
        await post.save();
        
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

