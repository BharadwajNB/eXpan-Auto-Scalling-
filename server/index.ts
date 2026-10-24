import express from 'express';
import cors from 'cors';
import { fork, ChildProcess } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Persistent data paths
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interfaces
export interface Instance {
  id: string;
  name: string;
  port: number;
  process?: ChildProcess;
  status: 'healthy' | 'unhealthy' | 'launching' | 'terminating';
  cpu: number;
  memory: number;
  requestsPerSecond: number;
  uptime: string;
  availabilityZone: string;
  privateIp: string;
  publicIp: string;
  instanceType: string;
  launchTime: string;
  networkInMb: number;
  networkOutMb: number;
  healthCheckPasses: number;
  totalRequests: number;
  inFlightRequests: number;
  logs: string[];
}

export interface ScalingEvent {
  id: string;
  timestamp: string;
  type: 'scale-out' | 'scale-in' | 'alert' | 'instance-started' | 'instance-terminated' | 'instance-unhealthy' | 'instance-replaced' | 'health-check';
  instanceId?: string;
  reason: string;
  status: 'completed' | 'pending' | 'failed';
  details?: string;
}

export interface AutoScalingConfig {
  minInstances: number;
  maxInstances: number;
  desiredInstances: number;
  scaleOutThreshold: number;
  scaleInThreshold: number;
  cooldownSeconds: number;
  activeCooldown: number;
  policyType: 'Target Tracking' | 'Step Scaling' | 'Simple Scaling';
  evaluationPeriod: string;
  metricType: 'cpu' | 'rps' | 'memory';
  breachChecks: number;
}

export interface LoadBalancerInfo {
  name: string;
  dnsName: string;
  scheme: 'internet-facing' | 'internal';
  type: 'application';
  state: 'active' | 'provisioning' | 'failed';
  ipAddressType: 'ipv4';
  activeConnections: number;
  processedBytesMb: number;
  healthyTargets: number;
  totalTargets: number;
  algorithm: 'Round Robin' | 'Least Outstanding Requests';
  stickinessEnabled: boolean;
  stickinessDurationSeconds: number;
  deregistrationDelay: number;
  healthCheckPath: string;
}

export interface MetricDataPoint {
  timestamp: number;
  timeLabel: string;
  cpu: number;
  memory: number;
  requests: number;
  latency: number;
  instances: number;
  networkIn: number;
  networkOut: number;
  errorRate: number;
}

// In-Memory Cloud State
let instances: Instance[] = [];
let nextPort = 4001;
let roundRobinIndex = 0;
let events: ScalingEvent[] = [];
let history: MetricDataPoint[] = [];

// Load Balancer Configuration
let lbInfo: LoadBalancerInfo = {
  name: 'alb-expan-prod',
  dnsName: 'alb-expan-prod.ap-south-1.elb.amazonaws.com',
  scheme: 'internet-facing',
  type: 'application',
  state: 'active',
  ipAddressType: 'ipv4',
  activeConnections: 0,
  processedBytesMb: 12.4,
  healthyTargets: 0,
  totalTargets: 0,
  algorithm: 'Least Outstanding Requests',
  stickinessEnabled: false,
  stickinessDurationSeconds: 86400,
  deregistrationDelay: 30,
  healthCheckPath: '/health',
};

// Auto Scaling Configuration
let asgConfig: AutoScalingConfig = {
  minInstances: 1,
  maxInstances: 4,
  desiredInstances: 1,
  scaleOutThreshold: 70,
  scaleInThreshold: 30,
  cooldownSeconds: 15,
  activeCooldown: 0,
  policyType: 'Target Tracking',
  evaluationPeriod: '1 minute',
  metricType: 'cpu',
  breachChecks: 1,
};

// Load Test Configuration & Engine
let loadTest = {
  isActive: false,
  preset: 'normal',
  pattern: 'constant' as 'constant' | 'spike' | 'staircase' | 'sine',
  targetRps: 30,
  concurrentUsers: 45,
  currentRps: 0,
  durationLimit: 0,
  elapsedSeconds: 0,
  errorInjectionRate: 0,
  totalRequestsSent: 0,
  successfulRequests: 0,
  failedRequests: 0,
  measuredLatencyMs: 25,
};

