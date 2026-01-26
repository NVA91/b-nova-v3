#!/usr/bin/env node
/**
 * b-nova-v3 AI Service - Load Test & Performance Benchmark
 * 
 * Tests service performance under various load conditions
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  testImage: process.env.TEST_IMAGE || './test-image.jpg',
  concurrentRequests: parseInt(process.env.CONCURRENT_REQUESTS) || 10,
  totalRequests: parseInt(process.env.TOTAL_REQUESTS) || 100,
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

// ============================================================================
// HTTP HELPERS
// ============================================================================

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

async function makeRequest(url, options = {}, data = null) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), CONFIG.timeout);

  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = data || undefined;

  try {
    const res = await fetch(url, { method, headers, body, signal: controller.signal });
    clearTimeout(id);
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      return { status: res.status, data: parsed };
    } catch (e) {
      return { status: res.status, data: text };
    }
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ============================================================================
// BENCHMARK FUNCTIONS
// ============================================================================

/**
 * Single prediction benchmark
 */
async function benchmarkSinglePrediction() {
  log('\n📊 Benchmark: Single Prediction', 'bright');
  log('═'.repeat(60), 'cyan');
  
  if (!fs.existsSync(CONFIG.testImage)) {
    log(`❌ Test image not found: ${CONFIG.testImage}`, 'red');
    return null;
  }
  
  const boundary = generateBoundary();
  const formData = buildMultipartData(CONFIG.testImage, boundary);
  
  const times = [];
  const warmupRuns = 5;
  const benchmarkRuns = 50;
  
  log(`\n🔥 Warming up (${warmupRuns} runs)...`, 'yellow');
  
  // Warmup
  for (let i = 0; i < warmupRuns; i++) {
    try {
      await makeRequest(`${CONFIG.serviceUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': formData.length
        }
      }, formData);
      process.stdout.write('.');
    } catch (error) {
      process.stdout.write('x');
    }
  }
  
  console.log('');
  log(`\n⏱️  Running benchmark (${benchmarkRuns} runs)...`, 'yellow');
  
  // Benchmark
  for (let i = 0; i < benchmarkRuns; i++) {
    try {
      const start = Date.now();
      const response = await makeRequest(`${CONFIG.serviceUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': formData.length
        }
      }, formData);
      const duration = Date.now() - start;
      
      if (response.status === 200) {
        times.push(duration);
        process.stdout.write('.');
      } else {
        process.stdout.write('x');
      }
    } catch (error) {
      process.stdout.write('x');
    }
  }
  
  console.log('');
  
  if (times.length === 0) {
    log('\n❌ All requests failed', 'red');
    return null;
  }
  
  // Calculate statistics
  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  
  const stats = {
    runs: times.length,
    avg: avg.toFixed(2),
    min: min,
    max: max,
    median: median,
    p95: p95,
    p99: p99,
    throughput: (1000 / avg).toFixed(2),
  };
  
  displayBenchmarkResults(stats);
  
  return stats;
}

/**
 * Concurrent requests benchmark
 */
