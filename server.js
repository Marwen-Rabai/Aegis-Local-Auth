/**
 * Aegis Local Auth - Main Server
 * Self-Sovereign User Verification Fortress
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const config = require('./config/config');
const logger = require('./app/services/logger');
const database = require('./app/database/database');
const authRoutes = require('./app/routes/authRoutes');

// Create Express application
const app = express();

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Compression middleware for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security middleware - Apply first for maximum protection
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration with strict origin control
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.CORS_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.error(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React frontend build directory
app.use(express.static(path.join(__dirname, 'app/web/dist')));

// API routes
app.use('/api', authRoutes);

// For any other request, serve the React frontend's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/web/dist/index.html'));
});

// 404 handler for API routes (will only be hit if no other route matches)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: [
      '/api/register', 
      '/api/verify', 
      '/api/mass-register',
      '/api/statistics',
      '/api/health', 
      '/api/status'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler', err);
  
  // Rate limiting error
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    logger.info('Initializing Aegis Local Auth database...');
    await database.initialize();
    
    // Start HTTP server
    const server = app.listen(config.SERVER_PORT, () => {
      logger.serverStart(config.SERVER_PORT);
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  🛡️  AEGIS LOCAL AUTH  🛡️                    ║
║                                                              ║
║  Self-Sovereign User Verification Fortress                  ║
║  Developed by: MARWEN RABAI                                  ║
║  Portfolio: marwenrabai.strtikingly.com                     ║
║                                                              ║
║  Status: OPERATIONAL                                         ║
║  Port: ${config.SERVER_PORT}                                            ║
║  Database: ${config.DATABASE_PATH}                         ║
║  SMS Provider: ${config.SMS_PROVIDER.toUpperCase()}                        ║
║  Fallback: ${config.SMS_FALLBACK_ENABLED ? 'ENABLED' : 'DISABLED'}                           ║
║                                                              ║
║  Web Interface: http://localhost:${config.SERVER_PORT}                    ║
║  API Health: http://localhost:${config.SERVER_PORT}/api/health             ║
║                                                              ║
║  📝 NOTE: Multiple SMS providers supported                  ║
║  🔧 API | Android Gateway | GSM Modem                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connection
          await database.close();
          logger.info('Database connection closed');
          
          // Close OTP engine resources
          try {
            const otpEngine = require('./app/services/otpEngine');
            await otpEngine.closeModem();
          } catch (modemError) {
            // Ignore modem close errors during shutdown
            logger.info('Modem connection cleanup completed');
          }
          
          logger.serverShutdown();
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', error);
          process.exit(1);
        }
      });
    };

    // Handle process signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', err);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start Aegis Local Auth server', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app; 