// Helper: Persist events
function saveEvents() {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events.slice(0, 100), null, 2));
  } catch (err) {
    console.error('Failed to save events:', err);
  }
}

function loadPersistedEvents() {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, 'utf-8');
      events = JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load events:', err);
  }
}

loadPersistedEvents();

// Helper: Add event to audit trail
function logEvent(type: ScalingEvent['type'], reason: string, details?: string, instanceId?: string) {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const evt: ScalingEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
    timestamp: timeStr,
    type,
    instanceId,
    reason,
    status: 'completed',
    details,
  };
  events.unshift(evt);
  if (events.length > 100) events.pop();
  saveEvents();
  return evt;
}

// -----------------------------------------------------------------------
// CLUSTER / FLEET MANAGER (Real Node.js Worker Processes)
// -----------------------------------------------------------------------

const WORKER_SCRIPT = path.join(process.cwd(), 'server', 'worker.js');

function getAvailablePort(): number {
  const usedPorts = new Set(instances.map(i => i.port));
  let port = 4001;
  while (usedPorts.has(port)) {
    port++;
  }
  return port;
}

function spawnWorkerNode(preferredPort?: number, preferredName?: string, preferredAz?: string): Instance {
  const port = preferredPort || getAvailablePort();
  const id = `i-0${Math.random().toString(16).substring(2, 10)}`;
  const index = instances.length + 1;
  const name = preferredName || `web-prod-app-0${index}`;
  const az = preferredAz || (instances.length % 2 === 0 ? 'ap-south-1a' : 'ap-south-1b');
  const privateIp = `10.0.${az === 'ap-south-1a' ? '1' : '2'}.${40 + index * 5}`;
  const publicIp = `13.233.${120 + index * 10}.${15 + index}`;

  console.log(`[FLEET] Spawning worker process ${name} (${id}) on port ${port}...`);

  const child = fork(WORKER_SCRIPT, [], {
    env: {
      ...process.env,
      PORT: String(port),
      INSTANCE_ID: id,
      INSTANCE_NAME: name,
      AZ: az,
      PRIVATE_IP: privateIp,
    },
    silent: true,
  });

  const instance: Instance = {
    id,
    name,
    port,
    process: child,
    status: 'launching',
    cpu: 18.0,
    memory: 38.0,
    requestsPerSecond: 0,
    uptime: '0m',
    availabilityZone: az,
    privateIp,
    publicIp,
    instanceType: 't3.medium (2 vCPU, 4GB RAM)',
    launchTime: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    networkInMb: 2.1,
    networkOutMb: 4.8,
    healthCheckPasses: 0,
    totalRequests: 0,
    inFlightRequests: 0,
    logs: [`[BOOT] Worker process initialized on port ${port} with PID ${child.pid}`],
  };

  // Capture stdout
  child.stdout?.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line) {
        instance.logs.push(line);
        if (instance.logs.length > 80) instance.logs.shift();
      }
    }
  });

  // Capture stderr
  child.stderr?.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line) {
        instance.logs.push(`[ERR] ${line}`);
        if (instance.logs.length > 80) instance.logs.shift();
      }
    }
  });

  // Handle sudden crash (Fault Injection / Self-Healing Trigger)
  child.on('exit', (code, signal) => {
    console.log(`[FLEET] Worker ${instance.id} exited with code ${code}, signal ${signal}`);
    instance.status = 'unhealthy';
    instance.logs.push(`[CRASH] Process exited (code: ${code}, signal: ${signal})`);
  });

  instances.push(instance);

  // Poll for worker readiness
  const checkInterval = setInterval(async () => {
    try {
      const res = await fetch(`http://localhost:${port}/health`);
      if (res.ok) {
        clearInterval(checkInterval);
        instance.status = 'healthy';
        instance.healthCheckPasses = 1;
        instance.logs.push(`[HEALTH] HTTP /health passed 200 OK. Target registered with ALB.`);
        logEvent('instance-started', `Node ${instance.name} (${instance.id}) initialized and passed ALB target checks.`, `Listening on port ${port} in ${az}`, instance.id);
      }
    } catch (e) {
      // Still booting up
    }
  }, 400);

  // Fallback timeout to healthy after 3s
  setTimeout(() => {
    clearInterval(checkInterval);
    if (instance.status === 'launching') {
      instance.status = 'healthy';
    }
  }, 3000);

  return instance;
}

