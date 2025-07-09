# 🚀 Guide de Déploiement - Aegis Local Auth

## Déploiement en Production

**Développé par :** [MARWEN RABAI](https://marwenrabai.strtikingly.com)  
**Version :** 1.0.0

---

## 🏗️ Préparation de l'Environnement

### Prérequis Système
```bash
# Vérifier les prérequis
node --version  # v16.0.0+
npm --version   # 8.0.0+
git --version   # 2.0.0+
```

### Variables d'Environnement
Créez un fichier `.env` à la racine du projet pour les configurations de production :
```bash
# .env
NODE_ENV=production
PORT=3000
SMS_PROVIDER=api # ou 'modem' ou 'gateway'
SMS_API_KEY=votre_cle_api_securisee
SMS_API_URL=https://api.fournisseur.com/send
SERIAL_PORT_PATH=/dev/ttyUSB0 # Pour Linux, ou COM3 pour Windows
```

---

## 🐳 Déploiement avec Docker (Recommandé)

### Fichier `Dockerfile`
```dockerfile
# Utiliser une image Node.js Alpine pour la légèreté
FROM node:18-alpine

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && adduser -S aegis -u 1001

WORKDIR /app

# Copier uniquement les fichiers de dépendances pour profiter du cache Docker
COPY package*.json ./

# Installer les dépendances de production
RUN npm ci --only=production

# Copier le reste du code source
COPY . .

# Créer les répertoires nécessaires et donner les permissions
RUN mkdir -p logs uploads data && chown -R aegis:nodejs /app

# Changer vers l'utilisateur non-root
USER aegis

# Exposer le port de l'application
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["node", "server.js"]
```

### Fichier `docker-compose.yml`
```yaml
version: '3.8'

services:
  aegis-local-auth:
    build: .
    container_name: aegis_auth
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data # Persistance de la base de données
      - ./logs:/app/logs # Persistance des logs
      - ./uploads:/app/uploads # Persistance des fichiers uploadés
    environment:
      - NODE_ENV=production
      - SMS_PROVIDER=api
      # Ajoutez d'autres variables d'environnement ici
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Commandes de Déploiement Docker
```bash
# 1. Construire l'image Docker
docker build -t aegis-local-auth:1.0.0 .

# 2. Démarrer le conteneur avec Docker Compose
docker-compose up -d

# 3. Vérifier les logs en temps réel
docker-compose logs -f
```

---

## ⚙️ Déploiement Manuel (Serveur Linux)

### 1. Configuration du Serveur
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer Git
sudo apt install -y git
```

### 2. Déploiement de l'Application
```bash
# Cloner le projet depuis votre dépôt Git
git clone https://github.com/votre-repo/aegis-local-auth.git
cd aegis-local-auth

# Installer les dépendances de production
npm ci --only=production

# Configurer les variables d'environnement (avec un fichier .env ou export)
export PORT=3000
# ... autres variables

# Démarrer l'application
npm start
```

### 3. Utilisation de PM2 pour la Gestion de Processus
PM2 est un gestionnaire de processus pour Node.js qui assure que votre application reste en ligne.

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application avec PM2
pm2 start server.js --name "aegis-local-auth"

# Configurer PM2 pour démarrer au redémarrage du serveur
pm2 startup
# Suivez les instructions affichées par la commande ci-dessus

# Sauvegarder la configuration de PM2
pm2 save

# Monitorer l'application
pm2 monit
```

---

## 🌐 Configuration d'un Reverse Proxy avec Nginx

Utiliser Nginx comme reverse proxy est une bonne pratique pour la sécurité, le load balancing et la gestion des certificats SSL.

### 1. Installer Nginx
```bash
sudo apt install -y nginx
```

### 2. Configurer Nginx
Créez un nouveau fichier de configuration : `sudo nano /etc/nginx/sites-available/aegis.conf`

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000; # Fait pointer vers votre app Node.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Activer la Configuration et Redémarrer Nginx
```bash
# Créer un lien symbolique
sudo ln -s /etc/nginx/sites-available/aegis.conf /etc/nginx/sites-enabled/

# Tester la configuration Nginx
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 4. Sécuriser avec SSL (Let's Encrypt)
```bash
# Installer Certbot pour Nginx
sudo apt install -y certbot python3-certbot-nginx

# Obtenir et installer automatiquement le certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Le renouvellement est généralement configuré automatiquement par Certbot
```

---

## 🔒 Considérations de Sécurité en Production

- **Firewall** : Configurez un firewall (ex: UFW sur Ubuntu) pour n'autoriser que le trafic nécessaire (SSH, HTTP, HTTPS).
  ```bash
  sudo ufw allow ssh
  sudo ufw allow 'Nginx Full'
  sudo ufw enable
  ```
- **Variables d'Environnement** : Ne stockez jamais de secrets (clés d'API, etc.) directement dans le code. Utilisez un fichier `.env` (ajouté au `.gitignore`) ou un service de gestion de secrets (comme AWS Secrets Manager, HashiCorp Vault).
- **Mises à Jour Régulières** : Maintenez le serveur et les dépendances (npm) à jour.
  ```bash
  npm audit
  ```

---

## 🔄 Sauvegarde et Maintenance

### Sauvegarde de la Base de Données
La base de données SQLite est un simple fichier (`aegis_users.sqlite` dans le répertoire `data/` si vous utilisez Docker).

```bash
# Script de sauvegarde simple
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/votre/dossier/de/backups"
DB_FILE="/chemin/vers/data/aegis_users.sqlite"
cp $DB_FILE "$BACKUP_DIR/aegis_users_backup_$DATE.sqlite"
```
Automatisez ce script avec un `cron job` pour des sauvegardes régulières.

### Rotation des Logs
Utilisez un outil comme `logrotate` pour gérer les fichiers de log et éviter qu'ils ne saturent le disque.

---

**Développé par [MARWEN RABAI](https://marwenrabai.strtikingly.com)**  
**Guide de déploiement v1.0.0** 