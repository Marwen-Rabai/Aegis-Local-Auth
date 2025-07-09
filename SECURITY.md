# 🔒 Guide de Sécurité - Aegis Local Auth

## Politique de Sécurité et Bonnes Pratiques

**Développé par :** [MARWEN RABAI](https://marwenrabai.strtikingly.com)  
**Version :** 1.0.0

---

## 🛡️ Architecture de Sécurité

### Principes Fondamentaux
- **Zero Trust** : Aucune confiance par défaut
- **Défense en profondeur** : Multiples couches de sécurité
- **Principe du moindre privilège** : Accès minimal nécessaire
- **Chiffrement en transit et au repos** : Protection des données

### Composants Sécurisés
```
┌─────────────────────────────────────────────────────────────┐
│                    Aegis Local Auth                        │
├─────────────────────────────────────────────────────────────┤
│  🔒 Helmet (Security Headers)                              │
│  🛡️ CORS (Cross-Origin Protection)                        │
│  ⚡ Rate Limiting (DDoS Protection)                        │
│  🔐 Input Validation (XSS/SQL Injection)                   │
│  🗝️ Bcrypt (Password Hashing)                             │
│  📝 Audit Logging (Security Events)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentification et Autorisation

### Hachage des Données Sensibles
```javascript
// Hachage des numéros de téléphone
const phoneHash = await bcrypt.hash(phoneNumber, 12);

// Hachage des codes OTP
const otpHash = await bcrypt.hash(otp, 12);

// Vérification sécurisée
const isValid = await bcrypt.compare(otp, otpHash);
```

### Gestion des Sessions
- **Pas de sessions persistantes** : Chaque requête est indépendante
- **OTP à usage unique** : Codes utilisés une seule fois
- **Expiration automatique** : 5 minutes par défaut
- **Verrouillage de compte** : Après 3 tentatives échouées

### Rate Limiting
```javascript
// Configuration de limitation de débit
RATE_LIMIT: {
  REGISTRATION: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 tentatives par fenêtre
    message: {
      error: 'Rate limit reached. Please wait before sending more SMS.',
      retryAfter: '15 minutes'
    }
  },
  VERIFICATION: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 tentatives par fenêtre
    message: {
      error: 'Too many verification attempts. Please try again later.',
      retryAfter: '5 minutes'
    }
  }
}
```

---

## 🛡️ Protection contre les Attaques

### Headers de Sécurité (Helmet)
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));
```

### Protection CORS
```javascript
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser uniquement les origines configurées
    if (!origin) return callback(null, true);
    
    if (config.CORS_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.error(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Validation des Entrées
```javascript
// Validation stricte des numéros de téléphone
const phoneNumberValidation = [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 digits')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in valid international format')
    .trim()
    .escape()
];

// Validation des codes OTP
const otpValidation = [
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
    .trim()
    .escape()
];
```

---

## 🔍 Journalisation de Sécurité

### Événements de Sécurité Loggés
```javascript
// Tentatives d'authentification
logger.authAttempt(phoneHash, success, clientIP);

// Violations de rate limiting
logger.rateLimitExceeded(endpoint, clientIP);

// Verrouillage de comptes
logger.accountLocked(phoneHash, attempts, clientIP);

// Tentatives d'enregistrement
logger.registration(phoneHash, clientIP);
```

### Format des Logs de Sécurité
```json
{
  "timestamp": "2024-12-30T10:30:00.000Z",
  "level": "warn",
  "event": "security_violation",
  "type": "rate_limit_exceeded",
  "ip": "192.168.1.100",
  "endpoint": "/api/register",
  "user_agent": "Mozilla/5.0...",
  "details": {
    "windowMs": 900000,
    "max": 100,
    "current": 101
  }
}
```

### Rotation des Logs
```javascript
// Configuration Winston pour la sécurité
new winston.transports.File({
  filename: path.join(logsDir, 'security.log'),
  level: 'warn',
  maxsize: 5242880, // 5MB
  maxFiles: 10,
  handleExceptions: true,
  handleRejections: true
})
```

---

## 🗄️ Sécurité des Données

### Chiffrement des Données
- **Numéros de téléphone** : Hachés avec bcrypt (salt rounds: 12)
- **Codes OTP** : Hachés avant stockage
- **Base de données** : SQLite avec chiffrement optionnel
- **Transit** : HTTPS obligatoire en production

### Anonymisation des Données
```javascript
// Masquage des numéros de téléphone dans les logs
const maskedPhone = phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');

// Hachage des identifiants pour la confidentialité
const phoneHash = await bcrypt.hash(phoneNumber, 12);
```

### Rétention des Données
```javascript
// Configuration de rétention
STATS_RETENTION_DAYS: 90, // Statistiques conservées 90 jours
STATS_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // Nettoyage quotidien
```

---

## 🌐 Sécurité Réseau

### Configuration HTTPS
```javascript
// Redirection HTTP vers HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### Headers de Sécurité Supplémentaires
```javascript
// Headers de sécurité personnalisés
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
  next();
});
```