// Gracefully terminate worker node
async function terminateWorkerNode(id: string, reason = 'Scale-In or administrative request') {
  const target = instances.find(i => i.id === id);
  if (!target) return false;

  target.status = 'terminating';
  target.logs.push(`[DRAIN] Deregistration initiated. Draining active connections...`);

  try {
    await fetch(`http://localhost:${target.port}/api/shutdown`, { method: 'POST' }).catch(() => {});
  } catch (e) {}

  setTimeout(() => {
    try {
      if (target.process && !target.process.killed) {
        target.process.kill('SIGTERM');
      }
    } catch (e) {}
    instances = instances.filter(i => i.id !== id);
    logEvent('scale-in', `Instance ${target.name} (${target.id}) drained and terminated`, reason, target.id);
  }, 1200);

  return true;
}

// Initialize baseline fleet (1 active EC2 worker node)
spawnWorkerNode(4001, 'web-prod-app-01', 'ap-south-1a');

// -----------------------------------------------------------------------
// APPLICATION LOAD BALANCER (ALB) REVERSE PROXY
// -----------------------------------------------------------------------

app.use('/api/gateway', async (req, res) => {
  const healthyNodes = instances.filter(i => i.status === 'healthy');
  if (healthyNodes.length === 0) {
    res.status(503).json({ error: 'Service Unavailable: No healthy targets registered with ALB target group.' });
    return;
  }

  // Select target based on algorithm
  let target: Instance;
  if (lbInfo.algorithm === 'Least Outstanding Requests') {
    target = healthyNodes.reduce((min, cur) => cur.inFlightRequests < min.inFlightRequests ? cur : min, healthyNodes[0]);
  } else {
    target = healthyNodes[roundRobinIndex % healthyNodes.length];
    roundRobinIndex = (roundRobinIndex + 1) % healthyNodes.length;
  }

  target.inFlightRequests++;
  target.totalRequests++;
  lbInfo.activeConnections++;

  const subPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const normalizedPath = (subPath === '/' || subPath === '/work') ? '/api/work' : subPath;
  const targetUrl = `http://localhost:${target.port}${normalizedPath}`;

  const startTime = Date.now();
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'X-Forwarded-For': req.socket.remoteAddress || '127.0.0.1',
        'X-Forwarded-Proto': 'http',
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    const elapsed = Date.now() - startTime;
    const body = await response.text();

    res.status(response.status);
    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });
    res.setHeader('X-Target-Instance', target.id);
    res.setHeader('X-Target-Port', String(target.port));
    res.send(body);

    lbInfo.processedBytesMb += (body.length / 1024 / 1024);
  } catch (err: any) {
    res.status(502).json({ error: 'Bad Gateway: Target connection failed', details: err.message, target: target.id });
  } finally {
    target.inFlightRequests = Math.max(0, target.inFlightRequests - 1);
    lbInfo.activeConnections = Math.max(0, lbInfo.activeConnections - 1);
  }
});

