/**
 * Aegis Local Auth - Logging Service
 * Robust, leveled logging system for security monitoring and debugging
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format with timestamp and detailed information
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }
    return logMessage;
  })
);

// Create the winston logger instance
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Error logs - captures error and warn levels
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true
    }),
    
    // General/Access logs - captures all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true
    }),
    
    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// Enhanced logging methods for different security contexts
const securityLogger = {
  // Authentication events
  authAttempt: (phoneHash, success, ip) => {
    logger.info(`Authentication attempt - Phone: ${phoneHash.substring(0, 8)}..., Success: ${success}, IP: ${ip}`);
  },
  
  // Registration events
  registration: (phoneHash, ip) => {
    logger.info(`Registration attempt - Phone: ${phoneHash.substring(0, 8)}..., IP: ${ip}`);
  },
  
  // OTP events (without logging actual OTP)
  otpGenerated: (phoneHash) => {
    logger.info(`OTP generated for phone: ${phoneHash.substring(0, 8)}...`);
  },
  
  otpSent: (phoneNumber, success, error = null) => {
    const maskedPhone = phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
    if (success) {
      logger.info(`OTP SMS sent successfully to: ${maskedPhone}`);
    } else {
      logger.error(`Failed to send OTP SMS to: ${maskedPhone}. Error: ${error}`);
    }
  },
  
  // Security violations
  accountLocked: (phoneHash, attempts, ip) => {
    logger.warn(`Account locked - Phone: ${phoneHash.substring(0, 8)}..., Failed attempts: ${attempts}, IP: ${ip}`);
  },
  
  rateLimitExceeded: (endpoint, ip) => {
    logger.warn(`Rate limit exceeded - Endpoint: ${endpoint}, IP: ${ip}`);
  },
  
  // System events
  serverStart: (port) => {
    logger.info(`Aegis Local Auth server started on port ${port}`);
  },
  
  serverShutdown: () => {
    logger.info('Aegis Local Auth server shutdown initiated');
  },
  
  databaseConnected: (dbPath) => {
    logger.info(`Database connected successfully: ${dbPath}`);
  },
  
  modemStatus: (status, error = null) => {
    if (status === 'healthy') {
      logger.info('GSM modem health check: HEALTHY');
    } else {
      logger.error(`GSM modem health check: FAILED - ${error}`);
    }
  },
  
  // General error logging
  error: (message, error = null) => {
    if (error) {
      logger.error(`${message} - Error: ${error.message || error}`);
    } else {
      logger.error(message);
    }
  },
  
  // General info logging
  info: (message) => {
    logger.info(message);
  },
  
  // Debug logging
  debug: (message) => {
    logger.debug(message);
  }
};

module.exports = securityLogger; 