/**
 * AEGIS LOCAL AUTH - LOAD TESTING SUITE
 * Performance testing for high-load scenarios
 */

const axios = require('axios');
const cluster = require('cluster');
const os = require('os');

class LoadTester {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Run a single request and collect metrics
   */
  async runSingleRequest(endpoint, method = 'GET', data = null) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Aegis-Load-Tester/1.0'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      this.updateMetrics(responseTime, true);
      return { success: true, responseTime, status: response.status };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false, error);
      return { success: false, responseTime, error: error.message };
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics(responseTime, success, error = null) {
    this.results.totalRequests++;
    this.results.responseTimes.push(responseTime);

    if (success) {
      this.results.successfulRequests++;
    } else {
      this.results.failedRequests++;
      if (error) {
        this.results.errors.push(error);
      }
    }

    this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
    this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);
    
    // Calculate running average
    const sum = this.results.responseTimes.reduce((a, b) => a + b, 0);
    this.results.averageResponseTime = sum / this.results.responseTimes.length;
  }

  /**
   * Generate load test scenario
   */
  async runLoadTest(config) {
    console.log(`🚀 Starting load test: ${config.name}`);
    console.log(`📊 Configuration: ${config.concurrent} concurrent users, ${config.duration}s duration`);
    
    this.results.startTime = Date.now();
    
    const workers = [];
    const numWorkers = Math.min(config.concurrent, os.cpus().length);
    
    if (cluster.isMaster) {
      // Create worker processes
      for (let i = 0; i < numWorkers; i++) {
        const worker = cluster.fork();
        workers.push(worker);
        
        worker.send({
          type: 'START_LOAD_TEST',
          config: {
            ...config,
            workerId: i,
            requestsPerWorker: Math.floor(config.totalRequests / numWorkers)
          }
        });
      }

      // Collect results from workers
      let completedWorkers = 0;
      const workerResults = [];

      cluster.on('message', (worker, message) => {
        if (message.type === 'LOAD_TEST_COMPLETE') {
          workerResults.push(message.results);
          completedWorkers++;
          
          if (completedWorkers === numWorkers) {
            this.aggregateResults(workerResults);
            this.printResults();
          }
        }
      });

    } else {
      // Worker process
      process.on('message', async (message) => {
        if (message.type === 'START_LOAD_TEST') {
          const results = await this.runWorkerLoadTest(message.config);
          process.send({
            type: 'LOAD_TEST_COMPLETE',
            results
          });
          process.exit(0);
        }
      });
    }
  }

  /**
   * Run load test in worker process
   */
  async runWorkerLoadTest(config) {
    const promises = [];
    
    for (let i = 0; i < config.requestsPerWorker; i++) {
      const delay = Math.random() * (config.duration * 1000) / config.requestsPerWorker;
      
      promises.push(
        new Promise(resolve => {
          setTimeout(async () => {
            const result = await this.runSingleRequest(
              config.endpoint,
              config.method,
              config.data
            );
            resolve(result);
          }, delay);
        })
      );
    }

    const results = await Promise.all(promises);
    return this.processWorkerResults(results);
  }

  /**
   * Process results from worker
   */
  processWorkerResults(results) {
    const workerMetrics = {
      totalRequests: results.length,
      successfulRequests: results.filter(r => r.success).length,
      failedRequests: results.filter(r => !r.success).length,
      responseTimes: results.map(r => r.responseTime),
      errors: results.filter(r => !r.success).map(r => r.error)
    };

    workerMetrics.averageResponseTime = 
      workerMetrics.responseTimes.reduce((a, b) => a + b, 0) / workerMetrics.responseTimes.length;
    workerMetrics.minResponseTime = Math.min(...workerMetrics.responseTimes);
    workerMetrics.maxResponseTime = Math.max(...workerMetrics.responseTimes);

    return workerMetrics;
  }

  /**
   * Aggregate results from all workers
   */
  aggregateResults(workerResults) {
    this.results.endTime = Date.now();
    
    this.results.totalRequests = workerResults.reduce((sum, r) => sum + r.totalRequests, 0);
    this.results.successfulRequests = workerResults.reduce((sum, r) => sum + r.successfulRequests, 0);
    this.results.failedRequests = workerResults.reduce((sum, r) => sum + r.failedRequests, 0);
    
    // Combine all response times
    this.results.responseTimes = workerResults.reduce((arr, r) => arr.concat(r.responseTimes), []);
    this.results.errors = workerResults.reduce((arr, r) => arr.concat(r.errors), []);
    
    // Calculate aggregate metrics
    this.results.averageResponseTime = 
      this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    this.results.minResponseTime = Math.min(...this.results.responseTimes);
    this.results.maxResponseTime = Math.max(...this.results.responseTimes);
    
    // Calculate percentiles
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    this.results.p50 = this.getPercentile(sortedTimes, 50);
    this.results.p95 = this.getPercentile(sortedTimes, 95);
    this.results.p99 = this.getPercentile(sortedTimes, 99);
  }

  /**
   * Calculate percentile
   */
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index];
  }

  /**
   * Print test results
   */
  printResults() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    const requestsPerSecond = this.results.totalRequests / duration;

    console.log('\n' + '='.repeat(60));
    console.log('📊 LOAD TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${duration.toFixed(2)}s`);
    console.log(`📋 Total Requests: ${this.results.totalRequests}`);
    console.log(`✅ Successful: ${this.results.successfulRequests}`);
    console.log(`❌ Failed: ${this.results.failedRequests}`);
    console.log(`🎯 Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`🚀 Requests/sec: ${requestsPerSecond.toFixed(2)}`);
    console.log('\n📈 Response Time Metrics:');
    console.log(`   Average: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Minimum: ${this.results.minResponseTime}ms`);
    console.log(`   Maximum: ${this.results.maxResponseTime}ms`);
    console.log(`   50th percentile: ${this.results.p50}ms`);
    console.log(`   95th percentile: ${this.results.p95}ms`);
    console.log(`   99th percentile: ${this.results.p99}ms`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Error Summary:');
      const errorCounts = {};
      this.results.errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
      
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`   ${error}: ${count} occurrences`);
      });
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Run health check load test
   */
  async testHealthEndpoint() {
    await this.runLoadTest({
      name: 'Health Check Load Test',
      endpoint: '/api/health',
      method: 'GET',
      concurrent: 50,
      totalRequests: 1000,
      duration: 30
    });
  }

  /**
   * Run registration endpoint load test
   */
  async testRegistrationEndpoint() {
    await this.runLoadTest({
      name: 'Registration Load Test',
      endpoint: '/api/register',
      method: 'POST',
      data: { phoneNumber: '+1234567890' },
      concurrent: 20,
      totalRequests: 500,
      duration: 60
    });
  }

  /**
   * Run statistics endpoint load test
   */
  async testStatisticsEndpoint() {
    await this.runLoadTest({
      name: 'Statistics Load Test',
      endpoint: '/api/statistics',
      method: 'GET',
      concurrent: 30,
      totalRequests: 300,
      duration: 30
    });
  }
}

// Run load tests if this file is executed directly
if (require.main === module) {
  const tester = new LoadTester();
  
  async function runAllTests() {
    console.log('🧪 Starting Aegis Local Auth Load Tests\n');
    
    try {
      await tester.testHealthEndpoint();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      await tester.testStatisticsEndpoint();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      await tester.testRegistrationEndpoint();
      
      console.log('\n✅ All load tests completed successfully!');
    } catch (error) {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    }
  }

  runAllTests();
}

module.exports = LoadTester; 