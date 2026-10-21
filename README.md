# eXpan — Production Cloud Infrastructure & Auto-Scaling Platform

eXpan is a real-world, full-stack Cloud Infrastructure Monitoring, Load Balancing, and Auto-Scaling Platform. It combines an active multi-process worker cluster, an Application Load Balancer (ALB) reverse proxy, real-time CloudWatch telemetry, and an automated horizontal elasticity engine with a high-contrast enterprise operations console.

---

## 🏛️ System Architecture

eXpan operates as a distributed system with a clear separation of concerns across four core layers:

```
[ Incoming HTTP Traffic / Load Generator ]
                    │
                    ▼ (HTTP Port 5000)
    [ Application Load Balancer (ALB) Gateway ]
       (Reverse Proxy: Least Connections / Round Robin)
                    │
        ┌───────────┴───────────┬───────────────────────┐
        ▼ (Port 4001)           ▼ (Port 4002)           ▼ (Port 4003+)
 [ Worker Node #1 ]      [ Worker Node #2 ]      [ Worker Node #3 ]
  PID: 26576 (ap-south-1a) PID: 18040 (ap-south-1b) (Dynamically Spawned)
  IP: 10.0.1.45           IP: 10.0.2.50           IP: 10.0.1.55
        │                       │                       │
        └───────────┬───────────┴───────────────────────┘
                    │ (Real-Time Metrics & Health Probes)
                    ▼
        [ CloudWatch Metric Collector & Alarm Evaluator ]
                    │
                    ▼
        [ Auto Scaling Group (ASG) Controller ]
         (Target Tracking Policy: CPU > 70% Scale-Out, CPU < 30% Scale-In)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 [ Auto Scale-Out (+1) ]  [ Auto Scale-In (-1) ]
  Spawns Child Process     Drains & Kills Process
```

### Components

1. **Master Control Plane (`server/index.ts` on Port 5000)**:
   - Houses the cluster manager, reverse proxy load balancer, health check scheduler, load testing engine, and the 2-second auto-scaling supervisor loop.
2. **Microservice Worker Fleet (`server/worker.js` on Ports 4001, 4002, ...)**:
   - Real, independent Node.js processes spawned via `child_process.fork()`.
   - Each worker runs its own HTTP server, handles compute workloads, responds to `/health` probes, tracks memory/CPU utilization, and emits live stdout/stderr logs.
3. **Application Load Balancer (ALB)**:
   - Real reverse proxy mounted at `/api/gateway/work` that distributes traffic across healthy worker nodes using **Least Outstanding Requests** or **Round Robin** algorithms.
4. **Operations Web Console (`src/` on Port 5173)**:
   - Built with React 19, TypeScript, Tailwind CSS, Recharts, and Framer Motion.
   - Proxies `/api` requests seamlessly to the backend server at `http://localhost:5000`.

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ or v24 recommended)
- **npm**: v9.0.0 or later

### Installation
```bash
# 1. Clone or navigate to the project directory
cd "CC project (Auto Scalling)"

# 2. Install all dependencies (both frontend and backend)
npm install
```

### Running the Full Application
```bash
# Starts both the Backend Server (Port 5000) and the Vite Frontend (Port 5173) concurrently
npm run dev
```

