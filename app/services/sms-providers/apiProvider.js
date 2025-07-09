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

    // Format de la charge utile pour l'API SMS
    // Vous devrez peut-être ajuster selon votre fournisseur d'API
    const payload = {
        to: phoneNumber,
        text: message,
        api_key: apiKey,
        // Ajoutez d'autres champs selon votre API
        // from: 'YourAppName',
        // type: 'text'
    };

    try {
        logger.info(`[SMS-API] Envoi d'un SMS à ${phoneNumber} via l'API principale`);
        
        const response = await axios.post(url, payload, {
            timeout: timeout,
            headers: {
                ...headers,
                'Authorization': `Bearer ${apiKey}` // Au cas où l'API utilise Bearer token
            }
        });

        // Vérifiez une réponse de succès. Cela peut varier selon votre API.
        if (response.status === 200) {
            // Différents fournisseurs API ont différents formats de réponse
            const data = response.data;
            
            // Vérifications possibles selon votre API
            if (data.success === true || data.status === 'success' || data.message_id) {
                logger.info('[SMS-API] SMS envoyé avec succès via l\'API principale.');
                return true;
            } else {
                logger.error('[SMS-API] L\'API a retourné un échec.', { 
                    status: response.status, 
                    data: data 
                });
                return false;
            }
        } else {
            logger.error('[SMS-API] Réponse HTTP non réussie.', { 
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