/**
 * Aegis Local Auth - Setup Script
 * Helps with initial configuration and system checks
 */

const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  🛡️  AEGIS LOCAL AUTH  🛡️                    ║
║                                                              ║
║                     Setup & Configuration                   ║
╚══════════════════════════════════════════════════════════════╝
`);

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = '16.0.0';
console.log(`✓ Node.js version: ${nodeVersion}`);

if (nodeVersion < `v${requiredVersion}`) {
    console.error(`❌ Node.js version ${requiredVersion} or higher is required`);
    process.exit(1);
}

// Check if all required directories exist
const requiredDirs = [
    'app/controllers',
    'app/database', 
    'app/routes',
    'app/services',
    'app/public',
    'config',
    'logs'
];

console.log('\n📁 Checking directory structure...');
requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✓ ${dir}`);
    } else {
        console.log(`❌ ${dir} - Missing`);
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ ${dir} - Created`);
    }
});

// Check if all required files exist
const requiredFiles = [
    'package.json',
    'server.js',
    'config/config.js',
    'app/services/logger.js',
    'app/database/database.js',
    'app/services/otpEngine.js',
    'app/controllers/userController.js',
    'app/routes/authRoutes.js',
    'app/public/index.html',
    'app/public/style.css',
    'app/public/app.js'
];

console.log('\n📄 Checking required files...');
let missingFiles = [];
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✓ ${file}`);
    } else {
        console.log(`❌ ${file} - Missing`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.error(`\n❌ Missing ${missingFiles.length} required files. Please ensure all files are properly created.`);
    process.exit(1);
}

console.log('\n🔧 System Configuration:');
console.log('• Database: SQLite (local)');
console.log('• Port: 3000 (configurable)');
console.log('• GSM Port: COM3 (Windows) / /dev/ttyUSB0 (Linux)');
console.log('• Security: bcrypt, rate limiting, CORS');

console.log('\n📝 Next Steps:');
console.log('1. Connect your GSM modem to a USB port');
console.log('2. Insert an active SIM card');
console.log('3. Update SERIAL_PORT_PATH in config/config.js if needed');
console.log('4. Run: npm install');
console.log('5. Run: npm start');
console.log('6. Open: http://localhost:3000');

console.log('\n🛡️ Aegis Local Auth setup complete!');
console.log('For support, check the README.md file.\n'); 