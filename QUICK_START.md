# Quick Start Guide

## Prerequisites

Before running the application, you need:

1. **Node.js and npm** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **MongoDB** (local or Atlas)
   - Local MongoDB: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas

## Setup Steps

### 1. Install Node.js (if not already installed)
- Visit https://nodejs.org/
- Download and install the LTS version
- Restart your terminal/command prompt after installation

### 2. Verify Installation
Open a new terminal and run:
```bash
node --version
npm --version
```

### 3. Install Dependencies
From the project root directory:
```bash
npm run install-all
```

This will install dependencies for:
- Root package (concurrently)
- Backend
- Frontend

### 4. Configure Environment
The `backend/.env` file has been created with default values. If you need to change:
- MongoDB URI (for Atlas, use: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)
- Port numbers
- JWT secret

Edit `backend/.env` file.

### 5. Start MongoDB (if using local MongoDB)
```bash
# Windows (if installed as service, it should auto-start)
# Or run manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 6. Run the Application
From the project root:
```bash
npm run dev
```

This starts:
- **Backend** on `http://localhost:4000`
- **Frontend** on `http://localhost:5173`

## Troubleshooting

### "npm is not recognized"
- Node.js is not installed or not in PATH
- Install Node.js from nodejs.org
- Restart terminal after installation

### MongoDB Connection Error
- Ensure MongoDB is running (local) or connection string is correct (Atlas)
- Check `MONGO_URI` in `backend/.env`

### Port Already in Use
- Change `PORT` in `backend/.env` for backend
- Change port in `social-media/vite.config.js` for frontend

### Missing Dependencies
Run `npm run install-all` again

## Next Steps

Once both servers are running:
1. Open `http://localhost:5173` in your browser
2. Register a new user account
3. Connect social media accounts (OAuth setup required)
4. Create and schedule posts

## Individual Server Commands

If you need to run servers separately:

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

