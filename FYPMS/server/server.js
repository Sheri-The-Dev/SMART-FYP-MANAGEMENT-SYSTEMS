const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const compression = require('compression'); // Added for performance
require('dotenv').config();

// ==============================
// IMPORT INTERNAL MODULES
// ==============================
const { testConnection } = require('./config/database');
const { verifyEmailConfig } = require('./config/email');
const { generalLimiter } = require('./middleware/rateLimiter');

// ==============================
// IMPORT ROUTES
// ==============================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const projectRoutes = require('./routes/project');
const proposalRoutes = require('./routes/proposal');
const curriculumRoutes = require('./routes/curriculum');
const presentationRoutes = require('./routes/presentation');

// ==============================
// APP INITIALIZATION
// ==============================
const app = express();
const PORT = process.env.PORT || 5000;

// ==============================
// PERFORMANCE & SECURITY MIDDLEWARE
// ==============================
app.use(compression()); // Compress all responses
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ==============================
// CORS CONFIG
// ==============================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ==============================
// BODY PARSERS
// ==============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==============================
// STATIC UPLOADS CONFIG
// ==============================
const uploadsPath = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(
  '/uploads',
  express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
      res.set('Cache-Control', 'public, max-age=3600');

      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };

      if (types[ext]) {
        res.set('Content-Type', types[ext]);
      }
    },
  })
);

// ==============================
// RATE LIMITING
// ==============================
app.use('/api', generalLimiter);

// ==============================
// HEALTH CHECK
// ==============================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    time: new Date().toISOString(),
  });
});

// ==============================
// API ROUTES
// ==============================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/presentations', presentationRoutes);
app.use('/api/evaluation-sessions', require('./routes/evaluationSessions'));
app.use('/api/coordinator', require('./routes/coordinator'));
app.use('/api/defense', require('./routes/defense'));
app.use('/api/supervisor', require('./routes/supervisor'));
app.use('/api/evaluation', require('./routes/evaluation'));

// ==============================
// 404 HANDLER
// ==============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ==============================
// START SERVER
// ==============================
const startServer = async () => {
  try {
    await testConnection();
    await verifyEmailConfig();

    app.listen(PORT, () => {
      console.log('===================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Uploads path: ${uploadsPath}`);
      console.log('===================================');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();

// ==============================
// PROCESS ERROR HANDLING
// ==============================
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('SIGINT', () => {
  console.log('👋 Server stopped');
  process.exit(0);
});