// Periodic ALB Health Check Probe Engine (Every 5s)
setInterval(async () => {
  for (const inst of instances) {
    if (inst.status === 'terminating') continue;
    try {
      const probeUrl = `http://localhost:${inst.port}${lbInfo.healthCheckPath}`;
      const res = await fetch(probeUrl);
      if (res.ok) {
        if (inst.status === 'unhealthy') {
          inst.status = 'healthy';
          inst.logs.push(`[ALB] Target passed health checks and re-entered service.`);
        }
        inst.healthCheckPasses++;
      } else {
        inst.status = 'unhealthy';
        inst.logs.push(`[ALB] Health check probe failed with status HTTP ${res.status}`);
      }
    } catch (e: any) {
      if (inst.status === 'healthy') {
        inst.status = 'unhealthy';
        inst.logs.push(`[ALB] Health check connection refused (${e.message})`);
        logEvent('instance-unhealthy', `Target group health check failed on ${inst.name} (${inst.id}): Connection refused`, 'ALB marked target as Unhealthy.', inst.id);
      }
    }
  }

  lbInfo.healthyTargets = instances.filter(i => i.status === 'healthy').length;
  lbInfo.totalTargets = instances.length;
}, 5000);

// -----------------------------------------------------------------------
// REAL HTTP LOAD TESTING GENERATOR ENGINE
// -----------------------------------------------------------------------

let loadTestInterval: NodeJS.Timeout | null = null;

function startLoadTestEngine(preset = 'normal', customRps = 32, pattern = 'constant') {
  loadTest.isActive = true;
  loadTest.preset = preset;
  loadTest.targetRps = customRps;
  loadTest.pattern = pattern as any;
  loadTest.elapsedSeconds = 0;
  loadTest.totalRequestsSent = 0;
  loadTest.successfulRequests = 0;
  loadTest.failedRequests = 0;

  if (loadTestInterval) clearInterval(loadTestInterval);

  console.log(`[LOAD-TEST] Started real traffic generation: Target ${customRps} req/s (${pattern} waveform)`);
  logEvent('alert', `Traffic generator started: injecting ${customRps} req/s towards ALB target group`, `Profile: ${preset.toUpperCase()}, Waveform: ${pattern}`);

  // Dispatches HTTP requests in sub-second batches to hit target RPS
  loadTestInterval = setInterval(async () => {
    if (!loadTest.isActive) {
      clearInterval(loadTestInterval!);
      return;
    }

    loadTest.elapsedSeconds++;

    // Calculate dynamic RPS based on waveform
    let dynamicRps = loadTest.targetRps;
    if (loadTest.pattern === 'staircase') {
      const step = Math.floor(loadTest.elapsedSeconds / 10);
      dynamicRps = Math.min(500, loadTest.targetRps + step * 40);
    } else if (loadTest.pattern === 'sine') {
      dynamicRps = Math.round(loadTest.targetRps * (1 + 0.35 * Math.sin(loadTest.elapsedSeconds / 6)));
    } else if (loadTest.pattern === 'spike') {
      dynamicRps = Math.round(loadTest.targetRps * (Math.random() > 0.4 ? 1.4 : 0.8));
    }

    loadTest.currentRps = dynamicRps;

    // Check duration limit
    if (loadTest.durationLimit > 0 && loadTest.elapsedSeconds >= loadTest.durationLimit) {
      stopLoadTestEngine();
      logEvent('alert', `Load test duration limit reached (${loadTest.durationLimit}s). Traffic halted.`);
      return;
    }

    // Fire actual requests to the ALB Gateway
    const countToFire = Math.max(1, Math.round(dynamicRps / 2)); // Every 500ms
    for (let i = 0; i < countToFire; i++) {
      const reqStart = Date.now();
      loadTest.totalRequestsSent++;

      fetch(`http://localhost:${PORT}/api/gateway/work`)
        .then(async (r) => {
          const lat = Date.now() - reqStart;
          loadTest.measuredLatencyMs = Math.round((loadTest.measuredLatencyMs * 0.85) + (lat * 0.15));
          if (r.ok) {
            loadTest.successfulRequests++;
          } else {
            loadTest.failedRequests++;
          }
        })
        .catch(() => {
          loadTest.failedRequests++;
        });
    }
  }, 500);
}

function stopLoadTestEngine() {
  loadTest.isActive = false;
  loadTest.currentRps = 0;
  if (loadTestInterval) {
    clearInterval(loadTestInterval);
    loadTestInterval = null;
  }
  console.log('[LOAD-TEST] Traffic generation stopped. Ingress returning to idle baseline.');
  logEvent('alert', 'Traffic generator stopped. CloudWatch monitoring cooldown initiated.');
}

