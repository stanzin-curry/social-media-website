import express from 'express';
import { authenticate } from '../utils/middleware.js';
import { getProfile, updateProfile, changePassword, deleteAccount, uploadProfilePhoto } from '../controllers/user.controller.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', upload.single('profilePhoto'), updateProfile);
router.post('/profile/photo', upload.single('profilePhoto'), uploadProfilePhoto);
router.put('/password', changePassword);
router.delete('/account', deleteAccount);

export default router;

