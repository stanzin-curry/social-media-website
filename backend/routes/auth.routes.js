import express from 'express';
import { 
  register, 
  login, 
  linkedinAuth,
  linkedinCompanyAuth,
  linkedinCallback,
  linkedinCompanyCallback,
  facebookAuth,
  facebookCallback,
  instagramAuth,
  instagramCallback,
  testLinkedInPost,
  testFacebookPost,
  testInstagramPost
} from '../controllers/auth.controller.js';
import { authenticate } from '../utils/middleware.js';
import User from '../models/User.model.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, async (req, res) => {
  try {
    // Fetch full user data excluding password
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user data'
    });
  }
});

// OAuth routes - LinkedIn Personal Profile
router.get('/linkedin', authenticate, linkedinAuth);
router.get('/linkedin/callback', linkedinCallback);

// OAuth routes - LinkedIn Company Pages
router.get('/linkedin-company', authenticate, linkedinCompanyAuth);
router.get('/linkedin-company/callback', linkedinCompanyCallback);

// OAuth routes - Facebook
router.get('/facebook', authenticate, facebookAuth);
router.get('/facebook/callback', facebookCallback);

// OAuth routes - Instagram
router.get('/instagram', authenticate, instagramAuth);
router.get('/instagram/callback', instagramCallback);

// Test route for LinkedIn posting
router.post('/test-linkedin-post', authenticate, testLinkedInPost);

// Test route for Facebook posting
router.post('/test-facebook-post', authenticate, testFacebookPost);

// Test route for Instagram posting
router.post('/test-instagram-post', authenticate, testInstagramPost);

export default router;

