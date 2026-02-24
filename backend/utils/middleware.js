import { verifyToken } from './jwt.js';
import User from '../models/User.model.js';
import Session from '../models/Session.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token is valid
    const decoded = verifyToken(token);
    
    // Check if session exists in database
    const session = await Session.findOne({ token, user: decoded.userId });
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please login again.'
      });
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    // Get user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    req.session = session; // Optional: attach session to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
};

