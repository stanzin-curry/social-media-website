import Account from '../models/Account.model.js';
import axios from 'axios';

// Facebook/Instagram OAuth connection
export const connectFacebookAccount = async ({ userId, accessToken, platformUserId, platformUsername }) => {
  // Check if account already exists
  let account = await Account.findOne({ user: userId, platform: 'facebook' });
  
  if (account) {
    account.accessToken = accessToken;
    account.platformUserId = platformUserId;
    account.platformUsername = platformUsername;
    account.isActive = true;
    account.lastSync = new Date();
    await account.save();
    return account;
  }

  account = await Account.create({
    user: userId,
    platform: 'facebook',
    platformUserId,
    platformUsername,
    accessToken,
    isActive: true
  });

  return account;
};

// Instagram OAuth connection (uses Facebook Graph API)
export const connectInstagramAccount = async ({ userId, accessToken, platformUserId, platformUsername }) => {
  let account = await Account.findOne({ user: userId, platform: 'instagram' });
  
  if (account) {
    account.accessToken = accessToken;
    account.platformUserId = platformUserId;
    account.platformUsername = platformUsername;
    account.isActive = true;
    account.lastSync = new Date();
    await account.save();
    return account;
  }

  account = await Account.create({
    user: userId,
    platform: 'instagram',
    platformUserId,
    platformUsername,
    accessToken,
    isActive: true
  });

  return account;
};

// LinkedIn OAuth connection
export const connectLinkedInAccount = async ({ userId, accessToken, refreshToken, platformUserId, platformUsername, expiresIn }) => {
  let account = await Account.findOne({ user: userId, platform: 'linkedin' });
  
  const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  if (account) {
    account.accessToken = accessToken;
    if (refreshToken) account.refreshToken = refreshToken;
    if (tokenExpiresAt) account.tokenExpiresAt = tokenExpiresAt;
    account.platformUserId = platformUserId;
    account.platformUsername = platformUsername;
    account.isActive = true;
    account.lastSync = new Date();
    await account.save();
    return account;
  }

  account = await Account.create({
    user: userId,
    platform: 'linkedin',
    platformUserId,
    platformUsername,
    accessToken,
    refreshToken,
    tokenExpiresAt,
    isActive: true
  });

  return account;
};

// Generate OAuth URLs (for frontend to redirect users)
export const getFacebookAuthUrl = (userId) => {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) {
    throw new Error('FACEBOOK_CLIENT_ID is not set in environment variables');
  }
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:4000/api/auth/facebook/callback';
  const scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';
  // Encode userId in state parameter
  const state = userId ? Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64') : Date.now().toString();
  
  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`;
};

export const getInstagramAuthUrl = (userId) => {
  // Instagram uses Facebook OAuth
  return getFacebookAuthUrl(userId);
};

export const getLinkedInAuthUrl = (userId) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    throw new Error('LINKEDIN_CLIENT_ID is not set in environment variables');
  }
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:4000/api/auth/linkedin/callback';
  // OpenID Connect scopes
  const scope = 'openid profile email w_member_social';
  // Encode userId in state parameter
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
};

