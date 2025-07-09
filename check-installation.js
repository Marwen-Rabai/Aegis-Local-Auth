
/**
 * Aegis Local Auth - Installation Verification Script
 * Developed by: MARWEN RABAI
 * Portfolio: https://marwenrabai.strtikingly.com
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  🛡️  AEGIS LOCAL AUTH  🛡️                    ║
║                                                              ║
║                Installation Verification Script             ║
║                Developed by: MARWEN RABAI                    ║
╚══════════════════════════════════════════════════════════════╝
`);

console.log('🔍 Vérification de l\'installation...\n');

let hasErrors = false;

// Vérifier Node.js
console.log('📋 Vérification Node.js...');
const nodeVersion = process.version;
const requiredVersion = 16;
const currentVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (currentVersion >= requiredVersion) {
    console.log(`✅ Node.js ${nodeVersion} (OK)`);
} else {
    console.log(`❌ Node.js ${nodeVersion} (Minimum requis: v${requiredVersion})`);
    hasErrors = true;
}

// Vérifier les dépendances critiques
console.log('\n📦 Vérification des dépendances...');
const criticalDeps = [
    'express',
    'sqlite3',
    'bcrypt',
    'serialport',
    '@serialport/parser-readline',
    'winston',
    'helmet',
    'cors'
];

criticalDeps.forEach(dep => {
    try {
        require.resolve(dep);
        console.log(`✅ ${dep}`);
    } catch (err) {
        console.log(`❌ ${dep} (manquant)`);
        hasErrors = true;
    }
});

// Vérifier la structure des dossiers
console.log('\n📁 Vérification de la structure...');
const requiredDirs = [
    'config',
    'app',
    'app/controllers',
    'app/services',
    'app/database',
    'app/routes',
    'app/services/sms-providers',
    'logs',
    'uploads'
];

requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ ${dir}/ (manquant)`);
        hasErrors = true;
    }
});

// Vérifier les fichiers critiques
console.log('\n📄 Vérification des fichiers...');
const requiredFiles = [
    'server.js',
    'package.json',
    'config/config.js',
    'app/controllers/userController.js',
    'app/services/otpEngine.js',
    'app/services/logger.js',
    'app/database/database.js',
    'app/routes/authRoutes.js'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} (manquant)`);
        hasErrors = true;
    }
});

// Vérifier les fournisseurs SMS
console.log('\n📱 Vérification des fournisseurs SMS...');
const smsProviders = [
    'app/services/sms-providers/apiProvider.js',
    'app/services/sms-providers/gatewayProvider.js',
    'app/services/sms-providers/modemProvider.js'
];

smsProviders.forEach(provider => {
    if (fs.existsSync(provider)) {
        console.log(`✅ ${path.basename(provider)}`);
    } else {
        console.log(`❌ ${path.basename(provider)} (manquant)`);
        hasErrors = true;
    }
});

// Vérifier la configuration
console.log('\n⚙️ Vérification de la configuration...');
try {
    const config = require('./config/config.js');
    
    // Vérifier les paramètres critiques
    const requiredConfig = [
        'SERVER_PORT',
        'SMS_PROVIDER',
        'SMS_FALLBACK_ENABLED',
        'SERIAL_PORT_PATH',
        'DATABASE_PATH'
    ];
    
    requiredConfig.forEach(key => {
        if (config[key] !== undefined) {
            console.log(`✅ ${key}: ${config[key]}`);
        } else {
            console.log(`❌ ${key} (manquant dans config.js)`);
            hasErrors = true;
        }
    });
    
    // Vérifications spécifiques SMS
    if (config.SMS_PROVIDER === 'api' && !config.SMS_API_CONFIG) {
        console.log(`⚠️  SMS_API_CONFIG manquant pour le fournisseur API`);
    }
    
    if (config.SMS_PROVIDER === 'gateway' && !config.SMS_GATEWAY_CONFIG) {
        console.log(`⚠️  SMS_GATEWAY_CONFIG manquant pour le fournisseur Gateway`);
    }
    
} catch (err) {
    console.log(`❌ Erreur de configuration: ${err.message}`);
    hasErrors = true;
}

// Test de connexion locale (si le serveur est démarré)
console.log('\n🌐 Test de connexion...');
function testConnection() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET',
            timeout: 3000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Serveur accessible (http://localhost:3000)');
                    try {
                        const health = JSON.parse(data);
                        console.log(`✅ Status: ${health.status}`);
                        console.log(`✅ Version Node.js: ${health.system.nodeVersion}`);
                    } catch (e) {
                        console.log('✅ Réponse reçue (données invalides)');
                    }
                } else {
                    console.log(`⚠️  Serveur répond avec le code ${res.statusCode}`);
                }
                resolve();
            });
        });

        req.on('error', () => {
            console.log('ℹ️  Serveur non démarré (normal si premier test)');
            console.log('   Pour démarrer: npm start');
            resolve();
        });

        req.on('timeout', () => {
            console.log('⚠️  Timeout de connexion');
            req.destroy();
            resolve();
        });

        req.end();
    });
}

// Résumé final
async function finalSummary() {
    await testConnection();
    
    console.log('\n' + '═'.repeat(66));
    
    if (hasErrors) {
        console.log('❌ INSTALLATION INCOMPLÈTE');
        console.log('\n🔧 Actions recommandées:');
        console.log('1. Exécuter: node install.js');
        console.log('2. Vérifier les fichiers manquants');
        console.log('3. Consulter README.md ou WINDOWS_SETUP.md');
        console.log('4. Support: https://marwenrabai.strtikingly.com');
        process.exit(1);
    } else {
        console.log('✅ INSTALLATION RÉUSSIE !');
        console.log('\n🚀 Pour démarrer l\'application:');
        console.log('   npm start          # Mode production');
        console.log('   npm run dev        # Mode développement');
        console.log('\n🌐 Accès:');
        console.log('   http://localhost:3000          # Interface web');
        console.log('   http://localhost:3000/api/health   # Santé système');
        console.log('\n📚 Documentation:');
        console.log('   README.md              # Guide principal');
        console.log('   WINDOWS_SETUP.md       # Guide Windows');
        console.log('   DOCUMENTATION_COMPLETE.md  # Doc complète');
        console.log('\n👨‍💻 Développé par: MARWEN RABAI');
        console.log('   Portfolio: https://marwenrabai.strtikingly.com');
    }
    
    console.log('═'.repeat(66));
}

// Exécuter les vérifications
setTimeout(finalSummary, 100); 