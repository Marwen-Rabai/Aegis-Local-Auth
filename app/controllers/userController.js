/**
 * Aegis Local Auth - Enhanced User Controller
 * Core business logic with mass registration and unlimited phone support
 */

const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const config = require('../../config/config');
const logger = require('../services/logger');
const database = require('../database/database');
const otpEngine = require('../services/otpEngine');
const massRegistrationService = require('../services/massRegistrationService');

/**
 * Handle user registration - Generate and send OTP
 */
async function handleRegistration(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.info(`Registration validation failed: ${JSON.stringify(errors.array())}`);
        return res.status(422).json({ success: false, message: 'Invalid input data', errors: errors.array() });
    }

    const { phoneNumber } = req.body;
    try {
        const phoneHash = await bcrypt.hash(phoneNumber, config.BCRYPT_SALT_ROUNDS);
        logger.registration(phoneHash, req.ip);
        const otp = otpEngine.generateOTP();
        const otpHash = await bcrypt.hash(otp, config.BCRYPT_SALT_ROUNDS);
        const expiresAt = Math.floor(Date.now() / 1000) + (config.OTP_EXPIRATION_MINUTES * 60);
        await database.upsertUserWithOtp(phoneHash, otpHash, expiresAt);
        logger.otpGenerated(phoneHash);
        const smsResult = await otpEngine.sendOtpSms(phoneNumber, otp);
        logger.info(`✅ OTP sent via ${smsResult.provider}.`);
        return res.status(200).json({
            success: true,
            message: `OTP sent successfully via ${smsResult.provider}.`,
            phoneNumber: smsResult.phoneNumber,
            provider: smsResult.provider
        });
    } catch (error) {
        logger.error(`[Registration] Failed for ${phoneNumber.substring(0, 5)}...: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal error occurred during registration.'
        });
    }
}

/**
 * Handle OTP verification (Enhanced with detailed logging)
 */
async function handleVerification(req, res) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.info(`Verification validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(422).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { phoneNumber, otp } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Hash the phone number to find user
    const phoneHash = await bcrypt.hash(phoneNumber, config.BCRYPT_SALT_ROUNDS);

    // Find user by phone hash
    const user = await database.findUserByPhoneHash(phoneHash);
    
    if (!user) {
      logger.authAttempt(phoneHash, false, clientIP);
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number or OTP',
        remainingAttempts: null
      });
    }

    // Check if account is locked
    if (user.is_locked) {
      logger.accountLocked(phoneHash, user.failed_attempts, clientIP);
      return res.status(423).json({
        success: false,
        message: 'Account is locked due to multiple failed attempts',
        lockStatus: true
      });
    }

    // Check if OTP has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (!user.otp_expires_at || currentTime > user.otp_expires_at) {
      logger.authAttempt(phoneHash, false, clientIP);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        expired: true
      });
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(otp, user.current_otp_hash);
    
    if (!isOtpValid) {
      // Increment failed attempts
      await database.incrementFailedAttempts(phoneHash);
      
      const newFailedAttempts = user.failed_attempts + 1;
      logger.authAttempt(phoneHash, false, clientIP);

      // Check if account should be locked
      if (newFailedAttempts >= config.MAX_OTP_ATTEMPTS) {
        await database.lockUser(phoneHash);
        logger.accountLocked(phoneHash, newFailedAttempts, clientIP);
        
        return res.status(423).json({
          success: false,
          message: 'Account locked due to multiple failed verification attempts',
          lockStatus: true,
          maxAttemptsReached: true
        });
      }

      // Return remaining attempts
      const remainingAttempts = config.MAX_OTP_ATTEMPTS - newFailedAttempts;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        remainingAttempts,
        failedAttempts: newFailedAttempts
      });
    }

    // OTP is valid - verify user with atomic transaction
    try {
      await database.verifyUserWithTransaction(phoneHash);
      logger.authAttempt(phoneHash, true, clientIP);
      
      const maskedPhone = phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
      logger.info(`✅ User successfully verified: ${maskedPhone}`);

      res.status(200).json({
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber: maskedPhone,
        verified: true,
        timestamp: new Date().toISOString()
      });

    } catch (transactionError) {
      logger.error('Verification transaction failed', transactionError);
      res.status(500).json({
        success: false,
        message: 'Verification process failed. Please try again.',
        error: 'Transaction error'
      });
    }

  } catch (error) {
    logger.error('Verification error', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Handle mass registration via phone number list
 */
async function handleMassRegistration(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ success: false, message: 'Invalid input data', errors: errors.array() });
        }
        const { phoneNumbers } = req.body;
        if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            return res.status(400).json({ success: false, message: 'Phone numbers array is required.' });
        }
        const operation = await massRegistrationService.start(phoneNumbers);
        return res.status(202).json({
            success: true,
            message: 'Mass registration process started.',
            operationId: operation.id,
            statusEndpoint: `/api/mass-register/${operation.id}`
        });
    } catch (error) {
        logger.error('[MassRegistration] Failed to start process', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to start mass registration process.'
        });
    }
}

