/**
 * Aegis Local Auth - GSM Modem Diagnostic Tool
 * Comprehensive diagnostic for SMS sending issues
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('./config/config');

class ModemDiagnostic {
  constructor() {
    this.port = null;
    this.parser = null;
    this.responses = [];
  }

  async runDiagnostic() {
    console.log('🔧 AEGIS GSM MODEM DIAGNOSTIC TOOL');
    console.log('=' .repeat(50));
    
    try {
      await this.connectToModem();
      await this.runBasicTests();
      await this.runSMSTests();
      await this.runAdvancedTests();
      
      console.log('\n✅ DIAGNOSTIC COMPLETED');
      console.log('Check the results above for any issues.');
      
    } catch (error) {
      console.error('❌ DIAGNOSTIC FAILED:', error.message);
    } finally {
      await this.closeConnection();
    }
  }

  async connectToModem() {
    console.log(`\n📡 Connecting to modem on ${config.SERIAL_PORT_PATH}...`);
    
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
          console.error('❌ Failed to open port:', err.message);
          reject(err);
          return;
        }
        
        console.log('✅ Port opened successfully');
        this.setupDataHandling();
        resolve();
      });
    });
  }

  setupDataHandling() {
    this.parser.on('data', (data) => {
      const response = data.trim();
      if (response) {
        console.log(`📥 Modem: ${response}`);
        this.responses.push(response);
      }
    });
  }

  async sendCommand(command, timeout = 10000, description = '') {
    console.log(`📤 Sending: ${command} ${description ? '(' + description + ')' : ''}`);
    
    return new Promise((resolve, reject) => {
      this.responses = [];
      
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to: ${command}`));
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
      setTimeout(checkResponse, 100);
    });
  }

  async runBasicTests() {
    console.log('\n🔍 BASIC CONNECTIVITY TESTS');
    console.log('-'.repeat(30));

    try {
      // Test 0: Disable echo first
      console.log('🔧 Disabling modem echo...');
      try {
        const echoResponse = await this.sendCommand('ATE0', 5000, 'Disable echo');
        console.log(echoResponse.includes('OK') ? '✅ Echo: DISABLED' : '⚠️ Echo: May still be enabled');
      } catch (echoError) {
        console.log('⚠️ Echo disable failed, continuing...');
      }

      // Test 1: Basic AT
      const atResponse = await this.sendCommand('AT', 5000, 'Basic connectivity test');
      console.log(atResponse.includes('OK') ? '✅ Basic AT: PASS' : '❌ Basic AT: FAIL');

      // Test 2: Modem info
      const modelResponse = await this.sendCommand('AT+CGMM', 5000, 'Get modem model');
      console.log('📋 Modem Model:', this.extractInfo(modelResponse));

      // Test 3: IMEI
      const imeiResponse = await this.sendCommand('AT+CGSN', 5000, 'Get IMEI');
      console.log('📋 IMEI:', this.extractInfo(imeiResponse));

      // Test 4: SIM Status
      const simResponse = await this.sendCommand('AT+CPIN?', 5000, 'Check SIM status');
      console.log(simResponse.includes('READY') ? '✅ SIM Status: READY' : '❌ SIM Status: ' + simResponse);

      // Test 5: Signal Strength
      const signalResponse = await this.sendCommand('AT+CSQ', 5000, 'Check signal strength');
      const signalMatch = signalResponse.match(/\+CSQ:\s*(\d+),(\d+)/);
      if (signalMatch) {
        const rssi = parseInt(signalMatch[1]);
        const dbm = rssi >= 0 && rssi <= 31 ? -113 + (rssi * 2) : 'Unknown';
        console.log(`✅ Signal: ${dbm}dBm (RSSI: ${rssi})`);
      }

      // Test 6: Network Registration
      const networkResponse = await this.sendCommand('AT+CREG?', 5000, 'Check network registration');
      console.log(networkResponse.includes(',1') || networkResponse.includes(',5') ? 
        '✅ Network: REGISTERED' : '❌ Network: NOT REGISTERED');

    } catch (error) {
      console.error('❌ Basic test failed:', error.message);
    }
  }

  async runSMSTests() {
    console.log('\n📱 SMS CAPABILITY TESTS');
    console.log('-'.repeat(30));

    try {
      // Test 1: SMS Format
      const formatResponse = await this.sendCommand('AT+CMGF=1', 5000, 'Set SMS text mode');
      console.log(formatResponse.includes('OK') ? '✅ SMS Text Mode: SET' : '❌ SMS Text Mode: FAILED');

      // Test 2: Character Set
      const charsetResponse = await this.sendCommand('AT+CSCS="GSM"', 5000, 'Set character set');
      console.log(charsetResponse.includes('OK') ? '✅ Character Set: SET' : '❌ Character Set: FAILED');

      // Test 3: SMS Memory
      const memoryResponse = await this.sendCommand('AT+CPMS?', 5000, 'Check SMS memory');
      console.log('📋 SMS Memory:', memoryResponse);

      // Test 4: Service Center
      const scResponse = await this.sendCommand('AT+CSCA?', 5000, 'Check service center');
      console.log('📋 Service Center:', scResponse);

      // Test 5: SMS Command Support
      const cmgsResponse = await this.sendCommand('AT+CMGS=?', 5000, 'Test SMS command support');
      console.log(cmgsResponse.includes('OK') ? '✅ SMS Command: SUPPORTED' : '❌ SMS Command: NOT SUPPORTED');

    } catch (error) {
      console.error('❌ SMS test failed:', error.message);
    }
  }

  async runAdvancedTests() {
    console.log('\n🔬 ADVANCED DIAGNOSTIC TESTS');
    console.log('-'.repeat(30));

    try {
      // Test 1: Error Reporting
      const errorResponse = await this.sendCommand('AT+CMEE=2', 5000, 'Enable verbose errors');
      console.log(errorResponse.includes('OK') ? '✅ Verbose Errors: ENABLED' : '❌ Verbose Errors: FAILED');

      // Test 2: Test SMS Setup (without sending)
      console.log('🧪 Testing SMS setup sequence...');
      
      try {
        const testNumber = '+1234567890'; // Test number
        const setupResponse = await this.sendCommand(`AT+CMGS="${testNumber}"`, 15000, 'Test SMS setup');
        
        if (setupResponse.includes('>')) {
          console.log('✅ SMS Setup: SUCCESS - Prompt received');
          
          // Cancel the SMS
          await this.sendCommand(String.fromCharCode(27), 5000, 'Cancel SMS (ESC)');
          console.log('✅ SMS Cancelled successfully');
        } else {
          console.log('❌ SMS Setup: FAILED - No prompt received');
          console.log('📋 Response:', setupResponse);
        }
      } catch (setupError) {
        console.log('❌ SMS Setup: TIMEOUT or ERROR');
        console.log('📋 Error:', setupError.message);
      }

      // Test 3: Check for conflicting software
      console.log('\n🔍 CHECKING FOR CONFLICTS...');
      console.log('Please check if any of these programs are running:');
      console.log('- Huawei Mobile Partner');
      console.log('- Mobile Connect');
      console.log('- Any modem management software');
      console.log('- Demo Mode windows');

    } catch (error) {
      console.error('❌ Advanced test failed:', error.message);
    }
  }

  extractInfo(response) {
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.includes('AT+') && !line.includes('OK') && !line.includes('ERROR')) {
        return line.trim();
      }
    }
    return 'Unknown';
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

// Run diagnostic if this file is executed directly
if (require.main === module) {
  const diagnostic = new ModemDiagnostic();
  diagnostic.runDiagnostic().catch(console.error);
}

module.exports = ModemDiagnostic; 