const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('../../../config/config');
const logger = require('../logger');

let port;
let parser;

// Initialiser la connexion au modem
function initializeModem() {
    if (port && port.isOpen) return;
    
    try {
        port = new SerialPort({
            path: config.SERIAL_PORT_PATH,
            baudRate: config.SERIAL_BAUD_RATE,
        });

        parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        port.on('open', () => logger.info('[SMS-Modem] Port série ouvert.'));
        port.on('error', (err) => logger.error('[SMS-Modem] Erreur de port série:', err));
        
    } catch (error) {
        logger.error('[SMS-Modem] Échec de l\'initialisation du modem.', error);
        port = null;
    }
}

// Initialise le modem au démarrage
initializeModem();

/**
 * Envoie une commande AT et attend la réponse
 * @param {string} command
 * @param {number} timeout
 * @returns {Promise<string>}
 */
function sendATCommand(command, timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (!port || !port.isOpen) {
            reject(new Error('Port série non ouvert'));
            return;
        }

        const responses = [];
        
        const timer = setTimeout(() => {
            parser.removeListener('data', dataHandler);
            reject(new Error(`Timeout: ${command}`));
        }, timeout);

        const dataHandler = (data) => {
            const response = data.toString().trim();
            if (response) {
                responses.push(response);
                
                if (response.includes('OK') || response.includes('ERROR') || response.includes('+CMGS:')) {
                    clearTimeout(timer);
                    parser.removeListener('data', dataHandler);
                    resolve(responses.join('\n'));
                }
            }
        };

        parser.on('data', dataHandler);
        port.write(command + '\r');
    });
}

/**
 * Envoie un SMS en utilisant le modem GSM physique.
 * @param {string} phoneNumber
 * @param {string} message
 * @returns {Promise<boolean>}
 */
async function send(phoneNumber, message) {
    if (!port || !port.isOpen) {
        logger.error('[SMS-Modem] Le port série n\'est pas ouvert ou disponible.');
        return false;
    }

    try {
        logger.info(`[SMS-Modem] Envoi d'un SMS à ${phoneNumber} via modem GSM`);
        
        // Initialiser les paramètres du modem
        await sendATCommand('ATE0', 5000); // Disable echo
        await sendATCommand('AT', 5000); // Test basic connectivity
        await sendATCommand('AT+CMGF=1', 5000); // Set SMS text mode
        await sendATCommand('AT+CSCS="GSM"', 5000); // Set character set
        
        // Configurer le centre de service SMS si nécessaire
        try {
            await sendATCommand('AT+CSCA="+213661000111"', 10000);
            logger.info('[SMS-Modem] Centre de service SMS configuré pour Mobilis');
        } catch (scError) {
            logger.warn('[SMS-Modem] Impossible de configurer le centre de service SMS:', scError.message);
        }

        // Démarrer l'envoi du SMS
        const setRecipientResponse = await sendATCommand(`AT+CMGS="${phoneNumber}"`, 15000);
        
        if (!setRecipientResponse.includes('>')) {
            throw new Error(`Échec de la configuration du destinataire SMS - pas de prompt reçu. Réponse: ${setRecipientResponse}`);
        }
        
        logger.info(`[SMS-Modem] Prompt SMS reçu pour ${phoneNumber}, envoi du message...`);

        // Envoyer le contenu du message avec Ctrl+Z
        const messageResponse = await sendATCommand(message + String.fromCharCode(26), 45000);
        
        if (messageResponse.includes('OK') || messageResponse.includes('+CMGS:')) {
            logger.info(`[SMS-Modem] SMS envoyé avec succès à ${phoneNumber}`);
            return true;
        } else {
            throw new Error(`Échec de l'envoi du SMS - réponse inattendue: ${messageResponse}`);
        }

    } catch (error) {
        logger.error(`[SMS-Modem] Échec de l'envoi du SMS à ${phoneNumber}:`, error.message);
        return false;
    }
}

/**
 * Ferme la connexion au modem
 */
function closeModem() {
    if (port && port.isOpen) {
        port.close();
        logger.info('[SMS-Modem] Connexion au modem fermée.');
    }
}

module.exports = { send, closeModem }; 