async function benchmarkConcurrentRequests(concurrency = 10, total = 100) {
  log(`\n📊 Benchmark: Concurrent Requests (${concurrency} concurrent, ${total} total)`, 'bright');
  log('═'.repeat(60), 'cyan');
  
  if (!fs.existsSync(CONFIG.testImage)) {
    log(`❌ Test image not found: ${CONFIG.testImage}`, 'red');
    return null;
  }
  
  const boundary = generateBoundary();
  const formData = buildMultipartData(CONFIG.testImage, boundary);
  
  const results = [];
  let completed = 0;
  let failed = 0;
  
  const startTime = Date.now();
  
  log(`\n🚀 Starting load test...`, 'yellow');
  
  // Create batches
  const batches = Math.ceil(total / concurrency);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, total - batch * concurrency);
    const promises = [];
    
    for (let i = 0; i < batchSize; i++) {
      const promise = (async () => {
        try {
          const reqStart = Date.now();
          const response = await makeRequest(`${CONFIG.serviceUrl}/predict`, {
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': formData.length
            }
          }, formData);
          const duration = Date.now() - reqStart;
          
          if (response.status === 200) {
            results.push({
              success: true,
              duration: duration,
              inferenceTime: response.data.inference_time_ms,
            });
            completed++;
            process.stdout.write(colorize('.', 'green'));
          } else {
            failed++;
            process.stdout.write(colorize('x', 'red'));
          }
        } catch (error) {
          failed++;
          process.stdout.write(colorize('x', 'red'));
        }
      })();
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('');
  
  if (results.length === 0) {
    log('\n❌ All requests failed', 'red');
    return null;
  }
  
  // Calculate statistics
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const inferenceTimes = results.map(r => r.inferenceTime).sort((a, b) => a - b);
  
  const stats = {
    total: total,
    successful: completed,
    failed: failed,
    successRate: ((completed / total) * 100).toFixed(2),
    totalTime: (totalTime / 1000).toFixed(2),
    avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    p95Duration: durations[Math.floor(durations.length * 0.95)],
    avgInferenceTime: (inferenceTimes.reduce((a, b) => a + b, 0) / inferenceTimes.length).toFixed(2),
    throughput: (completed / (totalTime / 1000)).toFixed(2),
  };
  
  displayLoadTestResults(stats);
  
  return stats;
}

/**
 * Stress test - gradually increase load
 */
