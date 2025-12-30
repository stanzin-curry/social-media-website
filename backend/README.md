# Backend API - Social Media Scheduler

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
- MongoDB Atlas connection string
- JWT secret
- OAuth credentials for Facebook, Instagram, and LinkedIn

4. Start the server:
```bash
npm run dev
```

Server runs on `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Posts
- `POST /api/posts` - Create new post (requires auth)
- `GET /api/posts` - Get all posts (requires auth)
- `GET /api/posts/scheduled` - Get scheduled posts (requires auth)
- `GET /api/posts/published` - Get published posts (requires auth)
- `GET /api/posts/:id` - Get post by ID (requires auth)
- `PUT /api/posts/:id` - Update post (requires auth)
- `DELETE /api/posts/:id` - Delete post (requires auth)

### Accounts
- `GET /api/accounts` - Get connected accounts (requires auth)
- `GET /api/accounts/:id` - Get account by ID (requires auth)
- `POST /api/accounts/facebook/connect` - Connect Facebook account (requires auth)
- `POST /api/accounts/instagram/connect` - Connect Instagram account (requires auth)
- `POST /api/accounts/linkedin/connect` - Connect LinkedIn account (requires auth)
- `POST /api/accounts/:id/disconnect` - Disconnect account (requires auth)
- `POST /api/accounts/:id/refresh` - Refresh account token (requires auth)

### Users
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)

## Cron Scheduler

The cron scheduler runs every minute to check for posts ready to publish. It automatically:
1. Finds posts with `status: 'scheduled'` and `scheduledDate <= now`
2. Publishes them to the specified platforms
3. Updates post status to `'published'` or `'failed'`

## File Uploads

Media files are uploaded to `/uploads` directory and served at `/uploads/:filename`.

Maximum file size: 10MB
Supported formats: Images and videos

