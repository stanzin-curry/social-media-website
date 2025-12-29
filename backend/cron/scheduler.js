import cron from 'node-cron';
import Post from '../models/Post.model.js';
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

