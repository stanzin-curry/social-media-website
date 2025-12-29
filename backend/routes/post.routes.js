import express from 'express';
import { authenticate } from '../utils/middleware.js';
import { upload } from '../utils/upload.js';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getScheduledPosts,
  getPublishedPosts
} from '../controllers/post.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', upload.single('media'), createPost);
router.get('/', getPosts);
router.get('/scheduled', getScheduledPosts);
router.get('/published', getPublishedPosts);
router.get('/:id', getPostById);
router.put('/:id', upload.single('media'), updatePost);
router.delete('/:id', deletePost);

export default router;