Once started:
- **Operations Console**: Open [http://localhost:5173/](http://localhost:5173/) in your browser.
- **Backend API & Telemetry**: Available at [http://localhost:5000/api/metrics/system](http://localhost:5000/api/metrics/system).
- **ALB Gateway Ingress**: Accessible at [http://localhost:5000/api/gateway/work](http://localhost:5000/api/gateway/work).

### Additional Scripts
```bash
# Run only the backend server
npm run server

# Run only the frontend client
npm run client

# Verify TypeScript compilation and build production bundle
npm run build
```

---

## ⚙️ How Instances (Worker Nodes) Are Set Up & Managed

eXpan treats instances as actual computational units rather than simulated mocks:

### 1. Automated Dynamic Provisioning (Scale-Out)
- When incoming traffic drives average CPU or RPS across healthy nodes above the configured threshold (default: **70% CPU**), the Auto Scaling Group supervisor detects the breach.
- The manager automatically finds the next available port (e.g. `4002`, `4003`), assigns private and public VPC IPs, and forks a real Node.js child process executing `server/worker.js`.
- The node starts in the `launching` state. The supervisor polls its `/health` endpoint. Once it returns **HTTP 200 OK**, the node is registered with the ALB target group and enters active service.

### 2. Manual On-Demand Provisioning
- Users can click **"Provision Node"** from the **Dashboard**, **Instances**, or **Auto Scaling** pages.
- This immediately issues a `POST /api/instances` call, allocating a new worker process, assigning Availability Zones (`ap-south-1a` or `ap-south-1b`), and updating fleet capacity.

### 3. Graceful Connection Draining (Scale-In)
- When traffic drops and CPU remains below the scale-in threshold (default: **30% CPU**), the ASG initiates scale-in.
- The manager sends an HTTP `POST /api/shutdown` to the node to drain in-flight connections.
- After a configurable deregistration delay, the child process is cleanly terminated with `SIGTERM`.

### 4. Self-Healing & Disaster Recovery
- The ALB runs an active health check loop every 5 seconds against each node's `/health` endpoint.
- If a worker process crashes, exits unexpectedly, or fails consecutive probes:
  1. The target is flagged as `unhealthy`.
  2. The ASG supervisor marks the corrupted node for replacement.
  3. The dead process is purged, and a healthy replacement node is automatically launched.
  4. An `instance-replaced` event is permanently recorded in the audit log.

### 5. Worker Node Internals
Each worker process exposes dedicated endpoints:
- `GET /health`: Reports PID, process uptime, memory consumption (`rss`, `heapUsed`), and system load.
- `GET /api/work`: Performs cryptographic and math operations, simulating real computational work and logging round-trip times.
- `POST /api/stress`: Injects intensive CPU calculations for testing alert triggers.
- `POST /api/fail`: Simulates internal service degradation to test ALB failover.

---

## 🖥️ How to Operate the Website (Operations Guide)

### 1. Dashboard (`/dashboard`)
The central command cockpit for real-time fleet observation:
- **6 KPI Metric Cards**: Live Active Fleet count, Average Fleet CPU %, Ingress Request Rate (req/s), Target Latency (ms), ALB Health %, and Resource Cost ($/hr).
- **Interactive Architecture Topology Canvas**: Visualizes the flow from Clients &rarr; ALB Gateway &rarr; Active EC2 Blades &rarr; ASG Controller.
  - Hovering and clicking any blade opens the **Node Inspection Drawer**.
  - Animated data beams speed up or slow down based on real request throughput.
- **Unified Telemetry Charts**: Switch between **Split** (CPU vs Traffic), **CPU** (with 70% Alarm and 30% Scale-In reference lines), and **Traffic** views.
- **Active EC2 Fleet Table**: Live list of active nodes with one-click manual scaling controls (`+` / `-`).
- **Quick Action Bar**: One-click **"START LOAD TEST"** button to immediately generate traffic.

### 2. Compute Fleet Inventory (`/instances`)
Manage and inspect all running virtual nodes:
- **Search & Filter**: Search nodes by ID (e.g. `i-0e0c21236`), private IP (`10.0.1.45`), or Availability Zone (`ap-south-1a`). Filter by status (`healthy`, `unhealthy`, `launching`, `terminating`).
- **Fleet HUD**: Displays total active nodes against the maximum capacity ceiling (e.g. `2 / 4`), target health percentage, and total processed throughput.
- **Node Actions**: Inspect individual nodes, reboot processes, or drain nodes directly from the table.

### 3. Node Inspector & Console Drawer (`InstanceDrawer`)
Clicking any node in the topology or instances table slides out the inspection panel:
- **Telemetry & Network Tab**:
  - Precision vCPU Utilization and Memory Allocation gauges.
  - Private VPC IP, Public Elastic IP, Availability Zone, and HTTP probe pass rate.
  - **Inject CPU Stress**: Triggers an intensive computation loop on this specific worker process to test threshold alerts.
  - **Reboot Process**: Sends an administrative reboot signal, restarting the worker process.
  - **Crash Node via SIGKILL (Test Self-Healing)**: Kills the worker process immediately to verify that the ASG detects the failure and auto-replaces the node.
  - **Drain & Terminate Node**: Safely drains connections and stops the node.
- **Live Process Logs Tab**:
  - Displays real-time `stdout` and `stderr` streams captured from the worker process (equivalent to `tail -f /var/log/nginx/access.log`).
  - Includes a manual **"Refresh"** button to reload the process log buffer.

### 4. Application Load Balancer (`/load-balancer`)
Configure and monitor Layer 7 traffic routing:
- **Routing Algorithm Selection**: Switch between **Least Outstanding Requests** (dynamic load balancing based on active in-flight requests) and **Round Robin**.
- **Session Affinity (Stickiness)**: Toggle cookie-based target stickiness.
- **Health Check Configuration**: Change target health check endpoints (e.g. `/health`, `/api/health`) and adjust deregistration delays.
- **Send Health Probe**: Click **"Send Health Probe"** to dispatch real HTTP requests across all active targets. Displays actual status codes and round-trip response times in milliseconds.

### 5. Auto Scaling Group (`/auto-scaling`)
Inspect and tune horizontal elasticity policies:
- **Alarm Metric Selector**: Switch the primary scaling metric between **CPU %**, **RPS / Node**, and **RAM %**.
- **Capacity Bounds**: View and adjust Minimum Floor (e.g. 1 EC2), Desired Fleet Capacity, and Maximum Ceiling (e.g. 4 EC2).
- **Cooldown Management**: Displays active cooldown countdown (e.g. `25s`). Click **"COOLDOWN (BYPASS)"** to clear the timer immediately and force real-time policy evaluation.
- **Manual Stepper**: Scale out (`+`) or scale in (`-`) instances with built-in boundary checks.

### 6. HTTP Load Testing & Benchmarking (`/load-testing`)
Generate real concurrent HTTP traffic against the ALB Gateway:
- **Workload Presets**:
  - **Normal Traffic**: 32 req/s, 45 concurrent users (~24% fleet CPU).
  - **Medium Load**: 85 req/s, 160 users (~50% fleet CPU).
  - **High Surge**: 165 req/s, 340 users (breaches 70% threshold, triggers Auto-Scaling to 2 instances).
  - **Extreme Spike**: 285 req/s, 620 users (scales fleet up to 3–4 instances).
- **Traffic Waveforms**:
  - `Constant (Steady)`: Smooth sustained request rate.
  - `Surge / Flash Spike`: Random bursts of heavy traffic.
  - `Step Ramp (Staircase)`: Incremental traffic increases every 10 seconds.
  - `Sinusoidal (Day/Night)`: Cyclical tidal wave patterns simulating diurnal traffic.
- **Custom Sliders**: Fine-tune target RPS from 15 to 400 req/s.
- **Duration Limits**: Set test duration (30s, 60s, 120s, 300s, or Continuous).
- **Execution**: Click **"Start HTTP Load Test"** to begin traffic injection. The system will dispatch real HTTP requests to `http://localhost:5000/api/gateway/work` and graph live latency and throughput.

### 7. CloudWatch Monitoring (`/monitoring`)
Observability suite for fleet telemetry:
- **4 Dedicated Telemetry Cards**:
  1. **Fleet CPU Utilization**: Area chart with threshold markers.
  2. **Ingress Request Rate**: Throughput in req/s.
  3. **Target Response Latency**: Measured p95 round-trip latency in ms.
  4. **HTTP 5xx Error Rate**: Error percentage tracking.
- **Time Range Selectors**: Filter data across `5m`, `15m`, `30m`, `1h`, `6h`, and `24h` intervals.
- **Export CSV**: Download time-series metric samples as a CSV spreadsheet.

### 8. Scaling Audit Trail (`/events`)
Comprehensive audit log of all operational decisions:
- **Tracked Event Types**: `scale-out`, `scale-in`, `alert`, `instance-started`, `instance-terminated`, `instance-unhealthy`, `instance-replaced`, and `health-check`.
- **Search & Filters**: Filter events by category or search by instance ID.
- **Export**: Export the audit trail to **JSON** or **CSV** for reports.
- **Clear Log**: Reset the event history.

### 9. Settings (`/settings`)
Global platform configuration:
- **Engine Mode**:
  - **Cluster Engine**: Native Node.js multi-process cluster on local ports.
  - **AWS Connector**: Ready for live AWS EC2, CloudWatch, and ALB connections via credentials.
- **Elasticity Presets**: One-click apply pre-tuned profiles:
  - *Production Standard* (Min: 1, Max: 4, Out: 70%, In: 30%, Cooldown: 60s).
  - *Aggressive High-Load* (Min: 2, Max: 6, Out: 60%, In: 25%, Cooldown: 30s).
  - *Cost-Conservative Eco* (Min: 1, Max: 2, Out: 85%, In: 40%, Cooldown: 120s).
- **Validation**: Enforces strict boundary rules (Minimum < Maximum, Scale-In < Scale-Out to prevent thrashing).
- **Diagnostics**: Built-in endpoint connection testing with latency verification.

---

## 🧪 Demonstration & Verification Walkthrough

To verify the end-to-end elasticity lifecycle:

1. **Verify Baseline**:
   - Open `/dashboard`. Observe 1 healthy instance (`web-prod-app-01`), CPU around 24%, and STABLE state.
2. **Trigger Scale-Out**:
   - Navigate to `/load-testing`. Select **"High Surge"** (165 req/s) and click **"Start HTTP Load Test"**.
   - As real requests hit the ALB gateway, CPU breaches the 70% threshold.
   - The ASG controller triggers an alarm and automatically provisions `web-prod-app-02`.
   - The new node passes health checks and begins sharing traffic 50% / 50%, stabilizing fleet CPU back below 50%.
3. **Verify Disaster Recovery (Self-Healing)**:
   - Click on `web-prod-app-01` in the architecture diagram to open the drawer.
   - Click **"Crash Node via SIGKILL (Test Self-Healing)"**.
   - The process is terminated. The ALB marks it `unhealthy`.
   - Within 2 seconds, the ASG self-healing controller detects the failure, terminates the dead node, and auto-spawns a replacement node.
4. **Trigger Scale-In**:
   - Click **"Stop Load Test"**.
   - Ingress returns to baseline. As CPU drops below 30%, the ASG drains connections on the surplus node and terminates it, returning the fleet to 1 instance.

---

## 🔒 Security & Production Best Practices

- **Port Isolation**: Worker processes run on local unexposed ports (`4001+`), accessible only through the ALB reverse proxy.
- **Connection Draining**: Prevents dropped HTTP requests during scale-in operations.
- **Process Cleanup**: Built-in `SIGINT` and `SIGTERM` listeners guarantee that child processes terminate cleanly when the server stops.
- **Error Guardrails**: ASG threshold validation prevents flapping and rapid capacity thrashing.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