async function stressTest() {
  log('\n📊 Stress Test: Gradually Increasing Load', 'bright');
  log('═'.repeat(60), 'cyan');
  
  const stages = [
    { concurrency: 1, requests: 10, name: 'Baseline' },
    { concurrency: 5, requests: 25, name: 'Light Load' },
    { concurrency: 10, requests: 50, name: 'Medium Load' },
    { concurrency: 20, requests: 100, name: 'Heavy Load' },
    { concurrency: 50, requests: 200, name: 'Stress Load' },
  ];
  
  const stageResults = [];
  
  for (const stage of stages) {
    log(`\n🔥 Stage: ${stage.name} (${stage.concurrency} concurrent, ${stage.requests} requests)`, 'yellow');
    
    const result = await benchmarkConcurrentRequests(stage.concurrency, stage.requests);
    
    if (result) {
      stageResults.push({
        stage: stage.name,
        concurrency: stage.concurrency,
        ...result,
      });
    } else {
      log(`❌ Stage failed: ${stage.name}`, 'red');
      break;
    }
    
    // Cool down between stages
    log('\n💤 Cooling down for 5 seconds...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  displayStressTestSummary(stageResults);
  
  return stageResults;
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

function displayBenchmarkResults(stats) {
  console.log('');
  log('╔════════════════════════════════════════════════════════════╗', 'green');
  log('║              BENCHMARK RESULTS                            ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝', 'green');
  console.log('');
  console.log(`  ${colorize('Runs:', 'bright')}              ${stats.runs}`);
  console.log(`  ${colorize('Average:', 'bright')}           ${stats.avg}ms`);
  console.log(`  ${colorize('Median:', 'bright')}            ${stats.median}ms`);
  console.log(`  ${colorize('Min:', 'bright')}               ${stats.min}ms`);
  console.log(`  ${colorize('Max:', 'bright')}               ${stats.max}ms`);
  console.log(`  ${colorize('95th Percentile:', 'bright')}  ${stats.p95}ms`);
  console.log(`  ${colorize('99th Percentile:', 'bright')}  ${stats.p99}ms`);
  console.log(`  ${colorize('Throughput:', 'bright')}       ${colorize(stats.throughput + ' req/s', 'magenta')}`);
  console.log('');
}

function displayLoadTestResults(stats) {
  console.log('');
  log('╔════════════════════════════════════════════════════════════╗', 'green');
  log('║              LOAD TEST RESULTS                            ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝', 'green');
  console.log('');
  console.log(`  ${colorize('Total Requests:', 'bright')}       ${stats.total}`);
  console.log(`  ${colorize('Successful:', 'bright')}            ${colorize(stats.successful, 'green')}`);
  console.log(`  ${colorize('Failed:', 'bright')}                ${stats.failed > 0 ? colorize(stats.failed, 'red') : stats.failed}`);
  console.log(`  ${colorize('Success Rate:', 'bright')}          ${colorize(stats.successRate + '%', stats.successRate >= 99 ? 'green' : 'yellow')}`);
  console.log(`  ${colorize('Total Time:', 'bright')}            ${stats.totalTime}s`);
  console.log('');
  console.log(`  ${colorize('Avg Duration:', 'bright')}          ${stats.avgDuration}ms`);
  console.log(`  ${colorize('Min Duration:', 'bright')}          ${stats.minDuration}ms`);
  console.log(`  ${colorize('Max Duration:', 'bright')}          ${stats.maxDuration}ms`);
  console.log(`  ${colorize('95th Percentile:', 'bright')}       ${stats.p95Duration}ms`);
  console.log('');
  console.log(`  ${colorize('Avg Inference Time:', 'bright')}    ${stats.avgInferenceTime}ms`);
  console.log(`  ${colorize('Throughput:', 'bright')}            ${colorize(stats.throughput + ' req/s', 'magenta')}`);
  console.log('');
}

function displayStressTestSummary(results) {
  console.log('');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              STRESS TEST SUMMARY                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
  
  console.log('  Stage              | Concurrency | Success Rate | Avg Duration | Throughput');
  console.log('  ' + '─'.repeat(75));
  
  results.forEach(result => {
    const stage = result.stage.padEnd(18);
    const concurrency = String(result.concurrency).padEnd(11);
    const successRate = (result.successRate + '%').padEnd(12);
    const avgDuration = (result.avgDuration + 'ms').padEnd(12);
    const throughput = (result.throughput + ' req/s').padEnd(10);
    
    console.log(`  ${stage} | ${concurrency} | ${successRate} | ${avgDuration} | ${throughput}`);
  });
  
  console.log('');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  log('╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║     b-nova-v3 AI Service - Load & Performance Tests       ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');
  
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';
  
  try {
    if (mode === 'single' || mode === 'all') {
      await benchmarkSinglePrediction();
    }
    
    if (mode === 'load' || mode === 'all') {
      const concurrency = parseInt(args[1]) || CONFIG.concurrentRequests;
      const total = parseInt(args[2]) || CONFIG.totalRequests;
      await benchmarkConcurrentRequests(concurrency, total);
    }
    
    if (mode === 'stress') {
      await stressTest();
    }
    
    log('\n✅ All tests completed!', 'green');
    console.log('');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Show usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('');
  console.log('Usage: node test-load-performance.js [mode] [concurrency] [total]');
  console.log('');
  console.log('Modes:');
  console.log('  single  - Single prediction benchmark');
  console.log('  load    - Concurrent requests load test');
  console.log('  stress  - Gradually increasing stress test');
  console.log('  all     - Run single and load tests (default)');
  console.log('');
  console.log('Examples:');
  console.log('  node test-load-performance.js');
  console.log('  node test-load-performance.js single');
  console.log('  node test-load-performance.js load 20 200');
  console.log('  node test-load-performance.js stress');
  console.log('');
  console.log('Environment Variables:');
  console.log('  AI_SERVICE_URL        - Service URL (default: http://localhost:8000)');
  console.log('  TEST_IMAGE            - Test image path (default: ./test-image.jpg)');
  console.log('  CONCURRENT_REQUESTS   - Concurrent requests (default: 10)');
  console.log('  TOTAL_REQUESTS        - Total requests (default: 100)');
  console.log('');
  process.exit(0);
}

main().catch(console.error);
