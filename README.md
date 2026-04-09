# SocialSync

<!-- Hero Image Placeholder -->
<!-- ![SocialSync Banner](https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=SocialSync+-+Social+Media+Management+Made+Simple) -->

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)

**SocialSync** is a powerful, full-stack social media management dashboard that empowers users to seamlessly connect, create, schedule, and analyze content across multiple platforms. Think Buffer or Hootsuite, but built with modern web technologies and real-time analytics. Whether you're a content creator, marketer, or business owner, SocialSync simplifies your social media workflow by bringing all your accounts into one beautiful, intuitive interface.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📊 **Live Dashboard** | Real-time overview of your social media performance with engagement metrics and post analytics |
| 📅 **Visual Calendar** | Interactive content planner with drag-and-drop scheduling and quick-schedule capabilities |
| 🤖 **Automated Scheduling** | Cron-based background job system that automatically publishes your posts at the perfect time |
| 📈 **Analytics Tracking** | Real-time fetching of post engagement (Likes, Comments, Shares, Reach) via Facebook Graph API |
| 🔐 **Secure OAuth** | Industry-standard OAuth 2.0 authentication with secure token storage - no passwords stored |
| 🎨 **Rich Content Creation** | Create posts with rich text formatting and image uploads, preview before publishing |
| 🔄 **Multi-Platform Support** | Connect and manage Facebook Pages, Instagram Business accounts, and LinkedIn profiles |
| 📱 **Responsive Design** | Beautiful, modern UI that works seamlessly on desktop, tablet, and mobile devices |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library with hooks and context API
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Icons** - Comprehensive icon library for beautiful interfaces
- **React Router DOM** - Declarative routing for single-page applications
- **Chart.js** - Beautiful, responsive charts for analytics visualization
- **Axios** - Promise-based HTTP client for API communication

### Backend
- **Node.js** - JavaScript runtime built on Chrome's V8 engine
- **Express.js** - Fast, unopinionated web framework for Node.js
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - Elegant MongoDB object modeling for Node.js
- **Multer** - Middleware for handling multipart/form-data (file uploads)
- **node-cron** - Task scheduler for automated post publishing
- **JWT (jsonwebtoken)** - Secure token-based authentication
- **bcryptjs** - Password hashing for user security

