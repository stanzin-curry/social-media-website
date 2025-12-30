# Setup Instructions

## Quick Start

### 1. Install All Dependencies

From the root directory, run:
```bash
npm run install-all
```

This will install dependencies for:
- Root package (concurrently)
- Backend
- Frontend

### 2. Create Backend Environment File

Create `backend/.env` file with the following content:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/social-scheduler
JWT_SECRET=dev_secret_key_123

# OAuth Configuration (Placeholders for future use)
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:4000/api/auth/facebook/callback

INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:4000/api/auth/instagram/callback

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://localhost:4000/api/auth/linkedin/callback

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Backend URL (for media URLs)
BACKEND_URL=http://localhost:4000
```

**Note:** Make sure MongoDB is running locally, or update `MONGO_URI` to point to your MongoDB Atlas cluster.

### 3. Start MongoDB (if using local MongoDB)

If you're using local MongoDB, make sure it's running:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
# MongoDB should start automatically as a service
```

### 4. Run Both Servers

From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:4000`
- Frontend server on `http://localhost:5173`

## Individual Commands

### Backend Only
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

### Frontend Only
```bash
npm run dev:frontend
# or
cd social-media && npm run dev
```

## Production Build

Build the frontend:
```bash
npm run build
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the `MONGO_URI` in `backend/.env`
- For MongoDB Atlas, use the connection string format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### Port Already in Use
- Backend default port: 4000
- Frontend default port: 5173
- Change ports in `.env` files if needed

### Missing Dependencies
Run `npm run install-all` again to ensure all dependencies are installed.

