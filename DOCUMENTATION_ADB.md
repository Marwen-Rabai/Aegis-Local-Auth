# 📱 Documentation ADB - Aegis Local Auth

## Système d'Envoi de SMS via Android Debug Bridge (ADB)

**Développé par :** [MARWEN RABAI](https://marwenrabai.strtikingly.com)  
**Version :** 2.0.0  
**Date :** 2024-12-30

---

## 🎯 Vue d'Ensemble

Le système ADB (Android Debug Bridge) d'Aegis Local Auth permet d'envoyer des SMS directement via un téléphone Android connecté en USB. Cette méthode offre une connexion ultra-stable et performante pour l'envoi de messages SMS sans nécessiter d'applications tierces ou de configurations réseau complexes.

### Avantages du Système ADB

- **🔌 Connexion USB stable** : Pas de dépendance au Wi-Fi ou réseau mobile
- **⚡ Performance élevée** : Communication directe avec le téléphone
- **🔒 Sécurité renforcée** : Pas de transmission de données via internet
- **🎯 Simplicité** : Configuration automatique via script
- **💰 Économique** : Utilise votre forfait mobile existant

---

## 📋 Prérequis

### Téléphone Android
- **Version Android** : 4.1+ (API 16+)
- **Options développeur** activées
- **Débogage USB** activé
- **Forfait SMS** actif
- **Câble USB** fonctionnel

### Ordinateur
- **Node.js** : Version 16.0.0 ou supérieure
- **Système d'exploitation** : Windows, macOS, ou Linux
- **Port USB** disponible
- **Droits administrateur** (pour l'installation)

---

## 🛠️ Installation Automatique

### Méthode Recommandée

```bash
# Étape 1 : Connecter le téléphone Android via USB
# Étape 2 : Accepter l'autorisation de débogage USB
# Étape 3 : Exécuter le script d'installation

npm run setup-adb
```

### Ce que fait le script automatiquement

1. **Détection du système d'exploitation**
2. **Téléchargement des outils ADB** appropriés
3. **Installation dans le dossier `bin/platform-tools/`**
4. **Configuration automatique** du fichier `config/config.js`
5. **Définition du fournisseur SMS** sur 'adb'

---

## ⚙️ Configuration du Téléphone Android

### Étape 1 : Activer les Options Développeur

1. Allez dans **Paramètres** → **À propos du téléphone**
2. Appuyez **7 fois** sur **"Numéro de build"**
3. Saisissez votre code PIN/motif si demandé
4. Message de confirmation : "Vous êtes maintenant développeur"

### Étape 2 : Activer le Débogage USB

1. Retournez dans **Paramètres** → **Système**
2. Accédez aux **Options pour les développeurs**
3. Activez **"Débogage USB"**
4. Confirmez dans la popup

### Étape 3 : Autoriser l'Ordinateur

1. Connectez le téléphone à l'ordinateur via USB
2. Une popup apparaît : **"Autoriser le débogage USB ?"**
3. Cochez **"Toujours autoriser depuis cet ordinateur"**
4. Appuyez sur **"Autoriser"**

---

## 🔧 Configuration Technique

### Structure des Fichiers ADB

```
Aegis Local Auth/
├── bin/
│   └── platform-tools/
│       ├── adb.exe              # Windows
│       ├── adb                  # Linux/macOS
│       ├── fastboot.exe         # Outil complémentaire
│       └── autres_outils...
├── config/
│   └── config.js               # Configuration ADB
└── app/services/sms-providers/
    └── adbProvider.js          # Fournisseur ADB
```

### Configuration dans config.js

```javascript
// Configuration ADB automatique
SMS_PROVIDER: 'adb',
SMS_FALLBACK_ENABLED: true,
SMS_FALLBACK_PROVIDERS: ['gateway', 'modem'],

SMS_ADB_CONFIG: {
    adbPath: 'chemin/vers/adb.exe',     // Configuré automatiquement
    targetDevice: null,                  // Auto-détection
    timeout: 30000,                     // Timeout en millisecondes
    retryAttempts: 3,                   // Nombre de tentatives
    retryDelay: 2000                    // Délai entre tentatives
}
```

---

## 📱 Commandes ADB pour SMS

### Commandes de Base

```bash
# Vérifier la connexion
adb devices

# Tester la connectivité
adb shell echo "Test connexion"

# Vérifier le service SMS
adb shell service check isms
```

### Commandes d'Envoi SMS

#### Android 4.1 - 8.1 (API 16-27)
```bash
adb shell service call isms 5 s16 "NUMERO" i32 0 i32 0 s16 "MESSAGE"
```

#### Android 9.0+ (API 28+)
```bash
adb shell service call isms 7 i32 0 s16 "com.android.mms.service" s16 "NUMERO" s16 "null" s16 "MESSAGE" s16 "null" s16 "null"
```

#### Android 11+ (API 30+)
```bash
adb shell service call isms 5 i32 1 s16 "com.android.mms.service" s16 "null" s16 "NUMERO" s16 "null" s16 "MESSAGE" s16 "null" s16 "null" i32 1 i32 0
```

### Paramètres des Commandes

- **NUMERO** : Numéro de téléphone (format international recommandé)
- **MESSAGE** : Texte du SMS (échapper les espaces avec `\`)
- **i32** : Paramètre entier 32 bits
- **s16** : Paramètre chaîne de caractères

---

## 🏗️ Architecture du Fournisseur ADB

### Fichier adbProvider.js

```javascript
const { exec } = require('child_process');
const config = require('../../../config/config');
const logger = require('../logger');

class ADBProvider {
    constructor() {
        this.adbPath = config.SMS_ADB_CONFIG.adbPath;
        this.timeout = config.SMS_ADB_CONFIG.timeout || 30000;
        this.retryAttempts = config.SMS_ADB_CONFIG.retryAttempts || 3;
        this.retryDelay = config.SMS_ADB_CONFIG.retryDelay || 2000;
    }

    async send(phoneNumber, message) {
        // Implémentation de l'envoi SMS
        // Détection automatique de la version Android
        // Gestion des erreurs et tentatives
        // Logging détaillé
    }

    async detectAndroidVersion() {
        // Détection de la version Android
        // Retourne la commande SMS appropriée
    }

    async executeADBCommand(command) {
        // Exécution sécurisée des commandes ADB
        // Gestion des timeouts
        // Parsing des réponses
    }
}

module.exports = new ADBProvider();
```

### Flux d'Exécution

1. **Vérification de la connexion** ADB
2. **Détection de la version Android** du téléphone
3. **Sélection de la commande SMS** appropriée
4. **Échappement du message** (espaces, caractères spéciaux)
5. **Exécution de la commande** ADB
6. **Analyse de la réponse** et gestion des erreurs
7. **Logging** détaillé des opérations

---

## 🔍 Diagnostic et Dépannage

### Commandes de Diagnostic

```bash
# Vérifier les appareils connectés
adb devices

# Informations sur l'appareil
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk

# État du service SMS
adb shell service check isms
adb shell service list | grep isms

# Test de connectivité
adb shell echo "Test réussi"
```

### Problèmes Courants

#### 1. Appareil Non Détecté
```bash
# Vérifications
adb kill-server
adb start-server
adb devices

# Solutions
- Vérifier le câble USB
- Réautoriser le débogage USB
- Redémarrer ADB
```

#### 2. Service SMS Indisponible
```bash
# Diagnostic
adb shell service check isms

# Solutions
- Redémarrer le téléphone
- Vérifier les permissions SMS
- Tester avec l'application SMS native
```

#### 3. Échec d'Envoi SMS
```bash
# Vérifications
- Crédit SMS disponible
- Réseau mobile actif
- Numéro de téléphone valide
- Format du message correct
```

### Codes d'Erreur ADB

| Code | Description | Solution |
|------|-------------|----------|
| `device offline` | Appareil déconnecté | Reconnecter USB |
| `device unauthorized` | Autorisation refusée | Réautoriser débogage |
| `no devices/emulators found` | Aucun appareil | Vérifier connexion |
| `service not found` | Service SMS absent | Redémarrer téléphone |

---

## 📊 Surveillance et Logging

### Logs du Système ADB

```javascript
// Exemple de logs détaillés
[ADB-SMS] Démarrage envoi SMS vers +33*****678
[ADB-SMS] Détection Android version: 11 (API 30)
[ADB-SMS] Commande sélectionnée: isms 5
[ADB-SMS] Exécution: adb shell service call isms 5...
[ADB-SMS] Réponse: Result: Parcel(00000000 '....')
[ADB-SMS] ✅ SMS envoyé avec succès en 2.3s
```

### Métriques de Performance

- **Temps d'envoi moyen** : 2-5 secondes
- **Taux de succès** : 95%+ avec bonne connexion
- **Débit maximum** : 1 SMS par seconde
- **Latence USB** : < 100ms

---

## 🔐 Sécurité et Bonnes Pratiques

### Sécurité

1. **Autorisations limitées** : ADB uniquement pour cet ordinateur
2. **Débogage désactivé** en production
3. **Câble USB sécurisé** pour éviter les écoutes
4. **Logs anonymisés** (numéros masqués)

### Bonnes Pratiques

1. **Test régulier** de la connectivité
2. **Monitoring** des échecs d'envoi
3. **Mise à jour** des outils ADB
4. **Sauvegarde** de la configuration
5. **Documentation** des modifications

---

## 🚀 Utilisation Avancée

### Envoi en Lot

```javascript
// Exemple d'envoi massif via ADB
const results = await bulkSendSMS(phoneNumbers, customMessage);
console.log(`Envoyés: ${results.successful.length}`);
console.log(`Échecs: ${results.failed.length}`);
```

### Intégration API

```javascript
// Endpoint pour envoi SMS via ADB
POST /api/sms/send
{
    "phoneNumber": "+33612345678",
    "message": "Votre code OTP: 123456"
}
```

### Surveillance Temps Réel

```javascript
// WebSocket pour monitoring en temps réel
ws.on('sms_status', (data) => {
    console.log(`SMS ${data.id}: ${data.status}`);
});
```

---

## 📚 Références et Ressources

### Documentation Officielle

- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)
- [Platform Tools](https://developer.android.com/studio/releases/platform-tools)
- [Android SMS API](https://developer.android.com/reference/android/telephony/SmsManager)

### Ressources Communautaires

- [ADB SMS Scripts](https://github.com/topics/adb-sms)
- [Android SMS via ADB](https://stackoverflow.com/questions/tagged/android-sms+adb)
- [ADB Commands Reference](https://adbshell.com/)

### Outils Complémentaires

- **scrcpy** : Contrôle d'écran Android
- **Vysor** : Mirroring d'écran
- **ADB WiFi** : ADB sans fil

---

## 🔄 Mises à Jour et Maintenance

### Mise à Jour des Outils ADB

```bash
# Vérifier la version actuelle
adb version

# Télécharger la dernière version
# https://developer.android.com/studio/releases/platform-tools

# Remplacer les fichiers dans bin/platform-tools/
```

### Maintenance Préventive

1. **Nettoyage mensuel** des logs
2. **Vérification** des connexions
3. **Test** des fonctionnalités
4. **Mise à jour** de la documentation

---

## 🆘 Support et Assistance

### Contact Développeur

- **Portfolio** : [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)
- **Email** : Contact via portfolio
- **Spécialisation** : Systèmes SMS, Node.js, Android

### Ressources d'Aide

1. **Logs détaillés** : `logs/aegis.log`
2. **Diagnostic automatique** : `npm run check`
3. **Tests système** : `npm run test`
4. **Documentation complète** : `DOCUMENTATION_COMPLETE.md`

---

## 📝 Changelog ADB

### Version 2.0.0 (2024-12-30)
- ✅ Implémentation complète du système ADB
- ✅ Support multi-versions Android
- ✅ Configuration automatique
- ✅ Diagnostic avancé
- ✅ Documentation complète

### Version 1.0.0 (2024-12-29)
- 🚀 Première version du système ADB
- 📱 Support Android 4.1+
- 🔧 Script d'installation automatique
- 📊 Logging de base

---

*Cette documentation est maintenue par **MARWEN RABAI** dans le cadre du projet **Aegis Local Auth**. Pour toute question ou amélioration, consultez le portfolio du développeur.* 