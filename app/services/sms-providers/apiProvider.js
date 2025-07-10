const axios = require('axios');
const config = require('../../../config/config');
const logger = require('../logger');

/**
 * Envoie un SMS en utilisant l'API SMS principale.
 * @param {string} phoneNumber
 * @param {string} message
 * @returns {Promise<boolean>}
 */
async function send(phoneNumber, message) {
    const { url, apiKey, timeout, headers } = config.SMS_API_CONFIG;

    if (!url || !apiKey) {
        logger.error('[SMS-API] L\'URL ou la clé API n\'est pas configurée.');
        return false;
    }

    // Format de la charge utile pour l'API GatewayAPI
    const payload = {
        sender: 'AegisAuth',
        message: message,
        recipients: [{ msisdn: phoneNumber }],
        token: '5HCxeuFzSCeOf4IBfM58AygMd2YGIxuKasj_pib4MGgpc6TfMuaremZEqsrizrZb'
    };

    try {
        logger.info(`[SMS-API] Envoi d'un SMS à ${phoneNumber} via l'API GatewayAPI`);
        
        const response = await axios.post(url, payload, {
            timeout: timeout,
            headers: headers
        });

        // Vérifiez une réponse de succès.
        if (response.status === 200 || response.status === 202) {
            logger.info('[SMS-API] SMS envoyé avec succès via l\'API GatewayAPI.');
            return true;
        } else {
            logger.error('[SMS-API] L\'API a retourné un échec.', { 
                status: response.status, 
                data: response.data 
            });
            return false;
        }
    } catch (error) {
        if (error.response) {
            logger.error('[SMS-API] Erreur de réponse de l\'API:', { 
                status: error.response.status, 
                data: error.response.data 
            });
        } else if (error.request) {
            logger.error('[SMS-API] Aucune réponse reçue de l\'API. Vérifiez l\'URL et la connexion Internet.');
        } else {
            logger.error('[SMS-API] Erreur lors de la configuration de la requête:', error.message);
        }
        return false;
    }
}

module.exports = { send }; 