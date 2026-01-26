const http = require('http');

const PORT = process.env.MOCK_AI_PORT || 8000;

function json(res, obj, code = 200) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = req.url;
  if (req.method === 'GET' && url === '/') {
    return json(res, { service: 'mock-ai-service', version: '0.0.1', status: 'running' });
  }

  if (req.method === 'GET' && url === '/health') {
    return json(res, { status: 'healthy', version: '0.0.1', device: 'cpu', cuda_available: false, rocm_available: false });
  }

  if (req.method === 'GET' && url === '/devices') {
    return json(res, { devices: ['cpu'], current: 'cpu' });
  }

  // Expose a minimal /metrics endpoint for tests that expect Prometheus metrics
  if (req.method === 'GET' && url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ai_service_up 1\n');
    return;
  }

  if (req.method === 'POST' && url === '/predict') {
    // Simple parser: consume body (multipart or raw) and return a mock prediction
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();

      // If this looks like an invalid file upload (test uses 'not an image'), return 500
      if (body.includes('not an image')) {
        return res.writeHead(500, { 'Content-Type': 'application/json' }) || res.end(JSON.stringify({ error: 'invalid file' }));
      }

      // If content-type is JSON or no file content present, return 400
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data') && body.trim().length === 0) {
        return res.writeHead(400, { 'Content-Type': 'application/json' }) || res.end(JSON.stringify({ error: 'no file provided' }));
      }

      const response = {
        predictions: [{ class_id: 0, class_name: 'mock-label', confidence: 0.99 }],
        device_used: 'cpu',
        inference_time_ms: 1.2
      };
      json(res, response);
    });
    req.on('error', () => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'parse error' }));
    });
    return;
  }

  if (req.method === 'POST' && url === '/predict/batch') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      // Count occurrences of filename= to determine number of images
      const matches = (body.match(/filename="/g) || []).length || (body.match(/content-disposition: form-data; name="files"/g) || []).length;
      const total = matches > 0 ? matches : 1;
      const results = [];
      for (let i = 0; i < total; i++) {
        results.push({ filename: `test-${i}.jpg`, predictions: [{class_id:0,class_name:'mock',confidence:0.9}], inference_time_ms:1.2 });
      }
      const response = { results, device_used: 'cpu', total_images: total };
      json(res, response);
    });
    req.on('error', () => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'parse error' }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`Mock AI Service listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => process.exit());
