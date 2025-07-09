# 📚 Référence API - Aegis Local Auth

## Documentation Complète des Endpoints

**Développé par :** [MARWEN RABAI](https://marwenrabai.strtikingly.com)  
**Version :** 1.0.0

---

## 🌐 Base URL

```
http://localhost:3000/api
```

---

## 🔐 Authentification

L'API utilise une authentification basée sur les numéros de téléphone et codes OTP. Aucun token d'authentification n'est requis pour les endpoints publics.

---

## 📱 Endpoints d'Enregistrement

### POST /api/register

Enregistre un numéro de téléphone et envoie un code OTP.

#### Requête
```json
{
  "phoneNumber": "+33612345678"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "OTP sent successfully to your phone number",
  "phoneNumber": "+336****5678",
  "expiresIn": 5,
  "messageId": "msg_123456789",
  "duration": 2340,
  "timestamp": "2024-12-30T10:30:00.000Z",
  "mode": "real_sms"
}
```

#### Réponse Demo Mode (200)
```json
{
  "success": true,
  "message": "📱 Demo Mode: Registration successful! (GSM modem not connected)",
  "phoneNumber": "+336****5678",
  "expiresIn": 5,
  "mode": "demo",
  "demo": {
    "message": "🔧 GSM modem not connected - System running in demo mode",
    "instruction": "Connect a GSM modem with SIM card for real SMS functionality",
    "generatedOTP": "123456",
    "note": "In demo mode, the OTP is shown here for testing purposes"
  },
  "timestamp": "2024-12-30T10:30:00.000Z"
}
```

#### Réponse Erreur (422)
```json
{
  "success": false,
  "message": "Invalid input data",
  "errors": [
    {
      "type": "field",
      "value": "invalid-phone",
      "msg": "Phone number must be in valid international format",
      "path": "phoneNumber",
      "location": "body"
    }
  ]
}
```

#### Limites
- **Rate Limit** : 1000 requêtes par fenêtre de 15 minutes
- **Format** : Numéro international (ex: +33612345678)
- **Longueur** : 10-15 chiffres

---

### POST /api/verify

Vérifie un code OTP pour un numéro de téléphone.

#### Requête
```json
{
  "phoneNumber": "+33612345678",
  "otp": "123456"
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "phoneNumber": "+336****5678",
  "verified": true,
  "timestamp": "2024-12-30T10:35:00.000Z"
}
```

#### Réponse OTP Invalide (400)
```json
{
  "success": false,
  "message": "Invalid OTP",
  "remainingAttempts": 2,
  "failedAttempts": 1
}
```

#### Réponse Compte Verrouillé (423)
```json
{
  "success": false,
  "message": "Account locked due to multiple failed verification attempts",
  "lockStatus": true,
  "maxAttemptsReached": true
}
```

#### Réponse OTP Expiré (400)
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one.",
  "expired": true
}
```

#### Limites
- **Rate Limit** : 100 requêtes par fenêtre de 5 minutes
- **Tentatives** : 3 tentatives maximum avant verrouillage
- **Expiration** : 5 minutes

---

## 📊 Endpoints de Masse

### POST /api/mass-register

Démarre un enregistrement de masse pour plusieurs numéros.

#### Requête
```json
{
  "phoneNumbers": [
    "+33612345678",
    "+33687654321",
    "+33611111111",
    "+33622222222"
  ]
}
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "operationId": "op_1640123456789_abc123",
  "validNumbers": 4,
  "invalidNumbers": 0,
  "estimatedDuration": "8 seconds",
  "message": "Mass registration started successfully"
}
```

#### Réponse Erreur (422)
```json
{
  "success": false,
  "message": "Invalid input data",
  "errors": [
    {
      "type": "field",
      "value": ["invalid-number"],
      "msg": "Invalid phone number format",
      "path": "phoneNumbers[0]",
      "location": "body"
    }
  ]
}
```

#### Limites
- **Rate Limit** : 10 opérations par heure
- **Taille max** : 10,000 numéros par opération
- **Format** : Array de numéros internationaux

---

### GET /api/mass-register/{operationId}

Récupère le statut d'une opération de masse.

#### Réponse Succès (200)
```json
{
  "success": true,
  "operation": {
    "id": "op_1640123456789_abc123",
    "status": "completed",
    "progress": "100.00",
    "total": 4,
    "processed": 4,
    "successful": 3,
    "failed": 1,
    "startTime": "2024-12-30T10:30:00.000Z",
    "endTime": "2024-12-30T10:30:08.000Z",
    "duration": 8000,
    "successRate": "75.00",
    "results": {
      "successful": [
        {
          "phoneNumber": "+336****5678",
          "timestamp": "2024-12-30T10:30:02.000Z",
          "otp": "123456"
        }
      ],
      "failed": [
        {
          "phoneNumber": "+336****2222",
          "error": "Invalid phone number",
          "timestamp": "2024-12-30T10:30:05.000Z"
        }
      ]
    }
  }
}
```

#### Réponse Opération en Cours (200)
```json
{
  "success": true,
  "operation": {
    "id": "op_1640123456789_abc123",
    "status": "processing",
    "progress": "50.00",
    "total": 4,
    "processed": 2,
    "successful": 2,
    "failed": 0,
    "startTime": "2024-12-30T10:30:00.000Z",
    "estimatedTimeRemaining": "4 seconds"
  }
}
```

---

## 📈 Endpoints de Monitoring

### GET /api/health

Vérifie la santé du système.

#### Réponse Succès (200)
```json
{
  "status": "healthy",
  "timestamp": "2024-12-30T10:30:00.000Z",
  "system": {
    "nodeVersion": "v22.16.0",
    "platform": "win32",
    "arch": "x64",
    "uptime": 3600,
    "memoryUsage": {
      "rss": 84905984,
      "heapTotal": 66043904,
      "heapUsed": 32456789,
      "external": 1234567
    },
    "pid": 1234
  },
  "database": {
    "status": "connected",
    "totalUsers": 150,
    "verifiedUsers": 120,
    "lockedUsers": 5
  },
  "modem": {
    "status": "healthy",
    "signal": {
      "quality": "excellent",
      "strength": -45
    },
    "sim": {
      "status": "ready",
      "operator": "Orange"
    },
    "network": {
      "status": "registered",
      "type": "4G"
    }
  },
  "features": {
    "unlimitedRegistration": true,
    "massRegistration": true,
    "fileUpload": true,
    "statisticsApi": true,
    "demoMode": false
  },
  "version": "1.0.0"
}
```

---

### GET /api/statistics

Récupère les statistiques complètes du système.

#### Réponse Succès (200)
```json
{
  "success": true,
  "statistics": {
    "system": {
      "status": "operational",
      "uptime": 3600,
      "version": "1.0.0",
      "mode": "production",
      "timestamp": "2024-12-30T10:30:00.000Z"
    },
    "database": {
      "status": "connected",
      "totalUsers": 150,
      "verifiedUsers": 120,
      "lockedUsers": 5,
      "totalRegistrations": 200,
      "successfulRegistrations": 180,
      "failedRegistrations": 20
    },
    "modem": {
      "status": "healthy",
      "totalSent": 180,
      "successRate": "95.00",
      "averageResponseTime": "2.3s",
      "lastActivity": "2024-12-30T10:29:45.000Z"
    },
    "massRegistration": {
      "overview": {
        "totalOperations": 5,
        "activeOperations": 1,
        "totalProcessed": 1000,
        "totalSuccessful": 950,
        "overallSuccessRate": "95.00"
      }
    },
    "performance": {
      "totalRegistrations": 180,
      "successRate": "95.00",
      "averageResponseTime": "< 3s"
    },
    "features": {
      "unlimitedRegistration": true,
      "massRegistration": true,
      "detailedLogging": true,
      "demoMode": false
    }
  },
  "timestamp": "2024-12-30T10:30:00.000Z"
}
```

---

### GET /api/status

Récupère le statut de base du service.

#### Réponse Succès (200)
```json
{
  "service": "Aegis Local Auth",
  "status": "operational",
  "version": "1.0.0",
  "timestamp": "2024-12-30T10:30:00.000Z",
  "features": {
    "unlimitedRegistration": true,
    "massRegistration": true,
    "detailedLogging": true,
    "statisticsApi": true
  },
  "endpoints": {
    "register": "POST /api/register",
    "verify": "POST /api/verify",
    "massRegister": "POST /api/mass-register",
    "massRegisterStatus": "GET /api/mass-register/:operationId",
    "statistics": "GET /api/statistics",
    "health": "GET /api/health"
  },
  "limits": {
    "registrationPerWindow": 1000,
    "verificationPerWindow": 100,
    "bulkOperationsPerHour": 10,
    "maxPhoneNumbersPerBulk": 10000
  }
}
```

---

## 🔧 Endpoints de Diagnostic

### GET /api/modem-info

Récupère les informations détaillées du modem GSM.

#### Réponse Succès (200)
```json
{
  "success": true,
  "modem": {
    "status": "healthy",
    "provider": "modem",
    "fallback": true,
    "port": "COM5",
    "baudRate": 9600,
    "signal": {
      "quality": "excellent",
      "strength": -45,
      "bars": 5
    },
    "sim": {
      "status": "ready",
      "operator": "Orange",
      "country": "France",
      "iccid": "89014103211118510720"
    },
    "network": {
      "status": "registered",
      "type": "4G",
      "cellId": "12345678",
      "lac": "8765"
    },
    "lastActivity": "2024-12-30T10:29:45.000Z"
  }
}
```

---

## 📋 Codes d'Erreur

### Codes HTTP

| Code | Description |
|------|-------------|
| 200 | Succès |
| 400 | Requête invalide |
| 422 | Données de validation invalides |
| 423 | Compte verrouillé |
| 429 | Rate limit dépassé |
| 500 | Erreur serveur interne |

### Messages d'Erreur Courants

```json
{
  "success": false,
  "message": "Rate limit reached. Please wait before sending more SMS.",
  "retryAfter": "15 minutes"
}
```

```json
{
  "success": false,
  "message": "API endpoint not found",
  "availableEndpoints": [
    "/api/register",
    "/api/verify",
    "/api/mass-register",
    "/api/statistics",
    "/api/health",
    "/api/status"
  ]
}
```

---

## 🔒 Sécurité

### Headers de Sécurité
- **Content-Security-Policy** : Protection XSS
- **X-Frame-Options** : Protection clickjacking
- **X-Content-Type-Options** : Protection MIME sniffing
- **Strict-Transport-Security** : HTTPS enforcement

### Validation des Données
- **Phone Numbers** : Format international validé
- **OTP Codes** : 6 chiffres exactement
- **Rate Limiting** : Protection contre les abus
- **Input Sanitization** : Nettoyage des entrées

---

## 📊 Exemples d'Utilisation

### cURL Examples

#### Enregistrement Simple
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+33612345678"}'
```

