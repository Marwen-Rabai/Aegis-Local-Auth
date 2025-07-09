# 🪟 Guide d'Installation Windows - Aegis Local Auth

## Installation et Configuration sur Windows avec PowerShell

**Développé par :** [MARWEN RABAI](https://marwenrabai.strtikingly.com)  
**Version :** 1.0.0

---

## 🎯 Objectif

Ce guide fournit des instructions détaillées pour installer et configurer **Aegis Local Auth** sur un environnement Windows en utilisant **PowerShell**. L'application fonctionnera comme un service API back-end sans interface graphique.

---

## 1. 🏗️ Prérequis

Assurez-vous que les logiciels suivants sont installés sur votre système Windows :

1.  **Node.js (LTS)** : Téléchargez et installez depuis [nodejs.org](https://nodejs.org/). Cela inclut `npm`.
2.  **Git** : Téléchargez et installez depuis [git-scm.com](https://git-scm.com/).

Vous pouvez vérifier leur installation en ouvrant PowerShell et en exécutant :
```powershell
node --version
npm --version
git --version
```

---

## 2. 📂 Installation de l'Application

1.  **Ouvrez PowerShell**.
2.  **Clonez le projet** depuis son dépôt (remplacez l'URL si nécessaire) :
    ```powershell
    git clone https://github.com/votre-utilisateur/aegis-local-auth.git
    ```
3.  **Accédez au répertoire** du projet :
    ```powershell
    cd aegis-local-auth
    ```
4.  **Installez les dépendances** du projet. Cette commande lit `package.json` et installe tous les paquets nécessaires.
    ```powershell
    npm install
    ```
    Cette commande peut prendre quelques minutes.

---

## 3. ⚙️ Configuration

La configuration se fait principalement dans le fichier `config/config.js`.

1.  **Ouvrez le fichier de configuration** dans un éditeur de texte (comme Notepad, VS Code, etc.) :
    ```powershell
    notepad.exe config/config.js
    ```

2.  **Modifiez les paramètres** selon vos besoins :
    - `SMS_PROVIDER`: Choisissez votre fournisseur SMS principal : `'api'`, `'modem'`, ou `'gateway'`.
    - `SMS_FALLBACK_ENABLED`: Mettez à `true` pour activer le basculement automatique si le fournisseur principal échoue.
    - `SERIAL_PORT_PATH`: **Crucial pour le modem GSM.** Spécifiez le port COM de votre modem. Ex : `'COM3'`, `'COM4'`. Vous pouvez trouver le port dans le "Gestionnaire de périphériques" de Windows.
    - `SMS_API_CONFIG`: Si vous utilisez le fournisseur `api`, configurez ici votre `apiKey` et `url`.
    - `DATABASE_PATH`: Le chemin vers le fichier de la base de données SQLite. Le chemin par défaut est généralement correct.

---

## 4. 🚀 Démarrage de l'Application

Une fois l'installation et la configuration terminées, vous pouvez démarrer le serveur.

-   **Pour un usage en production** (recommandé pour la stabilité) :
    ```powershell
    npm start
    ```

-   **Pour le développement** (redémarre automatiquement en cas de modification de fichier) :
    ```powershell
    npm run dev
    ```

L'API sera alors accessible. Vous devriez voir une bannière de démarrage dans votre terminal confirmant que le serveur est opérationnel.

---

## 5. ✅ Vérification et Tests

Pour vous assurer que tout fonctionne correctement, utilisez ces endpoints API avec un outil comme [Postman](https://www.postman.com/downloads/), `curl` (inclus dans les versions récentes de Windows), ou `Invoke-RestMethod` de PowerShell.

-   **Vérifier la Santé du Système** :
    ```powershell
    Invoke-RestMethod -Uri http://localhost:3000/api/health
    ```
    Cette commande devrait retourner un objet JSON détaillé sur l'état du serveur, de la base de données et des fonctionnalités.

-   **Tester l'Enregistrement d'un Numéro** :
    ```powershell
    $body = @{ phoneNumber = "+1234567890" } | ConvertTo-Json
    Invoke-RestMethod -Uri http://localhost:3000/api/register -Method Post -Body $body -ContentType "application/json"
    ```
    Cette commande simule une demande d'enregistrement et devrait déclencher l'envoi d'un SMS.

---

## 6. 🔧 Dépannage (Troubleshooting)

-   **Erreur `EADDRINUSE`** : Signifie que le port `3000` est déjà utilisé. Arrêtez tout autre processus `node.exe` en cours via le Gestionnaire des tâches ou avec la commande :
    ```powershell
    Get-Process node | Stop-Process -Force
    ```
-   **Problèmes de Modem GSM** :
    - Vérifiez que le port COM est correct dans `config/config.js`.
    - Assurez-vous que les pilotes du modem sont correctement installés.
    - Vérifiez que la carte SIM est active et a du crédit.
-   **Logs** : Les journaux d'activité et d'erreurs sont votre meilleur ami. Consultez les fichiers dans le répertoire `logs/` pour des informations détaillées sur ce qui se passe.

---

**Développé par [MARWEN RABAI](https://marwenrabai.strtikingly.com)** 