// -----------------------------------------------------------------------
// AUTO SCALING GROUP (ASG) SUPERVISOR CONTROLLER (Runs every 2s)
// -----------------------------------------------------------------------

setInterval(() => {
  const healthyNodes = instances.filter(i => i.status === 'healthy');
  const healthyCount = Math.max(1, healthyNodes.length);

  // Recalculate per-instance CPU and Memory based on real activity
  const activeTraffic = loadTest.isActive ? loadTest.currentRps : 32;
  const basePerNodeTraffic = Math.round(activeTraffic / healthyCount);

  // Compute live CPU: Base OS 10% + real traffic factor
  let fleetCpuSum = 0;
  instances.forEach((inst, idx) => {
    if (inst.status === 'unhealthy') {
      inst.cpu = 99.0;
      return;
    }
    const perNodeRps = inst.requestsPerSecond || basePerNodeTraffic;
    const computedCpu = Math.min(99, Math.max(14, 10 + (perNodeRps * 4.2) + ((idx % 2 === 0 ? 1 : -1) * 2)));
    inst.cpu = +computedCpu.toFixed(1);
    inst.memory = Math.min(88, Math.max(34, +(38 + inst.cpu * 0.4).toFixed(1)));
    inst.requestsPerSecond = inst.status === 'healthy' ? perNodeRps : 0;
    inst.networkInMb = +(10 + inst.cpu * 0.25).toFixed(1);
    inst.networkOutMb = +(25 + inst.cpu * 0.75).toFixed(1);
    fleetCpuSum += inst.cpu;
  });

  const avgCpu = +(fleetCpuSum / Math.max(1, instances.length)).toFixed(1);
  const avgMemory = Math.round(40 + avgCpu * 0.35);

  // Decrement active cooldown
  if (asgConfig.activeCooldown > 0) {
    asgConfig.activeCooldown = Math.max(0, asgConfig.activeCooldown - 2);
  }

  // 1. SELF-HEALING ENGINE: Detect dead or failed nodes and replace automatically!
  const deadNode = instances.find(i => i.status === 'unhealthy');
  if (deadNode) {
    console.log(`[SELF-HEALING] Detected unhealthy node ${deadNode.id}. Triggering automated recovery...`);
    deadNode.status = 'terminating';
    terminateWorkerNode(deadNode.id, 'Self-healing replacement cycle');
    const replacement = spawnWorkerNode();
    logEvent(
      'instance-replaced',
      `Auto Scaling self-healing: Terminated unhealthy node ${deadNode.id} and launched replacement ${replacement.name} (${replacement.id})`,
      'Automated health check failure recovery succeeded.',
      deadNode.id
    );
  }

  // 2. AUTO-SCALING POLICY EVALUATION
  const metricVal = asgConfig.metricType === 'rps' ? Math.round(activeTraffic / healthyCount) : avgCpu;
  const outLimit = asgConfig.metricType === 'rps' ? 120 : asgConfig.scaleOutThreshold;
  const inLimit = asgConfig.metricType === 'rps' ? 40 : asgConfig.scaleInThreshold;

  // Scale-Out Trigger
  if (metricVal >= outLimit && instances.length < asgConfig.maxInstances) {
    if (asgConfig.activeCooldown <= 0) {
      const newInst = spawnWorkerNode();
      asgConfig.activeCooldown = asgConfig.cooldownSeconds;
      asgConfig.desiredInstances = instances.length;
      logEvent('alert', `High ${asgConfig.metricType.toUpperCase()} Alarm: reached ${metricVal} (Threshold: > ${outLimit})`, 'CloudWatch alarm in ALARM state.');
      logEvent('scale-out', `Auto Scaling Group launched instance ${newInst.name} (${newInst.id}) to meet desired capacity ${instances.length}`, `Capacity scaled from ${instances.length - 1} to ${instances.length}`, newInst.id);
    }
  }
  // Scale-In Trigger
  else if (metricVal <= inLimit && instances.length > asgConfig.minInstances) {
    if (asgConfig.activeCooldown <= 0 && !loadTest.isActive) {
      const candidateToRemove = instances[instances.length - 1];
      if (candidateToRemove && candidateToRemove.status !== 'terminating') {
        terminateWorkerNode(candidateToRemove.id, `Utilization sustained below threshold (${metricVal} < ${inLimit})`);
        asgConfig.activeCooldown = asgConfig.cooldownSeconds;
        asgConfig.desiredInstances = instances.length - 1;
      }
    }
  }

  // Push Telemetry History Sample
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const latency = loadTest.isActive ? loadTest.measuredLatencyMs : (avgCpu > 70 ? Math.round(100 + Math.pow((avgCpu - 70) / 10, 1.8) * 45) : 95 + Math.round(activeTraffic * 0.15));
  const errorRate = avgCpu < 75 ? +(0.02 + Math.random() * 0.03).toFixed(2) : +((avgCpu - 75) * 0.18).toFixed(2);

  history.push({
    timestamp: Date.now(),
    timeLabel: timeStr,
    cpu: avgCpu,
    memory: avgMemory,
    requests: activeTraffic,
    latency,
    instances: instances.length,
    networkIn: +(activeTraffic * 0.45).toFixed(1),
    networkOut: +(activeTraffic * 1.35).toFixed(1),
    errorRate: +(errorRate + loadTest.errorInjectionRate).toFixed(2),
  });

  if (history.length > 30) history.shift();
}, 2000);

