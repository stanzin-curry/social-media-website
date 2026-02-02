import Account from '../models/Account.model.js';
import axios from 'axios';

// Facebook/Instagram OAuth connection
export const connectFacebookAccount = async ({ userId, accessToken, platformUserId, platformUsername, pages = [] }) => {
  // Check if account already exists
  let account = await Account.findOne({ user: userId, platform: 'facebook' });
  
  if (account) {
    account.accessToken = accessToken;
    account.platformUserId = platformUserId;
    account.platformUsername = platformUsername;
    account.isActive = true;
    account.lastSync = new Date();
    // Update pages array if provided
    if (pages && pages.length > 0) {
      account.pages = pages;
    }
    await account.save();
    return account;
  }

  account = await Account.create({
    user: userId,
    platform: 'facebook',
    platformUserId,
    platformUsername,
    accessToken,
    pages: pages || [],
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

// LinkedIn OAuth connection - supports both personal and company accounts
export const connectLinkedInAccount = async ({ userId, accessToken, refreshToken, platformUserId, platformUsername, expiresIn, pages = [], accountType = 'personal' }) => {
  // accountType: 'personal' or 'company'
  const platform = accountType === 'company' ? 'linkedin-company' : 'linkedin';
  
  let account = await Account.findOne({ user: userId, platform: platform });
  
  const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  if (account) {
    account.accessToken = accessToken;
    if (refreshToken) account.refreshToken = refreshToken;
    if (tokenExpiresAt) account.tokenExpiresAt = tokenExpiresAt;
    account.platformUserId = platformUserId;
    account.platformUsername = platformUsername;
    // Update pages array if provided
    if (pages && pages.length > 0) {
      account.pages = pages.map(page => ({
        id: page.id,
        name: page.name,
        accessToken: accessToken,
        urn: page.urn,
        vanityName: page.vanityName
      }));
    }
    account.isActive = true;
    account.lastSync = new Date();
    await account.save();
    return account;
  }

  account = await Account.create({
    user: userId,
    platform: platform,
    platformUserId,
    platformUsername,
    accessToken,
    refreshToken,
    tokenExpiresAt,
    pages: pages.map(page => ({
      id: page.id,
      name: page.name,
      accessToken: accessToken,
      urn: page.urn,
      vanityName: page.vanityName
    })),
    isActive: true
  });

  return account;
};

// Generate OAuth URLs (for frontend to redirect users)
export const getFacebookAuthUrl = (userId) => {
  // Validate FACEBOOK_CLIENT_ID before generating URL
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) {
    throw new Error('FACEBOOK_CLIENT_ID is not set in environment variables');
  }
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:4000/api/auth/facebook/callback';
  // Facebook scopes for Social Media Scheduler: comma-separated
  // Verify scope includes all required permissions (read_insights needed for analytics)
  // business_management is required to access all pages the user manages
  const scope = 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,read_insights,instagram_basic,instagram_content_publish,business_management';
  // Encode userId in state parameter
  const state = userId ? Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64') : Date.now().toString();
  
  // Build query parameters
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code',
    state: state,
    auth_type: 'rerequest', // Force re-authentication to get updated permissions
    prompt: 'consent' // Request explicit consent for permissions
  });
  
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
};

export const getInstagramAuthUrl = (userId) => {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) {
    throw new Error('FACEBOOK_CLIENT_ID is not set in environment variables');
  }
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:4000/api/auth/instagram/callback';
  // Instagram scopes: requires Facebook OAuth with Instagram permissions (read_insights needed for analytics)
  // business_management is required to access all pages the user manages
  const scope = 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,read_insights,instagram_basic,instagram_content_publish,business_management';
  // Encode userId in state parameter
  const state = userId ? Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64') : Date.now().toString();
  
  return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`;
};

// LinkedIn Personal Profile OAuth URL
export const getLinkedInAuthUrl = (userId) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    throw new Error('LINKEDIN_CLIENT_ID is not set in environment variables');
  }
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:4000/api/auth/linkedin/callback';
  // Personal profile scopes
  const scope = 'openid profile email w_member_social';
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
};

// LinkedIn Company Pages OAuth URL (for Community Management API)
export const getLinkedInCompanyAuthUrl = (userId) => {
  const clientId = process.env.LINKEDIN_COMPANY_CLIENT_ID;
  if (!clientId) {
    throw new Error('LINKEDIN_COMPANY_CLIENT_ID is not set in environment variables');
  }
  const redirectUri = process.env.LINKEDIN_COMPANY_REDIRECT_URI || 'http://localhost:4000/api/auth/linkedin-company/callback';
  // Company pages scopes - includes w_organization_social
  const scope = 'openid profile email w_organization_social';
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now(), accountType: 'company' })).toString('base64');
  
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
};

