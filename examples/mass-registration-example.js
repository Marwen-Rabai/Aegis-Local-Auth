/**
 * Aegis Local Auth - Mass Registration Example
 * Demonstrates how to use the mass registration API
 */

const axios = require('axios');

// Configuration
const AEGIS_API_BASE = 'http://localhost:3000/api';

// Example phone numbers (replace with real numbers)
const examplePhoneNumbers = [
  '+12345678901',
  '+12345678902', 
  '+12345678903',
  '+12345678904',
  '+12345678905',
  '+44123456789',
  '+33123456789',
  '+49123456789',
  '+81123456789',
  '+86123456789'
];

/**
 * Start a mass registration operation
 */
async function startMassRegistration(phoneNumbers) {
  try {
    console.log(`🚀 Starting mass registration for ${phoneNumbers.length} numbers...`);
    
    const response = await axios.post(`${AEGIS_API_BASE}/mass-register`, {
      phoneNumbers: phoneNumbers
    });

    if (response.data.success) {
      console.log('✅ Mass registration started!');
      console.log(`📊 Operation ID: ${response.data.operationId}`);
      console.log(`📱 Valid numbers: ${response.data.validNumbers}`);
      console.log(`⏱️ Estimated duration: ${response.data.estimatedDuration}`);
      
      return response.data.operationId;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

/**
 * Track the progress of a mass registration operation
 */
async function trackProgress(operationId) {
  console.log(`\n📊 Tracking progress for operation: ${operationId}`);

  const trackingInterval = setInterval(async () => {
    try {
      const response = await axios.get(`${AEGIS_API_BASE}/mass-register/${operationId}`);
      
      if (response.data.success) {
        const operation = response.data.operation;
        const progress = parseFloat(operation.progress);
        
        process.stdout.write('\r\x1b[K');
        process.stdout.write(
          `📊 Progress: ${progress}% | ` +
          `Processed: ${operation.processed}/${operation.total} | ` +
          `✅ Success: ${operation.successful.length} | ` +
          `❌ Failed: ${operation.failed.length}`
        );

        if (operation.endTime) {
          clearInterval(trackingInterval);
          console.log('\n\n🏁 Mass registration completed!');
          
          const successRate = ((operation.successful.length / operation.total) * 100).toFixed(2);
          
          console.log(`📱 Total: ${operation.total}`);
          console.log(`✅ Successful: ${operation.successful.length}`);
          console.log(`❌ Failed: ${operation.failed.length}`);
          console.log(`📈 Success rate: ${successRate}%`);
          return;
        }
      }
    } catch (error) {
      console.error('\n❌ Error tracking progress:', error.message);
      clearInterval(trackingInterval);
    }
  }, 2000);
}

/**
 * Save results to a file
 */
async function saveResults(operation) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const resultsDir = './results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mass-registration-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);

    const results = {
      operationId: operation.id,
      summary: {
        total: operation.total,
        successful: operation.successful.length,
        failed: operation.failed.length,
        successRate: ((operation.successful.length / operation.total) * 100).toFixed(2),
        startTime: operation.startTime,
        endTime: operation.endTime
      },
      successful: operation.successful,
      failed: operation.failed
    };

    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${filepath}`);

    // Create CSV summary
    const csvFilename = `mass-registration-summary-${timestamp}.csv`;
    const csvFilepath = path.join(resultsDir, csvFilename);
    
    let csvContent = 'Phone Number,Status,OTP,Message ID,Error,Timestamp\n';
    
    operation.successful.forEach(result => {
      csvContent += `${result.phoneNumber},SUCCESS,${result.otp},${result.messageId || ''},,${result.timestamp}\n`;
    });
    
    operation.failed.forEach(result => {
      csvContent += `${result.phoneNumber},FAILED,,,${result.error},${result.timestamp}\n`;
    });

    fs.writeFileSync(csvFilepath, csvContent);
    console.log(`📊 CSV summary saved to: ${csvFilepath}`);

  } catch (error) {
    console.error('❌ Error saving results:', error.message);
  }
}

/**
 * Get system statistics
 */
async function getStatistics() {
  try {
    console.log('\n📊 Fetching system statistics...');
    
    const response = await axios.get(`${AEGIS_API_BASE}/statistics`);
    
    if (response.data.success) {
      const stats = response.data.statistics;
      
      console.log('\n📊 SYSTEM STATISTICS:');
      console.log('═'.repeat(50));
      console.log(`🖥️ System Status: ${stats.system.status}`);
      console.log(`⏱️ Uptime: ${Math.floor(stats.system.uptime / 3600)}h ${Math.floor((stats.system.uptime % 3600) / 60)}m`);
      console.log(`📱 Total SMS Sent: ${stats.modem.totalSent || 0}`);
      console.log(`✅ Success Rate: ${stats.modem.successRate || 0}%`);
      console.log(`🔒 Verified Users: ${stats.database.verifiedUsers || 0}`);
      console.log(`📡 Modem Status: ${stats.modem.status || 'Unknown'}`);
      
      if (stats.massRegistration) {
        console.log(`🚀 Total Operations: ${stats.massRegistration.overview.totalOperations}`);
        console.log(`⚡ Active Operations: ${stats.massRegistration.overview.activeOperations}`);
      }
      
      console.log('═'.repeat(50));
    } else {
      console.error('❌ Failed to get statistics:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error getting statistics:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          🛡️ AEGIS LOCAL AUTH - MASS REGISTRATION DEMO       ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // Get initial statistics
  await getStatistics();

  console.log('\n🚀 MASS REGISTRATION DEMO');
  console.log('This demo will register the following phone numbers:');
  examplePhoneNumbers.forEach((phone, index) => {
    console.log(`   ${index + 1}. ${phone}`);
  });

  console.log('\n⚠️ WARNING: This will send real SMS messages!');
  console.log('Make sure you have:');
  console.log('  1. GSM modem connected and working');
  console.log('  2. SIM card with SMS credits');
  console.log('  3. Permission to send SMS to these numbers');
  
  // Wait for user confirmation (in a real script, you might want to add this)
  console.log('\n📝 Note: Replace example numbers with real ones in production');
  console.log('Starting demo in 3 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start mass registration
  const operationId = await startMassRegistration(examplePhoneNumbers);
  
  if (operationId) {
    // Track progress
    await trackProgress(operationId);
    
    // Get final statistics
    await getStatistics();
  }
}

// Run the demo
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  startMassRegistration,
  trackProgress,
  getStatistics,
  saveResults
}; 