### Protection contre les Attaques DDoS
```javascript
// Rate limiting par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite par IP
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## 🔧 Sécurité de la Configuration

### Gestion des Secrets
```javascript
// Variables d'environnement pour les secrets
const config = {
  SMS_API_KEY: process.env.SMS_API_KEY,
  SMS_API_URL: process.env.SMS_API_URL,
  DATABASE_PATH: process.env.DATABASE_PATH || './aegis_users.sqlite',
  SERVER_PORT: process.env.PORT || 3000
};
```

### Validation de Configuration
```javascript
// Vérification des paramètres critiques
const validateConfig = () => {
  const required = ['SMS_API_KEY', 'SMS_API_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
```

### Permissions de Fichiers
```bash
# Permissions sécurisées pour les fichiers sensibles
chmod 600 config/config.js
chmod 700 logs/
chmod 700 uploads/
chown -R aegis:aegis /app
```

---

## 🚨 Gestion des Incidents

### Détection d'Anomalies
```javascript
// Détection de comportements suspects
const detectAnomalies = (req, res, next) => {
  const clientIP = req.ip;
  const userAgent = req.get('User-Agent');
  
  // Vérifier les patterns suspects
  if (isSuspiciousPattern(clientIP, userAgent)) {
    logger.warn('Suspicious activity detected', {
      ip: clientIP,
      userAgent,
      endpoint: req.path
    });
    
    // Bloquer temporairement
    return res.status(403).json({
      success: false,
      message: 'Access temporarily blocked'
    });
  }
  
  next();
};
```

### Procédures d'Urgence
1. **Attaque DDoS détectée** : Activer le mode maintenance
2. **Violation de données** : Isoler et analyser
3. **Compte compromis** : Révoquer et notifier
4. **Vulnérabilité découverte** : Patch immédiat

### Plan de Réponse
```javascript
// Script de réponse aux incidents
const incidentResponse = async (incident) => {
  // 1. Isoler l'incident
  await isolateIncident(incident);
  
  // 2. Notifier les parties prenantes
  await notifyStakeholders(incident);
  
  // 3. Analyser l'impact
  const impact = await analyzeImpact(incident);
  
  // 4. Corriger le problème
  await remediateIncident(incident);
  
  // 5. Documenter l'incident
  await documentIncident(incident, impact);
};
```

---

## 📋 Audit de Sécurité

### Checklist de Sécurité
- [ ] **Authentification** : Hachage bcrypt configuré
- [ ] **Autorisation** : Rate limiting actif
- [ ] **Validation** : Toutes les entrées validées
- [ ] **Chiffrement** : HTTPS en production
- [ ] **Journalisation** : Logs de sécurité actifs
- [ ] **Configuration** : Secrets dans variables d'environnement
- [ ] **Mise à jour** : Dépendances à jour
- [ ] **Monitoring** : Alertes configurées

### Tests de Sécurité
```bash
# Audit des dépendances
npm audit

# Test de pénétration
npm run security-test

# Analyse statique
npm run lint:security
```

### Outils de Sécurité Recommandés
- **OWASP ZAP** : Test de pénétration
- **Snyk** : Audit des dépendances
- **ESLint Security** : Analyse statique
- **Helmet** : Headers de sécurité

---

## 🔄 Mise à Jour de Sécurité

### Processus de Patch
1. **Détection** : Monitoring automatique des vulnérabilités
2. **Évaluation** : Analyse de l'impact
3. **Développement** : Correction du problème
4. **Test** : Validation en environnement de test
5. **Déploiement** : Mise à jour en production
6. **Vérification** : Confirmation de la correction

### Politique de Mise à Jour
- **Critiques** : Patch dans les 24h
- **Importantes** : Patch dans la semaine
- **Modérées** : Patch dans le mois
- **Faibles** : Patch lors de la prochaine version

---

## 📞 Signalement de Vulnérabilités

### Coordonnées de Sécurité
- **Email de sécurité** : security@marwenrabai.strtikingly.com
- **Responsable** : MARWEN RABAI
- **Portfolio** : [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)

### Processus de Signalement
1. **Découverte** : Identifier la vulnérabilité
2. **Signalement** : Contacter l'équipe de sécurité
3. **Analyse** : Évaluation de la vulnérabilité
4. **Correction** : Développement du patch
5. **Déploiement** : Mise à jour sécurisée
6. **Notification** : Communication aux utilisateurs

---

## 📊 Métriques de Sécurité

### KPIs de Sécurité
- **Tentatives d'attaque** : Nombre par jour/semaine
- **Taux de blocage** : Pourcentage d'attaques bloquées
- **Temps de réponse** : Délai de correction des incidents
- **Couverture de tests** : Pourcentage de code testé

### Tableau de Bord de Sécurité
```javascript
// Métriques de sécurité en temps réel
const securityMetrics = {
  activeThreats: getActiveThreats(),
  blockedRequests: getBlockedRequests(),
  securityEvents: getSecurityEvents(),
  systemHealth: getSystemHealth()
};
```

---

**Développé par [MARWEN RABAI](https://marwenrabai.strtikingly.com)**  
**Guide de sécurité v1.0.0** 