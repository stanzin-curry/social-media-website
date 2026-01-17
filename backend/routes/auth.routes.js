import express from 'express';
import { 
  register, 
  login, 
  linkedinAuth, 
  linkedinCallback,
  facebookAuth,
  facebookCallback,
  instagramAuth,
  instagramCallback,
  testLinkedInPost,
  testFacebookPost,
  testInstagramPost
} from '../controllers/auth.controller.js';
import { authenticate } from '../utils/middleware.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// OAuth routes - LinkedIn
router.get('/linkedin', authenticate, linkedinAuth);
router.get('/linkedin/callback', linkedinCallback);

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

