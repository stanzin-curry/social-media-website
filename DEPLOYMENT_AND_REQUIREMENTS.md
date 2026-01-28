# 🚀 Deployment and Requirements Guide

**Moving SocialSync from Local Sandbox to Live Production**

This comprehensive guide covers everything you need to transition your MERN stack Social Media Management tool (SocialSync) from localhost development to a production environment with real users and real analytics.

---

## 📋 Table of Contents

1. [Facebook & Instagram Requirements](#1-facebook--instagram-requirements)
2. [LinkedIn API Requirements](#2-linkedin-api-requirements)
3. [Deployment & Production Checklist](#3-deployment--production-checklist)
4. [Token Management Strategy](#4-token-management-strategy)

---

## 1. Facebook & Instagram Requirements

### 1.1 Required Permissions (Scopes)

Your app currently requests the following scopes (defined in `backend/services/oauth.service.js`):

```javascript
const scope = 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,read_insights,instagram_basic,instagram_content_publish';
```

#### Permission Breakdown

| Scope | Category | Required For | App Review Required |
|-------|----------|--------------|-------------------|
| `email` | Basic | User identification | ❌ No |
| `public_profile` | Basic | User profile data | ❌ No |
| `pages_show_list` | Pages | List user's Facebook Pages | ❌ No |
| `pages_read_engagement` | Analytics | Read engagement metrics (likes, comments, shares) | ❌ No |
| `pages_manage_posts` | Posting | Create and manage posts on Pages | ⚠️ Yes (for public) |
| `read_insights` | Analytics | Access detailed analytics (reach, impressions) | ⚠️ **Yes (Critical)** |
| `instagram_basic` | Instagram | Access Instagram Business Account info | ⚠️ Yes (for public) |
| `instagram_content_publish` | Instagram | Publish to Instagram | ⚠️ Yes (for public) |

#### Permission Categories Explained

**Posting Permissions:**
- `pages_manage_posts` - Allows creating, editing, and deleting posts on Facebook Pages
- `instagram_content_publish` - Allows publishing photos and videos to Instagram Business Accounts

**Analytics Permissions:**
- `pages_read_engagement` - Provides basic engagement metrics (likes, comments, shares) without App Review
- `read_insights` - **REQUIRES APP REVIEW** - Provides advanced metrics like reach, impressions, and detailed analytics

**Basic Permissions:**
- `pages_show_list` - Lists all Facebook Pages the user manages
- `instagram_basic` - Basic Instagram account information

> ⚠️ **Critical Note**: The `read_insights` permission is essential for your analytics feature but requires Facebook App Review approval. Without it, your analytics will only show basic metrics (likes, comments, shares) but not reach/impressions.

### 1.2 App Modes: Development vs. Live

#### Development Mode (Default)

**What it is:**
- Your Facebook app starts in Development Mode by default
- Only app admins, developers, and testers can authenticate
- Permissions work without App Review for these users only

**Limitations:**
- ❌ Public users cannot authenticate
- ❌ Cannot go live without App Review
- ✅ Perfect for testing and development

**How to Check:**
1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Navigate to **Settings** > **Basic**
4. Check **App Mode** section

#### Live Mode (Production)

**What it is:**
- App is publicly available to all Facebook users
- All permissions must be approved through App Review
- Required for production deployment

**Requirements to Go Live:**
1. ✅ Complete App Review for all advanced permissions
2. ✅ Provide Privacy Policy URL
3. ✅ Provide Terms of Service URL
4. ✅ Complete Business Verification (if required)
5. ✅ Switch app to "Live Mode" in dashboard

> ⚠️ **Warning**: Do not switch to Live Mode until App Review is complete. Users will see permission errors if permissions aren't approved.

### 1.3 Business Verification

#### When is Business Verification Required?

Facebook requires Business Verification in these scenarios:

1. **Tech Provider Use Case** - If your app manages social media for multiple clients/businesses
2. **Advanced Permissions** - Some permissions (like `read_insights`) may require Business Verification
3. **App Review Requirements** - Facebook may request Business Verification during App Review

#### Types of Business Verification

**Individual Developer:**
- Personal Facebook account
- Limited to basic permissions
- May not be sufficient for `read_insights` in production

**Business/Organization:**
- Facebook Business Manager account
- Required for Tech Provider use cases
- More likely to get advanced permissions approved

**How to Complete Business Verification:**

1. **Create/Verify Business Manager Account**
   - Go to [Business Manager](https://business.facebook.com/)
   - Create a business account or verify existing one
   - Provide business documentation (tax ID, business license, etc.)

2. **Link App to Business Manager**
   - In App Dashboard, go to **Settings** > **Basic**
   - Add your Business Manager account
   - Transfer app ownership if needed

3. **Submit Verification Documents**
   - Follow Facebook's verification process
   - Provide required business documents
   - Wait for approval (can take several days)

> 💡 **Tip**: Start Business Verification early - it can take 1-2 weeks. Don't wait until App Review.

### 1.4 App Review Process

#### Step-by-Step App Review Guide

**Step 1: Prepare Required Assets**

Before submitting, ensure you have:

- [ ] **Privacy Policy URL** - Must be publicly accessible HTTPS URL
- [ ] **Terms of Service URL** - Must be publicly accessible HTTPS URL
- [ ] **App Icon** - 1024x1024px PNG
- [ ] **App Screenshots** - Show your app's functionality
- [ ] **Screencast Video** - 2-5 minute video demonstrating:
  - User login/authentication flow
  - Connecting Facebook/Instagram accounts
  - Creating and scheduling posts
  - Viewing analytics (if requesting `read_insights`)

**Step 2: Navigate to App Review**

1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Click **App Review** in the left sidebar
4. Click **Permissions and Features**

**Step 3: Request Permissions**

For each permission requiring review:

1. Click **Request** next to the permission
2. Fill out the request form:
   - **Use Case**: Describe how your app uses this permission
   - **Instructions**: Step-by-step instructions for reviewers
   - **Privacy Policy URL**: Your publicly accessible privacy policy
   - **Terms of Service URL**: Your publicly accessible terms

**Step 4: Write Review Instructions**

This is critical - reviewers need clear instructions to test your app.

**Example Review Instructions Template:**

```
REVIEW INSTRUCTIONS FOR [PERMISSION NAME]

1. TEST ACCOUNT SETUP:
   - Use the test account: [test@example.com]
   - Password: [password]
   - This account has a Facebook Page connected

2. AUTHENTICATION FLOW:
   - Visit: https://your-domain.com/login
   - Click "Connect Facebook" button
   - Grant requested permissions
   - You will be redirected back to the app

3. TESTING [PERMISSION NAME]:
   - Navigate to "Create Post" page
   - Create a test post with text and image
   - Schedule the post (or publish immediately)
   - Verify the post appears on the connected Facebook Page
   - [Add specific steps for this permission]

4. ANALYTICS TESTING (if requesting read_insights):
   - Navigate to "Analytics" page
   - Click "Refresh Analytics" on a published post
   - Verify metrics display (likes, comments, shares, reach)

5. NOTES:
   - The app is in development mode, so only test accounts work
   - All test data can be deleted after review
   - Contact: [your-email@example.com] for questions
```

**Step 5: Submit for Review**

1. Review all information for accuracy
2. Ensure all required fields are filled
3. Click **Submit for Review**
4. Wait for review (typically 3-7 business days)

**Step 6: Respond to Reviewer Feedback**

If Facebook requests changes:

1. Check **App Review** > **My Submissions**
2. Read reviewer feedback carefully
3. Make requested changes
4. Resubmit with updated instructions

**Common Review Rejection Reasons:**

- ❌ Insufficient review instructions
- ❌ Privacy Policy doesn't mention data collection
- ❌ App doesn't demonstrate permission usage
- ❌ Test account doesn't work
- ❌ Missing screencast or screenshots

### 1.5 Required Assets Checklist

Before submitting App Review, verify:

- [ ] **Privacy Policy** - Must include:
  - What data you collect (access tokens, user info, posts)
  - How you use the data
  - Third-party services (Facebook, LinkedIn APIs)
  - User rights (data deletion, account removal)
  - Contact information

- [ ] **Terms of Service** - Must include:
  - Service description
  - User responsibilities
  - Limitation of liability
  - API usage compliance

- [ ] **Screencast Video** - Should show:
  - Complete user flow from login to post creation
  - Permission grant screens
  - Actual posting functionality
  - Analytics display (if requesting `read_insights`)

- [ ] **Test Account** - Provide:
  - Email and password
  - Facebook Page connected
  - Instagram Business Account connected (if applicable)

> ⚠️ **Critical**: Your Privacy Policy and Terms of Service MUST be publicly accessible via HTTPS before submitting. Facebook reviewers will check these URLs.

---

## 2. LinkedIn API Requirements

### 2.1 Required Scopes

Your app currently requests the following LinkedIn scopes (defined in `backend/services/oauth.service.js`):

```javascript
const scope = 'openid profile email w_member_social';
```

#### Scope Breakdown

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `openid` | OpenID Connect authentication | User identification |
| `profile` | Basic profile information | Display user name |
| `email` | User email address | Account association |
| `w_member_social` | **Posting permission** | Create and publish posts |

### 2.2 Token Lifespan and Refresh

#### Access Token Lifespan

- **LinkedIn Access Tokens**: Valid for **60 days**
- **Refresh Tokens**: Available and stored in your `Account` model
- **Current Implementation**: Your app stores `refreshToken` and `tokenExpiresAt` in the database

#### Token Refresh Flow

Your current implementation (`backend/models/Account.model.js`) stores:

```javascript
{
  accessToken: String,      // Current access token
  refreshToken: String,     // Refresh token for renewal
  tokenExpiresAt: Date      // Token expiration timestamp
}
```

**Token Refresh Process:**

1. Check `tokenExpiresAt` before making API calls
2. If token expires within 7 days, refresh it
3. Use refresh token to get new access token
4. Update database with new token and expiration

**LinkedIn Token Refresh Endpoint:**

```
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={refresh_token}
&client_id={client_id}
&client_secret={client_secret}
```

### 2.3 Current Implementation Notes

**What's Working:**
- ✅ Refresh tokens are stored in database
- ✅ Token expiration dates are tracked
- ✅ OAuth flow handles refresh tokens

**What Needs Implementation:**
- ⚠️ Automatic token refresh before expiration
- ⚠️ Token refresh endpoint/functionality
- ⚠️ Error handling for expired tokens

**Recommendation:**
Implement automatic token refresh in your `backend/controllers/account.controller.js` `refreshAccountToken` function or create a middleware that checks token expiration before API calls.

---

## 3. Deployment & Production Checklist

### 3.1 HTTPS Requirement

#### Why HTTPS is Required

Facebook **requires HTTPS** for OAuth callback URLs in production. Localhost HTTP URLs will not work for public users.

**Facebook's Requirements:**
- ✅ All callback URLs must use `https://`
- ✅ SSL certificate must be valid (not self-signed)
- ✅ Certificate must be trusted by major browsers

**Current Localhost URLs (Must Change):**

```env
# Development (localhost) - WILL NOT WORK IN PRODUCTION
FACEBOOK_REDIRECT_URI=http://localhost:4000/api/auth/facebook/callback
INSTAGRAM_REDIRECT_URI=http://localhost:4000/api/auth/instagram/callback
LINKEDIN_REDIRECT_URI=http://localhost:4000/api/auth/linkedin/callback
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

**Production URLs (Required):**

```env
# Production (HTTPS required)
FACEBOOK_REDIRECT_URI=https://api.yourdomain.com/api/auth/facebook/callback
INSTAGRAM_REDIRECT_URI=https://api.yourdomain.com/api/auth/instagram/callback
LINKEDIN_REDIRECT_URI=https://api.yourdomain.com/api/auth/linkedin/callback
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

#### SSL Certificate Options

**Free Options:**
- **Let's Encrypt** - Free, automated SSL certificates (recommended)
- **Cloudflare** - Free SSL with CDN
- **AWS Certificate Manager** - Free for AWS-hosted apps

**Paid Options:**
- Commercial SSL certificates (DigiCert, GlobalSign, etc.)
- Usually not necessary - Let's Encrypt is sufficient

### 3.2 Domain Verification

#### Facebook Domain Verification

**Why Verify Your Domain:**
- Required for some advanced features
- Adds credibility to your app
- May be required for App Review

**How to Verify Domain:**

1. **Go to Facebook App Dashboard**
   - Navigate to **Settings** > **Basic**
   - Scroll to **App Domains** section

2. **Add Your Domain**
   - Enter your production domain (e.g., `yourdomain.com`)
   - Click **Add Domain**

3. **Choose Verification Method**
   - **DNS Verification** (Recommended):
     - Add TXT record to your DNS
     - Facebook provides the record value
     - Wait for DNS propagation (up to 48 hours)
   - **HTML File Upload**:
     - Download verification file from Facebook
     - Upload to your web server root
     - Facebook verifies automatically

4. **Complete Verification**
   - Facebook checks your domain
   - Status changes to "Verified" when complete

**DNS TXT Record Example:**

```
Type: TXT
Name: @ (or yourdomain.com)
Value: facebook-domain-verification=abc123xyz789
TTL: 3600
```

### 3.3 Environment Variables Migration

#### Complete Environment Variable Checklist

**Before Deployment:**

Update your `backend/.env` file with production values:

```env
# ============================================
# PRODUCTION ENVIRONMENT VARIABLES
# ============================================

# Server Configuration
PORT=4000
NODE_ENV=production

# Database (Use MongoDB Atlas for production)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/social-scheduler?retryWrites=true&w=majority

# Authentication (USE STRONG SECRET IN PRODUCTION)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long

# Facebook OAuth Configuration (HTTPS REQUIRED)
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://api.yourdomain.com/api/auth/facebook/callback

# Instagram OAuth Configuration (uses Facebook App)
INSTAGRAM_REDIRECT_URI=https://api.yourdomain.com/api/auth/instagram/callback

# LinkedIn OAuth Configuration (HTTPS REQUIRED)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://api.yourdomain.com/api/auth/linkedin/callback

# Application URLs (HTTPS REQUIRED)
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Optional: Mock Analytics (set to false in production)
ENABLE_MOCK_ANALYTICS=false
```

#### Critical Changes from Development

| Variable | Development | Production | Notes |
|----------|-------------|------------|-------|
| `NODE_ENV` | `development` | `production` | Enables production optimizations |
| `MONGO_URI` | `mongodb://localhost:27017/...` | `mongodb+srv://...` | Use MongoDB Atlas |
| `JWT_SECRET` | `dev_secret_key_123` | Strong random string | **MUST be strong** |
| `*_REDIRECT_URI` | `http://localhost:4000/...` | `https://api.yourdomain.com/...` | **HTTPS required** |
| `FRONTEND_URL` | `http://localhost:5173` | `https://yourdomain.com` | **HTTPS required** |
| `BACKEND_URL` | `http://localhost:4000` | `https://api.yourdomain.com` | **HTTPS required** |

> ⚠️ **Security Warning**: Never commit `.env` files to version control. Use environment variable management in your hosting platform (Vercel, Heroku, AWS, etc.).

#### Update Facebook App Settings

After updating environment variables, update your Facebook App:

1. **Go to Facebook App Dashboard**
2. **Settings** > **Basic**
3. **Add Platform** > **Website**
4. **Site URL**: `https://yourdomain.com`
5. **Settings** > **Facebook Login** > **Settings**
6. **Valid OAuth Redirect URIs**: Add `https://api.yourdomain.com/api/auth/facebook/callback`
7. **Settings** > **Instagram Basic Display** (if using)
8. **Valid OAuth Redirect URIs**: Add `https://api.yourdomain.com/api/auth/instagram/callback`

#### Update LinkedIn App Settings

1. **Go to LinkedIn Developer Portal**
2. **Your App** > **Auth** tab
3. **Authorized redirect URLs**: Add `https://api.yourdomain.com/api/auth/linkedin/callback`
4. **Save** changes

### 3.4 File Storage Solutions

#### Current Implementation

Your app currently uses local file storage (`backend/uploads/` folder):

```javascript
// backend/utils/upload.js
const uploadsDir = join(__dirname, '../uploads');
```

**Why This Won't Work in Production:**

- ❌ **Serverless Platforms** (Vercel, Netlify, AWS Lambda): No persistent file system
- ❌ **Container Platforms** (Docker): Files lost on container restart
- ⚠️ **VPS/Cloud Servers**: Works but not scalable or reliable

#### Recommended Solutions

**Option 1: AWS S3 (Recommended for Scalability)**

**Pros:**
- ✅ Highly scalable
- ✅ CDN integration (CloudFront)
- ✅ Reliable and durable
- ✅ Pay-as-you-go pricing

**Implementation Steps:**

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-app-uploads --region us-east-1
   ```

2. **Install AWS SDK**
   ```bash
   npm install aws-sdk multer-s3
   ```

3. **Update Upload Configuration**
   ```javascript
   // backend/utils/upload-s3.js
   import multerS3 from 'multer-s3';
   import aws from 'aws-sdk';
   
   const s3 = new aws.S3({
     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
     region: process.env.AWS_REGION
   });
   
   export const upload = multer({
     storage: multerS3({
       s3: s3,
       bucket: process.env.AWS_S3_BUCKET_NAME,
       acl: 'public-read',
       key: (req, file, cb) => {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
       }
     })
   });
   ```

4. **Update Environment Variables**
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-app-uploads
   ```

**Option 2: Cloudinary (Recommended for Media Optimization)**

**Pros:**
- ✅ Automatic image optimization
- ✅ Video processing
- ✅ Transformations on-the-fly
- ✅ Free tier available (25GB storage)

**Implementation Steps:**

1. **Sign up at [Cloudinary](https://cloudinary.com/)**
2. **Install SDK**
   ```bash
   npm install cloudinary multer-storage-cloudinary
   ```

3. **Update Upload Configuration**
   ```javascript
   // backend/utils/upload-cloudinary.js
   import cloudinary from 'cloudinary';
   import { CloudinaryStorage } from 'multer-storage-cloudinary';
   import multer from 'multer';
   
   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
   });
   
   const storage = new CloudinaryStorage({
     cloudinary: cloudinary,
     params: {
       folder: 'socialsync-uploads',
       allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
     }
   });
   
   export const upload = multer({ storage });
   ```

4. **Update Environment Variables**
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

**Option 3: VPS with Persistent Storage**

If using a VPS (DigitalOcean, Linode, AWS EC2):

- ✅ Local storage works
- ⚠️ Set up automated backups
- ⚠️ Consider moving to S3/Cloudinary for scalability

**Update Media URL Generation**

After implementing cloud storage, update your media URL generation in `backend/services/facebook.service.js`:

```javascript
// Before (local file)
const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
imageUrl = `${baseUrl}/${cleanPath}`;

// After (cloud storage - S3 example)
imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

// Or (Cloudinary)
imageUrl = cloudinary.url(fileKey, { secure: true });
```

### 3.5 Serverless vs. VPS Considerations

#### Serverless Platforms (Vercel, Netlify, AWS Lambda)

**Pros:**
- ✅ Auto-scaling
- ✅ No server management
- ✅ Pay-per-use pricing
- ✅ Built-in CDN

**Cons:**
- ❌ No persistent file system (must use S3/Cloudinary)
- ❌ Cold starts can cause delays
- ❌ Limited execution time (5-15 minutes)
- ❌ More complex for cron jobs

**Best For:**
- Frontend hosting (Vercel, Netlify)
- API endpoints with cloud storage
- Low to medium traffic

#### VPS/Cloud Servers (DigitalOcean, AWS EC2, Linode)

**Pros:**
- ✅ Full control
- ✅ Persistent file system (with backups)
- ✅ No execution time limits
- ✅ Easy cron job setup

**Cons:**
- ⚠️ Server management required
- ⚠️ Manual scaling
- ⚠️ Fixed monthly costs
- ⚠️ Security updates needed

**Best For:**
- Full-stack applications
- Cron jobs (post scheduling)
- High traffic applications
- When you need full control

#### Recommended Architecture

**Hybrid Approach (Best of Both Worlds):**

```
Frontend (React)     → Vercel/Netlify (CDN, auto-scaling)
Backend API          → VPS/EC2 (cron jobs, persistent connections)
File Storage         → AWS S3 or Cloudinary (scalable, reliable)
Database             → MongoDB Atlas (managed, scalable)
```

### 3.6 Database Considerations

#### MongoDB Atlas (Recommended)

**Why Use MongoDB Atlas:**
- ✅ Managed service (no server management)
- ✅ Automatic backups
- ✅ Built-in monitoring
- ✅ Free tier available (512MB)
- ✅ Auto-scaling

**Migration Steps:**

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free cluster

2. **Create Database User**
   - Database Access > Add New User
   - Create username and password
   - Save credentials securely

3. **Whitelist IP Addresses**
   - Network Access > Add IP Address
   - Add your server IP or `0.0.0.0/0` for development (restrict in production)

4. **Get Connection String**
   - Clusters > Connect > Connect your application
   - Copy connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

5. **Update Environment Variable**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/social-scheduler?retryWrites=true&w=majority
   ```

### 3.7 Pre-Deployment Checklist

Before going live, verify:

- [ ] **HTTPS Setup**
  - [ ] SSL certificate installed and valid
  - [ ] All URLs use `https://`
  - [ ] No mixed content warnings

- [ ] **Environment Variables**
  - [ ] All `localhost` URLs changed to production domains
  - [ ] Strong `JWT_SECRET` set
  - [ ] Database connection string updated
  - [ ] OAuth credentials verified

- [ ] **Facebook App Configuration**
  - [ ] OAuth redirect URIs updated in Facebook App Dashboard
  - [ ] App Domains added and verified
  - [ ] App Review completed (if going Live)
  - [ ] Business Verification completed (if required)

- [ ] **LinkedIn App Configuration**
  - [ ] Redirect URIs updated in LinkedIn Developer Portal

- [ ] **File Storage**
  - [ ] Cloud storage configured (S3/Cloudinary)
  - [ ] Upload functionality tested
  - [ ] Media URLs accessible publicly

- [ ] **Database**
  - [ ] MongoDB Atlas cluster created
  - [ ] Connection tested
  - [ ] Backups enabled

- [ ] **Security**
  - [ ] `.env` file not committed to git
  - [ ] CORS configured for production domain only
  - [ ] Rate limiting implemented
  - [ ] Error messages don't expose sensitive data

- [ ] **Testing**
  - [ ] OAuth flows tested end-to-end
  - [ ] Post creation and publishing tested
  - [ ] Analytics fetching tested
  - [ ] File uploads tested

---

## 4. Token Management Strategy

### 4.1 Current Implementation Analysis

#### Facebook Token Management

**Current State:**
- ✅ Short-lived tokens (1 hour) received from OAuth
- ❌ **No long-lived token exchange implemented**
- ❌ No automatic token refresh
- ⚠️ Tokens expire after 1 hour - users must re-authenticate

**Token Flow:**
```
User OAuth → Authorization Code → Short-lived Token (1 hour) → Stored in DB
```

**Problem:**
After 1 hour, the token expires and users must reconnect their Facebook account.

#### LinkedIn Token Management

**Current State:**
- ✅ Access tokens (60 days) received from OAuth
- ✅ Refresh tokens stored in database
- ✅ Token expiration dates tracked (`tokenExpiresAt`)
- ⚠️ **No automatic refresh implemented** (refresh endpoint exists but not called automatically)

**Token Flow:**
```
User OAuth → Authorization Code → Access Token (60 days) + Refresh Token → Stored in DB
```

### 4.2 Facebook Long-Lived Tokens

#### What Are Long-Lived Tokens?

- **Short-lived tokens**: Valid for **1 hour** (current implementation)
- **Long-lived tokens**: Valid for **60 days** (recommended for production)

#### How to Exchange for Long-Lived Token

**Exchange Endpoint:**

```
GET https://graph.facebook.com/v19.0/oauth/access_token?
  grant_type=fb_exchange_token
  &client_id={app-id}
  &client_secret={app-secret}
  &fb_exchange_token={short-lived-token}
```

**Response:**
```json
{
  "access_token": "long-lived-token-here",
  "token_type": "bearer",
  "expires_in": 5183944  // Seconds (60 days)
}
```

#### Implementation: Exchange Token After OAuth

Update `backend/controllers/auth.controller.js`:

```javascript
// After receiving short-lived token (line 265)
const { access_token } = tokenResponse.data;

// Exchange for long-lived token
try {
  const longLivedResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET,
      fb_exchange_token: access_token
    }
  });

  const longLivedToken = longLivedResponse.data.access_token;
  const expiresIn = longLivedResponse.data.expires_in; // seconds
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // Store long-lived token and expiration
  await connectFacebookAccount({
    userId,
    accessToken: longLivedToken,
    platformUserId,
    platformUsername,
    expiresIn: expiresIn,
    tokenExpiresAt: tokenExpiresAt
  });
} catch (error) {
  console.error('Failed to exchange for long-lived token:', error);
  // Fallback to short-lived token
  await connectFacebookAccount({
    userId,
    accessToken: access_token,
    platformUserId,
    platformUsername
  });
}
```

**Update Account Model:**

Update `backend/models/Account.model.js` to store expiration for Facebook:

```javascript
// Already exists, but ensure it's used for Facebook too
tokenExpiresAt: {
  type: Date
}
```

**Update OAuth Service:**

Update `backend/services/oauth.service.js`:

```javascript
export const connectFacebookAccount = async ({ 
  userId, 
  accessToken, 
  platformUserId, 
  platformUsername,
  expiresIn,
  tokenExpiresAt 
}) => {
  let account = await Account.findOne({ user: userId, platform: 'facebook' });
  
  const updateData = {
    accessToken,
    platformUserId,
    platformUsername,
    isActive: true,
    lastSync: new Date()
  };

  if (tokenExpiresAt) {
    updateData.tokenExpiresAt = tokenExpiresAt;
  } else if (expiresIn) {
    updateData.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
  }

  if (account) {
    Object.assign(account, updateData);
    await account.save();
    return account;
  }

  account = await Account.create({
    user: userId,
    platform: 'facebook',
    ...updateData
  });

  return account;
};
```

### 4.3 Token Refresh Strategy

#### Facebook Token Refresh

**Important:** Facebook long-lived tokens **cannot be refreshed**. They must be re-exchanged before expiration.

**Strategy:**
1. Check token expiration before API calls
2. If token expires within 7 days, prompt user to reconnect
3. Re-run OAuth flow to get new token
4. Exchange for new long-lived token

**Implementation: Middleware to Check Token Expiration**

Create `backend/middleware/tokenCheck.middleware.js`:

```javascript
import Account from '../models/Account.model.js';

export const checkTokenExpiration = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const platform = req.body.platform || req.query.platform || 'facebook';

    const account = await Account.findOne({
      user: userId,
      platform: platform,
      isActive: true
    });

    if (!account) {
      return res.status(401).json({
        success: false,
        message: `No active ${platform} account found`
      });
    }

    // Check if token is expired or expires soon (within 7 days)
    if (account.tokenExpiresAt) {
      const daysUntilExpiration = (account.tokenExpiresAt - new Date()) / (1000 * 60 * 60 * 24);
      
      if (daysUntilExpiration < 0) {
        return res.status(401).json({
          success: false,
          message: `${platform} token expired. Please reconnect your account.`,
          requiresReconnect: true
        });
      }

      if (daysUntilExpiration < 7) {
        // Token expires soon - warn user
        req.tokenExpiresSoon = true;
        req.daysUntilExpiration = Math.ceil(daysUntilExpiration);
      }
    }

    req.account = account;
    next();
  } catch (error) {
    next(error);
  }
};
```

#### LinkedIn Token Refresh

**Strategy:**
1. Check `tokenExpiresAt` before API calls
2. If token expires within 7 days, refresh automatically
3. Use refresh token to get new access token
4. Update database with new token

**Implementation: Refresh LinkedIn Token**

Update `backend/controllers/account.controller.js`:

```javascript
import axios from 'axios';

export const refreshAccountToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const accountId = req.params.id;

    const account = await Account.findOne({
      _id: accountId,
      user: userId,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    if (account.platform === 'linkedin' && account.refreshToken) {
      // Refresh LinkedIn token
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refreshToken,
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
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

      account.accessToken = access_token;
      if (refresh_token) account.refreshToken = refresh_token;
      account.tokenExpiresAt = tokenExpiresAt;
      account.lastSync = new Date();
      await account.save();

      return res.json({
        success: true,
        message: 'Token refreshed successfully',
        expiresAt: tokenExpiresAt
      });
    } else if (account.platform === 'facebook') {
      // Facebook tokens cannot be refreshed - user must reconnect
      return res.status(400).json({
        success: false,
        message: 'Facebook tokens cannot be refreshed. Please reconnect your account.',
        requiresReconnect: true
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Token refresh not supported for this platform'
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.error_description || 'Failed to refresh token'
    });
  }
};
```

### 4.4 Maintenance Schedule

#### Recommended Token Maintenance

**Facebook (Long-Lived Tokens - 60 days):**

- ✅ **Day 1**: User connects account, receives 60-day token
- ⚠️ **Day 53** (7 days before expiration): Show warning to user
- ⚠️ **Day 60**: Token expires, user must reconnect

**Maintenance Tasks:**
- [ ] Implement token expiration check before API calls
- [ ] Show warning UI when token expires soon
- [ ] Email notification 7 days before expiration
- [ ] Automatic reconnection prompt when token expires

**LinkedIn (Access Tokens - 60 days):**

- ✅ **Day 1**: User connects account, receives 60-day token + refresh token
- ✅ **Day 53**: Automatically refresh token using refresh token
- ✅ **Day 60+**: Continue using refreshed token

**Maintenance Tasks:**
- [ ] Implement automatic token refresh 7 days before expiration
- [ ] Handle refresh token expiration (rare, but possible)
- [ ] Fallback to reconnection if refresh fails

#### Token Expiration Monitoring

**Create Cron Job for Token Checks:**

Update `backend/cron/scheduler.js`:

```javascript
import cron from 'node-cron';
import Account from '../models/Account.model.js';

// Check token expiration daily
cron.schedule('0 0 * * *', async () => {
  console.log('Checking token expiration...');
  
  const accounts = await Account.find({ isActive: true });
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const account of accounts) {
    if (account.tokenExpiresAt) {
      const daysUntilExpiration = (account.tokenExpiresAt - now) / (1000 * 60 * 60 * 24);
      
      if (daysUntilExpiration < 0) {
        // Token expired - deactivate account
        account.isActive = false;
        await account.save();
        console.log(`Deactivated expired ${account.platform} account for user ${account.user}`);
      } else if (daysUntilExpiration < 7 && account.tokenExpiresAt <= sevenDaysFromNow) {
        // Token expires soon - send notification (implement email service)
        console.log(`Token expires soon for ${account.platform} account (user ${account.user})`);
        // TODO: Send email notification
      }
    }
  }
});
```

### 4.5 Production Token Management Checklist

Before deploying, ensure:

- [ ] **Facebook Long-Lived Token Exchange**
  - [ ] Implemented in OAuth callback
  - [ ] Token expiration stored in database
  - [ ] Error handling for exchange failures

- [ ] **LinkedIn Token Refresh**
  - [ ] Refresh endpoint implemented
  - [ ] Automatic refresh before expiration
  - [ ] Error handling for refresh failures

- [ ] **Token Expiration Monitoring**
  - [ ] Cron job checks expiration daily
  - [ ] User notifications before expiration
  - [ ] Account deactivation for expired tokens

- [ ] **User Experience**
  - [ ] Warning UI when token expires soon
  - [ ] Clear reconnection flow
  - [ ] Error messages guide users to reconnect

---

## 📝 Summary

### Critical Path to Production

1. **Facebook App Review** (2-4 weeks)
   - Complete Business Verification (if required)
   - Submit App Review with all required assets
   - Get `read_insights` permission approved

2. **Infrastructure Setup** (1-2 days)
   - Set up HTTPS/SSL certificates
   - Configure production domain
   - Set up cloud file storage (S3/Cloudinary)
   - Migrate to MongoDB Atlas

3. **Environment Configuration** (1 day)
   - Update all environment variables
   - Update OAuth redirect URIs in Facebook/LinkedIn dashboards
   - Verify domain in Facebook Business Manager

4. **Token Management** (1-2 days)
   - Implement long-lived token exchange for Facebook
   - Implement automatic token refresh for LinkedIn
   - Set up token expiration monitoring

5. **Testing** (2-3 days)
   - Test OAuth flows end-to-end
   - Test post creation and publishing
   - Test analytics fetching
   - Test file uploads

6. **Go Live** (1 day)
   - Switch Facebook app to Live Mode
   - Deploy to production
   - Monitor for errors

### Estimated Timeline

- **Minimum**: 3-4 weeks (if App Review is quick)
- **Realistic**: 4-6 weeks (accounting for App Review delays)
- **With Business Verification**: 6-8 weeks

### Key Takeaways

1. ⚠️ **Facebook App Review is the longest step** - Start early
2. ⚠️ **HTTPS is required** - Cannot use HTTP in production
3. ⚠️ **File storage must be cloud-based** - Local storage won't work on serverless
4. ⚠️ **Token management is critical** - Implement long-lived tokens and refresh logic
5. ✅ **Test thoroughly** - OAuth flows are complex and errors are hard to debug in production

---

## 🔗 Additional Resources

- [Facebook App Review Documentation](https://developers.facebook.com/docs/app-review)
- [Facebook Long-Lived Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived-tokens)
- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [MongoDB Atlas Setup Guide](https://docs.atlas.mongodb.com/getting-started/)
- [AWS S3 Setup Guide](https://docs.aws.amazon.com/s3/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

**Last Updated**: 2024
**Version**: 1.0

