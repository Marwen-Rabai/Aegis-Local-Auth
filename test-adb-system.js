/**
 * Test complet du système ADB SMS
 * Vérification de toutes les fonctionnalités ADB
 * 
 * @author MARWEN RABAI
 * @version 2.0.0
 */

const config = require('./config/config');
const logger = require('./app/services/logger');
const adbProvider = require('./app/services/sms-providers/adbProvider');
const { exec } = require('child_process');

class ADBSystemTest {
    constructor() {
        this.testResults = {
            connection: false,
            deviceDetection: false,
            versionDetection: false,
            smsService: false,
            smsTest: false,
            overall: false
        };
    }

    /**
     * Lance tous les tests du système ADB
     */
    async runAllTests() {
        console.log('🧪 TEST COMPLET DU SYSTÈME ADB SMS');
        console.log('='.repeat(60));
        console.log(`📅 Date: ${new Date().toLocaleString()}`);
        console.log(`🔧 Configuration ADB: ${config.SMS_PROVIDER}`);
        console.log(`📱 Chemin ADB: ${config.SMS_ADB_CONFIG?.adbPath || 'non configuré'}`);
        console.log('');

        try {
            // Test 1: Vérification de l'installation ADB
            await this.testADBInstallation();
            
            // Test 2: Vérification de la connexion
            await this.testConnection();
            
            // Test 3: Détection de l'appareil
            await this.testDeviceDetection();
            
            // Test 4: Détection de la version Android
            await this.testAndroidVersion();
            
            // Test 5: Vérification du service SMS
            await this.testSMSService();
            
            // Test 6: Test d'envoi SMS (si numéro fourni)
            const testNumber = process.argv[2];
            if (testNumber) {
                await this.testSMSSending(testNumber);
            } else {
                console.log('⚠️ Aucun numéro de test fourni - test d\'envoi SMS ignoré');
                console.log('   Usage: node test-adb-system.js +213XXXXXXXXX');
            }

            // Résumé des tests
            this.displayTestSummary();

        } catch (error) {
            console.error('❌ Erreur critique lors des tests:', error.message);
            process.exit(1);
        }
    }

    /**
     * Test 1: Vérification de l'installation ADB
     */
    async testADBInstallation() {
        console.log('🔍 TEST 1: VÉRIFICATION DE L\'INSTALLATION ADB');
        console.log('-'.repeat(50));

        try {
            const adbPath = config.SMS_ADB_CONFIG?.adbPath;
            if (!adbPath) {
                throw new Error('Chemin ADB non configuré');
            }

            // Vérifier si le fichier ADB existe
            const { exec } = require('child_process');
            const command = `"${adbPath}" version`;
            
            const result = await this.executeCommand(command, 10000);
            console.log('✅ Installation ADB: OK');
            console.log(`📋 Version: ${result.split('\n')[0]}`);
            
            this.testResults.connection = true;
        } catch (error) {
            console.log('❌ Installation ADB: ÉCHEC');
            console.log(`📋 Erreur: ${error.message}`);
            console.log('💡 Solutions:');
            console.log('   - Exécuter: npm run setup-adb');
            console.log('   - Vérifier le chemin dans config/config.js');
        }
        console.log('');
    }

    /**
     * Test 2: Vérification de la connexion
     */
    async testConnection() {
        console.log('🔍 TEST 2: VÉRIFICATION DE LA CONNEXION');
        console.log('-'.repeat(50));

        try {
            const status = await adbProvider.getStatus();
            
            if (status.status === 'connected') {
                console.log('✅ Connexion ADB: OK');
                console.log(`📱 Appareil: ${status.deviceId}`);
                this.testResults.connection = true;
            } else {
                throw new Error(`Statut: ${status.status}`);
            }
        } catch (error) {
            console.log('❌ Connexion ADB: ÉCHEC');
            console.log(`📋 Erreur: ${error.message}`);
            console.log('💡 Solutions:');
            console.log('   - Connecter le téléphone via USB');
            console.log('   - Autoriser le débogage USB');
            console.log('   - Vérifier: adb devices');
        }
        console.log('');
    }

    /**
     * Test 3: Détection de l'appareil
     */
    async testDeviceDetection() {
        console.log('🔍 TEST 3: DÉTECTION DE L\'APPAREIL');
        console.log('-'.repeat(50));

        try {
            const adbPath = config.SMS_ADB_CONFIG?.adbPath;
            const result = await this.executeCommand(`"${adbPath}" devices -l`, 10000);
            
            const lines = result.split('\n').filter(line => 
                line.trim() && 
                !line.includes('List of devices') && 
                line.includes('device')
            );

            if (lines.length > 0) {
                console.log('✅ Détection appareil: OK');
                lines.forEach((line, index) => {
                    console.log(`📱 Appareil ${index + 1}: ${line.trim()}`);
                });
                this.testResults.deviceDetection = true;
            } else {
                throw new Error('Aucun appareil détecté');
            }
        } catch (error) {
            console.log('❌ Détection appareil: ÉCHEC');
            console.log(`📋 Erreur: ${error.message}`);
        }
        console.log('');
    }

