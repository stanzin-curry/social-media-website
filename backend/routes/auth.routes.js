import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authenticate } from '../utils/middleware.js';

const router = express.Router();

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

export default router;

