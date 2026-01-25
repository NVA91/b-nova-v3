#!/usr/bin/env node
/**
 * b-nova-v3 AI Service - Integration Tests
 * 
 * Comprehensive integration tests for all endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  testImage: process.env.TEST_IMAGE || './test-image.jpg',
  timeout: 30000,
};

// ============================================================================
// COLORS
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = [];
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log('');
    console.log(colorize(`▶ Running: ${this.name}`, 'bright'));
    console.log(colorize('═'.repeat(60), 'cyan'));
    console.log('');
    
    for (const test of this.tests) {
      try {
        process.stdout.write(`  ${test.name}... `);
        
        const startTime = Date.now();
        await test.fn();
        const duration = Date.now() - startTime;
        
        console.log(colorize(`✓ (${duration}ms)`, 'green'));
        
        this.results.push({
          name: test.name,
          success: true,
          duration: duration,
        });
        
      } catch (error) {
        console.log(colorize(`✗`, 'red'));
        console.log(colorize(`    Error: ${error.message}`, 'red'));
        
        this.results.push({
          name: test.name,
          success: false,
          error: error.message,
        });
      }
    }
    
    this.displayResults();
  }
  
  displayResults() {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log('');
    
    if (failed === 0) {
      console.log(colorize(`✓ ${passed}/${total} tests passed`, 'green'));
    } else {
      console.log(colorize(`✗ ${failed}/${total} tests failed`, 'red'));
    }
    
    console.log('');
  }
}

// ============================================================================
// HTTP HELPERS
// ============================================================================

function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: CONFIG.timeout,
    }, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed, raw: responseData });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: responseData });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

function generateBoundary() {
  return '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
}

function buildMultipartData(filePath, boundary) {
  const fileName = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);
  
  const parts = [];
  
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n`
  ));
  
  parts.push(fileData);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  
  return Buffer.concat(parts);
}

function buildBatchMultipartData(filePaths, boundary) {
  const parts = [];
  
  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`
    ));
    
    parts.push(fileData);
    parts.push(Buffer.from('\r\n'));
  }
  
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  
  return Buffer.concat(parts);
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertExists(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value does not exist');
  }
}

function assertType(value, type, message) {
  if (typeof value !== type) {
    throw new Error(message || `Expected type ${type}, got ${typeof value}`);
  }
}

// ============================================================================
// TEST SUITES
// ============================================================================

/**
 * Basic Endpoint Tests
 */
async function testBasicEndpoints() {
  const suite = new TestSuite('Basic Endpoints');
  
  suite.test('GET / should return service info', async () => {
    const response = await makeRequest(`${CONFIG.serviceUrl}/`);
    
    assertEqual(response.status, 200, 'Status should be 200');
    assertExists(response.data.service, 'Service name should exist');
    assertExists(response.data.version, 'Version should exist');
  });
  
  suite.test('GET /health should return health status', async () => {
    const response = await makeRequest(`${CONFIG.serviceUrl}/health`);
    
    assertEqual(response.status, 200, 'Status should be 200');
    assertEqual(response.data.status, 'healthy', 'Status should be healthy');
    assertExists(response.data.device, 'Device should exist');
    assertType(response.data.cuda_available, 'boolean', 'CUDA availability should be boolean');
    assertType(response.data.rocm_available, 'boolean', 'ROCm availability should be boolean');
  });
  
  suite.test('GET /devices should list available devices', async () => {
    const response = await makeRequest(`${CONFIG.serviceUrl}/devices`);
    
    assertEqual(response.status, 200, 'Status should be 200');
    assertExists(response.data.devices, 'Devices list should exist');
    assertExists(response.data.current, 'Current device should exist');
  });
  
  suite.test('GET /metrics should return Prometheus metrics', async () => {
    const response = await makeRequest(`${CONFIG.serviceUrl}/metrics`);
    
    assertEqual(response.status, 200, 'Status should be 200');
    assert(response.raw.includes('ai_service'), 'Metrics should contain service metrics');
  });
  
  await suite.run();
  return suite.results;
}

/**
 * Prediction Tests
 */
