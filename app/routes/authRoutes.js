/**
 * Aegis Local Auth - Enhanced Authentication Routes
 * API endpoints with mass registration and unlimited phone support
 */

const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const config = require('../../config/config');
const logger = require('../services/logger');
const userController = require('../controllers/userController');

const router = express.Router();

// Rate limiting middleware for registration endpoint (increased limits)
const registrationRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT.REGISTRATION.windowMs,
  max: config.RATE_LIMIT.REGISTRATION.max,
  message: config.RATE_LIMIT.REGISTRATION.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    logger.rateLimitExceeded('/api/register', clientIP);
    res.status(429).json(config.RATE_LIMIT.REGISTRATION.message);
  }
});

// Rate limiting middleware for verification endpoint
const verificationRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT.VERIFICATION.windowMs,
  max: config.RATE_LIMIT.VERIFICATION.max,
  message: config.RATE_LIMIT.VERIFICATION.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    logger.rateLimitExceeded('/api/verify', clientIP);
    res.status(429).json(config.RATE_LIMIT.VERIFICATION.message);
  }
});

// Rate limiting for bulk SMS operations
const bulkSmsRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT.BULK_SMS.windowMs,
  max: config.RATE_LIMIT.BULK_SMS.max,
  message: config.RATE_LIMIT.BULK_SMS.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    logger.rateLimitExceeded('/api/mass-register', clientIP);
    res.status(429).json(config.RATE_LIMIT.BULK_SMS.message);
  }
});

// Rate limiting for statistics endpoints
const statisticsRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT.STATISTICS.windowMs,
  max: config.RATE_LIMIT.STATISTICS.max,
  message: config.RATE_LIMIT.STATISTICS.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    logger.rateLimitExceeded('/api/statistics', clientIP);
    res.status(429).json(config.RATE_LIMIT.STATISTICS.message);
  }
});

// Phone number validation middleware
const phoneNumberValidation = [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 digits')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in valid international format (e.g., +1234567890)')
    .trim()
    .escape()
];

// OTP validation middleware
const otpValidation = [
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
    .trim()
    .escape()
];

// Mass registration validation middleware
const massRegistrationValidation = [
  body('phoneNumbers')
    .isArray({ min: 1 })
    .withMessage('Phone numbers must be an array with at least one number')
    .custom((phoneNumbers) => {
      if (phoneNumbers.length > 10000) {
        throw new Error('Maximum 10,000 phone numbers allowed per request');
      }
      return true;
    })
];

/**
 * POST /api/register
 * Register a phone number and send OTP (UNLIMITED)
 */
router.post('/register', 
  registrationRateLimit,
  phoneNumberValidation,
  userController.handleRegistration
);

/**
 * POST /api/verify
 * Verify OTP for phone number
 */
router.post('/verify',
  verificationRateLimit,
  [...phoneNumberValidation, ...otpValidation],
  userController.handleVerification
);

/**
 * POST /api/mass-register
 * Mass registration of multiple phone numbers
 */
router.post('/mass-register',
  bulkSmsRateLimit,
  massRegistrationValidation,
  userController.handleMassRegistration
);

/**
 * GET /api/mass-register/:operationId
 * Get status of mass registration operation
 */
router.get('/mass-register/:operationId',
  statisticsRateLimit,
  userController.getMassRegistrationStatus
);

/**
 * GET /api/statistics
 * Get comprehensive system statistics
 */
router.get('/statistics',
  statisticsRateLimit,
  userController.getSystemStatistics
);

/**
 * GET /api/health
 * Enhanced health check endpoint for monitoring
 */
router.get('/health', userController.healthCheck);

/**
 * GET /api/status
 * Basic system status endpoint
 */
router.get('/status', (req, res) => {
  res.json({
    service: 'Aegis Local Auth',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      unlimitedRegistration: config.FEATURES.UNLIMITED_REGISTRATION,
      massRegistration: config.FEATURES.MASS_REGISTRATION,
      detailedLogging: config.FEATURES.DETAILED_LOGGING,
      statisticsApi: config.FEATURES.STATISTICS_API
    },
    endpoints: {
      register: 'POST /api/register',
      verify: 'POST /api/verify', 
      massRegister: 'POST /api/mass-register',
      massRegisterStatus: 'GET /api/mass-register/:operationId',
      statistics: 'GET /api/statistics',
      health: 'GET /api/health'
    },
    limits: {
      registrationPerWindow: config.RATE_LIMIT.REGISTRATION.max,
      verificationPerWindow: config.RATE_LIMIT.VERIFICATION.max,
      bulkOperationsPerHour: config.RATE_LIMIT.BULK_SMS.max,
      maxPhoneNumbersPerBulk: 10000
    }
  });
});

/**
 * GET /api/modem-info
 * Get detailed modem information
 */
router.get('/modem-info',
  statisticsRateLimit,
  async (req, res) => {
    try {
      const otpEngine = require('../services/otpEngine');
      const modemInfo = await otpEngine.getModemInfo();
      const modemHealth = await otpEngine.checkModemHealth();
      
      res.json({
        success: true,
        modem: {
          ...modemInfo,
          health: modemHealth
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Modem info error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get modem information',
        error: error.message
      });
    }
  }
);

module.exports = router; 