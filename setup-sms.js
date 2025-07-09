/**
 * SMS Setup and Configuration Script
 * Configure SMS service center and test functionality
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('./config/config');

class SMSSetup {
  constructor() {
    this.port = null;
    this.parser = null;
    this.responses = [];
  }

  async setupSMS() {
    console.log('📱 AEGIS SMS SETUP & CONFIGURATION');
    console.log('=' .repeat(50));
    
    try {
      await this.connectToModem();
      await this.configureModem();
      await this.testSMSConfiguration();
      await this.testRealSMS();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    } finally {
      await this.closeConnection();
    }
  }

  async connectToModem() {
    console.log(`\n📡 Connecting to ${config.SERIAL_PORT_PATH}...`);
    
    return new Promise((resolve, reject) => {
      this.port = new SerialPort({
        path: config.SERIAL_PORT_PATH,
        baudRate: config.SERIAL_BAUD_RATE,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      
      this.port.open((err) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('✅ Connected successfully');
        this.setupDataHandling();
        resolve();
      });
    });
  }

  setupDataHandling() {
    this.parser.on('data', (data) => {
      const response = data.trim();
      if (response) {
        console.log(`📥 ${response}`);
        this.responses.push(response);
      }
    });
  }

  async sendCommand(command, timeout = 10000, description = '') {
    if (description) console.log(`\n🔧 ${description}`);
    console.log(`📤 ${command}`);
    
    return new Promise((resolve, reject) => {
      this.responses = [];
      
      const timer = setTimeout(() => {
        reject(new Error(`Timeout: ${command}`));
      }, timeout);

      const checkResponse = () => {
        const fullResponse = this.responses.join('\n');
        if (fullResponse.includes('OK') || fullResponse.includes('ERROR') || fullResponse.includes('>')) {
          clearTimeout(timer);
          resolve(fullResponse);
        } else {
          setTimeout(checkResponse, 100);
        }
      };

      this.port.write(command + '\r\n');
      setTimeout(checkResponse, 200);
    });
  }

  async configureModem() {
    console.log('\n⚙️ CONFIGURING MODEM FOR SMS');
    console.log('-'.repeat(30));

    try {
      // Disable echo
      await this.sendCommand('ATE0', 5000, 'Disabling echo');
      
      // Basic test
      await this.sendCommand('AT', 5000, 'Testing basic connectivity');
      
      // Set SMS text mode
      await this.sendCommand('AT+CMGF=1', 5000, 'Setting SMS text mode');
      
      // Set character set
      await this.sendCommand('AT+CSCS="GSM"', 5000, 'Setting character set');
      
      // Enable verbose errors
      await this.sendCommand('AT+CMEE=2', 5000, 'Enabling verbose error messages');
      
      // Check current service center
      const scResponse = await this.sendCommand('AT+CSCA?', 5000, 'Checking current SMS service center');
      console.log('📋 Current service center:', scResponse);
      
      // Configure service center for Algeria (Mobilis)
      // You might need to change this based on your operator
      console.log('\n🔧 Configuring SMS service center...');
      console.log('Available operators:');
      console.log('1. Mobilis: +213661000111');
      console.log('2. Djezzy: +213770000111');
      console.log('3. Ooredoo: +213550000111');
      
      // Try Mobilis first (most common)
      try {
        await this.sendCommand('AT+CSCA="+213661000111"', 10000, 'Setting Mobilis service center');
        console.log('✅ Service center configured for Mobilis');
      } catch (scError) {
        console.log('⚠️ Could not set service center:', scError.message);
      }
      
      console.log('✅ Modem configuration completed');
      
    } catch (error) {
      console.log('❌ Configuration failed:', error.message);
      throw error;
    }
  }

  async testSMSConfiguration() {
    console.log('\n🧪 TESTING SMS CONFIGURATION');
    console.log('-'.repeat(30));

    try {
      // Check SMS memory
      const memoryResponse = await this.sendCommand('AT+CPMS?', 5000, 'Checking SMS memory');
      console.log('📋 SMS Memory status:', memoryResponse);
      
      // Check network registration
      const networkResponse = await this.sendCommand('AT+CREG?', 5000, 'Checking network registration');
      console.log('📋 Network status:', networkResponse);
      
      // Check signal strength
      const signalResponse = await this.sendCommand('AT+CSQ', 5000, 'Checking signal strength');
      console.log('📋 Signal strength:', signalResponse);
      
      console.log('✅ SMS configuration test completed');
      
    } catch (error) {
      console.log('❌ Configuration test failed:', error.message);
    }
  }

  async testRealSMS() {
    console.log('\n📨 TESTING REAL SMS SENDING');
    console.log('-'.repeat(30));
    
    // Get phone number from command line
    const testNumber = process.argv[2];
    if (!testNumber) {
      console.log('⚠️ No phone number provided for SMS test');
      console.log('Usage: node setup-sms.js +213XXXXXXXXX');
      return;
    }

    console.log(`📱 Testing SMS to: ${testNumber}`);
    
    try {
      // Start SMS sending
      const setupResponse = await this.sendCommand(`AT+CMGS="${testNumber}"`, 30000, 'Starting SMS send');
      
      if (setupResponse.includes('>')) {
        console.log('✅ SMS prompt received! Modem is ready to send.');
        
        // Send test message
        const testMessage = 'Test SMS from Aegis Local Auth - SMS functionality is working!';
        console.log(`📝 Sending message: ${testMessage}`);
        
        const sendResponse = await this.sendCommand(testMessage + String.fromCharCode(26), 60000, 'Sending SMS content');
        
        if (sendResponse.includes('OK') || sendResponse.includes('+CMGS:')) {
          console.log('🎉 SMS SENT SUCCESSFULLY!');
          console.log('📱 Check your phone for the test message');
          
          // Extract message ID if available
          const messageIdMatch = sendResponse.match(/\+CMGS:\s*(\d+)/);
          if (messageIdMatch) {
            console.log(`📋 Message ID: ${messageIdMatch[1]}`);
          }
        } else {
          console.log('❌ SMS sending failed');
          console.log('📋 Response:', sendResponse);
        }
      } else {
        console.log('❌ No SMS prompt received');
        console.log('📋 Response:', setupResponse);
        console.log('\n💡 Possible issues:');
        console.log('- Wrong service center number');
        console.log('- No SMS credit/plan');
        console.log('- Network not allowing SMS');
      }
      
    } catch (error) {
      console.log('❌ SMS test failed:', error.message);
      
      if (error.message.includes('Timeout')) {
        console.log('\n💡 Timeout suggests:');
        console.log('- SMS service center not configured correctly');
        console.log('- No SMS credit or plan active');
        console.log('- Network connectivity issues');
        console.log('- SIM card SMS capability disabled');
      }
    }
  }

  async closeConnection() {
    if (this.port && this.port.isOpen) {
      return new Promise((resolve) => {
        this.port.close(() => {
          console.log('\n📡 Connection closed');
          resolve();
        });
      });
    }
  }
}

// Run setup
if (require.main === module) {
  const setup = new SMSSetup();
  setup.setupSMS().catch(console.error);
}

module.exports = SMSSetup; 