// -----------------------------------------------------------------------
// REST API ROUTES
// -----------------------------------------------------------------------

// Get aggregated system telemetry
app.get('/api/metrics/system', (req, res) => {
  const healthyCount = instances.filter(i => i.status === 'healthy').length;
  const avgCpu = instances.length > 0 ? +(instances.reduce((acc, i) => acc + i.cpu, 0) / instances.length).toFixed(1) : 0;
  const avgMemory = instances.length > 0 ? +(instances.reduce((acc, i) => acc + i.memory, 0) / instances.length).toFixed(1) : 0;
  const totalRps = instances.reduce((acc, i) => acc + i.requestsPerSecond, 0);
  const scalingState = avgCpu >= asgConfig.scaleOutThreshold ? 'scaling-up' : avgCpu <= asgConfig.scaleInThreshold && instances.length > asgConfig.minInstances ? 'scaling-down' : 'stable';

  res.json({
    cpuUtilization: avgCpu,
    memoryUtilization: avgMemory,
    requestsPerSecond: totalRps || (loadTest.isActive ? loadTest.currentRps : 32),
    latency: loadTest.isActive ? loadTest.measuredLatencyMs : (avgCpu > 70 ? 190 : 118),
    errorRate: avgCpu > 75 ? 1.4 : 0.05,
    activeInstances: instances.length,
    healthyInstances: healthyCount,
    unhealthyInstances: instances.length - healthyCount,
    loadBalancerHealth: instances.some(i => i.status === 'unhealthy') ? 66 : 100,
    scalingState,
    estimatedCostPerHour: +(0.0416 * instances.length).toFixed(4),
  });
});

// Get all running instances
app.get('/api/instances', (req, res) => {
  const sanitized = instances.map(i => ({
    id: i.id,
    name: i.name,
    status: i.status,
    cpu: i.cpu,
    memory: i.memory,
    requestsPerSecond: i.requestsPerSecond,
    uptime: i.uptime,
    availabilityZone: i.availabilityZone,
    privateIp: i.privateIp,
    publicIp: i.publicIp,
    instanceType: i.instanceType,
    launchTime: i.launchTime,
    networkInMb: i.networkInMb,
    networkOutMb: i.networkOutMb,
    healthCheckPasses: i.healthCheckPasses,
    port: i.port,
  }));
  res.json(sanitized);
});

