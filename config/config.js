/**
 * Aegis Local Auth - Configuration Module
 * Centralized configuration constants for security, reliability, and hardware control
 */

module.exports = {
  // Server Configuration
  SERVER_PORT: process.env.PORT || 3000,
  
  // GSM Modem Serial Communication Settings
  SERIAL_PORT_PATH: process.env.SERIAL_PORT || 'COM5', // Back to COM5 - working port
  SERIAL_BAUD_RATE: 9600,
  
  // OTP Security Settings
  OTP_EXPIRATION_MINUTES: 5,
  MAX_OTP_ATTEMPTS: 3,
  
  // Cryptographic Settings
  BCRYPT_SALT_ROUNDS: 12,
  
  // Bulk SMS Configuration
  BULK_SMS_DELAY: 2000, // Delay between SMS sends in milliseconds
  MAX_BULK_SIZE: 10000, // Maximum numbers per bulk operation (0 = unlimited)
  BULK_BATCH_SIZE: 100, // Process in batches for large lists
  
  // Rate Limiting Configuration - More permissive for mass registration
  RATE_LIMIT: {
    REGISTRATION: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Increased for mass registration
      message: {
        error: 'Rate limit reached. Please wait before sending more SMS.',
        retryAfter: '15 minutes'
      }
    },
    VERIFICATION: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 100, // Increased for mass verification
      message: {
        error: 'Too many verification attempts. Please try again later.',
        retryAfter: '5 minutes'
      }
    },
    BULK_SMS: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Max 10 bulk operations per hour
      message: {
        error: 'Bulk SMS rate limit exceeded. Please wait before sending more.',
        retryAfter: '1 hour'
      }
    },
    STATISTICS: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute for statistics
      message: {
        error: 'Statistics rate limit exceeded.',
        retryAfter: '1 minute'
      }
    }
  },
  
  // CORS Configuration
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  
  // Database Configuration
  DATABASE_PATH: './aegis_users.sqlite',
  
  // File Upload Configuration
  UPLOAD_DIR: './uploads',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB max file size
  ALLOWED_FILE_TYPES: ['.csv', '.xlsx', '.xls', '.txt'],
  
  // Statistics Configuration
  STATS_RETENTION_DAYS: 90, // Keep statistics for 90 days
  STATS_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // Clean up every 24 hours
  
  // Logging Configuration
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',  
    INFO: 'info',
    DEBUG: 'debug'
  },
  
  // Advanced Features
  FEATURES: {
    UNLIMITED_REGISTRATION: true, // Allow unlimited phone registrations
    MASS_REGISTRATION: true, // Enable mass registration features
    DETAILED_LOGGING: true, // Enhanced logging with phone number tracking
    STATISTICS_API: true, // Enable statistics endpoints
    FILE_UPLOAD: true, // Enable file upload for bulk operations
    REAL_TIME_MONITORING: true // Enable real-time monitoring
  },

  // ===================================================================
  // NOUVELLE CONFIGURATION POUR L'ENVOI DE SMS
  // ===================================================================

  /**
   * Choisissez le fournisseur de services SMS principal.
   * Options possibles :
   * - 'api': Pour utiliser l'API SMS principale.
   * - 'gateway': Pour utiliser une application de passerelle SMS sur Android via HTTP.
   * - 'modem': Pour utiliser le modem GSM physique connecté via USB.
   */
  SMS_PROVIDER: 'api', // MODIFIEZ CECI pour choisir votre méthode par défaut

  /**
   * Liste ordonnée des fournisseurs de secours à utiliser si le fournisseur principal échoue.
   * Ajustez l'ordre selon vos préférences.
   */
  SMS_FALLBACK_PROVIDERS: ['gateway', 'modem'],

  /**
   * Activez le basculement automatique.
   * Si 'true', et que le fournisseur principal (SMS_PROVIDER) échoue,
   * le système essaiera automatiquement d'envoyer avec l'autre fournisseur.
   */
  SMS_FALLBACK_ENABLED: true,

  /**
   * Configuration pour l'API SMS principale
   */
  SMS_API_CONFIG: {
    // Votre clé API pour le service SMS
    apiKey: '060dc53b991317113843223d8644095b03d29eb20de08d1a',
    
    // URL de l'API SMS (vous devrez peut-être ajuster selon votre fournisseur)
    url: 'https://api.sms-provider.com/send', // <-- METTEZ L'URL DE VOTRE API ICI
    
    // Timeout pour la requête HTTP en millisecondes
    timeout: 15000,
    
    // Headers supplémentaires si nécessaire
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  /**
   * Configuration pour la passerelle SMS Android
   */
  SMS_GATEWAY_CONFIG: {
    // L'URL affichée par l'application sur votre téléphone Android.
    // Assurez-vous que votre PC et votre téléphone sont sur le même réseau Wi-Fi.
    // L'API de l'app "GSM Modem (SMS)" utilise la méthode POST sur /send
    url: 'http://192.168.1.140:8090/send', // <-- METTEZ L'IP DE VOTRE TÉLÉPHONE ICI

    // La plupart de ces applications simples n'ont pas de clé API, mais c'est une bonne pratique de le prévoir.
    apiKey: null,

    // Timeout pour la requête HTTP en millisecondes
    timeout: 10000
  }
}; 