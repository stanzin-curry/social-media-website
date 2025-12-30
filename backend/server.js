import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import accountRoutes from './routes/account.routes.js';
import userRoutes from './routes/user.routes.js';

// Import cron job
import { startScheduler } from './cron/scheduler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social-media-scheduler')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      
      // Start cron scheduler
      startScheduler();
      console.log('⏰ Cron scheduler started');
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;