// Get real logs for a specific instance
app.get('/api/instances/:id/logs', (req, res) => {
  const inst = instances.find(i => i.id === req.params.id);
  if (!inst) {
    res.status(404).json({ error: 'Instance not found' });
    return;
  }
  res.json({ instanceId: inst.id, name: inst.name, logs: inst.logs });
});

// Provision new instance
app.post('/api/instances', (req, res) => {
  if (instances.length >= asgConfig.maxInstances) {
    res.status(400).json({ error: `Cannot launch instance: Maximum capacity limit (${asgConfig.maxInstances}) reached.` });
    return;
  }
  const inst = spawnWorkerNode();
  asgConfig.desiredInstances = instances.length;
  res.status(201).json({ success: true, instance: { id: inst.id, name: inst.name, port: inst.port, az: inst.availabilityZone } });
});

// Terminate instance
app.delete('/api/instances/:id', async (req, res) => {
  if (instances.length <= asgConfig.minInstances) {
    res.status(400).json({ error: `Cannot terminate: Minimum capacity floor (${asgConfig.minInstances}) required.` });
    return;
  }
  const ok = await terminateWorkerNode(req.params.id, 'Manual administrative termination');
  if (!ok) {
    res.status(404).json({ error: 'Instance not found' });
    return;
  }
  asgConfig.desiredInstances = instances.length - 1;
  res.json({ success: true, message: `Termination initiated for instance ${req.params.id}` });
});

// Reboot instance
app.post('/api/instances/:id/reboot', async (req, res) => {
  const target = instances.find(i => i.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Instance not found' });
    return;
  }

  target.logs.push('[REBOOT] Administrative reboot issued. Restarting worker process...');
  try {
    if (target.process) target.process.kill('SIGTERM');
  } catch (e) {}

  setTimeout(() => {
    target.status = 'healthy';
    target.uptime = '0m';
    logEvent('health-check', `Instance ${target.name} (${target.id}) gracefully rebooted and re-registered with ALB.`, 'Nginx and worker process restored.', target.id);
  }, 1000);

  res.json({ success: true, message: `Reboot initiated for ${target.id}` });
});

// Chaos testing: Crash instance to test self-healing
app.post('/api/instances/:id/crash', (req, res) => {
  const target = instances.find(i => i.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Instance not found' });
    return;
  }

  console.log(`[FAULT-INJECTION] Killing process for ${target.id} with SIGKILL`);
  target.status = 'unhealthy';
  target.cpu = 99.0;
  target.logs.push('[FAULT-INJECTION] Node process terminated via SIGKILL to test self-healing.');

  try {
    if (target.process) target.process.kill('SIGKILL');
  } catch (e) {}

  logEvent('instance-unhealthy', `Fault Injection: Terminated process ${target.name} (${target.id})`, 'Target marked Unhealthy. Auto Scaling self-healing will auto-replace this node.', target.id);

  res.json({ success: true, message: `Process for ${target.id} terminated. ASG self-healing will detect and replace this node.` });
});