### DevOps & Tools
- **Axios** - HTTP client for making API requests to social media platforms
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing middleware
- **Concurrently** - Run multiple npm scripts simultaneously

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (version 8.0.0 or higher) - Comes with Node.js
- **MongoDB** - Choose one:
  - **Local MongoDB** - [Download Community Edition](https://www.mongodb.com/try/download/community)
  - **MongoDB Atlas** - [Free tier available](https://www.mongodb.com/cloud/atlas) (recommended for quick setup)
- **Facebook Developer App** - Required for OAuth integration
  - Create an app at [Facebook Developers](https://developers.facebook.com/)
  - Add Facebook Login and Instagram Basic Display products
  - Configure OAuth redirect URIs

### Installation

#### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/social-media-website-main.git
cd social-media-website-main
```

#### Step 2: Backend Setup

```bash
cd backend
npm install
```

#### Step 3: Frontend Setup

```bash
cd ../social-media
npm install
```

**Alternative:** Install all dependencies from the root directory:

```bash
npm run install-all
```

---

## 🔑 Environment Configuration

Create a `.env` file in the `backend` directory with the following configuration:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/social-scheduler
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/social-scheduler

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Facebook OAuth Configuration
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:4000/api/auth/facebook/callback

# Instagram OAuth Configuration (uses Facebook App)
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_REDIRECT_URI=http://localhost:4000/api/auth/instagram/callback

# LinkedIn OAuth Configuration
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:4000/api/auth/linkedin/callback

# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

### ⚠️ Important Notes

**Facebook App Configuration:**
- **Development Mode**: Your Facebook app starts in "Development Mode" by default. In this mode, only app admins, developers, and testers can authenticate.
- **Live Mode**: To make your app available to all users, you must:
  1. Complete Facebook App Review for required permissions
  2. Switch your app to "Live Mode" in the Facebook App Dashboard
  3. Ensure all required permissions are approved (especially `read_insights` for analytics)

**Required Facebook Permissions:**
- `pages_show_list` - List user's Facebook Pages
- `pages_read_engagement` - Read engagement data
- `pages_manage_posts` - Create and manage posts
- `read_insights` - Access analytics (requires App Review)
- `instagram_basic` - Access Instagram Basic Display API
- `instagram_content_publish` - Publish to Instagram

**Security Best Practices:**
- Never commit your `.env` file to version control
- Use strong, unique values for `JWT_SECRET` in production
- Rotate OAuth credentials regularly
- Keep your MongoDB connection string secure

---

## 📖 Usage Guide

### The Happy Path: Connect → Create → Schedule → Track

#### 1. **Connect Your Accounts** 🔗

1. Navigate to the **Accounts** page after logging in
2. Click **Connect** next to Facebook, Instagram, or LinkedIn
3. You'll be redirected to the platform's OAuth consent screen
4. Grant the requested permissions
5. You'll be redirected back to SocialSync with your account connected

**Troubleshooting Facebook Permissions:**
If you encounter permission issues or need to reset OAuth scopes:
1. Go to Facebook Settings → Apps and Websites
2. Find your app and click **Remove**
3. Reconnect your account in SocialSync
4. This "Nuclear Reset" clears all previous permissions and allows fresh OAuth flow

#### 2. **Create Content** ✍️

1. Go to the **Create Post** page
2. Write your post content with rich text formatting
3. Upload images (supports JPG, PNG, GIF)
4. Select which platforms to publish to (Facebook, Instagram, LinkedIn)
5. Preview how your post will look on each platform

#### 3. **Schedule Your Posts** 📅

**Option A: Quick Schedule**
- Click **Schedule** on the Create Post page
- Select date and time
- Post will be automatically published at the scheduled time

**Option B: Visual Calendar**
- Navigate to the **Calendar** page
- View all scheduled posts in a visual calendar
- Drag and drop to reschedule
- Click on posts to edit or delete

**How Scheduling Works:**
- Posts are saved with a `scheduledDate` in the database
- A cron job runs every minute, checking for posts ready to publish
- When the scheduled time arrives, the post is automatically published to selected platforms
- Post status updates to `published` or `failed` based on the result

#### 4. **Track Performance** 📈

1. Visit the **Analytics** page to see overall performance metrics
2. View individual post analytics on the **Activity** page
3. Click **Refresh Analytics** on any published Facebook post to fetch real-time engagement data
4. Metrics include:
   - **Likes** - Total number of likes/reactions
   - **Comments** - Number of comments
   - **Shares** - Number of shares/reposts
   - **Reach** - Number of unique users who saw the post

---

## 📂 Project Structure

```
social-media-website-main/
│
├── backend/                    # Backend API Server
│   ├── config/
│   │   └── database.js        # MongoDB connection configuration
│   ├── controllers/            # Request handlers
│   │   ├── account.controller.js
│   │   ├── auth.controller.js
│   │   ├── post.controller.js
│   │   └── user.controller.js
│   ├── cron/
│   │   └── scheduler.js       # Automated post publishing cron job
│   ├── middleware/
│   │   └── upload.middleware.js
│   ├── models/                # MongoDB schemas
│   │   ├── Account.model.js
│   │   ├── Post.model.js
│   │   └── User.model.js
│   ├── routes/                # API route definitions
│   │   ├── account.routes.js
│   │   ├── auth.routes.js
│   │   ├── post.routes.js
│   │   └── user.routes.js
│   ├── services/              # Business logic & external API integrations
│   │   ├── facebook.service.js
│   │   ├── instagram.service.js
│   │   ├── linkedin.service.js
│   │   ├── oauth.service.js
│   │   └── publish.service.js
│   ├── utils/                 # Utility functions
│   │   ├── jwt.js
│   │   ├── middleware.js
│   │   └── upload.js
│   ├── uploads/               # Uploaded media files
│   ├── server.js              # Express server entry point
│   └── package.json
│
├── social-media/              # Frontend React Application
│   ├── public/
│   ├── src/
│   │   ├── api/               # API client functions
│   │   │   ├── account.api.js
│   │   │   ├── auth.api.js
│   │   │   ├── axios.js
│   │   │   ├── post.api.js
│   │   │   └── user.api.js
│   │   ├── components/        # Reusable UI components
│   │   │   ├── FullCalendar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MiniCalendar.jsx
│   │   │   ├── NotificationPanel.jsx
│   │   │   ├── PlatformSelector.jsx
│   │   │   ├── PostDetailModal.jsx
│   │   │   ├── PostPreviewFacebook.jsx
│   │   │   ├── PostPreviewInstagram.jsx
│   │   │   ├── PostPreviewLinkedIn.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ScheduleModal.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatsCard.jsx
│   │   ├── context/           # React Context for state management
│   │   │   ├── AppContext.jsx
│   │   │   └── AuthContext.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Accounts.jsx
│   │   │   ├── Activity.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Settings.jsx
│   │   ├── utils/             # Helper functions
│   │   │   └── chartSetup.js
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # React entry point
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json               # Root package.json with workspace scripts
└── README.md                  # This file
```

### Key Directories Explained

**Backend:**
- `controllers/` - Handle HTTP requests, validate input, call services
- `services/` - Business logic, external API integrations (Facebook Graph API, LinkedIn API)
- `models/` - MongoDB schemas defining data structure
- `routes/` - Define API endpoints and map them to controllers
- `cron/` - Background jobs for automated tasks (post scheduling)

**Frontend:**
- `api/` - Centralized API client functions using Axios
- `components/` - Reusable UI components (buttons, modals, calendars)
- `pages/` - Full page components (Dashboard, Calendar, Analytics)
- `context/` - Global state management using React Context API

---

## 🤝 Contributing

We welcome contributions to SocialSync! Whether it's bug fixes, new features, documentation improvements, or code optimizations, your help makes this project better for everyone.

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/social-media-website-main.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style and conventions
   - Add comments for complex logic
   - Update documentation if needed

4. **Test Your Changes**
   - Ensure the backend server starts without errors
   - Verify the frontend builds successfully
   - Test your feature thoroughly

5. **Commit Your Changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
   Use clear, descriptive commit messages.

6. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots if UI changes are involved

### Contribution Guidelines

- **Code Style**: Follow the existing code style and formatting
- **Testing**: Test your changes before submitting
- **Documentation**: Update README or add inline comments as needed
- **Issues**: Check existing issues before creating new ones
- **Be Respectful**: Be kind and constructive in discussions

### Areas for Contribution

- 🐛 Bug fixes and error handling improvements
- ✨ New features (analytics enhancements, additional platforms)
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🔒 Security improvements
- 🧪 Test coverage

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 SocialSync Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Note:** This project uses third-party APIs (Facebook Graph API, LinkedIn API, Instagram API). Ensure your usage complies with their respective Terms of Service and API usage policies.

---

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by industry-leading social media management tools
- Thanks to all contributors and the open-source community

---

⭐ **Star this repository if you find it helpful!** Contributions, issues, and feature requests are always welcome.
