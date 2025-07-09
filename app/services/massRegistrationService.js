/**
 * Aegis Local Auth - Mass Registration Service
 * Handles bulk phone number registration and file processing
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const XLSX = require('xlsx');
const config = require('../../config/config');
const logger = require('./logger');
const otpEngine = require('./otpEngine');

class MassRegistrationService {
  constructor() {
    this.activeOperations = new Map();
    this.operationHistory = [];
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  ensureUploadDir() {
    if (!fs.existsSync(config.UPLOAD_DIR)) {
      fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
      logger.info(`Created upload directory: ${config.UPLOAD_DIR}`);
    }
  }

  /**
   * Parse CSV file to extract phone numbers
   */
  async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const phoneNumbers = [];
      const errors = [];
      let lineNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv.parse({
          delimiter: ',',
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (row) => {
          lineNumber++;
          try {
            // Try different column positions for phone numbers
            const phoneNumber = this.extractPhoneNumber(row, lineNumber);
            if (phoneNumber) {
              if (this.validatePhoneNumber(phoneNumber)) {
                phoneNumbers.push(phoneNumber);
              } else {
                errors.push(`Line ${lineNumber}: Invalid phone number format: ${phoneNumber}`);
              }
            }
          } catch (error) {
            errors.push(`Line ${lineNumber}: ${error.message}`);
          }
        })
        .on('end', () => {
          logger.info(`CSV parsing completed: ${phoneNumbers.length} valid numbers, ${errors.length} errors`);
          resolve({ phoneNumbers, errors, totalLines: lineNumber });
        })
        .on('error', reject);
    });
  }

  /**
   * Parse Excel file to extract phone numbers
   */
  async parseExcelFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const phoneNumbers = [];
      const errors = [];

      data.forEach((row, index) => {
        const lineNumber = index + 1;
        try {
          const phoneNumber = this.extractPhoneNumber(row, lineNumber);
          if (phoneNumber) {
            if (this.validatePhoneNumber(phoneNumber)) {
              phoneNumbers.push(phoneNumber);
            } else {
              errors.push(`Line ${lineNumber}: Invalid phone number format: ${phoneNumber}`);
            }
          }
        } catch (error) {
          errors.push(`Line ${lineNumber}: ${error.message}`);
        }
      });

      logger.info(`Excel parsing completed: ${phoneNumbers.length} valid numbers, ${errors.length} errors`);
      return { phoneNumbers, errors, totalLines: data.length };
    } catch (error) {
      logger.error('Failed to parse Excel file', error);
      throw error;
    }
  }

  /**
   * Parse text file (one phone number per line)
   */
  async parseTextFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      
      const phoneNumbers = [];
      const errors = [];

      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const phoneNumber = line.trim();
        
        if (phoneNumber) {
          if (this.validatePhoneNumber(phoneNumber)) {
            phoneNumbers.push(phoneNumber);
          } else {
            errors.push(`Line ${lineNumber}: Invalid phone number format: ${phoneNumber}`);
          }
        }
      });

      logger.info(`Text file parsing completed: ${phoneNumbers.length} valid numbers, ${errors.length} errors`);
      return { phoneNumbers, errors, totalLines: lines.length };
    } catch (error) {
      logger.error('Failed to parse text file', error);
      throw error;
    }
  }

  /**
   * Extract phone number from row data
   */
  extractPhoneNumber(row, lineNumber) {
    if (!row || row.length === 0) return null;

    // Try different strategies to find phone number
    for (let i = 0; i < row.length; i++) {
      const cell = String(row[i]).trim();
      
      // Skip empty cells
      if (!cell) continue;
      
      // Check if cell looks like a phone number
      if (this.looksLikePhoneNumber(cell)) {
        return this.normalizePhoneNumber(cell);
      }
    }

    // If no phone-like cell found, try first non-empty cell
    const firstCell = row.find(cell => cell && String(cell).trim());
    if (firstCell) {
      const normalized = this.normalizePhoneNumber(String(firstCell).trim());
      if (this.validatePhoneNumber(normalized)) {
        return normalized;
      }
    }

    return null;
  }

  /**
   * Check if string looks like a phone number
   */
  looksLikePhoneNumber(str) {
    // Remove all non-digit characters and count digits
    const digits = str.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  /**
   * Normalize phone number format
   */
  normalizePhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (normalized && !normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    return /^\+?[1-9]\d{9,14}$/.test(phoneNumber);
  }

  /**
   * Start mass registration operation
   */
  async startMassRegistration(phoneNumbers) {
    const operationId = `op_${Date.now()}`;
    const operation = {
      id: operationId,
      total: phoneNumbers.length,
      processed: 0,
      successful: [],
      failed: [],
      startTime: new Date().toISOString()
    };

    this.activeOperations.set(operationId, operation);
    logger.info(`Starting mass registration for ${phoneNumbers.length} numbers`);

    // Process asynchronously
    this.processMassRegistration(operationId, phoneNumbers);

    return { operationId, status: 'started' };
  }

  /**
   * Process mass registration operation
   */
  async processMassRegistration(operationId, phoneNumbers) {
    const operation = this.activeOperations.get(operationId);
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await otpEngine.sendOtpSms(phoneNumber);
        
        if (result.success) {
          operation.successful.push({
            phoneNumber: result.phoneNumber,
            messageId: result.messageId,
            otp: result.otp,
            timestamp: result.timestamp
          });
          logger.info(`✅ ${operation.processed + 1}/${operation.total} SUCCESS: ${result.phoneNumber}`);
        } else {
          operation.failed.push({
            phoneNumber: result.phoneNumber,
            error: result.error,
            timestamp: result.timestamp
          });
          logger.error(`❌ ${operation.processed + 1}/${operation.total} FAILED: ${result.phoneNumber}`);
        }

        operation.processed++;
        
        // Delay between messages
        await new Promise(resolve => setTimeout(resolve, config.BULK_SMS_DELAY || 2000));

      } catch (error) {
        operation.failed.push({
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          error: error.message,
          timestamp: new Date().toISOString()
        });
        operation.processed++;
        logger.error(`❌ ${operation.processed}/${operation.total} ERROR`, error);
      }
    }

    operation.endTime = new Date().toISOString();
    operation.successRate = ((operation.successful.length / operation.total) * 100).toFixed(2);
    
    this.operationHistory.push(operation);
    this.activeOperations.delete(operationId);
    
    logger.info(`🏁 Mass registration completed: ${operation.successful.length}/${operation.total} successful`);
  }

  /**
   * Get operation status
   */
  getOperationStatus(operationId) {
    const operation = this.activeOperations.get(operationId) || 
                     this.operationHistory.find(op => op.id === operationId);
    
    if (operation) {
      return {
        ...operation,
        progress: operation.total > 0 ? ((operation.processed / operation.total) * 100).toFixed(2) : 0
      };
    }
    return null;
  }

  /**
   * Get all active operations
   */
  getActiveOperations() {
    return Array.from(this.activeOperations.values()).map(operation => ({
      ...operation,
      progress: operation.total > 0 ? ((operation.processed / operation.total) * 100).toFixed(2) : 0
    }));
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit = 50) {
    return this.operationHistory
      .slice(-limit)
      .reverse()
      .map(operation => ({
        id: operation.id,
        total: operation.total,
        successful: operation.successful.length,
        failed: operation.failed.length,
        successRate: operation.successRate,
        startTime: operation.startTime,
        endTime: operation.endTime,
        duration: operation.duration,
        status: operation.status
      }));
  }

  /**
   * Cancel operation
   */
  cancelOperation(operationId) {
    const operation = this.activeOperations.get(operationId);
    if (operation && operation.status === 'processing') {
      operation.status = 'cancelled';
      operation.endTime = new Date().toISOString();
      logger.info(`Mass registration operation ${operationId} cancelled`);
      return true;
    }
    return false;
  }

  /**
   * Generate comprehensive statistics
   */
  generateStatistics() {
    const allOperations = [...this.operationHistory, ...this.activeOperations.values()];
    const otpStats = otpEngine.getStatistics();
    
    const totalProcessed = allOperations.reduce((sum, op) => sum + op.processed, 0);
    const totalSuccessful = allOperations.reduce((sum, op) => sum + (op.successful?.length || 0), 0);
    
    return {
      overview: {
        totalOperations: allOperations.length,
        activeOperations: this.activeOperations.size,
        totalProcessed,
        totalSuccessful,
        overallSuccessRate: totalProcessed > 0 ? ((totalSuccessful / totalProcessed) * 100).toFixed(2) : 0
      },
      modem: otpStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Utility functions
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  maskPhoneNumber(phone) {
    if (!phone || phone.length <= 6) return phone;
    const start = phone.slice(0, 3);
    const end = phone.slice(-3);
    const middle = '*'.repeat(Math.max(0, phone.length - 6));
    return start + middle + end;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up old files and data
   */
  cleanup() {
    try {
      // Clean up upload directory
      const files = fs.readdirSync(config.UPLOAD_DIR);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(config.UPLOAD_DIR, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up old upload file: ${file}`);
        }
      });

      // Clean up old operation history
      const cutoffDate = new Date(Date.now() - (config.STATS_RETENTION_DAYS * 24 * 60 * 60 * 1000));
      this.operationHistory = this.operationHistory.filter(op => 
        new Date(op.startTime) > cutoffDate
      );

      logger.info('Cleanup completed successfully');
    } catch (error) {
      logger.error('Cleanup failed', error);
    }
  }
}

// Create and export singleton instance
const massRegistrationService = new MassRegistrationService();

module.exports = massRegistrationService; 