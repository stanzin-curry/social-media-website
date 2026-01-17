import express from 'express';
import { authenticate } from '../utils/middleware.js';
import upload from '../middleware/upload.middleware.js';
import {
  createPost,
  createPostFromCreateEndpoint,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getScheduledPosts,
  getPublishedPosts,
  refreshPostAnalytics
} from '../controllers/post.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create post endpoint (accepts content, mediaUrl, scheduledAt, etc.)
router.post('/create', upload.single('media'), createPostFromCreateEndpoint);
router.post('/', upload.single('media'), createPost);
router.get('/', getPosts);
router.get('/scheduled', getScheduledPosts);
router.get('/published', getPublishedPosts);
router.post('/:id/refresh-analytics', refreshPostAnalytics); // Must come before /:id route
router.get('/:id', getPostById);
router.put('/:id', upload.single('media'), updatePost);
router.delete('/:id', deletePost);

export default router;

