const axios = require('axios');
const config = require('../../../config/config');
const logger = require('../logger');

/**
 * Envoie un SMS en utilisant la passerelle Android via HTTP.
 * @param {string} phoneNumber
 * @param {string} message
 * @returns {Promise<boolean>}
 */
async function send(phoneNumber, message) {
    const { url, timeout } = config.SMS_GATEWAY_CONFIG;

    if (!url) {
        logger.error('[SMS-Gateway] L\'URL de la passerelle n\'est pas configurée.');
        return false;
    }

    // Le format de la charge utile (payload) dépend de l'application.
    // Pour "GSM Modem (SMS)" de Sindhi Developers, c'est généralement simple.
    const payload = {
        phone: phoneNumber,
        message: message,
        // Si votre app demande une clé, ajoutez-la ici
        // secret: apiKey 
    };

    try {
        logger.info(`[SMS-Gateway] Envoi d'un SMS à ${phoneNumber} via ${url}`);
        
        const response = await axios.post(url, payload, {
            timeout: timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Vérifiez une réponse de succès. Cela peut varier selon l'application.
        if (response.status === 200) {
            const data = response.data;
            
            // Différentes applications peuvent avoir différents formats de réponse
            // Vérifications possibles selon l'application Android
            if (data.success === true || data.status === 'success' || data.result === 'OK' || response.status === 200) {
                logger.info('[SMS-Gateway] SMS envoyé avec succès via la passerelle Android.');
                return true;
            } else {
                logger.error('[SMS-Gateway] La passerelle a retourné un échec.', { 
                    status: response.status, 
                    data: data 
                });
                return false;
            }
        } else {
            logger.error('[SMS-Gateway] Réponse HTTP non réussie.', { 
                status: response.status, 
                data: response.data 
            });
            return false;
        }

    } catch (error) {
        if (error.response) {
            logger.error('[SMS-Gateway] Erreur de réponse de la passerelle:', { 
                status: error.response.status, 
                data: error.response.data 
            });
        } else if (error.request) {
            logger.error('[SMS-Gateway] Aucune réponse reçue de la passerelle. Vérifiez l\'IP, le port et la connexion Wi-Fi.');
        } else {
            logger.error('[SMS-Gateway] Erreur lors de la configuration de la requête:', error.message);
        }
        return false;
    }
}

module.exports = { send }; 