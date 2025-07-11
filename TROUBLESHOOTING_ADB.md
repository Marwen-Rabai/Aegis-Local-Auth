# 🔧 Guide de Dépannage ADB - Aegis Local Auth

## Résolution des Problèmes ADB SMS

**Développé par :** [MARWEN RABAI](https://marwenrabai.strtikingly.com)  
**Version :** 2.0.0  
**Date :** 2024-12-30

---

## 🚨 Problèmes Courants et Solutions

### 1. Appareil Non Détecté

#### Symptômes
```bash
adb devices
# Résultat: List of devices attached
# (vide)
```

#### Solutions
```bash
# 1. Redémarrer le serveur ADB
adb kill-server
adb start-server
adb devices

# 2. Vérifier les pilotes USB (Windows)
# Aller dans Gestionnaire de périphériques
# Chercher "Périphériques Android" ou "ADB Interface"

# 3. Réautoriser le débogage USB
# Déconnecter/reconnecter le câble USB
# Accepter la popup "Autoriser le débogage USB"
```

#### Diagnostic Avancé
```bash
# Vérifier les périphériques USB
lsusb                    # Linux
system_profiler SPUSBDataType  # macOS

# Windows: Gestionnaire de périphériques
devmgmt.msc
```

---

### 2. Appareil "Unauthorized"

#### Symptômes
```bash
adb devices
# Résultat: XXXXXXXXXX unauthorized
```

#### Solutions
1. **Révoquer les autorisations**
   ```bash
   adb kill-server
   # Sur le téléphone: Options développeur > Révoquer autorisations débogage USB
   # Reconnecter le câble USB
   # Accepter la nouvelle popup d'autorisation
   ```

2. **Vérifier les clés RSA**
   ```bash
   # Supprimer les clés existantes
   rm ~/.android/adbkey*    # Linux/macOS
   # Windows: C:\Users\[USER]\.android\adbkey*
   
   adb kill-server
   adb start-server
   ```

---

### 3. Service SMS Introuvable

#### Symptômes
```bash
adb shell service check isms
# Résultat: Service isms: not found
```

#### Solutions
1. **Redémarrer le téléphone**
   ```bash
   adb reboot
   # Attendre le redémarrage complet
   adb devices
   ```

2. **Vérifier les services système**
   ```bash
   adb shell service list | grep -i sms
   adb shell service list | grep -i telephony
   ```

3. **Tester avec l'application SMS native**
   - Ouvrir l'application SMS du téléphone
   - Envoyer un SMS manuellement
   - Vérifier que le service fonctionne

---

### 4. Échec d'Envoi SMS

#### Symptômes
```bash
# Commande ADB exécutée mais SMS non reçu
Result: Parcel(00000000 '....')
```

#### Solutions
1. **Vérifier le crédit SMS**
   ```bash
   # Tester avec l'application SMS native
   # Vérifier le solde du forfait
   ```

2. **Vérifier le réseau mobile**
   ```bash
   adb shell dumpsys telephony.registry | grep -i signal
   adb shell getprop gsm.network.type
   ```

3. **Tester le format du numéro**
   ```bash
   # Format international recommandé
   +33612345678  # France
   +213771234567 # Algérie
   +1234567890   # USA
   ```

---

### 5. Problèmes de Version Android

#### Symptômes
```bash
# Commande ADB différente selon la version
# Erreur: "service call" non reconnu
```

#### Solutions
1. **Détecter la version Android**
   ```bash
   adb shell getprop ro.build.version.release
   adb shell getprop ro.build.version.sdk
   ```

2. **Utiliser la commande appropriée**
   ```bash
   # Android 4.1-8.1 (API 16-27)
   adb shell service call isms 5 s16 "NUMERO" i32 0 i32 0 s16 "MESSAGE"
   
   # Android 9-10 (API 28-29)
   adb shell service call isms 7 i32 0 s16 "com.android.mms.service" s16 "NUMERO" s16 "null" s16 "MESSAGE" s16 "null" s16 "null"
   
   # Android 11+ (API 30+)
   adb shell service call isms 5 i32 1 s16 "com.android.mms.service" s16 "null" s16 "NUMERO" s16 "null" s16 "MESSAGE" s16 "null" s16 "null" i32 1 i32 0
   ```

---

### 6. Problèmes de Caractères Spéciaux

#### Symptômes
```bash
# Messages avec caractères spéciaux non reçus
# Erreurs d'échappement
```

#### Solutions
1. **Échapper les caractères spéciaux**
   ```bash
   # Espaces
   "Hello World" → "Hello\ World"
   
   # Guillemets
   "Say \"Hello\"" → "Say\ \"Hello\""
   
   # Apostrophes
   "Don't worry" → "Don\'t\ worry"
   ```

2. **Utiliser printf pour l'échappement automatique**
   ```bash
   MESSAGE=$(printf '%q\n' "Hello World!")
   echo $MESSAGE  # Affiche: Hello\ World!
   ```

---

## 🔍 Outils de Diagnostic

### Script de Diagnostic Complet
```bash
# Exécuter le test complet
npm run test:adb

# Ou avec numéro de test
npm run test:adb +213771234567
```

### Commandes de Diagnostic Manuelles

#### Vérification de Base
```bash
# 1. Version ADB
adb version

# 2. Appareils connectés
adb devices -l

# 3. Informations sur l'appareil
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk
```

#### Vérification SMS
```bash
# 1. Service SMS
adb shell service check isms

# 2. Services liés aux SMS
adb shell service list | grep -i sms
adb shell service list | grep -i telephony

# 3. État du réseau
adb shell dumpsys telephony.registry
```

#### Test de Connectivité
```bash
# 1. Test de base
adb shell echo "Test connexion"

# 2. Test des permissions
adb shell pm list permissions | grep -i sms

# 3. Test des applications SMS
adb shell pm list packages | grep -i sms
```

---

## 🚨 Messages d'Erreur Courants

### "device offline"
```bash
# Cause: Connexion USB instable
# Solution:
adb kill-server
# Déconnecter/reconnecter USB
adb start-server
```

### "device unauthorized"
```bash
# Cause: Autorisation de débogage refusée
# Solution:
# 1. Révoquer autorisations dans Options développeur
# 2. Reconnecter USB
# 3. Accepter nouvelle autorisation
```

### "no devices/emulators found"
```bash
# Cause: Aucun appareil détecté
# Solution:
# 1. Vérifier câble USB
# 2. Vérifier pilotes (Windows)
# 3. Activer débogage USB
```

### "service not found"
```bash
# Cause: Service SMS indisponible
# Solution:
# 1. Redémarrer téléphone
# 2. Vérifier version Android
# 3. Tester app SMS native
```

---

## 🔧 Résolution par Système d'Exploitation

### Windows

#### Problèmes de Pilotes
```powershell
# 1. Installer pilotes ADB
# Télécharger: https://developer.android.com/studio/run/win-usb

# 2. Vérifier dans Gestionnaire de périphériques
devmgmt.msc
# Chercher "ADB Interface" ou "Android Device"

# 3. Mettre à jour pilotes si nécessaire
```

#### Problèmes de Chemin
```powershell
# 1. Vérifier le chemin ADB
where adb

# 2. Ajouter au PATH si nécessaire
$env:PATH += ";C:\chemin\vers\platform-tools"
```

### macOS

#### Problèmes de Permissions
```bash
# 1. Autoriser dans Préférences Système
sudo spctl --master-disable

# 2. Vérifier les permissions du fichier ADB
chmod +x /chemin/vers/adb
```

### Linux

#### Problèmes d'udev
```bash
# 1. Créer règle udev
sudo nano /etc/udev/rules.d/51-android.rules

# Contenu:
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"

# 2. Recharger les règles
sudo udevadm control --reload-rules
sudo udevadm trigger
```

---

## 📋 Checklist de Dépannage

### Avant de Commencer
- [ ] Téléphone connecté via USB
- [ ] Débogage USB activé
- [ ] Autorisation accordée
- [ ] Crédit SMS disponible
- [ ] Réseau mobile actif

### Tests de Base
- [ ] `adb devices` affiche l'appareil
- [ ] `adb shell echo "test"` fonctionne
- [ ] `adb shell service check isms` trouve le service
- [ ] Version Android détectée correctement

### Tests Avancés
- [ ] Envoi SMS avec app native réussit
- [ ] Commande ADB appropriée utilisée
- [ ] Caractères spéciaux échappés
- [ ] Timeout suffisant configuré

---

## 🆘 Obtenir de l'Aide

### Logs Détaillés
```bash
# Activer les logs ADB
export ADB_TRACE=all
adb logcat | grep -i sms

# Logs de l'application
tail -f logs/aegis.log | grep ADB
```

### Informations à Fournir
1. **Version du système**
   - OS (Windows/macOS/Linux)
   - Version ADB
   - Version Android du téléphone

2. **Sortie des commandes**
   ```bash
   adb devices -l
   adb shell getprop ro.build.version.release
   adb shell service check isms
   ```

3. **Messages d'erreur complets**
   - Logs de l'application
   - Sortie des commandes ADB
   - Messages d'erreur système

### Contact Support
- **Portfolio** : [marwenrabai.strtikingly.com](https://marwenrabai.strtikingly.com)
- **Documentation** : `DOCUMENTATION_ADB.md`
- **Tests** : `npm run test:adb`

---

## 🔄 Maintenance Préventive

### Vérifications Régulières
```bash
# 1. Test hebdomadaire
npm run test:adb

# 2. Mise à jour ADB mensuelle
# Télécharger dernière version platform-tools

# 3. Nettoyage des logs
rm -f logs/aegis.log.old
```

### Bonnes Pratiques
1. **Garder le téléphone connecté** pendant les opérations
2. **Éviter les déconnexions USB** fréquentes
3. **Tester régulièrement** avec l'app SMS native
4. **Monitorer les logs** pour détecter les problèmes
5. **Maintenir ADB à jour** avec les dernières versions

---

*Ce guide de dépannage est maintenu par **MARWEN RABAI** dans le cadre du projet **Aegis Local Auth**. Pour toute question supplémentaire, consultez la documentation complète ou le portfolio du développeur.* 