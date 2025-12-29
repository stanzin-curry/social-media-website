import express from 'express';
import { authenticate } from '../utils/middleware.js';
import { getProfile, updateProfile } from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;

