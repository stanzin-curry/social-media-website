import User from '../models/User.model.js';
import Account from '../models/Account.model.js';
import Post from '../models/Post.model.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email, fullName, companyName, notificationPreferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate username if provided
    if (username !== undefined) {
      if (!username || username.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters'
        });
      }
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ username: username.trim(), _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username.trim();
    }

    // Validate email if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
      user.email = email.toLowerCase().trim();
    }

    // Update optional fields
    if (fullName !== undefined) {
      user.fullName = fullName.trim() || undefined;
    }
    if (companyName !== undefined) {
      user.companyName = companyName.trim() || undefined;
    }

    // Update notification preferences
    if (notificationPreferences !== undefined) {
      if (typeof notificationPreferences.postPublished === 'boolean') {
        user.notificationPreferences.postPublished = notificationPreferences.postPublished;
      }
      if (typeof notificationPreferences.postFailed === 'boolean') {
        user.notificationPreferences.postFailed = notificationPreferences.postFailed;
      }
    }

    // Handle profile photo upload if provided
    if (req.file) {
      // Delete old profile photo if it exists
      if (user.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '../uploads', path.basename(user.profilePhoto));
        if (fs.existsSync(oldPhotoPath)) {
          try {
            fs.unlinkSync(oldPhotoPath);
          } catch (error) {
            console.error('Error deleting old profile photo:', error);
          }
        }
      }
      user.profilePhoto = `/uploads/${req.file.filename}`;
    }

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already taken`
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all user's accounts
    await Account.deleteMany({ user: userId });

    // Delete all user's posts
    await Post.deleteMany({ user: userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete account'
    });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile photo if it exists
    if (user.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '../uploads', path.basename(user.profilePhoto));
      if (fs.existsSync(oldPhotoPath)) {
        try {
          fs.unlinkSync(oldPhotoPath);
        } catch (error) {
          console.error('Error deleting old profile photo:', error);
        }
      }
    }

    // Update user's profile photo
    user.profilePhoto = `/uploads/${req.file.filename}`;
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile photo'
    });
  }
};

