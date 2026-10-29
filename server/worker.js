import http from 'node:http';
import os from 'node:os';

const port = Number(process.env.PORT) || 4001;
const instanceId = process.env.INSTANCE_ID || `i-${Math.random().toString(16).substring(2, 10)}`;
const name = process.env.INSTANCE_NAME || `web-prod-app-${port - 4000}`;
const az = process.env.AZ || 'ap-south-1a';
const privateIp = process.env.PRIVATE_IP || `10.0.1.${port - 3950}`;

let totalRequests = 0;
let healthy = true;
let stressActive = false;
let stressTimer = null;

// Real CPU stress loop for testing auto-scaling thresholds
function runStress(durationMs = 15000) {
  stressActive = true;
  console.log(`[STRESS] Initiated CPU stress benchmark on ${instanceId} for ${durationMs}ms`);
  
  const startTime = Date.now();
  if (stressTimer) clearInterval(stressTimer);

  stressTimer = setInterval(() => {
    if (Date.now() - startTime > durationMs) {
      clearInterval(stressTimer);
      stressActive = false;
      console.log(`[STRESS] CPU stress benchmark completed on ${instanceId}`);
      return;
    }
    // Perform intensive calculations for 100ms
    const blockUntil = Date.now() + 85;
    while (Date.now() < blockUntil) {
      Math.sqrt(Math.random() * 1000000);
    }
  }, 100);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  totalRequests++;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (url.pathname === '/health') {
    if (!healthy) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'unhealthy',
        instanceId,
        uptime: process.uptime(),
        error: 'Node marked unhealthy via fault injection probe'
      }));
      return;
    }

    const mem = process.memoryUsage();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      instanceId,
      name,
      az,
      privateIp,
      port,
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      totalRequests,
      memory: {
        rssMb: +(mem.rss / 1024 / 1024).toFixed(1),
        heapUsedMb: +(mem.heapUsed / 1024 / 1024).toFixed(1),
        heapTotalMb: +(mem.heapTotal / 1024 / 1024).toFixed(1)
      },
      systemLoad: os.loadavg ? os.loadavg()[0] : 0,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Work endpoint (handles traffic from ALB or load generator)
  if (url.pathname === '/api/work' || url.pathname === '/work' || url.pathname === '/') {
    const start = Date.now();
    // Simulate slight application processing work (1-5ms)
    let hash = 0;
    for (let i = 0; i < 50000; i++) {
      hash += (i * 31) % 9973;
    }

    const latency = Date.now() - start;
    console.log(`[HTTP] GET ${url.pathname} from ${req.socket.remoteAddress || 'ALB'} - 200 OK (${latency}ms) [Req #${totalRequests}]`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Processed successfully by worker node',
      instanceId,
      name,
      az,
      port,
      pid: process.pid,
      processingTimeMs: latency,
      requestIndex: totalRequests,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Fault injection: trigger CPU stress
  if (url.pathname === '/api/stress' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let durationMs = 20000;
      try {
        const parsed = JSON.parse(body || '{}');
        if (parsed.durationMs) durationMs = parsed.durationMs;
      } catch (e) {}

      runStress(durationMs);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `CPU stress started for ${durationMs}ms`, instanceId }));
    });
    return;
  }

  // Fault injection: toggle health failure
  if (url.pathname === '/api/fail' && req.method === 'POST') {
    healthy = false;
    console.log(`[FAULT] Node ${instanceId} marked as FAILING health checks.`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, status: 'unhealthy', instanceId }));
    return;
  }

  // Graceful shutdown
  if (url.pathname === '/api/shutdown' && req.method === 'POST') {
    console.log(`[DRAIN] Connection draining started on ${instanceId}. Closing server...`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Draining initiated', instanceId }));
    setTimeout(() => {
      server.close(() => {
        console.log(`[TERMINATED] Worker process ${instanceId} exited gracefully.`);
        process.exit(0);
      });
    }, 1000);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found', path: url.pathname }));
});

server.on('error', (err) => {
  console.error(`[WORKER-ERROR] Node ${name} (${instanceId}) server error:`, err.message);
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[BOOT] EC2 Worker Node ${name} (${instanceId}) listening on port ${port} [PID: ${process.pid}, AZ: ${az}, IP: ${privateIp}]`);
});

process.on('SIGTERM', () => {
  console.log(`[SIGTERM] Graceful termination signal received for ${instanceId}`);
  server.close(() => process.exit(0));
});
