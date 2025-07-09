/**
 * Port Conflict Checker
 * Check what might be using the COM port
 */

const { exec } = require('child_process');
const config = require('./config/config');

function checkPortUsage() {
  console.log('🔍 CHECKING PORT USAGE');
  console.log('=' .repeat(30));
  console.log(`Target Port: ${config.SERIAL_PORT_PATH}`);
  
  // Check running processes that might use the modem
  console.log('\n📋 Checking for conflicting processes...');
  
  const processesToCheck = [
    'Mobile Partner',
    'HuaweiMobile',
    'Mobile Connect',
    'DataCardMonitor',
    'MobilePartner',
    'node.exe'
  ];

  exec('tasklist /FI "STATUS eq RUNNING"', (error, stdout, stderr) => {
    if (error) {
      console.log('⚠️ Could not check running processes');
      return;
    }

    const runningProcesses = stdout.toLowerCase();
    let conflictsFound = false;

    processesToCheck.forEach(processName => {
      if (runningProcesses.includes(processName.toLowerCase())) {
        console.log(`❌ CONFLICT: ${processName} is running`);
        conflictsFound = true;
      }
    });

    if (!conflictsFound) {
      console.log('✅ No obvious conflicts found');
    }

    // Check for multiple node processes
    const nodeMatches = (runningProcesses.match(/node\.exe/g) || []);
    if (nodeMatches.length > 1) {
      console.log(`⚠️ Multiple Node.js processes running (${nodeMatches.length})`);
      console.log('   One might be using the modem port');
    }

    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Close any Huawei modem software');
    console.log('2. Stop other Node.js processes using the modem');
    console.log('3. Restart your computer to free all ports');
    console.log('4. Check Device Manager for port conflicts');
    
    console.log('\n📱 TO CHECK DEVICE MANAGER:');
    console.log('1. Press Win+X, select "Device Manager"');
    console.log('2. Expand "Ports (COM & LPT)"');
    console.log(`3. Look for ${config.SERIAL_PORT_PATH} - should show "Huawei Mobile Connect"`);
    console.log('4. If you see conflicts or errors, try:');
    console.log('   - Right-click → Disable → Enable');
    console.log('   - Unplug USB → Wait 10 seconds → Plug back in');
  });
}

// Check available COM ports
function checkAvailablePorts() {
  const { SerialPort } = require('serialport');
  
  console.log('\n📡 AVAILABLE SERIAL PORTS:');
  console.log('-'.repeat(30));
  
  SerialPort.list().then(ports => {
    if (ports.length === 0) {
      console.log('❌ No serial ports found');
      return;
    }

    ports.forEach(port => {
      console.log(`📍 ${port.path}`);
      if (port.manufacturer) console.log(`   Manufacturer: ${port.manufacturer}`);
      if (port.serialNumber) console.log(`   Serial: ${port.serialNumber}`);
      if (port.productId) console.log(`   Product ID: ${port.productId}`);
      
      if (port.path === config.SERIAL_PORT_PATH) {
        console.log('   ✅ This is your configured port');
      }
      console.log();
    });
  }).catch(error => {
    console.log('❌ Error listing ports:', error.message);
  });
}

// Main execution
console.log('🛠️ AEGIS PORT CONFLICT CHECKER');
console.log('=' .repeat(40));

checkPortUsage();
setTimeout(() => {
  checkAvailablePorts();
}, 1000); 