#### Vérification OTP
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+33612345678", "otp": "123456"}'
```

#### Enregistrement de Masse
```bash
curl -X POST http://localhost:3000/api/mass-register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": [
      "+33612345678",
      "+33687654321",
      "+33611111111"
    ]
  }'
```

#### Suivi de Progression
```bash
curl http://localhost:3000/api/mass-register/op_1640123456789_abc123
```

### JavaScript Examples

#### Enregistrement avec Fetch
```javascript
const registerPhone = async (phoneNumber) => {
  const response = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phoneNumber })
  });
  
  return await response.json();
};

// Utilisation
registerPhone('+33612345678')
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

#### Vérification avec Axios
```javascript
const axios = require('axios');

const verifyOTP = async (phoneNumber, otp) => {
  try {
    const response = await axios.post('http://localhost:3000/api/verify', {
      phoneNumber,
      otp
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
```

---

## 🔄 Webhooks (Futur)

Les webhooks seront disponibles dans les prochaines versions pour :
- Notifications d'enregistrement réussi
- Alertes d'échec SMS
- Rapports de masse terminés
- Monitoring en temps réel

---

## 📞 Support API

### Documentation Complète
- **README.md** : Guide principal
- **DOCUMENTATION_COMPLETE.md** : Documentation technique
- **QUICK_START.md** : Démarrage rapide

### Contact Développeur
- **Portfolio** : [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)
- **Support technique** : Via le portfolio
- **Services personnalisés** : Disponibles

---

**Développé par [MARWEN RABAI](https://marwenrabai.strtikingly.com)**  
**Version API : 1.0.0** 