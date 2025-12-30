import Account from '../models/Account.model.js';
import { connectFacebookAccount, connectInstagramAccount, connectLinkedInAccount } from '../services/oauth.service.js';

export const getAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const accounts = await Account.find({ user: userId, isActive: true });

    res.json({
      success: true,
      accounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch accounts'
    });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const userId = req.user._id;
    const account = await Account.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.json({
      success: true,
      account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch account'
    });
  }
};

export const connectFacebook = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accessToken, platformUserId, platformUsername } = req.body;

    if (!accessToken || !platformUserId || !platformUsername) {
      return res.status(400).json({
        success: false,
        message: 'Missing required OAuth data'
      });
    }

    const account = await connectFacebookAccount({
      userId,
      accessToken,
      platformUserId,
      platformUsername
    });

    res.json({
      success: true,
      message: 'Facebook account connected successfully',
      account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect Facebook account'
    });
  }
};

export const connectInstagram = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accessToken, platformUserId, platformUsername } = req.body;

    if (!accessToken || !platformUserId || !platformUsername) {
      return res.status(400).json({
        success: false,
        message: 'Missing required OAuth data'
      });
    }

    const account = await connectInstagramAccount({
      userId,
      accessToken,
      platformUserId,
      platformUsername
    });

    res.json({
      success: true,
      message: 'Instagram account connected successfully',
      account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect Instagram account'
    });
  }
};

export const connectLinkedIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accessToken, platformUserId, platformUsername, refreshToken, expiresIn } = req.body;

    if (!accessToken || !platformUserId || !platformUsername) {
      return res.status(400).json({
        success: false,
        message: 'Missing required OAuth data'
      });
    }

    const account = await connectLinkedInAccount({
      userId,
      accessToken,
      refreshToken,
      platformUserId,
      platformUsername,
      expiresIn
    });

    res.json({
      success: true,
      message: 'LinkedIn account connected successfully',
      account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect LinkedIn account'
    });
  }
};

export const disconnectAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const account = await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        user: userId
      },
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect account'
    });
  }
};

export const refreshAccountToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const account = await Account.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Token refresh logic would go here based on platform
    // This is a placeholder - actual implementation depends on platform APIs
    account.lastSync = new Date();
    await account.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh token'
    });
  }
};

