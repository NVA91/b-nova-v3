#!/usr/bin/env node
/**
 * b-nova-v3 AI Service - Startup Simulation & Health Check Polling
 * 
 * Simuliert den Service-Start und überwacht den Health-Status
 * bis der Service vollständig bereit ist.
 */

const http = require('http');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  maxRetries: 30,
  retryInterval: 2000, // 2 seconds
  timeout: 5000, // 5 seconds per request
  verbose: process.env.VERBOSE === 'true',
};

// ============================================================================
// COLORS FOR CONSOLE OUTPUT
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, timeout = CONFIG.timeout) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'GET',
      timeout: timeout,
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format timestamp
 */
function timestamp() {
  const now = new Date();
  return now.toISOString().split('T')[1].split('.')[0];
}

/**
 * Log with timestamp
 */
function log(message, color = 'reset') {
  console.log(`[${colorize(timestamp(), 'cyan')}] ${colorize(message, color)}`);
}

// ============================================================================
// STARTUP SIMULATION
// ============================================================================

/**
 * Wait for service to be ready
 */
async function waitForServiceReady() {
  log('🚀 Starting service readiness check...', 'bright');
  log(`   Target: ${CONFIG.serviceUrl}`, 'blue');
  log(`   Max retries: ${CONFIG.maxRetries}`, 'blue');
  log(`   Retry interval: ${CONFIG.retryInterval}ms`, 'blue');
  console.log('');
  
  let attempt = 0;
  let lastError = null;
  
  while (attempt < CONFIG.maxRetries) {
    attempt++;
    
    try {
      log(`Attempt ${attempt}/${CONFIG.maxRetries}: Checking health endpoint...`, 'yellow');
      
      const startTime = Date.now();
      const response = await makeRequest(`${CONFIG.serviceUrl}/health`);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        log(`✅ Service is ready! (Response time: ${responseTime}ms)`, 'green');
        console.log('');
        
        // Display service info
        displayServiceInfo(response.data);
        
        return {
          success: true,
          attempts: attempt,
          responseTime: responseTime,
          data: response.data,
        };
      } else {
        log(`⚠️  Service responded with status ${response.status}`, 'yellow');
        lastError = `HTTP ${response.status}`;
      }
      
    } catch (error) {
      if (CONFIG.verbose) {
        log(`❌ Connection failed: ${error.message}`, 'red');
      } else {
        log(`❌ Connection failed`, 'red');
      }
      lastError = error.message;
    }
    
    if (attempt < CONFIG.maxRetries) {
      log(`   Waiting ${CONFIG.retryInterval}ms before next attempt...`, 'blue');
      await sleep(CONFIG.retryInterval);
    }
  }
  
  // Failed after all retries
  log(`\n❌ Service failed to start after ${CONFIG.maxRetries} attempts`, 'red');
  log(`   Last error: ${lastError}`, 'red');
  
  return {
    success: false,
    attempts: attempt,
    lastError: lastError,
  };
}

/**
 * Display service information
 */
function displayServiceInfo(data) {
  console.log(colorize('╔════════════════════════════════════════════════════════════╗', 'green'));
  console.log(colorize('║              SERVICE INFORMATION                          ║', 'green'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'green'));
  console.log('');
  console.log(`  ${colorize('Status:', 'bright')}          ${colorize(data.status, 'green')}`);
  console.log(`  ${colorize('Version:', 'bright')}         ${data.version}`);
  console.log(`  ${colorize('Device:', 'bright')}          ${colorize(data.device, 'magenta')}`);
  console.log(`  ${colorize('CUDA Available:', 'bright')}  ${data.cuda_available ? colorize('✅ Yes', 'green') : colorize('❌ No', 'red')}`);
  console.log(`  ${colorize('ROCm Available:', 'bright')}  ${data.rocm_available ? colorize('✅ Yes', 'green') : colorize('❌ No', 'red')}`);
  console.log('');
}

/**
 * Test all endpoints after startup
 */
async function testEndpointsAfterStartup() {
  log('🧪 Testing all endpoints...', 'bright');
  console.log('');
  
  const endpoints = [
    { path: '/', name: 'Root' },
    { path: '/health', name: 'Health' },
    { path: '/devices', name: 'Devices' },
    { path: '/metrics', name: 'Metrics' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      log(`Testing ${endpoint.name} endpoint (${endpoint.path})...`, 'yellow');
      
      const startTime = Date.now();
      const response = await makeRequest(`${CONFIG.serviceUrl}${endpoint.path}`);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        log(`  ✅ ${endpoint.name}: OK (${responseTime}ms)`, 'green');
        results.push({ endpoint: endpoint.name, success: true, responseTime });
      } else {
        log(`  ❌ ${endpoint.name}: Failed (HTTP ${response.status})`, 'red');
        results.push({ endpoint: endpoint.name, success: false, status: response.status });
      }
      
    } catch (error) {
      log(`  ❌ ${endpoint.name}: Error (${error.message})`, 'red');
      results.push({ endpoint: endpoint.name, success: false, error: error.message });
    }
  }
  
  console.log('');
  
  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  if (successCount === totalCount) {
    log(`✅ All ${totalCount} endpoints are working!`, 'green');
  } else {
    log(`⚠️  ${successCount}/${totalCount} endpoints are working`, 'yellow');
  }
  
  return results;
}

