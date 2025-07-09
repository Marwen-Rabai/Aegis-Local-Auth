/**
 * Aegis Local Auth - Advanced OTP Engine
 * Direct GSM modem control for self-sovereign SMS transmission with modern serialport
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('../../config/config');
const logger = require('./logger');
const crypto = require('crypto');

class AdvancedOTPEngine {
  constructor() {
    this.port = null;
    this.parser = null;
    this.isInitialized = false;
    this.isConnected = false;
    this.commandQueue = [];
    this.currentCommand = null;
    this.responseBuffer = '';
    this.statistics = {
      totalSent: 0,
      totalSuccess: 0,
      totalFailed: 0,
      dailyStats: new Map(),
      modemInfo: null,
      lastHealthCheck: null
    };
  }

  /**
   * Initialize the GSM modem connection with modern serialport
   */
  async initializeModem() {
    try {
      logger.info('Initializing GSM modem connection...');
      
      // Close any existing connection first
      if (this.port && this.port.isOpen) {
        await this.closeModem();
        await this.delay(1000); // Wait for port to be fully released
      }
      
      // Create serial port connection
      this.port = new SerialPort({
        path: config.SERIAL_PORT_PATH,
        baudRate: config.SERIAL_BAUD_RATE,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
      });

      // Create parser for reading responses
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      return new Promise((resolve, reject) => {
        // Set a timeout for the entire initialization
        const initTimeout = setTimeout(() => {
          reject(new Error('Modem initialization timeout - port may be in use by another application'));
        }, 15000);

        // Handle port opening
        this.port.open((err) => {
          if (err) {
            clearTimeout(initTimeout);
            logger.error('Failed to open GSM modem port', err);
            
            // Provide helpful error message for common issues
            if (err.message.includes('Access denied') || err.message.includes('in use')) {
              reject(new Error(`Port ${config.SERIAL_PORT_PATH} is in use by another application. Please close any modem management software and try again.`));
            } else {
              reject(err);
            }
            return;
          }

          logger.info(`GSM modem port opened: ${config.SERIAL_PORT_PATH}`);
          this.isConnected = true;

          // Set up data handling
          this.setupDataHandling();

          // Initialize modem with AT commands
          this.initializeModemSettings()
            .then(() => {
              clearTimeout(initTimeout);
              this.isInitialized = true;
              logger.info('GSM modem initialized successfully');
              resolve(true);
            })
            .catch((initError) => {
              clearTimeout(initTimeout);
              reject(initError);
            });
        });

        // Handle connection errors
        this.port.on('error', (err) => {
          logger.error('GSM modem port error', err);
          this.isConnected = false;
          this.isInitialized = false;
          if (!this.isInitialized) {
            clearTimeout(initTimeout);
            reject(err);
          }
        });

        // Handle port close
        this.port.on('close', () => {
          logger.info('GSM modem port closed');
          this.isConnected = false;
          this.isInitialized = false;
        });
      });
    } catch (error) {
      logger.error('Failed to initialize GSM modem', error);
      throw error;
    }
  }

  /**
   * Set up data handling for modem responses
   */
  setupDataHandling() {
    this.parser.on('data', (data) => {
      const response = data.trim();
      if (response) {
        logger.debug(`Modem response: ${response}`);
        this.handleModemResponse(response);
      }
    });
  }

  /**
   * Handle responses from the modem
   */
  handleModemResponse(response) {
    this.responseBuffer += response + '\n';
    
    // Check for command completion
    if (response === 'OK' || response === 'ERROR' || response.includes('>')) {
      if (this.currentCommand) {
        this.currentCommand.resolve(this.responseBuffer.trim());
        this.currentCommand = null;
        this.responseBuffer = '';
        this.processCommandQueue();
      }
    }
  }

  /**
   * Send AT command to modem with queue management
   */
  async sendATCommand(command, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const commandObj = {
        command,
        resolve,
        reject,
        timeout: setTimeout(() => {
          clearTimeout(commandObj.timeout);
          reject(new Error(`Command timeout: ${command}`));
          this.currentCommand = null;
          this.processCommandQueue();
        }, timeout)
      };

      this.commandQueue.push(commandObj);
      if (!this.currentCommand) {
        this.processCommandQueue();
      }
    });
  }

  /**
   * Process command queue
   */
  processCommandQueue() {
    if (this.commandQueue.length === 0 || this.currentCommand) {
      return;
    }

    this.currentCommand = this.commandQueue.shift();
    this.responseBuffer = '';
    
    logger.debug(`Sending AT command: ${this.currentCommand.command}`);
    
    // Add small delay before writing command to ensure modem is ready
    setTimeout(() => {
      if (this.port && this.port.isOpen && this.currentCommand) {
        this.port.write(this.currentCommand.command + '\r\n');
      }
    }, 100);
  }

  /**
   * Initialize modem settings
   */
  async initializeModemSettings() {
    try {
      // Disable echo first (critical for proper response parsing)
      await this.sendATCommand('ATE0');
      
      // Basic AT test
      await this.sendATCommand('AT');
      
      // Set SMS text mode
      await this.sendATCommand('AT+CMGF=1');
      
      // Set character set
      await this.sendATCommand('AT+CSCS="GSM"');
      
      // Enable error codes
      await this.sendATCommand('AT+CMEE=1');
      
      // Configure SMS service center for Algeria (fix for AT+CMGS timeout)
      try {
        logger.info('Configuring SMS service center for Algeria...');
        
        // Check current service center
        const currentSC = await this.sendATCommand('AT+CSCA?');
        logger.info(`Current SMS service center: ${currentSC}`);
        
        // Set correct Mobilis service center
        await this.sendATCommand('AT+CSCA="+213661000111"');
        logger.info('SMS service center configured for Mobilis (+213661000111)');
        
        // Verify the change
        const newSC = await this.sendATCommand('AT+CSCA?');
        logger.info(`New SMS service center: ${newSC}`);
        
      } catch (scError) {
        logger.warn('Could not configure SMS service center:', scError.message);
        // Continue anyway, might work with default
      }
      
      // Get modem information
      this.statistics.modemInfo = await this.getModemInfo();
      
      logger.info('Modem settings initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize modem settings', error);
      throw error;
    }
  }

  /**
   * Check modem health with detailed diagnostics
   */
  async checkModemHealth() {
    try {
      if (!this.isConnected) {
        await this.initializeModem();
      }

      // Basic connectivity test
      const atResponse = await this.sendATCommand('AT');
      if (!atResponse.includes('OK')) {
        throw new Error('Modem not responding to AT commands');
      }

      // Check signal strength
      const signalInfo = await this.checkSignalStrength();
      
      // Check SIM card status
      const simStatus = await this.checkSIMStatus();
      
      // Check network registration
      const networkStatus = await this.checkNetworkRegistration();

      // Advanced SMS capability check
      const smsCapability = await this.checkSMSCapability();

      const healthData = {
        status: 'healthy',
        signal: signalInfo,
        sim: simStatus,
        network: networkStatus,
        sms: smsCapability,
        timestamp: new Date().toISOString()
      };

      this.statistics.lastHealthCheck = healthData;
      logger.modemStatus('healthy');
      logger.info(`Modem health: Signal ${signalInfo.rssi}dBm, SIM ${simStatus.status}, Network ${networkStatus.status}, SMS ${smsCapability.status}`);
      
      return healthData;
    } catch (error) {
      const healthData = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.statistics.lastHealthCheck = healthData;
      logger.modemStatus('failed', error.message);
      return healthData;
    }
  }

  /**
   * Check signal strength with detailed information
   */
  async checkSignalStrength() {
    try {
      const response = await this.sendATCommand('AT+CSQ');
      const match = response.match(/\+CSQ:\s*(\d+),(\d+)/);
      
      if (match) {
        const rssi = parseInt(match[1]);
        const ber = parseInt(match[2]);
        
        let signalDbm = 'Unknown';
        let signalQuality = 'Unknown';
        
        if (rssi >= 0 && rssi <= 31) {
          signalDbm = -113 + (rssi * 2);
          if (rssi >= 20) signalQuality = 'Excellent';
          else if (rssi >= 15) signalQuality = 'Good';
          else if (rssi >= 10) signalQuality = 'Fair';
          else if (rssi >= 5) signalQuality = 'Poor';
          else signalQuality = 'Very Poor';
        }
        
        return { rssi: signalDbm, ber, quality: signalQuality, raw: rssi };
      } else {
        throw new Error('Could not parse signal strength');
      }
    } catch (error) {
      logger.error('Failed to check signal strength', error);
      return { rssi: 'Unknown', ber: 'Unknown', quality: 'Unknown', error: error.message };
    }
  }

  /**
   * Check SIM card status
   */
  async checkSIMStatus() {
    try {
      const response = await this.sendATCommand('AT+CPIN?');
      if (response.includes('READY')) {
        return { status: 'Ready', message: 'SIM card is ready' };
      } else if (response.includes('SIM PIN')) {
        return { status: 'PIN Required', message: 'SIM card requires PIN' };
      } else {
        return { status: 'Error', message: 'SIM card error or not inserted' };
      }
    } catch (error) {
      return { status: 'Error', message: error.message };
    }
  }

  /**
   * Check network registration
   */
  async checkNetworkRegistration() {
    try {
      const response = await this.sendATCommand('AT+CREG?');
      const match = response.match(/\+CREG:\s*\d+,(\d+)/);
      
      if (match) {
        const status = parseInt(match[1]);
        const statusMap = {
          0: { status: 'Not Searching', message: 'Not searching for network' },
          1: { status: 'Home Network', message: 'Registered on home network' },
          2: { status: 'Searching', message: 'Searching for network' },
          3: { status: 'Denied', message: 'Registration denied' },
          4: { status: 'Unknown', message: 'Unknown network status' },
          5: { status: 'Roaming', message: 'Registered on roaming network' }
        };
        
        return statusMap[status] || { status: 'Unknown', message: 'Unknown status code' };
      } else {
        return { status: 'Error', message: 'Could not parse network status' };
      }
    } catch (error) {
      return { status: 'Error', message: error.message };
    }
  }

  /**
   * Check SMS capability and memory status
   */
  async checkSMSCapability() {
    try {
      // Check SMS format support
      const formatResponse = await this.sendATCommand('AT+CMGF?');
      
      // Check SMS memory status
      const memoryResponse = await this.sendATCommand('AT+CPMS?');
      
      // Check SMS service center
      const scResponse = await this.sendATCommand('AT+CSCA?');
      
      // Test basic SMS command
      const testResponse = await this.sendATCommand('AT+CMGS=?');
      
      return {
        status: 'Ready',
        format: formatResponse.includes('1') ? 'Text Mode' : 'PDU Mode',
        memory: this.parseSMSMemory(memoryResponse),
        serviceCenter: this.parseServiceCenter(scResponse),
        commandSupport: testResponse.includes('OK') ? 'Supported' : 'Limited',
        details: {
          formatResponse: formatResponse.trim(),
          memoryResponse: memoryResponse.trim(),
          scResponse: scResponse.trim()
        }
      };
    } catch (error) {
      logger.warn('SMS capability check failed', error);
      return {
        status: 'Limited',
        error: error.message,
        message: 'SMS functionality may be limited'
      };
    }
  }

  /**
   * Parse SMS memory information
   */
  parseSMSMemory(response) {
    try {
      // Example: +CPMS: "SM",5,50,"SM",5,50,"SM",5,50
      const match = response.match(/\+CPMS:\s*"([^"]+)",(\d+),(\d+)/);
      if (match) {
        return {
          storage: match[1],
          used: parseInt(match[2]),
          total: parseInt(match[3]),
          available: parseInt(match[3]) - parseInt(match[2])
        };
      }
      return { status: 'Unknown', raw: response };
    } catch (error) {
      return { status: 'Error', error: error.message };
    }
  }

  /**
   * Parse service center information
   */
  parseServiceCenter(response) {
    try {
      // Example: +CSCA: "+33695000695",145
      const match = response.match(/\+CSCA:\s*"([^"]+)"/);
      if (match) {
        return {
          number: match[1],
          status: 'Configured'
        };
      }
      return { status: 'Not Set', raw: response };
    } catch (error) {
      return { status: 'Error', error: error.message };
    }
  }

  /**
   * Generate secure 6-digit OTP
   */
  generateOTP() {
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    return String(randomNumber % 1000000).padStart(6, '0');
  }

  /**
   * Send OTP SMS with enhanced tracking and statistics
   */
  async sendOtpSms(phoneNumber, otp = null) {
    const startTime = Date.now();
    const generatedOtp = otp || this.generateOTP();
    
    logger.info(`Starting SMS send to ${this.maskPhoneNumber(phoneNumber)}`);
    
    try {
      // Health check before sending
      const healthCheck = await this.checkModemHealth();
      if (healthCheck.status !== 'healthy') {
        this.updateStatistics(phoneNumber, false, 'Modem health check failed');
        return {
          success: false,
          error: 'GSM modem is not healthy',
          details: healthCheck,
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          timestamp: new Date().toISOString()
        };
      }

      // Prepare message
      const message = `Your Aegis verification code is: ${generatedOtp}. This code expires in ${config.OTP_EXPIRATION_MINUTES} minutes. Do not share this code.`;

      // Send SMS with retry logic
      logger.info(`Sending SMS to ${this.maskPhoneNumber(phoneNumber)} via GSM modem`);
      
      // Try sending SMS with multiple attempts
      let lastError = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          logger.info(`SMS attempt ${attempt}/${maxRetries} to ${this.maskPhoneNumber(phoneNumber)}`);
          
          // Clear any pending commands
          await this.sendATCommand('AT', 5000);
          
          // Set recipient with longer timeout
          const setRecipientResponse = await this.sendATCommand(`AT+CMGS="${phoneNumber}"`, 15000);
          
          if (!setRecipientResponse.includes('>')) {
            throw new Error(`Failed to set SMS recipient - no prompt received. Response: ${setRecipientResponse}`);
          }
          
          logger.info(`SMS prompt received for ${this.maskPhoneNumber(phoneNumber)}, sending message...`);

          // Send message content with Ctrl+Z and extended timeout
          const messageResponse = await this.sendATCommand(message + String.fromCharCode(26), 45000);
          
          if (messageResponse.includes('OK') || messageResponse.includes('+CMGS:')) {
            const duration = Date.now() - startTime;
            const messageId = this.extractMessageId(messageResponse);
            
            this.updateStatistics(phoneNumber, true, null, duration);
            logger.otpSent(phoneNumber, true);
            logger.info(`✅ SMS sent successfully to ${this.maskPhoneNumber(phoneNumber)} in ${duration}ms (attempt ${attempt})`);
            
            return {
              success: true,
              messageId,
              phoneNumber: this.maskPhoneNumber(phoneNumber),
              duration,
              timestamp: new Date().toISOString(),
              otp: generatedOtp,
              attempts: attempt,
              response: messageResponse.replace(message, '[MESSAGE CONTENT HIDDEN]')
            };
          } else {
            throw new Error(`SMS sending failed - unexpected response: ${messageResponse}`);
          }
          
        } catch (attemptError) {
          lastError = attemptError;
          logger.warn(`SMS attempt ${attempt}/${maxRetries} failed: ${attemptError.message}`);
          
          if (attempt < maxRetries) {
            // Wait before retry
            logger.info(`Waiting 3 seconds before retry ${attempt + 1}...`);
            await this.delay(3000);
            
            // Try to reset modem state
            try {
              await this.sendATCommand('AT+CMGD=1,4', 10000); // Delete all SMS to free memory
            } catch (resetError) {
              logger.debug(`Could not reset SMS memory: ${resetError.message}`);
            }
          }
        }
      }
      
      // All attempts failed
      throw lastError;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStatistics(phoneNumber, false, error.message, duration);
      logger.otpSent(phoneNumber, false, error.message);
      logger.error(`❌ Failed to send SMS to ${this.maskPhoneNumber(phoneNumber)} after all attempts`, error);
      
      return {
        success: false,
        error: error.message,
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        duration,
        timestamp: new Date().toISOString(),
        details: error.stack
      };
    }
  }

  /**
   * Send SMS to multiple numbers with detailed progress tracking
   */
  async sendBulkSMS(phoneNumbers, customMessage = null) {
    const results = {
      total: phoneNumbers.length,
      successful: [],
      failed: [],
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0
    };

    const startTime = Date.now();
    logger.info(`🚀 Starting bulk SMS send to ${phoneNumbers.length} numbers`);

    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i];
      logger.info(`📱 Processing ${i + 1}/${phoneNumbers.length}: ${this.maskPhoneNumber(phoneNumber)}`);

      try {
        const result = await this.sendOtpSms(phoneNumber);
        
        if (result.success) {
          results.successful.push({
            phoneNumber: this.maskPhoneNumber(phoneNumber),
            messageId: result.messageId,
            duration: result.duration,
            timestamp: result.timestamp,
            otp: result.otp
          });
          logger.info(`✅ ${i + 1}/${phoneNumbers.length} SUCCESS: ${this.maskPhoneNumber(phoneNumber)}`);
        } else {
          results.failed.push({
            phoneNumber: this.maskPhoneNumber(phoneNumber),
            error: result.error,
            timestamp: result.timestamp
          });
          logger.error(`❌ ${i + 1}/${phoneNumbers.length} FAILED: ${this.maskPhoneNumber(phoneNumber)} - ${result.error}`);
        }

        // Small delay between messages to avoid overwhelming the modem
        if (i < phoneNumbers.length - 1) {
          await this.delay(config.BULK_SMS_DELAY || 2000);
        }

      } catch (error) {
        results.failed.push({
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          error: error.message,
          timestamp: new Date().toISOString()
        });
        logger.error(`❌ ${i + 1}/${phoneNumbers.length} ERROR: ${this.maskPhoneNumber(phoneNumber)}`, error);
      }
    }

    results.endTime = new Date().toISOString();
    results.duration = Date.now() - startTime;
    results.successRate = ((results.successful.length / results.total) * 100).toFixed(2);

    logger.info(`🏁 Bulk SMS completed: ${results.successful.length}/${results.total} successful (${results.successRate}%) in ${results.duration}ms`);
    
    return results;
  }

  /**
   * Update statistics
   */
  updateStatistics(phoneNumber, success, error = null, duration = 0) {
    this.statistics.totalSent++;
    
    if (success) {
      this.statistics.totalSuccess++;
    } else {
      this.statistics.totalFailed++;
    }

    // Daily statistics
    const today = new Date().toDateString();
    if (!this.statistics.dailyStats.has(today)) {
      this.statistics.dailyStats.set(today, {
        date: today,
        sent: 0,
        success: 0,
        failed: 0,
        numbers: []
      });
    }

    const dailyStat = this.statistics.dailyStats.get(today);
    dailyStat.sent++;
    
    if (success) {
      dailyStat.success++;
    } else {
      dailyStat.failed++;
    }

    dailyStat.numbers.push({
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      success,
      error,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics() {
    const stats = {
      ...this.statistics,
      successRate: this.statistics.totalSent > 0 ? 
        ((this.statistics.totalSuccess / this.statistics.totalSent) * 100).toFixed(2) : 0,
      dailyStatsArray: Array.from(this.statistics.dailyStats.values()),
      modemHealth: this.statistics.lastHealthCheck
    };

    return stats;
  }

  /**
   * Utility functions
   */
  maskPhoneNumber(phone) {
    if (phone.length <= 6) return phone;
    const start = phone.slice(0, 3);
    const end = phone.slice(-3);
    const middle = '*'.repeat(Math.max(0, phone.length - 6));
    return start + middle + end;
  }

  extractMessageId(response) {
    const match = response.match(/\+CMGS:\s*(\d+)/);
    return match ? match[1] : null;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get modem information
   */
  async getModemInfo() {
    try {
      const manufacturer = await this.sendATCommand('AT+CGMI');
      const model = await this.sendATCommand('AT+CGMM');
      const version = await this.sendATCommand('AT+CGMR');
      const imei = await this.sendATCommand('AT+CGSN');

      return {
        manufacturer: this.extractInfo(manufacturer),
        model: this.extractInfo(model),
        version: this.extractInfo(version),
        imei: this.extractInfo(imei)
      };
    } catch (error) {
      logger.error('Failed to get modem information', error);
      return { error: error.message };
    }
  }

  extractInfo(response) {
    const lines = response.split('\n').map(line => line.trim()).filter(line => line && line !== 'OK');
    return lines.length > 0 ? lines[0] : 'Unknown';
  }

  /**
   * Close modem connection
   */
  async closeModem() {
    if (this.port && this.port.isOpen) {
      return new Promise((resolve) => {
        this.port.close(() => {
          logger.info('GSM modem connection closed');
          this.isConnected = false;
          this.isInitialized = false;
          resolve();
        });
      });
    }
  }
}

// Create and export singleton instance
const advancedOtpEngine = new AdvancedOTPEngine();

module.exports = {
  checkModemHealth: () => advancedOtpEngine.checkModemHealth(),
  sendOtpSms: (phoneNumber, otp) => advancedOtpEngine.sendOtpSms(phoneNumber, otp),
  sendBulkSMS: (phoneNumbers, customMessage) => advancedOtpEngine.sendBulkSMS(phoneNumbers, customMessage),
  generateOTP: () => advancedOtpEngine.generateOTP(),
  getModemInfo: () => advancedOtpEngine.getModemInfo(),
  getStatistics: () => advancedOtpEngine.getStatistics(),
  closeModem: () => advancedOtpEngine.closeModem()
}; 