const { exec } = require('child_process');
const config = require('../../../config/config');
const logger = require('../logger');

/**
 * ADB SMS Provider for Aegis Local Auth
 * Sends SMS via Android Debug Bridge (ADB)
 * 
 * @author MARWEN RABAI
 * @version 2.0.0
 */
class ADBProvider {
    constructor() {
        this.adbPath = config.SMS_ADB_CONFIG?.adbPath || 'adb';
        this.targetDevice = config.SMS_ADB_CONFIG?.targetDevice || null;
        this.timeout = config.SMS_ADB_CONFIG?.timeout || 30000;
        this.retryAttempts = config.SMS_ADB_CONFIG?.retryAttempts || 3;
        this.retryDelay = config.SMS_ADB_CONFIG?.retryDelay || 2000;
        this.androidVersion = null;
        this.deviceId = null;
    }

    /**
     * Sends SMS via ADB
     * @param {string} phoneNumber - Target phone number
     * @param {string} message - SMS message content
     * @returns {Promise<boolean>} - Success status
     */
    async send(phoneNumber, message) {
        const startTime = Date.now();
        logger.info(`[SMS-ADB] Démarrage envoi SMS vers ${this.maskPhoneNumber(phoneNumber)}`);

        try {
            // Check ADB connection
            const isConnected = await this.checkConnection();
            if (!isConnected) {
                logger.error('[SMS-ADB] Aucun appareil Android connecté via ADB');
                return false;
            }

            // Detect Android version if not cached
            if (!this.androidVersion) {
                this.androidVersion = await this.detectAndroidVersion();
                logger.info(`[SMS-ADB] Version Android détectée: ${this.androidVersion}`);
            }

            // Prepare SMS command based on Android version
            const smsCommand = this.buildSMSCommand(phoneNumber, message);
            logger.info(`[SMS-ADB] Commande SMS préparée pour Android ${this.androidVersion}`);

            // Execute SMS command with multiple strategies and retry logic
            let lastError = null;
            const strategies = [0, 1, 2]; // Try all strategies
            
            for (const strategy of strategies) {
                const strategyName = ['Default', 'Alternative', 'Intent-based'][strategy];
                logger.info(`[SMS-ADB] Essai de la stratégie ${strategy}: ${strategyName}`);
                
                const smsCommand = this.buildSMSCommand(phoneNumber, message, strategy);
                
                for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
                    try {
                        logger.info(`[SMS-ADB] Stratégie ${strategy}, Tentative ${attempt}/${this.retryAttempts}`);
                        
                        const result = await this.executeADBCommand(smsCommand);
                        
                        // For intent-based strategy, any successful execution means SMS was sent
                        if (strategy === 2) {
                            if (result.includes('Starting:') || result.includes('Activity')) {
                                const duration = Date.now() - startTime;
                                logger.info(`[SMS-ADB] ✅ SMS envoyé avec succès via Intent en ${duration}ms`);
                                return true;
                            }
                        } else if (this.isSuccessResponse(result)) {
                            const duration = Date.now() - startTime;
                            logger.info(`[SMS-ADB] ✅ SMS envoyé avec succès via ${strategyName} en ${duration}ms`);
                            return true;
                        }
                        
                        throw new Error(`Réponse ADB inattendue: ${result}`);
                        
                    } catch (error) {
                        lastError = error;
                        logger.error(`[SMS-ADB] Stratégie ${strategy}, Tentative ${attempt} échouée: ${error.message}`);
                        
                        if (attempt < this.retryAttempts) {
                            await this.delay(this.retryDelay);
                        }
                    }
                }
                
                logger.info(`[SMS-ADB] Stratégie ${strategy} (${strategyName}) a échoué, passage à la suivante`);
            }

            logger.error(`[SMS-ADB] ❌ Échec après toutes les stratégies et tentatives: ${lastError.message}`);
            return false;

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`[SMS-ADB] ❌ Erreur critique après ${duration}ms:`, error.message);
            return false;
        }
    }

    /**
     * Checks ADB connection and device availability
     * @returns {Promise<boolean>} - Connection status
     */
    async checkConnection() {
        try {
            const command = `"${this.adbPath}" devices`;
            const result = await this.executeCommand(command, 10000);
            
            const lines = result.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
            const connectedDevices = lines.filter(line => line.includes('device') && !line.includes('offline'));
            
            if (connectedDevices.length === 0) {
                logger.error('[SMS-ADB] Aucun appareil Android connecté');
                return false;
            }

            // Store device ID for targeted commands
            this.deviceId = connectedDevices[0].split('\t')[0];
            logger.info(`[SMS-ADB] Appareil connecté: ${this.deviceId}`);
            return true;

        } catch (error) {
            logger.error('[SMS-ADB] Erreur de vérification de connexion:', error.message);
            return false;
        }
    }

    /**
     * Detects Android version of connected device
     * @returns {Promise<string>} - Android version
     */
    async detectAndroidVersion() {
        try {
            const devicePrefix = this.deviceId ? `-s ${this.deviceId}` : '';
            const command = `"${this.adbPath}" ${devicePrefix} shell getprop ro.build.version.release`;
            const version = await this.executeCommand(command, 10000);
            
            const majorVersion = parseInt(version.trim().split('.')[0]);
            logger.info(`[SMS-ADB] Version Android: ${version.trim()} (API ${majorVersion})`);
            
            return majorVersion;
        } catch (error) {
            logger.error('[SMS-ADB] Impossible de détecter la version Android, utilisation par défaut', error);
            return 11; // Default to Android 11 command format
        }
    }

    /**
     * Builds SMS command based on Android version with fallback strategies
     * @param {string} phoneNumber - Target phone number
     * @param {string} message - SMS message
     * @param {number} strategy - Command strategy (0=default, 1=alternative, 2=intent)
     * @returns {string} - ADB SMS command
     */
    buildSMSCommand(phoneNumber, message, strategy = 0) {
        const devicePrefix = this.deviceId ? `-s ${this.deviceId}` : '';
        const escapedMessage = this.escapeMessage(message);
        const formattedNumber = this.formatPhoneNumber(phoneNumber);

        // Strategy 2: Intent-based SMS (most reliable for Samsung and custom ROMs)
        if (strategy === 2) {
            return `"${this.adbPath}" ${devicePrefix} shell am start -a android.intent.action.SENDTO -d sms:${formattedNumber} --es sms_body "${message}" --ez exit_on_sent true`;
        }

        // Strategy 1: Alternative service call format
        if (strategy === 1) {
            if (this.androidVersion >= 11) {
                return `"${this.adbPath}" ${devicePrefix} shell service call isms 4 i32 1 s16 "com.android.messaging" s16 "${formattedNumber}" s16 "null" s16 "${escapedMessage}" s16 "null" s16 "null"`;
            } else if (this.androidVersion >= 9) {
                return `"${this.adbPath}" ${devicePrefix} shell service call isms 6 s16 "${formattedNumber}" s16 "null" s16 "${escapedMessage}" s16 "null" s16 "null"`;
            } else {
                return `"${this.adbPath}" ${devicePrefix} shell service call isms 4 s16 "${formattedNumber}" i32 0 i32 0 s16 "${escapedMessage}"`;
            }
        }

        // Strategy 0: Default service call format
        if (this.androidVersion >= 11) {
            // Android 11+ (API 30+)
            return `"${this.adbPath}" ${devicePrefix} shell service call isms 5 i32 1 s16 "com.android.mms.service" s16 "null" s16 "${formattedNumber}" s16 "null" s16 "${escapedMessage}" s16 "null" s16 "null" i32 1 i32 0`;
        } else if (this.androidVersion >= 9) {
            // Android 9-10 (API 28-29)
            return `"${this.adbPath}" ${devicePrefix} shell service call isms 7 i32 0 s16 "com.android.mms.service" s16 "${formattedNumber}" s16 "null" s16 "${escapedMessage}" s16 "null" s16 "null"`;
        } else {
            // Android 4.1-8.1 (API 16-27)
            return `"${this.adbPath}" ${devicePrefix} shell service call isms 5 s16 "${formattedNumber}" i32 0 i32 0 s16 "${escapedMessage}"`;
        }
    }

    /**
     * Executes ADB command with timeout
     * @param {string} command - ADB command to execute
     * @returns {Promise<string>} - Command output
     */
    async executeADBCommand(command) {
        logger.info(`[SMS-ADB] Exécution: ${this.sanitizeCommand(command)}`);
        return await this.executeCommand(command, this.timeout);
    }

    /**
     * Executes shell command with timeout
     * @param {string} command - Shell command
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<string>} - Command output
     */
    executeCommand(command, timeout) {
        return new Promise((resolve, reject) => {
            const process = exec(command, { timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Erreur d'exécution: ${error.message}`));
                    return;
                }
                
                if (stderr && stderr.trim()) {
                    logger.error(`[SMS-ADB] Avertissement: ${stderr.trim()}`);
                }
                
                resolve(stdout.trim());
            });

            // Handle timeout
            setTimeout(() => {
                process.kill();
                reject(new Error('Timeout de commande ADB'));
            }, timeout);
        });
    }

    /**
     * Checks if ADB response indicates success
     * @param {string} response - ADB command response
     * @returns {boolean} - Success status
     */
    isSuccessResponse(response) {
        // ADB SMS success indicators
        const successIndicators = [
            'Result: Parcel(',
            '00000000',
            'null'
        ];
        
        return successIndicators.some(indicator => 
            response.includes(indicator)
        );
    }

    /**
     * Escapes special characters in SMS message
     * @param {string} message - Original message
     * @returns {string} - Escaped message
     */
    escapeMessage(message) {
        return message
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/"/g, '\\"')    // Escape quotes
            .replace(/'/g, "\\'")    // Escape single quotes
            .replace(/ /g, '\\ ')    // Escape spaces
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\t/g, '\\t');  // Escape tabs
    }

    /**
     * Formats phone number for ADB command
     * @param {string} phoneNumber - Original phone number
     * @returns {string} - Formatted phone number
     */
    formatPhoneNumber(phoneNumber) {
        // Remove any existing formatting
        let formatted = phoneNumber.replace(/[^\d+]/g, '');
        
        // Ensure international format if not already
        if (!formatted.startsWith('+')) {
            // Add default country code if needed (customize based on your region)
            if (formatted.length === 10) {
                formatted = '+33' + formatted; // France example
            } else if (formatted.length === 9) {
                formatted = '+213' + formatted; // Algeria example
            }
        }
        
        return formatted;
    }

    /**
     * Masks phone number for logging
     * @param {string} phoneNumber - Original phone number
     * @returns {string} - Masked phone number
     */
    maskPhoneNumber(phoneNumber) {
        if (phoneNumber.length <= 4) return phoneNumber;
        
        const start = phoneNumber.substring(0, 3);
        const end = phoneNumber.substring(phoneNumber.length - 2);
        const middle = '*'.repeat(phoneNumber.length - 5);
        
        return `${start}${middle}${end}`;
    }

    /**
     * Sanitizes command for logging (removes sensitive data)
     * @param {string} command - Original command
     * @returns {string} - Sanitized command
     */
    sanitizeCommand(command) {
        // Replace phone numbers and messages with placeholders
        return command
            .replace(/s16 "\+?\d{8,15}"/g, 's16 "[PHONE_NUMBER]"')
            .replace(/s16 "[^"]*message[^"]*"/gi, 's16 "[MESSAGE_CONTENT]"');
    }

    /**
     * Delays execution for specified milliseconds
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gets ADB provider status and information
     * @returns {Promise<Object>} - Provider status
     */
    async getStatus() {
        try {
            const isConnected = await this.checkConnection();
            const version = this.androidVersion || await this.detectAndroidVersion();
            
            return {
                provider: 'adb',
                status: isConnected ? 'connected' : 'disconnected',
                deviceId: this.deviceId,
                androidVersion: version,
                adbPath: this.adbPath,
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                provider: 'adb',
                status: 'error',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }
}

// Export singleton instance
module.exports = new ADBProvider(); 