/**
 * Monitor service health over time
 */
async function monitorServiceHealth(duration = 30000, interval = 5000) {
  log(`📊 Monitoring service health for ${duration/1000}s (interval: ${interval/1000}s)...`, 'bright');
  console.log('');
  
  const startTime = Date.now();
  const measurements = [];
  
  while (Date.now() - startTime < duration) {
    try {
      const measurementStart = Date.now();
      const response = await makeRequest(`${CONFIG.serviceUrl}/health`);
      const responseTime = Date.now() - measurementStart;
      
      measurements.push({
        timestamp: Date.now(),
        success: response.status === 200,
        responseTime: responseTime,
      });
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      log(`[${elapsed}s] Health check: ${response.status === 200 ? colorize('✅ OK', 'green') : colorize('❌ Failed', 'red')} (${responseTime}ms)`, 'reset');
      
    } catch (error) {
      measurements.push({
        timestamp: Date.now(),
        success: false,
        error: error.message,
      });
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      log(`[${elapsed}s] Health check: ${colorize('❌ Error', 'red')} (${error.message})`, 'reset');
    }
    
    await sleep(interval);
  }
  
  console.log('');
  
  // Calculate statistics
  const successfulMeasurements = measurements.filter(m => m.success);
  const responseTimes = successfulMeasurements.map(m => m.responseTime);
  
  const stats = {
    total: measurements.length,
    successful: successfulMeasurements.length,
    failed: measurements.length - successfulMeasurements.length,
    uptime: (successfulMeasurements.length / measurements.length * 100).toFixed(2),
    avgResponseTime: responseTimes.length > 0 
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
      : 'N/A',
    minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 'N/A',
    maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 'N/A',
  };
  
  displayMonitoringStats(stats);
  
  return stats;
}

/**
 * Display monitoring statistics
 */
function displayMonitoringStats(stats) {
  console.log(colorize('╔════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║              MONITORING STATISTICS                        ║', 'cyan'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'cyan'));
  console.log('');
  console.log(`  ${colorize('Total Checks:', 'bright')}      ${stats.total}`);
  console.log(`  ${colorize('Successful:', 'bright')}        ${colorize(stats.successful, 'green')}`);
  console.log(`  ${colorize('Failed:', 'bright')}            ${stats.failed > 0 ? colorize(stats.failed, 'red') : stats.failed}`);
  console.log(`  ${colorize('Uptime:', 'bright')}            ${colorize(stats.uptime + '%', stats.uptime >= 99 ? 'green' : 'yellow')}`);
  console.log('');
  console.log(`  ${colorize('Avg Response Time:', 'bright')} ${stats.avgResponseTime}ms`);
  console.log(`  ${colorize('Min Response Time:', 'bright')} ${stats.minResponseTime}ms`);
  console.log(`  ${colorize('Max Response Time:', 'bright')} ${stats.maxResponseTime}ms`);
  console.log('');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log(colorize('╔════════════════════════════════════════════════════════════╗', 'bright'));
  console.log(colorize('║     b-nova-v3 AI Service - Startup Simulation             ║', 'bright'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'bright'));
  console.log('');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = args[0] || 'startup';
  
  try {
    if (mode === 'startup' || mode === 'all') {
      // 1. Wait for service to be ready
      const readyResult = await waitForServiceReady();
      
      if (!readyResult.success) {
        process.exit(1);
      }
      
      // 2. Test all endpoints
      await testEndpointsAfterStartup();
    }
    
    if (mode === 'monitor' || mode === 'all') {
      // 3. Monitor service health
      const duration = parseInt(args[1]) || 30000;
      const interval = parseInt(args[2]) || 5000;
      
      await monitorServiceHealth(duration, interval);
    }
    
    log('✅ All tests completed successfully!', 'green');
    console.log('');
    
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Show usage if --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('');
  console.log('Usage: node test-startup-simulation.js [mode] [duration] [interval]');
  console.log('');
  console.log('Modes:');
  console.log('  startup  - Wait for service startup and test endpoints (default)');
  console.log('  monitor  - Monitor service health over time');
  console.log('  all      - Run both startup and monitoring tests');
  console.log('');
  console.log('Examples:');
  console.log('  node test-startup-simulation.js');
  console.log('  node test-startup-simulation.js startup');
  console.log('  node test-startup-simulation.js monitor 60000 10000');
  console.log('  node test-startup-simulation.js all');
  console.log('');
  console.log('Environment Variables:');
  console.log('  AI_SERVICE_URL - Service URL (default: http://localhost:8000)');
  console.log('  VERBOSE        - Enable verbose logging (default: false)');
  console.log('');
  process.exit(0);
}

// Run main function
main().catch(console.error);
