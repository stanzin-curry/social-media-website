import express from 'express';
import { authenticate } from '../utils/middleware.js';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.delete('/account', deleteAccount);

export default router;

