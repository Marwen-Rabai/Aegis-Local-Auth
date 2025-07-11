/**
 * Script de nettoyage des logs et fichiers temporaires
 * Aegis Local Auth - Log Cleanup Utility
 * 
 * @author MARWEN RABAI
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 NETTOYAGE DES LOGS ET FICHIERS TEMPORAIRES');
console.log('='.repeat(60));
console.log(`📅 Date: ${new Date().toLocaleString()}`);
console.log('');

let filesRemoved = 0;
let totalSize = 0;
const errors = [];

// Patterns de fichiers à nettoyer
const cleanupPatterns = [
    /\.log$/,
    /\.log\.\d+$/,
    /\.log\.old$/,
    /\.log\.bak$/,
    /\.err$/,
    /\.out$/,
    /\.tmp$/,
    /\.temp$/,
    /yarn-error\.log$/
];

// Répertoires à nettoyer
const cleanupDirectories = ['logs', 'temp', 'tmp'];

// Fonction pour formater les octets
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Fonction pour nettoyer un répertoire
function cleanDirectory(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.isFile()) {
                        fs.unlinkSync(filePath);
                        filesRemoved++;
                        totalSize += stats.size;
                        console.log(`🗑️ Supprimé: ${filePath}`);
                    }
                } catch (error) {
                    errors.push(`${filePath}: ${error.message}`);
                }
            });
            
            console.log(`✅ ${dirPath}/ nettoyé`);
        } else {
            console.log(`ℹ️ ${dirPath}/ n'existe pas`);
        }
    } catch (error) {
        console.log(`❌ Erreur dans ${dirPath}/: ${error.message}`);
        errors.push(`${dirPath}: ${error.message}`);
    }
}

// Fonction pour scanner les fichiers
function scanDirectory(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            try {
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    // Ignorer certains répertoires
                    if (!['node_modules', '.git', 'bin', 'uploads'].includes(file)) {
                        scanDirectory(filePath);
                    }
                } else if (stats.isFile()) {
                    // Vérifier si le fichier doit être nettoyé
                    if (cleanupPatterns.some(pattern => pattern.test(file))) {
                        fs.unlinkSync(filePath);
                        filesRemoved++;
                        totalSize += stats.size;
                        console.log(`🗑️ Supprimé: ${filePath}`);
                    }
                }
            } catch (error) {
                errors.push(`${filePath}: ${error.message}`);
            }
        });
    } catch (error) {
        errors.push(`Scan ${dirPath}: ${error.message}`);
    }
}

// Nettoyage des répertoires spécifiques
console.log('📁 NETTOYAGE DES RÉPERTOIRES');
console.log('-'.repeat(40));

cleanupDirectories.forEach(dir => {
    cleanDirectory(dir);
});

console.log('');

// Nettoyage des fichiers dans tout le projet
console.log('🔍 RECHERCHE DE FICHIERS À NETTOYER');
console.log('-'.repeat(40));

scanDirectory('.');

console.log('');

// Affichage des résultats
console.log('📊 RÉSULTATS DU NETTOYAGE');
console.log('='.repeat(60));
console.log(`📁 Fichiers supprimés: ${filesRemoved}`);
console.log(`💾 Espace libéré: ${formatBytes(totalSize)}`);

if (errors.length > 0) {
    console.log(`❌ Erreurs: ${errors.length}`);
    console.log('');
    console.log('🔍 DÉTAILS DES ERREURS:');
    errors.forEach(error => {
        console.log(`   • ${error}`);
    });
}

console.log('');
if (filesRemoved > 0) {
    console.log('✅ Nettoyage terminé avec succès!');
} else {
    console.log('ℹ️ Aucun fichier à nettoyer trouvé.');
}

console.log('');
console.log('💡 CONSEILS:');
console.log('   • Exécutez `npm run cleanup` régulièrement');
console.log('   • Vérifiez les logs avant le nettoyage');
console.log('   • Sauvegardez les logs importants');
console.log('   • Utilisez `npm run clean:logs` comme alias'); 