    /**
     * Test 4: Détection de la version Android
     */
    async testAndroidVersion() {
        console.log('🔍 TEST 4: DÉTECTION VERSION ANDROID');
        console.log('-'.repeat(50));

        try {
            const adbPath = config.SMS_ADB_CONFIG?.adbPath;
            
            // Version Android
            const versionResult = await this.executeCommand(
                `"${adbPath}" shell getprop ro.build.version.release`, 10000
            );
            
            // API Level
            const apiResult = await this.executeCommand(
                `"${adbPath}" shell getprop ro.build.version.sdk`, 10000
            );
            
            // Informations sur l'appareil
            const deviceResult = await this.executeCommand(
                `"${adbPath}" shell getprop ro.product.model`, 10000
            );

            console.log('✅ Détection version: OK');
            console.log(`📱 Modèle: ${deviceResult.trim()}`);
            console.log(`🤖 Android: ${versionResult.trim()}`);
            console.log(`🔢 API Level: ${apiResult.trim()}`);
            
            this.testResults.versionDetection = true;
        } catch (error) {
            console.log('❌ Détection version: ÉCHEC');
            console.log(`📋 Erreur: ${error.message}`);
        }
        console.log('');
    }

    /**
     * Test 5: Vérification du service SMS
     */
    async testSMSService() {
        console.log('🔍 TEST 5: VÉRIFICATION SERVICE SMS');
        console.log('-'.repeat(50));

        try {
            const adbPath = config.SMS_ADB_CONFIG?.adbPath;
            
            // Vérifier le service isms
            const serviceResult = await this.executeCommand(
                `"${adbPath}" shell service check isms`, 10000
            );

            if (serviceResult.includes('found')) {
                console.log('✅ Service SMS: OK');
                console.log(`📋 Statut: ${serviceResult.trim()}`);
                this.testResults.smsService = true;
            } else {
                throw new Error('Service SMS non trouvé');
            }

            // Vérifier les permissions SMS
            const permResult = await this.executeCommand(
                `"${adbPath}" shell dumpsys telephony.registry | grep -i sms`, 5000
            );
            
            if (permResult.trim()) {
                console.log('📋 Registre SMS: Actif');
            }

        } catch (error) {
            console.log('❌ Service SMS: ÉCHEC');
            console.log(`📋 Erreur: ${error.message}`);
            console.log('💡 Solutions:');
            console.log('   - Redémarrer le téléphone');
            console.log('   - Vérifier les permissions SMS');
            console.log('   - Tester avec l\'app SMS native');
        }
        console.log('');
    }

    /**
     * Test 6: Test d'envoi SMS
     */
    async testSMSSending(phoneNumber) {
        console.log('🔍 TEST 6: TEST D\'ENVOI SMS');
        console.log('-'.repeat(50));
        console.log(`📱 Numéro de test: ${phoneNumber}`);

        try {
            const testMessage = `Test SMS Aegis ADB - ${new Date().toLocaleTimeString()}`;
            console.log(`📝 Message: ${testMessage}`);
            console.log('⏳ Envoi en cours...');

            const startTime = Date.now();
            const result = await adbProvider.send(phoneNumber, testMessage);
            const duration = Date.now() - startTime;

            if (result) {
                console.log('✅ Envoi SMS: SUCCÈS');
                console.log(`⏱️ Durée: ${duration}ms`);
                console.log('📱 Vérifiez la réception sur le téléphone cible');
                this.testResults.smsTest = true;
            } else {
                throw new Error('Échec de l\'envoi SMS');
            }
        } catch (error) {
            console.log('❌ Envoi SMS: ÉCHEC');
            console.log(`📋 Erreur: ${error.message}`);
            console.log('💡 Vérifications:');
            console.log('   - Crédit SMS disponible');
            console.log('   - Réseau mobile actif');
            console.log('   - Numéro de téléphone valide');
        }
        console.log('');
    }

    /**
     * Affiche le résumé des tests
     */
    displayTestSummary() {
        console.log('📊 RÉSUMÉ DES TESTS');
        console.log('='.repeat(60));

        const tests = [
            { name: 'Installation ADB', status: this.testResults.connection },
            { name: 'Connexion', status: this.testResults.connection },
            { name: 'Détection appareil', status: this.testResults.deviceDetection },
            { name: 'Version Android', status: this.testResults.versionDetection },
            { name: 'Service SMS', status: this.testResults.smsService },
            { name: 'Envoi SMS', status: this.testResults.smsTest }
        ];

        let passed = 0;
        tests.forEach(test => {
            const icon = test.status ? '✅' : '❌';
            const status = test.status ? 'SUCCÈS' : 'ÉCHEC';
            console.log(`${icon} ${test.name}: ${status}`);
            if (test.status) passed++;
        });

        console.log('');
        console.log(`📈 Résultat global: ${passed}/${tests.length} tests réussis`);
        
        if (passed === tests.length) {
            console.log('🎉 TOUS LES TESTS SONT RÉUSSIS!');
            console.log('✅ Le système ADB SMS est opérationnel');
        } else {
            console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
            console.log('🔧 Consultez les messages d\'erreur ci-dessus');
        }

        console.log('');
        console.log('📚 Documentation complète: DOCUMENTATION_ADB.md');
        console.log('🆘 Support: Portfolio de MARWEN RABAI');
    }

    /**
     * Exécute une commande shell avec timeout
     */
    executeCommand(command, timeout) {
        return new Promise((resolve, reject) => {
            exec(command, { timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Erreur: ${error.message}`));
                    return;
                }
                
                if (stderr && stderr.trim()) {
                    console.log(`⚠️ Avertissement: ${stderr.trim()}`);
                }
                
                resolve(stdout.trim());
            });
        });
    }
}

// Fonction principale
async function main() {
    const tester = new ADBSystemTest();
    await tester.runAllTests();
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
    console.error('❌ Erreur non gérée:', error.message);
    process.exit(1);
});

// Exécution si ce fichier est appelé directement
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erreur fatale:', error.message);
        process.exit(1);
    });
}

module.exports = ADBSystemTest; 