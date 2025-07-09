# 🚀 Guide de Démarrage Rapide - Aegis Local Auth

## Installation et Configuration en 5 Minutes

**Développé par :** [MARWEN RABAI](https://marwenrabai.strtikingly.com)

---

## ⚡ Installation Express

### 1. Vérifier les prérequis
```bash
node --version  # Doit être v16.0.0+
npm --version   # Doit être installé
```

### 2. Installation automatique
```bash
# Windows PowerShell
node install.js

# Linux/macOS
node install.js
```

### 3. Vérification
```bash
npm run check
```

---

## 🔧 Configuration SMS (Choisir une option)

### Option A : API SMS (Recommandé pour débuter)
```javascript
// config/config.js
SMS_PROVIDER: 'api',
SMS_API_CONFIG: {
  apiKey: 'votre-cle-api-ici',
  url: 'https://api.votre-fournisseur.com/send'
}
```

### Option B : Passerelle Android
```javascript
// config/config.js
SMS_PROVIDER: 'gateway',
SMS_GATEWAY_CONFIG: {
  url: 'http://192.168.1.140:8090/send'  // IP de votre Android
}
```

### Option C : Modem GSM
```javascript
// config/config.js
SMS_PROVIDER: 'modem',
SERIAL_PORT_PATH: 'COM5'  // Windows: COM3, Linux: /dev/ttyUSB0
```

---

## 🚀 Démarrage

```bash
# Démarrer l'application
npm start

# Ou mode développement
npm run dev
```

**Accès :** http://localhost:3000

---

## 🧪 Test Rapide

### Via Interface Web
1. Ouvrir http://localhost:3000
2. Onglet "Enregistrement"
3. Saisir un numéro de téléphone
4. Cliquer "Envoyer OTP"
5. Vérifier la réception du SMS

### Via API
```bash
# Test d'enregistrement
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+33612345678"}'

# Test de vérification
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+33612345678", "otp": "123456"}'
```

---

## 📊 Vérification du Système

### Endpoints de Diagnostic
- **Santé** : http://localhost:3000/api/health
- **Statistiques** : http://localhost:3000/api/statistics
- **Statut** : http://localhost:3000/api/status

### Logs
```bash
# Voir les logs récents
tail -f logs/access.log    # Linux/macOS
Get-Content logs/access.log -Wait  # Windows PowerShell
```

---

## 🔧 Dépannage Rapide

### Problème : "Port COM non trouvé"
```bash
# Windows
Get-WmiObject -Class Win32_SerialPort

# Linux
ls /dev/ttyUSB*
```

### Problème : "API SMS échec"
- Vérifier la clé API
- Contrôler l'URL d'endpoint
- Vérifier le crédit du compte

### Problème : "Passerelle Android inaccessible"
```bash
# Tester la connexion
ping 192.168.1.140

# Vérifier que l'app Android est active
```

---

## 📱 Fonctionnalités Principales

### ✅ Enregistrement Illimité
- Aucune limite sur le nombre de numéros
- Hachage sécurisé des données
- Expiration automatique des OTP

### ✅ Enregistrement de Masse
- Jusqu'à 10,000 numéros simultanément
- Suivi en temps réel
- Rapports détaillés

### ✅ Système SMS Modulaire
- 3 fournisseurs : API, Android, Modem
- Basculement automatique
- Configuration flexible

### ✅ Interface Web Moderne
- Design responsive
- Statistiques temps réel
- Monitoring complet

---

## 🎯 Utilisation Avancée

### Enregistrement de Masse
```bash
# Via API
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

### Surveillance Continue
```bash
# Vérifier la santé du système
curl http://localhost:3000/api/health

# Obtenir les statistiques
curl http://localhost:3000/api/statistics
```

---

## 📚 Documentation Complète

- **README.md** : Guide principal
- **DOCUMENTATION_COMPLETE.md** : Documentation technique complète
- **WINDOWS_SETUP.md** : Guide spécifique Windows
- **CHANGELOG.md** : Historique des versions

---

## 🆘 Support

### Problèmes Courants
1. **Dépendances manquantes** → `node install.js`
2. **Port déjà utilisé** → Changer le port dans `config.js`
3. **Modem non détecté** → Vérifier les pilotes
4. **API SMS échec** → Vérifier la clé et l'URL

### Contact
- **Portfolio** : [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)
- **Support technique** : Via le portfolio
- **Services personnalisés** : Disponibles

---

## 🏆 Bonnes Pratiques

### Sécurité
- Changer les clés API par défaut
- Utiliser HTTPS en production
- Surveiller les logs régulièrement

### Performance
- Utiliser SSD pour de meilleures performances
- Nettoyer les logs anciens
- Surveiller l'utilisation mémoire

### Maintenance
- Sauvegarder la base de données régulièrement
- Mettre à jour les dépendances
- Tester les fournisseurs SMS

---

**Développé avec ❤️ par [MARWEN RABAI](https://marwenrabai.strtikingly.com)**

*Version 1.0.0 - Système d'Authentification SMS Modulaire* 