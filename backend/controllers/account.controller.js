import Account from '../models/Account.model.js';
import Post from '../models/Post.model.js';
import { connectFacebookAccount, connectInstagramAccount, connectLinkedInAccount } from '../services/oauth.service.js';

export const getAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const accounts = await Account.find({ user: userId, isActive: true });

    // Get post counts for each platform
    const postCounts = await Post.aggregate([
      { $match: { user: userId, status: 'published' } },
      { $unwind: '$platforms' },
      { $group: { _id: '$platforms', count: { $sum: 1 } } }
    ]);

    // Convert post counts to object for easy lookup
    const postCountMap = {};
    postCounts.forEach(item => {
      postCountMap[item._id] = item.count;
    });

    // Enhance accounts with page counts and post counts
    const enhancedAccounts = accounts.map(account => {
      const accountObj = account.toObject();
      
      // Count pages/accounts
      let pageCount = 0;
      if (account.platform === 'facebook' && account.pages) {
        pageCount = account.pages.length;
      } else if (account.platform === 'linkedin-company' && account.pages) {
        pageCount = account.pages.length;
      } else if (account.platform === 'linkedin') {
        pageCount = 1; // Personal profile counts as 1
      }

      accountObj.pageCount = pageCount;
      accountObj.postCount = postCountMap[account.platform] || 0;

      return accountObj;
    });

    // Handle Instagram separately - count Instagram accounts from Facebook pages
    const facebookAccount = accounts.find(acc => acc.platform === 'facebook' && acc.isActive);
    const instagramAccount = accounts.find(acc => acc.platform === 'instagram' && acc.isActive);
    
    if (instagramAccount) {
      const instagramIndex = enhancedAccounts.findIndex(acc => acc.platform === 'instagram');
      if (instagramIndex !== -1) {
        if (facebookAccount && facebookAccount.pages) {
          enhancedAccounts[instagramIndex].pageCount = facebookAccount.pages.filter(page => page.instagramAccount).length;
        } else {
          enhancedAccounts[instagramIndex].pageCount = 1; // At least 1 if connected
        }
      }
    }

    res.json({
      success: true,
      accounts: enhancedAccounts
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

    // Fetch real follower counts from platform APIs
    const axios = (await import('axios')).default;
    let followerCount = 0;

    try {
      if (account.platform === 'facebook' && account.pages && account.pages.length > 0) {
        // For Facebook, get followers from the first page
        const firstPage = account.pages[0];
        try {
          const pageInfo = await axios.get(`https://graph.facebook.com/v19.0/${firstPage.id}`, {
            params: {
              fields: 'fan_count',
              access_token: firstPage.accessToken
            }
          });
          followerCount = pageInfo.data.fan_count || 0;
        } catch (error) {
          console.error('Error fetching Facebook followers:', error.message);
        }
      } else if (account.platform === 'instagram') {
        // For Instagram, get followers from Instagram Business Account
        // Instagram accounts are linked to Facebook pages
        const facebookAccount = await Account.findOne({
          user: userId,
          platform: 'facebook',
          isActive: true
        });
        
        if (facebookAccount && facebookAccount.pages) {
          // Find page with Instagram account
          const pageWithInstagram = facebookAccount.pages.find(page => 
            page.instagramAccount && page.instagramAccount.id === account.platformUserId
          );
          
          if (pageWithInstagram && pageWithInstagram.accessToken) {
            try {
              const igInfo = await axios.get(`https://graph.facebook.com/v19.0/${account.platformUserId}`, {
                params: {
                  fields: 'followers_count',
                  access_token: pageWithInstagram.accessToken
                }
              });
              followerCount = igInfo.data.followers_count || 0;
            } catch (error) {
              console.error('Error fetching Instagram followers:', error.message);
            }
          }
        }
      } else if (account.platform === 'linkedin' || account.platform === 'linkedin-company') {
        // LinkedIn doesn't provide follower count via API easily
        // We'll keep it at 0 or use a placeholder
        followerCount = account.followers || 0;
      }
    } catch (error) {
      console.error('Error fetching followers:', error.message);
    }

    // Update account with fetched data
    account.followers = followerCount;
    account.lastSync = new Date();
    await account.save();

    res.json({
      success: true,
      message: 'Account data refreshed successfully',
      account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh token'
    });
  }
};

export const getFacebookPages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find user's Facebook account
    const facebookAccount = await Account.findOne({
      user: userId,
      platform: 'facebook',
      isActive: true
    });

    if (!facebookAccount) {
      return res.status(404).json({
        success: false,
        message: 'Facebook account not found. Please connect your Facebook account first.'
      });
    }

    // Extract pages and Instagram accounts
    const pages = facebookAccount.pages || [];
    const instagramAccounts = [];
    const axios = (await import('axios')).default;

    // Collect all Instagram accounts from pages and fetch usernames
    for (const page of pages) {
      if (page.instagramAccount && page.instagramAccount.id) {
        let igUsername = page.instagramAccount.username || page.instagramAccount.id;
        
        // Fetch Instagram username if not already stored
        if (!page.instagramAccount.username && page.accessToken) {
          try {
            const igInfoResponse = await axios.get(`https://graph.facebook.com/v19.0/${page.instagramAccount.id}`, {
              params: {
                access_token: page.accessToken,
                fields: 'username'
              }
            });
            if (igInfoResponse.data.username) {
              igUsername = igInfoResponse.data.username;
              
              // Update the page's Instagram account username in database
              await Account.updateOne(
                { 
                  user: userId,
                  platform: 'facebook',
                  'pages.id': page.id
                },
                {
                  $set: {
                    'pages.$.instagramAccount.username': igUsername
                  }
                }
              );
            }
          } catch (igError) {
            console.error(`Error fetching Instagram username for ${page.instagramAccount.id}:`, igError.response?.data || igError.message);
            // Continue with ID if username fetch fails
          }
        }
        
        instagramAccounts.push({
          id: page.instagramAccount.id,
          username: igUsername,
          pageId: page.id,
          pageName: page.name,
          accessToken: page.accessToken // Include access token for posting
        });
      }
    }

    res.json({
      success: true,
      pages: pages.map(page => ({
        id: page.id,
        name: page.name,
        hasInstagram: !!page.instagramAccount
      })),
      instagramAccounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Facebook pages'
    });
  }
};

export const getLinkedInPages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Try to find company LinkedIn account first (for company pages)
    let linkedInAccount = await Account.findOne({
      user: userId,
      platform: 'linkedin-company',
      isActive: true
    });

    // Fallback to personal LinkedIn account if company account not found
    if (!linkedInAccount) {
      linkedInAccount = await Account.findOne({
        user: userId,
        platform: 'linkedin',
        isActive: true
      });
    }

    if (!linkedInAccount) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn account not found. Please connect your LinkedIn account first.'
      });
    }

    const pages = linkedInAccount.pages || [];

    res.json({
      success: true,
      pages: pages.map(page => ({
        id: page.id,
        name: page.name,
        urn: page.urn,
        vanityName: page.vanityName
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch LinkedIn company pages'
    });
  }
};

