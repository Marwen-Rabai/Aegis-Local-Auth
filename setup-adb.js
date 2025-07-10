const axios = require('axios');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const os = require('os');

console.log('🛠️ AEGIS LOCAL AUTH - ADB SETUP');
console.log('='.repeat(40));

// Detect OS
const platform = os.platform();
let downloadUrl;

switch (platform) {
    case 'win32':
        downloadUrl = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
        console.log('🖥️ OS Detected: Windows');
        break;
    case 'darwin':
        downloadUrl = 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip';
        console.log('🖥️ OS Detected: macOS');
        break;
    case 'linux':
        downloadUrl = 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip';
        console.log('🖥️ OS Detected: Linux');
        break;
    default:
        console.error('❌ Unsupported OS:', platform);
        process.exit(1);
}

// Create bin directory
const binDir = path.join(__dirname, 'bin');
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
    console.log('📁 Created bin directory');
} else {
    console.log('📁 bin directory already exists');
}

// Download ADB
const zipPath = path.join(binDir, 'platform-tools.zip');

async function downloadADB() {
    console.log('🌐 Downloading ADB tools...');
    const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream'
    });

    const totalLength = response.headers['content-length'];
    let downloadedLength = 0;
    let lastPercent = 0;

    response.data.on('data', (chunk) => {
        downloadedLength += chunk.length;
        const percent = Math.floor((downloadedLength / totalLength) * 100);
        if (percent !== lastPercent && percent % 10 === 0) {
            console.log(`📥 Download progress: ${percent}%`);
            lastPercent = percent;
        }
    });

    response.data.pipe(fs.createWriteStream(zipPath));

    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            console.log('✅ Download completed');
            resolve();
        });
        response.data.on('error', (err) => {
            console.error('❌ Download failed:', err.message);
            reject(err);
        });
    });
}

// Unzip the downloaded file
async function unzipADB() {
    console.log('📦 Unzipping ADB tools...');
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: binDir }))
            .on('close', () => {
                console.log('✅ Unzipping completed');
                fs.unlinkSync(zipPath); // Delete the zip file
                console.log('🧹 Cleaned up zip file');
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ Unzipping failed:', err.message);
                reject(err);
            });
    });
}

// Update config.js
function updateConfig() {
    console.log('⚙️ Updating configuration...');
    const configPath = path.join(__dirname, 'config', 'config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');

    const adbExecutable = platform === 'win32' ? 'adb.exe' : 'adb';
    const adbPath = path.join(binDir, 'platform-tools', adbExecutable).replace(/\\/g, '\\\\');

    // Check if SMS_ADB_CONFIG already exists
    if (configContent.includes('SMS_ADB_CONFIG')) {
        // Update existing config
        configContent = configContent.replace(
            /SMS_ADB_CONFIG: {[^}]*}/,
            `SMS_ADB_CONFIG: {
        adbPath: '${adbPath}', // Automatically set by setup-adb.js
        targetDevice: null
    }`
        );
    } else {
        // Add new config
        const insertPosition = configContent.lastIndexOf('}');
        const newConfig = `,

  /**
   * Configuration pour ADB (Android Debug Bridge)
   * Automatically set by setup-adb.js
   */
  SMS_ADB_CONFIG: {
    adbPath: '${adbPath}',
    targetDevice: null
  }`;
        configContent = configContent.slice(0, insertPosition) + newConfig + configContent.slice(insertPosition);
    }

    // Ensure SMS_PROVIDER is set to 'adb'
    if (configContent.includes('SMS_PROVIDER')) {
        configContent = configContent.replace(
            /SMS_PROVIDER: '[^']*'/,
            `SMS_PROVIDER: 'adb'`
        );
    }

    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('✅ Configuration updated successfully');
}

// Main execution
async function main() {
    try {
        await downloadADB();
        await unzipADB();
        updateConfig();

        console.log('🎉 ADB Setup Completed Successfully!');
        console.log('=' .repeat(40));
        console.log('📋 Next Steps:');
        console.log('1. Connect your Android phone to your PC via USB cable.');
        console.log('2. On your phone, go to Settings > About phone and tap "Build number" 7 times to enable Developer options.');
        console.log('3. Go back to Settings > System > Developer options and enable "USB debugging".');
        console.log('4. When prompted on your phone, allow USB debugging for this computer.');
        console.log('5. Run "npm start" to start the Aegis Local Auth server with ADB support.');
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

main(); 