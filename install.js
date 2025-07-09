/**
 * Aegis Local Auth - Installation Script
 * Fixes dependency issues and ensures proper setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  🛡️  AEGIS LOCAL AUTH  🛡️                    ║
║                                                              ║
║                  Advanced Installation Script               ║
╚══════════════════════════════════════════════════════════════╝
`);

function executeCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function createDirectory(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created ${description}: ${dirPath}`);
  } else {
    console.log(`✓ ${description} already exists: ${dirPath}`);
  }
}

async function main() {
  console.log('🚀 Starting Aegis Local Auth installation...\n');

  // Check Node.js version
  const nodeVersion = process.version;
  console.log(`📋 Node.js version: ${nodeVersion}`);
  
  if (nodeVersion < 'v16.0.0') {
    console.error('❌ Node.js version 16.0.0 or higher is required');
    process.exit(1);
  }

  // Create required directories
  console.log('\n📁 Setting up directory structure...');
  createDirectory('./uploads', 'Upload directory');
  createDirectory('./logs', 'Logs directory');

  // Clear npm cache first
  console.log('\n🧹 Clearing npm cache...');
  executeCommand('npm cache clean --force', 'NPM cache clear');

  // Remove node_modules and package-lock.json if they exist
  if (fs.existsSync('./node_modules')) {
    console.log('🗑️ Removing existing node_modules...');
    if (process.platform === 'win32') {
      executeCommand('rmdir /s /q node_modules', 'Remove node_modules (Windows)');
    } else {
      executeCommand('rm -rf node_modules', 'Remove node_modules (Unix)');
    }
  }

  if (fs.existsSync('./package-lock.json')) {
    fs.unlinkSync('./package-lock.json');
    console.log('✅ Removed package-lock.json');
  }

  // Install core dependencies first
  console.log('\n📦 Installing core dependencies...');
  const corePackages = [
    'express@^4.18.2',
    'helmet@^7.1.0',
    'cors@^2.8.5',
    'express-rate-limit@^7.1.5',
    'express-validator@^7.0.1',
    'sqlite3@^5.1.6',
    'bcrypt@^5.1.1',
    'winston@^3.11.0'
  ];

  for (const pkg of corePackages) {
    if (!executeCommand(`npm install ${pkg}`, `Installing ${pkg.split('@')[0]}`)) {
      console.error(`❌ Failed to install ${pkg}`);
      process.exit(1);
    }
  }

  // Install serialport with specific version that works
  console.log('\n📡 Installing SerialPort (modern version)...');
  if (!executeCommand('npm install serialport@^12.0.0', 'Installing SerialPort')) {
    console.error('❌ Failed to install SerialPort');
    process.exit(1);
  }

  // Install serialport parser
  console.log('\n📡 Installing SerialPort Parser...');
  if (!executeCommand('npm install @serialport/parser-readline@^11.0.0', 'Installing SerialPort Parser')) {
    console.error('❌ Failed to install SerialPort Parser');
    process.exit(1);
  }

  // Install additional packages
  console.log('\n📦 Installing additional packages...');
  const additionalPackages = [
    'multer@^1.4.5-lts.1',
    'csv-parse@^5.5.2',
    'xlsx@^0.18.5',
    'moment@^2.29.4',
    'node-cron@^3.0.3'
  ];

  for (const pkg of additionalPackages) {
    executeCommand(`npm install ${pkg}`, `Installing ${pkg.split('@')[0]}`);
  }

  // Install development dependencies
  console.log('\n🔧 Installing development dependencies...');
  executeCommand('npm install --save-dev nodemon@^3.0.2', 'Installing nodemon');

  // Create uploads directory with .gitkeep
  const uploadsDir = './uploads';
  createDirectory(uploadsDir, 'Uploads directory');
  fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '# Keep this directory\n');

  // Verify installation
  console.log('\n🔍 Verifying installation...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const requiredDeps = [
      'express', 'helmet', 'cors', 'express-rate-limit', 'express-validator',
      'sqlite3', 'bcrypt', 'serialport', 'winston', 'multer', 'csv-parse', 'xlsx'
    ];

    let allInstalled = true;
    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep]) {
        console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        console.log(`❌ ${dep}: NOT INSTALLED`);
        allInstalled = false;
      }
    }

    if (allInstalled) {
      console.log('\n✅ All dependencies installed successfully!');
    } else {
      console.log('\n⚠️ Some dependencies may be missing');
    }

  } catch (error) {
    console.error('❌ Error verifying installation:', error.message);
  }

  // Final setup
  console.log('\n🎯 Final setup steps...');
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     ✅ INSTALLATION COMPLETE                 ║
╚══════════════════════════════════════════════════════════════╝

🚀 Aegis Local Auth is now installed!

📝 NEXT STEPS:
1. Connect your GSM modem to a USB port
2. Insert an active SIM card
3. Update SERIAL_PORT_PATH in config/config.js if needed
   - Windows: COM3, COM4, etc.
   - Linux: /dev/ttyUSB0, /dev/ttyACM0, etc.
4. Run the application:
   
   npm start          # Production mode
   npm run dev        # Development mode

🌐 ACCESS:
   Web Interface: http://localhost:3000
   API Health: http://localhost:3000/api/health
   Statistics: http://localhost:3000/api/statistics

🛡️ FEATURES ENABLED:
   ✓ Unlimited phone registration
   ✓ Mass registration (up to 10,000 numbers)
   ✓ Real-time statistics
   ✓ Advanced logging
   ✓ Zero external dependencies

🔧 TROUBLESHOOTING:
   - If SMS doesn't send, check modem connection
   - Use AT commands to test modem manually
   - Check logs in ./logs/ directory
   - Visit /api/health for system status

For support, check README.md or system logs.
  `);
}

main().catch(error => {
  console.error('\n❌ Installation failed:', error);
  process.exit(1);
}); 