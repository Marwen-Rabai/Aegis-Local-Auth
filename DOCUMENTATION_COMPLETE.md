# 📚 Documentation Complète - Aegis Local Auth

## 🛡️ Système d'Authentification Locale par SMS

### Version 1.0.0 - Documentation Technique et Guide d'Utilisation

**Développé par :** [MARWEN RABAI](https://marwenrabai.strtikingly.com)  
**Portfolio :** [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)

---

## 1. Introduction

**Aegis Local Auth** est un système d'authentification locale par SMS permettant la vérification d'identité en toute autonomie. L'application utilise un système modulaire d'envoi de SMS avec trois méthodes principales :

- **API SMS** : Utilisation d'un fournisseur API externe
- **Passerelle Android** : Envoi via une application mobile sur réseau Wi-Fi
- **Modem GSM** : Envoi direct via modem physique USB

### Nouvelles Fonctionnalités

- **Système d'envoi SMS modulaire** avec basculement automatique
- **Enregistrement illimité** de numéros de téléphone
- **Enregistrement de masse** jusqu'à 10,000 numéros simultanément
- **Surveillance en temps réel** avec statistiques détaillées
- **Interface web moderne** avec suivi de progression

---

## 2. Architecture Générale de l'Application

### 2.1 Vue d'Ensemble des Modules

```
Aegis Local Auth/
├── config/
│   └── config.js              # Configuration principale
├── app/
│   ├── controllers/
│   │   └── userController.js  # Logique d'authentification
│   ├── services/
│   │   ├── otpEngine.js       # Moteur OTP et envoi SMS
│   │   ├── logger.js          # Service de journalisation
│   │   ├── massRegistrationService.js  # Service d'enregistrement de masse
│   │   └── sms-providers/     # Fournisseurs SMS modulaires
│   │       ├── apiProvider.js     # Fournisseur API
│   │       ├── gatewayProvider.js # Fournisseur passerelle Android
│   │       └── modemProvider.js   # Fournisseur modem GSM
│   ├── database/
│   │   └── database.js        # Gestion base de données SQLite
│   └── routes/
│       └── authRoutes.js      # Routes API
└── server.js                  # Point d'entrée principal
```

### 2.2 Flux d'Authentification OTP

1. **Requête d'enregistrement** : L'utilisateur soumet un numéro de téléphone
2. **Génération OTP** : Le système génère un code à 6 chiffres
3. **Sélection du fournisseur** : Le système choisit le fournisseur SMS principal
4. **Envoi du SMS** : Le code OTP est envoyé via le fournisseur sélectionné
5. **Basculement automatique** : En cas d'échec, tentative avec un fournisseur de secours
6. **Stockage sécurisé** : Le hash OTP est stocké en base avec une expiration
7. **Vérification** : L'utilisateur saisit le code reçu pour validation

---

## 3. Architecture du Système d'Envoi de SMS

### 3.1 Vue d'Ensemble Modulaire

Le système utilise une architecture basée sur des **"providers"** (fournisseurs) permettant une flexibilité maximale :

```javascript
// Chargement dynamique des fournisseurs
const providers = {
    api: require('./sms-providers/apiProvider'),
    modem: require('./sms-providers/modemProvider'),
    gateway: require('./sms-providers/gatewayProvider')
};
```

### 3.2 Composants Clés

#### **A. Configuration (`config/config.js`)**
- Définit le fournisseur principal (`SMS_PROVIDER`)
- Active/désactive le basculement (`SMS_FALLBACK_ENABLED`)
- Configure les paramètres de chaque fournisseur

#### **B. Moteur OTP (`otpEngine.js`)**
- Génère les codes OTP sécurisés
- Gère la logique de basculement
- Coordonne l'envoi via les fournisseurs

#### **C. Fournisseurs SMS (`sms-providers/`)**
- **apiProvider.js** : Intégration avec API SMS externe
- **gatewayProvider.js** : Communication avec application Android
- **modemProvider.js** : Communication série avec modem GSM

### 3.3 Logique de Basculement

```javascript
// Ordre de basculement selon le fournisseur principal
if (primaryProvider === 'api') {
    fallbackProviders = ['gateway', 'modem'];
} else if (primaryProvider === 'gateway') {
    fallbackProviders = ['api', 'modem'];
} else if (primaryProvider === 'modem') {
    fallbackProviders = ['api', 'gateway'];
}
```

---

## 4. Système de Surveillance et Statistiques

### 4.1 Service de Journalisation

L'application utilise **Winston** pour la journalisation multi-niveaux :

```javascript
// Types de logs disponibles
- logs/error.log     # Erreurs et warnings
- logs/access.log    # Logs généraux et accès
- Console output     # Affichage en temps réel
```

### 4.2 Statistiques Système

Accessible via `/api/statistics` :

- **État du système** : Statut opérationnel, temps de fonctionnement
- **Performance SMS** : Taux de succès, temps de réponse moyen
- **Statistiques base de données** : Utilisateurs totaux, vérifiés, verrouillés
- **État du modem** : Santé, signal, réseau (si applicable)
- **Opérations en cours** : Enregistrements de masse actifs

### 4.3 Interface Web de Surveillance

**URL d'accès** : `http://localhost:3000`

#### Éléments de l'Interface :

1. **Onglet Enregistrement** : Vérification individuelle
2. **Onglet Enregistrement de Masse** : Traitement par lots
3. **Onglet Statistiques** : Métriques temps réel

#### Indicateurs Visuels :

- **Barres de progression** : Avancement des opérations
- **Compteurs en temps réel** : Succès/échecs/total
- **Statut coloré** : Vert (succès), rouge (échec), orange (en cours)

---

## 5. Installation de l'Application

### 5.1 Prérequis

- **Node.js** 16+ (testé sur 22.16.0)
- **npm** (inclus avec Node.js)
- **Modem GSM** physique (optionnel, pour envoi direct)
- **Téléphone Android** (optionnel, pour passerelle)
- **Accès réseau** (pour API SMS)

### 5.2 Installation

```bash
# 1. Cloner le dépôt
git clone <repository-url>
cd "Aegis Local Auth"

# 2. Installation des dépendances (RECOMMANDÉ)
node install.js

# 3. Alternative manuelle
npm install

# 4. Vérifier l'installation
npm run test
```

### 5.3 Configuration Initiale

1. Vérifier le fichier `config/config.js`
2. Configurer les permissions pour le modem (si utilisé)
3. Tester la connectivité réseau

---

## 6. Configuration de l'Envoi de SMS

### 6.1 Configuration Principale

```javascript
// config/config.js - Section SMS
SMS_PROVIDER: 'api',           // Fournisseur principal
SMS_FALLBACK_ENABLED: true,    // Basculement automatique
```

### 6.2 Fournisseur API SMS

```javascript
SMS_API_CONFIG: {
    apiKey: 'votre-cle-api',
    url: 'https://api.votre-fournisseur.com/send',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
}
```

**Configuration requise :**
- Obtenir une clé API auprès de votre fournisseur SMS
- Configurer l'URL d'endpoint
- Ajuster le timeout selon vos besoins

### 6.3 Fournisseur Passerelle Android

```javascript
SMS_GATEWAY_CONFIG: {
    url: 'http://192.168.1.140:8090/send',
    apiKey: null,
    timeout: 10000
}
```

**Configuration requise :**
1. Installer l'application "GSM Modem (SMS)" sur Android
2. Connecter le téléphone au même réseau Wi-Fi
3. Noter l'adresse IP affichée dans l'application
4. Remplacer `192.168.1.140` par l'IP de votre téléphone

**⚠️ Important** : La clé API doit correspondre entre l'application et la configuration.

### 6.4 Fournisseur Modem GSM

```javascript
// Configuration port série
SERIAL_PORT_PATH: 'COM5',      // Windows
// SERIAL_PORT_PATH: '/dev/ttyUSB0',  // Linux
// SERIAL_PORT_PATH: '/dev/tty.usbmodem*',  // macOS
SERIAL_BAUD_RATE: 9600,
```

**Configuration requise :**
1. Connecter le modem GSM via USB
2. Identifier le port série (Gestionnaire de périphériques sous Windows)
3. Configurer le bon port dans `config.js`

---

## 7. Guide d'Utilisation Détaillé

### 7.1 Démarrage de l'Application

```bash
# Mode production
npm start

# Mode développement (avec redémarrage automatique)
npm run dev
```

### 7.2 Interface Web

**Accès** : `http://localhost:3000`

#### Onglet "Enregistrement"
- Saisir un numéro de téléphone
- Cliquer sur "Envoyer OTP"
- Saisir le code reçu
- Cliquer sur "Vérifier OTP"

#### Onglet "Enregistrement de Masse"
- Coller les numéros (un par ligne)
- Cliquer sur "Démarrer l'enregistrement de masse"
- Suivre le progrès en temps réel

#### Onglet "Statistiques"
- Consulter les métriques système
- Vérifier l'état du modem
- Rafraîchir les statistiques

### 7.3 Test d'Envoi SMS

#### Via cURL :
```bash
# Enregistrement
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+33612345678"}'

# Vérification
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+33612345678", "otp": "123456"}'
```

#### Vérifications à effectuer :
1. **Logs console** : Messages de succès/échec
2. **Téléphone destinataire** : Réception du SMS
3. **Fichiers logs** : `logs/access.log` et `logs/error.log`

### 7.4 Test du Basculement

#### Simulation d'échec :
1. **Arrêter l'application Android** (pour tester passerelle → API/modem)
2. **Débrancher le modem** (pour tester modem → API/passerelle)
3. **Configurer une mauvaise URL API** (pour tester API → passerelle/modem)

#### Observation des logs :
```javascript
// Exemple de log de basculement
[OTPEngine] Le fournisseur principal (gateway) a échoué. 
Tentative avec le fournisseur de secours: api
[OTPEngine] Envoi réussi avec le fournisseur de secours (api).
```

---

## 8. Accès aux Logs et Surveillance

### 8.1 Fichiers de Logs

```
logs/
├── access.log    # Logs généraux et accès
├── error.log     # Erreurs et warnings
```

### 8.2 Interprétation des Logs

#### Logs d'Enregistrement :
```
[INFO]: Registration attempt - Phone: $2b$12$ab..., IP: 192.168.1.100
[INFO]: ✅ Registration successful for phone: +336****5678
```

#### Logs d'Envoi SMS :
```
[INFO]: [OTPEngine] Démarrage de l'envoi SMS OTP vers +336****5678
[INFO]: [OTPEngine] ✅ SMS OTP envoyé avec succès en 2340ms
```

#### Logs d'Erreur :
```
[ERROR]: [SMS-Gateway] Aucune réponse reçue de la passerelle. 
Vérifiez l'IP, le port et la connexion Wi-Fi.
```

### 8.3 Surveillance des Performances

#### Endpoints de Monitoring :
```bash
# Santé du système
GET /api/health

# Statistiques complètes
GET /api/statistics

# Statut des opérations en cours
GET /api/mass-register/{operationId}
```

---

## 9. Extensibilité

### 9.1 Ajout d'un Nouveau Fournisseur SMS

#### Exemple : Intégration Twilio

1. **Créer le fournisseur** :
```javascript
// app/services/sms-providers/twilioProvider.js
const twilio = require('twilio');

async function send(phoneNumber, message) {
    const client = twilio(accountSid, authToken);
    try {
        await client.messages.create({
            body: message,
            from: '+1234567890',
            to: phoneNumber
        });
        return true;
    } catch (error) {
        console.error('Twilio error:', error);
        return false;
    }
}

module.exports = { send };
```

2. **Ajouter à la configuration** :
```javascript
// config/config.js
SMS_PROVIDER: 'twilio',  // Nouveau fournisseur

TWILIO_CONFIG: {
    accountSid: 'your-account-sid',
    authToken: 'your-auth-token',
    fromNumber: '+1234567890'
}
```

3. **Intégrer dans otpEngine.js** :
```javascript
const providers = {
    api: require('./sms-providers/apiProvider'),
    modem: require('./sms-providers/modemProvider'),
    gateway: require('./sms-providers/gatewayProvider'),
    twilio: require('./sms-providers/twilioProvider')  // Nouveau
};
```

---

## 10. Dépannage (FAQ)

### 10.1 Problèmes d'Installation

#### ❌ Erreur "node-pre-gyp"
```bash
# Solution
node install.js  # Utilise l'installation corrigée
```

#### ❌ Erreur "serialport"
```bash
# Solution
npm cache clean --force

# Linux/macOS
rm -rf node_modules package-lock.json

# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

# Puis réinstaller
node install.js
```

### 10.2 Problèmes SMS

#### ❌ "Modem not responding"
- Vérifier le port série dans `config.js`
- Tester avec un autre port USB
- Vérifier les drivers modem

#### ❌ "Passerelle Android inaccessible"
- Vérifier l'IP dans `config.js`
- S'assurer que PC et téléphone sont sur le même Wi-Fi
- Vérifier que l'application Android est active

#### ❌ "API SMS échec"
- Vérifier la clé API
- Contrôler l'URL d'endpoint
- Vérifier le crédit du compte SMS

### 10.3 Problèmes de Performance

#### ❌ "Envoi lent"
- Réduire `BULK_SMS_DELAY` dans `config.js`
- Vérifier la qualité du signal modem
- Optimiser la connexion réseau

#### ❌ "Interface web ne répond pas"
- Vérifier les logs dans `logs/error.log`
- Redémarrer l'application
- Vérifier la mémoire disponible

---

## 11. Annexe : Extraits de Code Clés

### 11.1 Configuration Complète

```javascript
// config/config.js
module.exports = {
  // Configuration serveur
  SERVER_PORT: 3000,
  
  // Configuration SMS
  SMS_PROVIDER: 'api',
  SMS_FALLBACK_ENABLED: true,
  
  // Configuration API SMS
  SMS_API_CONFIG: {
    apiKey: 'votre-cle-api',
    url: 'https://api.fournisseur.com/send',
    timeout: 15000
  },
  
  // Configuration passerelle Android
  SMS_GATEWAY_CONFIG: {
    url: 'http://192.168.1.140:8090/send',
    timeout: 10000
  },
  
  // Configuration modem
  SERIAL_PORT_PATH: 'COM5',
  SERIAL_BAUD_RATE: 9600,
  
  // Configuration OTP
  OTP_EXPIRATION_MINUTES: 5,
  MAX_OTP_ATTEMPTS: 3,
  
  // Configuration enregistrement de masse
  BULK_SMS_DELAY: 2000,
  MAX_BULK_SIZE: 10000
};
```

### 11.2 Fournisseur Modem GSM

```javascript
// app/services/sms-providers/modemProvider.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

async function send(phoneNumber, message) {
    try {
        // Initialiser le modem
        await sendATCommand('AT+CMGF=1');  // Mode texte
        await sendATCommand(`AT+CMGS="${phoneNumber}"`);
        
        // Envoyer le message
        const response = await sendATCommand(message + String.fromCharCode(26));
        
        return response.includes('OK') || response.includes('+CMGS:');
    } catch (error) {
        console.error('Erreur modem:', error);
        return false;
    }
}
```

### 11.3 Fournisseur Passerelle Android

```javascript
// app/services/sms-providers/gatewayProvider.js
const axios = require('axios');

async function send(phoneNumber, message) {
    const { url, timeout } = config.SMS_GATEWAY_CONFIG;
    
    try {
        const response = await axios.post(url, {
            phone: phoneNumber,
            message: message
        }, { timeout });
        
        return response.status === 200;
    } catch (error) {
        console.error('Erreur passerelle:', error);
        return false;
    }
}
```

---

## 12. Bonnes Pratiques

### 12.1 Sécurité

- **Hachage des données** : Numéros de téléphone et OTP hachés avant stockage
- **Limitation de débit** : Protection contre les attaques par déni de service
- **Expiration des codes** : OTP valides pendant 5 minutes uniquement
- **Verrouillage des comptes** : Après 3 tentatives de vérification échouées

### 12.2 Performance

- **Envoi par lots** : Traitement optimisé pour les grandes listes
- **Délais configurables** : Éviter la surcharge des fournisseurs
- **Gestion mémoire** : Nettoyage automatique des opérations terminées

### 12.3 Monitoring

- **Logs détaillés** : Traçabilité complète des opérations
- **Métriques temps réel** : Surveillance continue des performances
- **Alertes automatiques** : Détection des problèmes système

---

## 13. Support et Maintenance

### 13.1 Maintenance Régulière

- **Nettoyage des logs** : Rotation automatique après 5MB
- **Sauvegarde base de données** : Backup régulier du fichier SQLite
- **Mise à jour dépendances** : Vérification sécuritaire mensuelle

### 13.2 Surveillance Continue

- **Monitoring 24/7** : Surveillance du taux de succès SMS
- **Alertes critiques** : Notification en cas de panne système
- **Reporting automatique** : Rapports hebdomadaires de performance

---

## 👨‍💻 À Propos du Développeur

**MARWEN RABAI** est un développeur logiciel expert spécialisé dans les applications Node.js, les systèmes SMS et les solutions d'authentification. Avec une expertise dans la création d'applications évolutives, sécurisées et conviviales, Marwen a développé Aegis Local Auth pour fournir un système d'authentification auto-souverain complet.

### 🌐 Connectez-vous avec Marwen :
- **Portfolio** : [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)
- **Spécialisations** : Node.js, Intégration SMS, Systèmes d'Authentification, Applications Temps Réel
- **Technologies** : JavaScript, Express.js, SQLite, Communication Série, WebSockets

### 🛠️ Philosophie de Développement :
- **Solutions Auto-Souveraines** : Contrôle total sur vos données et infrastructure
- **Architecture Modulaire** : Code flexible, extensible et maintenable
- **Design Centré Utilisateur** : Interfaces intuitives avec feedback temps réel
- **Prêt pour l'Entreprise** : Solutions évolutives pour toutes tailles d'entreprise

---

## 📞 Services Professionnels

Besoin de personnalisation ou d'implémentation professionnelle d'Aegis Local Auth ? Marwen propose :

- **Intégration SMS Personnalisée** : Intégration avec des fournisseurs SMS spécifiques
- **Déploiement Entreprise** : Implémentation et optimisation à grande échelle
- **Fonctionnalités Personnalisées** : Fonctionnalités adaptées à vos besoins spécifiques
- **Support Technique** : Maintenance et support continus

Contact via : [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à soumettre des pull requests ou à signaler des problèmes.

### Comment Contribuer :
1. Forker le dépôt
2. Créer une branche de fonctionnalité
3. Effectuer vos modifications
4. Tester minutieusement
5. Soumettre une pull request

---

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

---

## 📧 Support

Pour le support technique, les rapports de bugs ou les demandes de fonctionnalités :
- Créer un issue sur GitHub
- Visiter : [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)

---

*Documentation générée pour Aegis Local Auth v1.0.0*  
*Développé avec ❤️ par [MARWEN RABAI](https://marwenrabai.strtikingly.com)*  
*Dernière mise à jour : 2024* 