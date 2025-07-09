/**
 * Quick SMS Service Center Fix
 * Configure the correct SMS service center for Algeria
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('./config/config');

async function fixSMSCenter() {
  console.log('🔧 FIXING SMS SERVICE CENTER');
  console.log('=' .repeat(40));
  
  let port = null;
  let parser = null;
  
  try {
    // Connect to modem
    console.log(`📡 Connecting to ${config.SERIAL_PORT_PATH}...`);
    
    port = new SerialPort({
      path: config.SERIAL_PORT_PATH,
      baudRate: config.SERIAL_BAUD_RATE,
      autoOpen: false
    });

    parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
    await new Promise((resolve, reject) => {
      port.open((err) => {
        if (err) reject(err);
        else {
          console.log('✅ Connected');
          resolve();
        }
      });
    });

    // Send command function
    const sendCommand = (command) => {
      return new Promise((resolve, reject) => {
        const responses = [];
        
        const timer = setTimeout(() => {
          reject(new Error(`Timeout: ${command}`));
        }, 10000);

        parser.on('data', (data) => {
          const response = data.trim();
          if (response) {
            console.log(`📥 ${response}`);
            responses.push(response);
            
            if (response.includes('OK') || response.includes('ERROR')) {
              clearTimeout(timer);
              resolve(responses.join('\n'));
            }
          }
        });

        console.log(`📤 ${command}`);
        port.write(command + '\r\n');
      });
    };

    // Configure SMS
    console.log('\n⚙️ Configuring SMS...');
    
    await sendCommand('ATE0');
    await sendCommand('AT');
    await sendCommand('AT+CMGF=1');
    
    // Check current center
    console.log('\n📋 Current SMS service center:');
    await sendCommand('AT+CSCA?');
    
    // Set correct Mobilis center
    console.log('\n🔧 Setting correct Mobilis SMS center...');
    await sendCommand('AT+CSCA="+213661000111"');
    
    // Verify
    console.log('\n✅ Verifying new configuration:');
    await sendCommand('AT+CSCA?');
    
    console.log('\n🎉 SMS SERVICE CENTER FIXED!');
    console.log('You can now test SMS sending with your application.');
    
  } catch (error) {
    console.error('❌ Failed to fix SMS center:', error.message);
  } finally {
    if (port && port.isOpen) {
      port.close();
      console.log('\n📡 Connection closed');
    }
  }
}

// Run the fix
fixSMSCenter().catch(console.error); 