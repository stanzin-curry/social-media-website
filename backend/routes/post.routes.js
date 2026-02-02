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
router.post('/create', upload.array('media', 10), createPostFromCreateEndpoint); // Max 10 images
router.post('/', upload.array('media', 10), createPost); // Max 10 images
router.get('/', getPosts);
router.get('/scheduled', getScheduledPosts);
router.get('/published', getPublishedPosts);
router.post('/:id/refresh-analytics', refreshPostAnalytics); // Must come before /:id route
router.get('/:id', getPostById);
router.put('/:id', upload.array('media', 10), updatePost); // Max 10 images
router.delete('/:id', deletePost);

export default router;

