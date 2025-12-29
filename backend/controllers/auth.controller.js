import User from '../models/User.model.js';
import { generateToken } from '../utils/jwt.js';
import { getLinkedInAuthUrl, getFacebookAuthUrl, getInstagramAuthUrl } from '../services/oauth.service.js';
import { connectLinkedInAccount, connectFacebookAccount, connectInstagramAccount } from '../services/oauth.service.js';
import axios from 'axios';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// LinkedIn OAuth - Return OAuth URL as JSON
export const linkedinAuth = async (req, res) => {
  try {
    // Get user ID from authenticated user (requires authentication middleware)
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    const authUrl = getLinkedInAuthUrl(userId);
    res.json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate LinkedIn OAuth'
    });
  }
};

// LinkedIn OAuth Callback
export const linkedinCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=missing_code`);
    }

    // Extract userId from state parameter
    let userId;
    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString());
        userId = decodedState.userId;
      }
    } catch (err) {
      console.error('Error decoding state:', err);
    }

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=invalid_state`);
    }

    // Exchange authorization code for access token
    // LinkedIn expects form-encoded data in the body, not query params
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:4000/api/auth/linkedin/callback',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user profile using OpenID Connect userinfo endpoint
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const profile = profileResponse.data;
    // OIDC response fields: sub (user ID), name, email, picture
    const platformUserId = profile.sub;
    const platformUsername = profile.name || profile.email || profile.sub;

    // Save account
    await connectLinkedInAccount({
      userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      platformUserId,
      platformUsername,
      expiresIn: expires_in
    });

    // Redirect to frontend accounts page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?success=linkedin_connected`);
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=${encodeURIComponent(error.response?.data?.error_description || error.message || 'oauth_failed')}`);
  }
};

// Facebook OAuth - Return OAuth URL as JSON
export const facebookAuth = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    const authUrl = getFacebookAuthUrl(userId);
    res.json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Facebook OAuth'
    });
  }
};

// Facebook OAuth Callback
export const facebookCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=missing_code`);
    }

    // Extract userId from state parameter
    let userId;
    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString());
        userId = decodedState.userId;
      }
    } catch (err) {
      console.error('Error decoding state:', err);
    }

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=invalid_state`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:4000/api/auth/facebook/callback',
        code: code
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: access_token,
        fields: 'id,name,email'
      }
    });

    const profile = profileResponse.data;
    const platformUserId = profile.id;
    const platformUsername = profile.name || profile.email || profile.id;

    // Save account
    await connectFacebookAccount({
      userId,
      accessToken: access_token,
      platformUserId,
      platformUsername
    });

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?success=facebook_connected`);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=${encodeURIComponent(error.response?.data?.error?.message || error.message || 'oauth_failed')}`);
  }
};

// Instagram OAuth - Return OAuth URL as JSON (uses Facebook OAuth)
export const instagramAuth = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    const authUrl = getInstagramAuthUrl(userId);
    res.json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Instagram OAuth'
    });
  }
};

// Instagram OAuth Callback (uses Facebook OAuth)
export const instagramCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=missing_code`);
    }

    // Extract userId from state parameter
    let userId;
    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString());
        userId = decodedState.userId;
      }
    } catch (err) {
      console.error('Error decoding state:', err);
    }

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=invalid_state`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:4000/api/auth/instagram/callback',
        code: code
      }
    });

    const { access_token } = tokenResponse.data;

    // Get Instagram Business Account ID (requires Facebook Page connection)
    // First, get user's pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: access_token
      }
    });

    const pages = pagesResponse.data.data;
    if (!pages || pages.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=no_facebook_page`);
    }

    // Get Instagram Business Account connected to the first page
    const pageId = pages[0].id;
    const instagramResponse = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        access_token: access_token,
        fields: 'instagram_business_account'
      }
    });

    const instagramAccountId = instagramResponse.data.instagram_business_account?.id;
    if (!instagramAccountId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=no_instagram_account`);
    }

    // Get Instagram account info
    const instagramInfoResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccountId}`, {
      params: {
        access_token: access_token,
        fields: 'username'
      }
    });

    const platformUserId = instagramAccountId;
    const platformUsername = instagramInfoResponse.data.username || instagramAccountId;

    // Save account
    await connectInstagramAccount({
      userId,
      accessToken: access_token,
      platformUserId,
      platformUsername
    });

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?success=instagram_connected`);
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=${encodeURIComponent(error.response?.data?.error?.message || error.message || 'oauth_failed')}`);
  }
};

