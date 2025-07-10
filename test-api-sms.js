const axios = require('axios');
const config = require('./config/config');
const logger = require('./app/services/logger');

async function testApiSms(phoneNumber) {
    console.log('🧪 AEGIS API SMS SENDING TEST');
    console.log('='.repeat(40));
    console.log(`📱 Testing SMS to: ${phoneNumber}`);
    console.log('⏳ Please wait...\n');

    const { url, apiKey, timeout, headers, secret, token } = config.SMS_API_CONFIG;

    if (!url || !apiKey || !secret || !token) {
        console.error('❌ API URL, key, secret, or token not configured');
        return;
    }

    // Create Basic Auth header
    const authString = Buffer.from(`${apiKey}:${secret}`).toString('base64');
    headers['Authorization'] = `Basic ${authString}`;

    const payload = {
        sender: 'AegisAuth',
        message: 'Test SMS from Aegis Local Auth - API functionality is working!',
        recipients: [{ msisdn: phoneNumber }],
        token: token
    };

    try {
        console.log('📤 Sending test SMS via API...');
        const response = await axios.post(url, payload, {
            timeout: timeout,
            headers: headers
        });

        if (response.status === 200 || response.status === 202) {
            console.log('🎉 SMS SENT SUCCESSFULLY VIA API!');
            console.log('📱 Check your phone for the test message');
            console.log('Response:', response.data);
        } else {
            console.error('❌ SMS sending failed via API');
            console.error('Status:', response.status);
            console.error('Response:', response.data);
        }
    } catch (error) {
        console.error('❌ Error sending SMS via API:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Get phone number from command line arguments
const testNumber = process.argv[2];
if (!testNumber) {
    console.error('❌ Usage: node test-api-sms.js <phone-number>');
    console.error('   Example: node test-api-sms.js +213776256416');
    process.exit(1);
}

testApiSms(testNumber); 