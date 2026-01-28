import User from '../models/User.model.js';
import { generateToken } from '../utils/jwt.js';
import { getLinkedInAuthUrl, getFacebookAuthUrl, getInstagramAuthUrl } from '../services/oauth.service.js';
import { connectLinkedInAccount, connectFacebookAccount, connectInstagramAccount } from '../services/oauth.service.js';
import { createLinkedInPost } from '../services/linkedin.service.js';
import { createFacebookPost, postToInstagram } from '../services/facebook.service.js';
import Account from '../models/Account.model.js';
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
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:4000/api/auth/facebook/callback',
        code: code
      }
    });

    const { access_token } = tokenResponse.data;

    // Debug: Log token received
    console.log("🔍 Token received. Fetching pages...");

    // Debug: Check token scopes
    try {
      const debugTokenResponse = await axios.get('https://graph.facebook.com/v19.0/debug_token', {
        params: {
          input_token: access_token,
          access_token: `${process.env.FACEBOOK_CLIENT_ID}|${process.env.FACEBOOK_CLIENT_SECRET}`
        }
      });
      console.log('=== Token Debug Info ===');
      console.log('Token scopes:', debugTokenResponse.data.data?.scopes);
      console.log('Token user ID:', debugTokenResponse.data.data?.user_id);
      console.log('=== End Token Debug ===');
    } catch (debugError) {
      console.warn('Could not debug token:', debugError.message);
    }

    // Get user profile
    const profileResponse = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        access_token: access_token,
        fields: 'id,name,email'
      }
    });

    const profile = profileResponse.data;
    const platformUserId = profile.id;
    const platformUsername = profile.name || profile.email || profile.id;

    // Fetch user's Pages with Instagram Business Account details
    let pagesArray = [];
    try {
      // Fetch all pages with pagination support
      let allPages = [];
      let nextUrl = null;
      let hasMore = true;
      let pageCount = 0;
      
      while (hasMore) {
        let pagesResponse;
        
        if (nextUrl) {
          // Follow pagination URL (already contains all parameters)
          pagesResponse = await axios.get(nextUrl);
        } else {
          // First request - use params
          pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
            params: {
              fields: 'name,access_token,id,instagram_business_account',
              access_token: access_token,
              limit: 100 // Request up to 100 pages per request
            }
          });
        }

        const pages = pagesResponse.data.data || [];
        allPages = allPages.concat(pages);
        pageCount++;
        
        console.log(`📄 Fetched page ${pageCount}: ${pages.length} pages (Total so far: ${allPages.length})`);
        
        // Check if there are more pages
        if (pagesResponse.data.paging && pagesResponse.data.paging.next) {
          nextUrl = pagesResponse.data.paging.next;
        } else {
          hasMore = false;
        }
      }
      
      console.log('=== Facebook Pages Response ===');
      console.log('Total pages found:', allPages.length);
      console.log('Pages data:', JSON.stringify({
        data: allPages.map(p => ({ id: p.id, name: p.name })),
        total: allPages.length
      }, null, 2));
      console.log('=== End Facebook Pages Response ===');

      // Map pages to the format needed for Account.pages array
      pagesArray = allPages.map(page => {
        const pageData = {
          id: page.id,
          name: page.name,
          accessToken: page.access_token
        };

        // Include Instagram Business Account if available
        if (page.instagram_business_account) {
          pageData.instagramAccount = {
            id: page.instagram_business_account.id,
            username: page.instagram_business_account.username || null
          };
        }

        return pageData;
      });

      // Find the first page with an Instagram Business Account and save it separately
      if (allPages && allPages.length > 0) {
        for (const page of allPages) {
          if (page.instagram_business_account) {
            console.log("📸 Found Instagram Business ID: " + page.instagram_business_account.id);
            const igAccount = page.instagram_business_account;
            const pageAccessToken = page.access_token; // Use Page's access token, not user's
            
            // Get Instagram account username
            let igUsername = igAccount.username || igAccount.id;
            try {
              const igInfoResponse = await axios.get(`https://graph.facebook.com/v19.0/${igAccount.id}`, {
                params: {
                  access_token: pageAccessToken,
                  fields: 'username'
                }
              });
              if (igInfoResponse.data.username) {
                igUsername = igInfoResponse.data.username;
              }
            } catch (igInfoError) {
              console.error('Error fetching Instagram username:', igInfoError.response?.data || igInfoError.message);
              // Continue with ID if username fetch fails
            }

            // Save Instagram account using findOneAndUpdate with upsert
            await Account.findOneAndUpdate(
              { 
                user: userId, 
                platform: 'instagram' 
              },
              {
                user: userId,
                platform: 'instagram',
                platformUserId: igAccount.id,
                platformUsername: igUsername,
                accessToken: pageAccessToken, // Critical: Use Page's token, not user's
                isActive: true,
                lastSync: new Date()
              },
              { 
                upsert: true,
                new: true
              }
            );

            console.log('Instagram Business Account automatically connected:', igAccount.id);
            break; // Only save the first IG account found
          }
        }
      }
    } catch (pagesError) {
      console.error('Error fetching Facebook Pages or Instagram accounts:', pagesError.response?.data || pagesError.message);
      console.warn("⚠️ No pages found. User might need to 'Reconnect' and select pages.");
      // Continue with account save even if Pages fetch fails
    }

    // Save Facebook account with pages array
    await connectFacebookAccount({
      userId,
      accessToken: access_token,
      platformUserId,
      platformUsername,
      pages: pagesArray
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
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:4000/api/auth/instagram/callback',
        code: code
      }
    });

    const { access_token } = tokenResponse.data;

    // Fetch pages with Instagram Business Account details (with pagination support)
    let allPages = [];
    let nextUrl = null;
    let hasMore = true;
    
    while (hasMore) {
      let pagesResponse;
      
      if (nextUrl) {
        // Follow pagination URL (already contains all parameters)
        pagesResponse = await axios.get(nextUrl);
      } else {
        // First request - use params
        pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
          params: {
            fields: 'access_token,name,instagram_business_account',
            access_token: access_token,
            limit: 100
          }
        });
      }

      const pages = pagesResponse.data.data || [];
      allPages = allPages.concat(pages);
      
      // Check if there are more pages
      if (pagesResponse.data.paging && pagesResponse.data.paging.next) {
        nextUrl = pagesResponse.data.paging.next;
      } else {
        hasMore = false;
      }
    }

    if (!allPages || allPages.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=no_facebook_page`);
    }

    // Find the first page with an Instagram Business Account
    let instagramAccount = null;
    let pageAccessToken = null;
    let pageName = null;

    for (const page of allPages) {
      if (page.instagram_business_account) {
        instagramAccount = page.instagram_business_account;
        pageAccessToken = page.access_token; // Critical: Use Page's token, not user's
        pageName = page.name;
        break;
      }
    }

    if (!instagramAccount) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=no_instagram_account`);
    }

    // Get Instagram account username
    let igUsername = instagramAccount.username || instagramAccount.id;
    try {
      const igInfoResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramAccount.id}`, {
        params: {
          access_token: pageAccessToken,
          fields: 'username'
        }
      });
      if (igInfoResponse.data.username) {
        igUsername = igInfoResponse.data.username;
      }
    } catch (igInfoError) {
      console.error('Error fetching Instagram username:', igInfoError.response?.data || igInfoError.message);
      // Continue with ID if username fetch fails
    }

    // Save Instagram account using findOneAndUpdate with upsert
    // Use Page's access token (critical for Instagram API calls)
    await Account.findOneAndUpdate(
      { 
        user: userId, 
        platform: 'instagram' 
      },
      {
        user: userId,
        platform: 'instagram',
        platformUserId: instagramAccount.id,
        platformUsername: igUsername,
        accessToken: pageAccessToken, // Critical: Use Page's token, not user's
        isActive: true,
        lastSync: new Date()
      },
      { 
        upsert: true,
        new: true
      }
    );

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?success=instagram_connected`);
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?error=${encodeURIComponent(error.response?.data?.error?.message || error.message || 'oauth_failed')}`);
  }
};

// Test route for LinkedIn post creation
export const testLinkedInPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    // Find user's LinkedIn account
    const account = await Account.findOne({
      user: userId,
      platform: 'linkedin',
      isActive: true
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn account not found. Please connect your LinkedIn account first.'
      });
    }

    // Format person URN: urn:li:person:{platformUserId}
    // platformUserId should be the 'sub' from OIDC (just the ID, not a URN)
    const personUrn = `urn:li:person:${account.platformUserId}`;

    // Create the post
    const result = await createLinkedInPost(
      account.accessToken,
      personUrn,
      text
    );

    res.json({
      success: true,
      message: 'Post created successfully',
      data: result
    });
  } catch (error) {
    console.error('LinkedIn post creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create LinkedIn post',
      error: error.response?.data || error.message
    });
  }
};

// Test route for Facebook post creation
export const testFacebookPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    // Find user's Facebook account
    const account = await Account.findOne({
      user: userId,
      platform: 'facebook',
      isActive: true
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Facebook account not found. Please connect your Facebook account first.'
      });
    }

    // Create the post
    const result = await createFacebookPost(
      account.accessToken,
      text
    );

    res.json({
      success: true,
      message: 'Post created successfully',
      data: result
    });
  } catch (error) {
    console.error('Facebook post creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Facebook post',
      error: error.response?.data || error.message
    });
  }
};

// Test route for Instagram post creation
export const testInstagramPost = async (req, res) => {
  try {
    const { accessToken, instagramId, imageUrl, caption } = req.body;
    const userId = req.user._id;

    // If accessToken and instagramId are not provided, try to get from user's account
    let token = accessToken;
    let igId = instagramId;

    if (!token || !igId) {
      // Find user's Instagram account
      const account = await Account.findOne({
        user: userId,
        platform: 'instagram',
        isActive: true
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Instagram account not found. Please connect your Instagram account first.'
        });
      }

      token = token || account.accessToken;
      igId = igId || account.platformUserId;
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required'
      });
    }

    if (!caption) {
      return res.status(400).json({
        success: false,
        message: 'caption is required'
      });
    }

    // Create the post
    const result = await postToInstagram(
      token,
      igId,
      imageUrl,
      caption
    );

    res.json({
      success: true,
      message: 'Instagram post created successfully',
      data: result
    });
  } catch (error) {
    console.error('Instagram post creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Instagram post',
      error: error.response?.data || error.message
    });
  }
};