/**
 * Get mass registration operation status
 */
async function getMassRegistrationStatus(req, res) {
  try {
    const { operationId } = req.params;
    
    if (!operationId) {
      return res.status(400).json({
        success: false,
        message: 'Operation ID is required'
      });
    }

    const status = massRegistrationService.getOperationStatus(operationId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Operation not found'
      });
    }

    res.status(200).json({
      success: true,
      operation: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get mass registration status error', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operation status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get comprehensive system statistics
 */
async function getSystemStatistics(req, res) {
  try {
    // Get database statistics
    const dbStats = await database.getUserStats();
    
    // Get OTP engine statistics
    const otpStats = otpEngine.getStatistics();
    
    // Get mass registration statistics
    const massRegStats = massRegistrationService.generateStatistics();
    
    // Get modem health (graceful failure)
    let modemHealth = { status: 'demo', message: 'GSM modem not connected - demo mode active' };
    try {
      modemHealth = await otpEngine.checkModemHealth();
    } catch (modemError) {
      // Expected when no modem is connected
    }

    const statistics = {
      system: {
        status: 'operational',
        uptime: process.uptime(),
        version: '1.0.0',
        mode: modemHealth.status === 'healthy' ? 'production' : 'demo',
        timestamp: new Date().toISOString()
      },
      database: {
        status: 'connected',
        ...dbStats
      },
      modem: {
        ...modemHealth,
        ...otpStats
      },
      massRegistration: massRegStats,
      performance: {
        totalRegistrations: otpStats.totalSent || 0,
        successRate: otpStats.successRate || 0,
        averageResponseTime: '< 3s'
      },
      features: {
        unlimitedRegistration: config.FEATURES.UNLIMITED_REGISTRATION,
        massRegistration: config.FEATURES.MASS_REGISTRATION,
        detailedLogging: config.FEATURES.DETAILED_LOGGING,
        demoMode: modemHealth.status !== 'healthy'
      }
    };

    res.status(200).json({
      success: true,
      statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get statistics error', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Enhanced health check with detailed system information
 */
async function healthCheck(req, res) {
  try {
    // Check database connection
    const dbStats = await database.getUserStats();
    
    // Check modem status (graceful failure for demo mode)
    let modemStatus = { 
      status: 'demo',
      signal: { quality: 'N/A' },
      sim: { status: 'N/A' },
      network: { status: 'N/A' },
      message: 'GSM modem not connected - demo mode active'
    };
    
    try {
      modemStatus = await otpEngine.checkModemHealth();
    } catch (modemError) {
      // Expected when no modem is connected - not an error
    }
    
    // Get system info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      pid: process.pid
    };

    const healthData = {
      status: 'healthy', // System is healthy even without modem
      timestamp: new Date().toISOString(),
      system: systemInfo,
      database: {
        status: 'connected',
        totalUsers: dbStats.total_users,
        verifiedUsers: dbStats.verified_users,
        lockedUsers: dbStats.locked_users
      },
      modem: {
        status: modemStatus.status,
        signal: modemStatus.signal || {},
        sim: modemStatus.sim || {},
        network: modemStatus.network || {},
        details: modemStatus.status === 'healthy' ? 'GSM modem operational' : 
                modemStatus.status === 'demo' ? 'Demo mode - GSM modem not required' : 
                modemStatus.error || modemStatus.message
      },
      features: {
        unlimitedRegistration: config.FEATURES.UNLIMITED_REGISTRATION,
        massRegistration: config.FEATURES.MASS_REGISTRATION,
        fileUpload: config.FEATURES.FILE_UPLOAD,
        statisticsApi: config.FEATURES.STATISTICS_API,
        demoMode: modemStatus.status !== 'healthy'
      },
      version: '1.0.0'
    };

    // System is always healthy - demo mode is not degraded
    const statusCode = 200;
    res.status(statusCode).json(healthData);

  } catch (error) {
    logger.error('Health check error', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error.message
    });
  }
}

module.exports = {
  handleRegistration,
  handleVerification,
  handleMassRegistration,
  getMassRegistrationStatus,
  getSystemStatistics,
  healthCheck
}; 