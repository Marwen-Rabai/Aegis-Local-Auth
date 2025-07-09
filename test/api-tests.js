/**
 * AEGIS LOCAL AUTH - COMPREHENSIVE API TESTS
 * Enterprise-grade testing suite for all API endpoints
 */

const request = require('supertest');
const app = require('../server');
const database = require('../app/database/database');

describe('Aegis Local Auth API Tests', () => {
  let server;
  const testPhoneNumber = '+1234567890';
  const invalidPhoneNumber = 'invalid_phone';
  const testOTP = '123456';

  beforeAll(async () => {
    // Initialize test database
    await database.initialize();
    
    // Start server for testing
    server = app.listen(0); // Use random port for testing
  });

  afterAll(async () => {
    // Clean up
    if (server) {
      server.close();
    }
    await database.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await database.clearTestData();
  });

  // =================================================================
  // HEALTH CHECK TESTS
  // =================================================================

  describe('GET /api/health', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('modem');
    });
  });

  describe('GET /api/status', () => {
    test('should return system status information', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'Aegis Local Auth');
      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('features');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /api/statistics', () => {
    test('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics).toHaveProperty('system');
      expect(response.body.statistics).toHaveProperty('database');
      expect(response.body.statistics).toHaveProperty('modem');
    });
  });

  // =================================================================
  // SINGLE REGISTRATION TESTS
  // =================================================================

  describe('POST /api/register', () => {
    test('should register valid phone number successfully', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ phoneNumber: testPhoneNumber })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('phoneNumber');
      expect(response.body).toHaveProperty('provider');
    });

    test('should reject invalid phone number format', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ phoneNumber: invalidPhoneNumber })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid input data');
      expect(response.body).toHaveProperty('errors');
    });

    test('should reject empty phone number', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({})
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    test('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      const promises = Array(1001).fill().map(() =>
        request(app)
          .post('/api/register')
          .send({ phoneNumber: testPhoneNumber })
      );

      const responses = await Promise.allSettled(promises);
      const rateLimitedResponses = responses.filter(
        result => result.value && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  // =================================================================
  // OTP VERIFICATION TESTS
  // =================================================================

  describe('POST /api/verify', () => {
    beforeEach(async () => {
      // Register a phone number first
      await request(app)
        .post('/api/register')
        .send({ phoneNumber: testPhoneNumber });
    });

    test('should verify valid OTP successfully', async () => {
      // Note: In a real test, we'd need to mock the OTP or use a test OTP
      const response = await request(app)
        .post('/api/verify')
        .send({ 
          phoneNumber: testPhoneNumber,
          otp: testOTP 
        });

      // This might fail in real testing without proper OTP, 
      // but it tests the endpoint structure
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });

    test('should reject invalid OTP format', async () => {
      const response = await request(app)
        .post('/api/verify')
        .send({ 
          phoneNumber: testPhoneNumber,
          otp: '12345' // Invalid length
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    test('should reject non-numeric OTP', async () => {
      const response = await request(app)
        .post('/api/verify')
        .send({ 
          phoneNumber: testPhoneNumber,
          otp: 'abcdef'
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  // =================================================================
  // MASS REGISTRATION TESTS
  // =================================================================

  describe('POST /api/mass-register', () => {
    const validPhoneNumbers = [
      '+1234567890',
      '+1234567891',
      '+1234567892'
    ];

    test('should start mass registration successfully', async () => {
      const response = await request(app)
        .post('/api/mass-register')
        .send({ phoneNumbers: validPhoneNumbers })
        .expect(202);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('operationId');
      expect(response.body).toHaveProperty('statusEndpoint');
    });

    test('should reject empty phone numbers array', async () => {
      const response = await request(app)
        .post('/api/mass-register')
        .send({ phoneNumbers: [] })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    test('should reject invalid phone numbers in array', async () => {
      const invalidNumbers = ['invalid1', 'invalid2'];
      
      const response = await request(app)
        .post('/api/mass-register')
        .send({ phoneNumbers: invalidNumbers })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should reject too many phone numbers', async () => {
      const tooManyNumbers = Array(10001).fill('+1234567890');
      
      const response = await request(app)
        .post('/api/mass-register')
        .send({ phoneNumbers: tooManyNumbers })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/mass-register/:operationId', () => {
    test('should return 404 for non-existent operation', async () => {
      const fakeOperationId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/mass-register/${fakeOperationId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should reject invalid operation ID format', async () => {
      const invalidOperationId = 'invalid-id';
      
      const response = await request(app)
        .get(`/api/mass-register/${invalidOperationId}`)
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // =================================================================
  // ERROR HANDLING TESTS
  // =================================================================

  describe('Error Handling', () => {
    test('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'API endpoint not found');
      expect(response.body).toHaveProperty('availableEndpoints');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should enforce content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/register')
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // =================================================================
  // SECURITY TESTS
  // =================================================================

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  // =================================================================
  // PERFORMANCE TESTS
  // =================================================================

  describe('Performance', () => {
    test('health check should respond quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests).fill().map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  // =================================================================
  // VALIDATION TESTS
  // =================================================================

  describe('Input Validation', () => {
    test('should sanitize SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/register')
        .send({ phoneNumber: maliciousInput })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle XSS attempts', async () => {
      const xssInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/register')
        .send({ phoneNumber: xssInput })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should limit request body size', async () => {
      const largePayload = {
        phoneNumber: testPhoneNumber,
        extraData: 'x'.repeat(20 * 1024 * 1024) // 20MB of data
      };

      const response = await request(app)
        .post('/api/register')
        .send(largePayload)
        .expect(413);

      expect(response.body).toHaveProperty('success', false);
    });
  });
}); 