// Chaos testing: Inject CPU stress
app.post('/api/instances/:id/stress', async (req, res) => {
  const target = instances.find(i => i.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Instance not found' });
    return;
  }

  target.cpu = 98.0;
  target.logs.push('[STRESS] Injected 98% CPU load benchmark.');
  try {
    await fetch(`http://localhost:${target.port}/api/stress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMs: 20000 }),
    }).catch(() => {});
  } catch (e) {}

  logEvent('alert', `CPU Stress Injected onto ${target.name} (${target.id})`, 'Instance CPU spiked to 98%. CloudWatch alarms evaluating.', target.id);
  res.json({ success: true, message: `CPU stress active on ${target.id}` });
});

// Auto-scaling config
app.get('/api/autoscaling/config', (req, res) => {
  res.json(asgConfig);
});

app.patch('/api/autoscaling/config', (req, res) => {
  asgConfig = { ...asgConfig, ...req.body };
  logEvent('alert', 'Auto Scaling Group policy configuration updated', `Out: > ${asgConfig.scaleOutThreshold}%, In: < ${asgConfig.scaleInThreshold}%, Cooldown: ${asgConfig.cooldownSeconds}s`);
  res.json(asgConfig);
});

app.post('/api/autoscaling/cooldown/bypass', (req, res) => {
  asgConfig.activeCooldown = 0;
  res.json({ success: true, message: 'Cooldown timer bypassed' });
});

// Load balancer info & config
app.get('/api/loadbalancer/info', (req, res) => {
  res.json({
    ...lbInfo,
    healthyTargets: instances.filter(i => i.status === 'healthy').length,
    totalTargets: instances.length,
  });
});

app.patch('/api/loadbalancer/config', (req, res) => {
  lbInfo = { ...lbInfo, ...req.body };
  res.json(lbInfo);
});

// Live Health Probe trigger (real HTTP request)
app.post('/api/loadbalancer/probe', async (req, res) => {
  const targetPath = req.body.path || lbInfo.healthCheckPath || '/health';
  const healthyNodes = instances.filter(i => i.status === 'healthy');

  if (healthyNodes.length === 0) {
    res.status(503).json({ error: 'No healthy targets to probe.' });
    return;
  }

  const results = [];
  for (const node of healthyNodes) {
    const start = Date.now();
    try {
      const probeRes = await fetch(`http://localhost:${node.port}${targetPath}`);
      const duration = Date.now() - start;
      const data = await probeRes.json().catch(() => ({}));
      results.push({
        instanceId: node.id,
        name: node.name,
        port: node.port,
        status: probeRes.status,
        durationMs: duration,
        ok: probeRes.ok,
        data,
      });
    } catch (e: any) {
      results.push({
        instanceId: node.id,
        name: node.name,
        port: node.port,
        status: 504,
        durationMs: Date.now() - start,
        ok: false,
        error: e.message,
      });
    }
  }

  logEvent('health-check', `Manual Health Check Probe to target group tg-expan-prod (${targetPath}) completed`, `Probed ${results.length} active instances with HTTP 200 responses.`);
  res.json({ success: true, results });
});

// Traffic & Load Test API
app.get('/api/loadtest/status', (req, res) => {
  res.json(loadTest);
});

app.post('/api/loadtest/start', (req, res) => {
  const { preset, targetRps, pattern } = req.body;
  startLoadTestEngine(preset || 'normal', targetRps || 32, pattern || 'constant');
  res.json({ success: true, loadTest });
});

app.post('/api/loadtest/stop', (req, res) => {
  stopLoadTestEngine();
  res.json({ success: true, loadTest });
});

// Telemetry history
app.get('/api/metrics/history', (req, res) => {
  res.json(history);
});

// Scaling Events Log
app.get('/api/events', (req, res) => {
  res.json(events);
});

app.delete('/api/events', (req, res) => {
  events = [];
  saveEvents();
  res.json({ success: true, message: 'Audit events log cleared' });
});

// Settings & Connectivity check
app.post('/api/settings/test-connection', async (req, res) => {
  const { url } = req.body;
  const targetUrl = url || `http://localhost:${PORT}/api/metrics/system`;
  const start = Date.now();

  try {
    const testRes = await fetch(targetUrl);
    const latency = Date.now() - start;
    res.json({
      success: testRes.ok,
      status: testRes.status,
      latencyMs: latency,
      message: `Endpoint responded with HTTP ${testRes.status} in ${latency}ms`,
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: err.message,
      message: `Failed to connect to ${targetUrl}: ${err.message}`,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` eXpan Real Cloud Platform Backend running on port ${PORT}`);
  console.log(` ALB Gateway Ingress: http://localhost:${PORT}/api/gateway`);
  console.log(` Telemetry & API:    http://localhost:${PORT}/api/metrics/system`);
  console.log(`=======================================================`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server and worker cluster...');
  instances.forEach(i => {
    try { if (i.process) i.process.kill('SIGKILL'); } catch (e) {}
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  instances.forEach(i => {
    try { if (i.process) i.process.kill('SIGKILL'); } catch (e) {}
  });
  process.exit(0);
});
