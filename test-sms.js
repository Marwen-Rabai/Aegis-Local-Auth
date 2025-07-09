/**
 * Quick SMS Test Script
 * Test SMS sending with the improved OTP engine
 */

const otpEngine = require('./app/services/otpEngine');
const logger = require('./app/services/logger');

async function testSMSSending() {
  console.log('🧪 AEGIS SMS SENDING TEST');
  console.log('=' .repeat(40));

  const testNumber = process.argv[2];
  
  if (!testNumber) {
    console.log('❌ Usage: node test-sms.js +213XXXXXXXXX');
    console.log('   Example: node test-sms.js +213776256416');
    process.exit(1);
  }

  console.log(`📱 Testing SMS to: ${testNumber}`);
  console.log('⏳ Please wait...\n');

  try {
    // Test modem health first
    console.log('🔍 Checking modem health...');
    const health = await otpEngine.checkModemHealth();
    
    if (health.status === 'healthy') {
      console.log('✅ Modem health: GOOD');
      console.log(`   Signal: ${health.signal.rssi}dBm`);
      console.log(`   SIM: ${health.sim.status}`);
      console.log(`   Network: ${health.network.status}`);
      console.log(`   SMS: ${health.sms.status}`);
    } else {
      console.log('❌ Modem health: FAILED');
      console.log(`   Error: ${health.error}`);
      return;
    }

    // Test SMS sending
    console.log('\n📤 Sending test SMS...');
    const result = await otpEngine.sendOtpSms(testNumber);
    
    if (result.success) {
      console.log('✅ SMS SENT SUCCESSFULLY!');
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Message ID: ${result.messageId || 'N/A'}`);
      console.log(`   Attempts: ${result.attempts || 1}`);
      console.log(`   OTP Code: ${result.otp}`);
      console.log('\n📱 Check your phone for the SMS!');
    } else {
      console.log('❌ SMS SENDING FAILED');
      console.log(`   Error: ${result.error}`);
      console.log(`   Duration: ${result.duration}ms`);
      
      if (result.details) {
        console.log('\n🔍 Error Details:');
        console.log(result.details);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Close modem connection
    try {
      await otpEngine.closeModem();
      console.log('\n📡 Modem connection closed');
    } catch (closeError) {
      console.log('⚠️ Error closing modem:', closeError.message);
    }
    
    process.exit(0);
  }
}

// Run the test
testSMSSending().catch(console.error); 