async function testPrediction() {
  const suite = new TestSuite('Prediction Endpoints');
  
  suite.test('POST /predict should classify image', async () => {
    if (!fs.existsSync(CONFIG.testImage)) {
      throw new Error(`Test image not found: ${CONFIG.testImage}`);
    }
    
    const boundary = generateBoundary();
    const formData = buildMultipartData(CONFIG.testImage, boundary);
    
    const response = await makeRequest(`${CONFIG.serviceUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length
      }
    }, formData);
    
    assertEqual(response.status, 200, 'Status should be 200');
    assertExists(response.data.predictions, 'Predictions should exist');
    assert(Array.isArray(response.data.predictions), 'Predictions should be an array');
    assert(response.data.predictions.length > 0, 'Should have at least one prediction');
    
    const firstPred = response.data.predictions[0];
    assertExists(firstPred.class_id, 'Prediction should have class_id');
    assertExists(firstPred.class_name, 'Prediction should have class_name');
    assertExists(firstPred.confidence, 'Prediction should have confidence');
    assertType(firstPred.confidence, 'number', 'Confidence should be a number');
    
    assertExists(response.data.device_used, 'Device used should exist');
    assertExists(response.data.inference_time_ms, 'Inference time should exist');
    assertType(response.data.inference_time_ms, 'number', 'Inference time should be a number');
  });
  
  suite.test('POST /predict should reject invalid file', async () => {
    const boundary = generateBoundary();
    const invalidData = Buffer.from('not an image');
    
    const parts = [];
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="invalid.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n`
    ));
    parts.push(invalidData);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    
    const formData = Buffer.concat(parts);
    
    const response = await makeRequest(`${CONFIG.serviceUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length
      }
    }, formData);
    
    assertEqual(response.status, 500, 'Status should be 500 for invalid file');
  });
  
  suite.test('POST /predict/batch should classify multiple images', async () => {
    if (!fs.existsSync(CONFIG.testImage)) {
      throw new Error(`Test image not found: ${CONFIG.testImage}`);
    }
    
    // Use same image multiple times for testing
    const imagePaths = [CONFIG.testImage, CONFIG.testImage];
    
    const boundary = generateBoundary();
    const formData = buildBatchMultipartData(imagePaths, boundary);
    
    const response = await makeRequest(`${CONFIG.serviceUrl}/predict/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length
      }
    }, formData);
    
    assertEqual(response.status, 200, 'Status should be 200');
    assertExists(response.data.results, 'Results should exist');
    assert(Array.isArray(response.data.results), 'Results should be an array');
    assertEqual(response.data.results.length, 2, 'Should have 2 results');
    assertEqual(response.data.total_images, 2, 'Total images should be 2');
  });
  
  await suite.run();
  return suite.results;
}

/**
 * Error Handling Tests
 */
async function testErrorHandling() {
  const suite = new TestSuite('Error Handling');
  
  suite.test('GET /nonexistent should return 404', async () => {
    const response = await makeRequest(`${CONFIG.serviceUrl}/nonexistent`);
    assertEqual(response.status, 404, 'Status should be 404');
  });
  
  suite.test('POST /predict without file should return error', async () => {
    const response = await makeRequest(`${CONFIG.serviceUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({}));
    
    assert(response.status >= 400, 'Status should be 4xx or 5xx');
  });
  
  await suite.run();
  return suite.results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log(colorize('╔════════════════════════════════════════════════════════════╗', 'bright'));
  console.log(colorize('║     b-nova-v3 AI Service - Integration Tests             ║', 'bright'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'bright'));
  
  const allResults = [];
  
  try {
    // Run all test suites
    allResults.push(...await testBasicEndpoints());
    allResults.push(...await testPrediction());
    allResults.push(...await testErrorHandling());
    
    // Summary
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;
    const total = allResults.length;
    
    console.log(colorize('╔════════════════════════════════════════════════════════════╗', 'cyan'));
    console.log(colorize('║                    TEST SUMMARY                           ║', 'cyan'));
    console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'cyan'));
    console.log('');
    console.log(`  Total Tests:    ${total}`);
    console.log(`  Passed:         ${colorize(passed, 'green')}`);
    console.log(`  Failed:         ${failed > 0 ? colorize(failed, 'red') : failed}`);
    console.log(`  Success Rate:   ${colorize(((passed / total) * 100).toFixed(2) + '%', passed === total ? 'green' : 'yellow')}`);
    console.log('');
    
    if (failed > 0) {
      console.log(colorize('Failed tests:', 'red'));
      allResults.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
      console.log('');
      process.exit(1);
    } else {
      console.log(colorize('✓ All tests passed!', 'green'));
      console.log('');
    }
    
  } catch (error) {
    console.log('');
    console.log(colorize(`❌ Fatal error: ${error.message}`, 'red'));
    console.error(error);
    process.exit(1);
  }
}

// Show usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('');
  console.log('Usage: node test-integration.js');
  console.log('');
  console.log('Environment Variables:');
  console.log('  AI_SERVICE_URL - Service URL (default: http://localhost:8000)');
  console.log('  TEST_IMAGE     - Test image path (default: ./test-image.jpg)');
  console.log('');
  process.exit(0);
}

main().catch(console.error);
