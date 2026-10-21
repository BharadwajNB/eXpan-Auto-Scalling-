<div align="center">

# ⚡ eXpan
### Production-Grade Cloud Infrastructure, Application Load Balancing & Auto-Scaling Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<p align="center">
  <b>A full-stack, distributed cloud simulation engine running real compute processes, Layer 7 reverse proxy routing, real-time CloudWatch telemetry, and an automated horizontal elasticity supervisor.</b>
</p>

[Architecture](#-system-architecture) • [Key Capabilities](#-key-capabilities) • [Quick Start](#-quick-start) • [Live Demo Guide](#-demo-walkthrough) • [Tech Stack](#-technology-stack) • [Viva Guide](#-viva--operations-guide)

---

</div>

## 🏛️ System Architecture

eXpan implements real distributed systems principles. Instead of mock data, it orchestrates an active multi-process worker cluster behind an Application Load Balancer (ALB) reverse proxy with sub-second health monitoring and automated elasticity.

```
                    [ Incoming HTTP Requests / Load Generator ]
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │    Layer 7 Application Load Balancer (ALB)     │
                 │   - Reverse Proxy Gateway (Port 5000)         │
                 │   - Algorithms: Least Connections / Round-Robin│
                 └───────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼ (Port 4001)           ▼ (Port 4002)           ▼ (Port 4003+)
          ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
          │ Worker #1   │         │ Worker #2   │         │ Worker #3   │
          │ (Active)    │         │ (Active)    │         │ (Dynamically│
          │ ap-south-1a │         │ ap-south-1b │         │  Provisioned│
          └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │ (Real-Time Metrics & HTTP Probes)
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │       CloudWatch Telemetry & Health Prober    │
                 │   - Active Health Checks every 5 seconds      │
                 │   - CPU, Memory, Latency & RPS Aggregation    │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │        Auto Scaling Group (ASG) Manager       │
                 │   - Scale-Out: CPU > 70% (Spawns worker.js)   │
                 │   - Scale-In:  CPU < 30% (Drains & terminates)│
                 │   - Self-Healing: Auto-replaces crashed nodes │
                 └───────────────────────────────────────────────┘
```

---

## ✨ Key Capabilities

| Component | Real-World Implementation |
| :--- | :--- |
| **Layer 7 Load Balancer** | Real reverse proxy (`/api/gateway/work`) distributing live traffic with **Least Connections** and **Round Robin** algorithms. |
| **Dynamic Auto-Scaling** | Real-time supervisor loop (every 2s) evaluating Target Tracking Policies. Dynamically spawns or drains Node.js child processes. |
| **Self-Healing Cluster** | Continuous `/health` probes detect crashed or degraded processes, immediately mark them unhealthy, and launch healthy replacements. |
| **HTTP Load Generator** | Integrated traffic engine capable of generating continuous or bursting traffic (15 to 400+ RPS) across 4 custom waveforms. |
| **Operations Console** | High-contrast enterprise dashboard with interactive architecture topology, live CPU/traffic charts, and node inspection drawers. |
| **Process Observability** | Inspect live `stdout` / `stderr` streams, memory allocations, and CPU utilization per individual worker node in real-time. |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher

### 2. Setup & Launch
```bash
# Clone the repository
git clone https://github.com/aaweshdas/eXpan-Auto-Scalling-.git
cd eXpan-Auto-Scalling-

# Install dependencies
npm install

# Start both Backend Control Plane and Frontend Console concurrently
npm run dev
```

### 3. Service Access Endpoints

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Operations Dashboard** | [http://localhost:5173/](http://localhost:5173/) | Web console for monitoring and administration |
| **ALB Ingress Gateway** | [http://localhost:5000/api/gateway/work](http://localhost:5000/api/gateway/work) | Reverse proxy endpoint handling workload distribution |
| **System Telemetry API** | [http://localhost:5000/api/metrics/system](http://localhost:5000/api/metrics/system) | Real-time aggregated cluster metrics |
| **Worker Health Probe** | `http://localhost:4001/health` | Individual node health probe & process telemetry |

---

## 🎬 Demo Walkthrough

Follow these steps to demonstrate complete cloud elasticity and fault tolerance:

```
[ Baseline Fleet ] ──( Load Surge )──> [ Scale-Out (+1) ] ──( Kill Node )──> [ Self-Healing Recovery ]
      1 Node                165 RPS             2 Nodes              SIGKILL            Healthy Replacement
```

1. **Verify Baseline State**:
   - Open `/dashboard`. Observe 1 running worker node (`web-prod-app-01`) at ~24% CPU in a `STABLE` state.
2. **Trigger Auto Scale-Out**:
   - Go to `/load-testing`, select **"High Surge"** (165 req/s), and click **"Start HTTP Load Test"**.
   - As real requests hit the ALB, CPU utilization breaches the **70% threshold**.
   - The ASG controller triggers an alarm and spawns `web-prod-app-02`. Traffic is instantly shared 50/50, bringing CPU back into the safe zone.
3. **Test Disaster Recovery (Self-Healing)**:
   - Click the node in the interactive architecture diagram to open the **Node Inspector Drawer**.
   - Click **"Crash Node via SIGKILL"**.
   - The ALB health prober flags the node as `unhealthy`. Within 2 seconds, the supervisor terminates the dead process and provisions an operational replacement.
4. **Trigger Auto Scale-In**:
   - Click **"Stop Load Test"**.
   - Traffic subsides. As average CPU falls below **30%**, the ASG initiates connection draining and shuts down surplus nodes, safely returning to baseline.

---

## 🛠️ Technology Stack

```
Frontend               Backend & Core Engine         DevOps & Tooling
─────────────────      ─────────────────────────     ────────────────────
React 19 (TypeScript)  Node.js (Child Process API)   Vite 6 Fast Bundler
Tailwind CSS           Express.js L7 Reverse Proxy   Oxlint / ESLint
Lucide Icons           Axios / Native HTTP Dispatch  Concurrent Dev Server
Recharts Telemetry     Custom ASG Controller         Git Version Control
Framer Motion          JSON Persistent Audit Trail   Cross-Platform Scripts
```

---

## 📁 Repository Structure

```
├── server/
│   ├── index.ts          # Control plane, ALB reverse proxy & ASG supervisor loop
│   ├── worker.js         # Compute node worker process (/health, /api/work, /stress)
│   └── data/events.json  # Persistent scaling & system event audit logs
├── src/
│   ├── components/       # Reusable UI widgets, drawers, metrics cards & topology
│   ├── pages/            # Dashboard, Instances, Load Balancer, ASG, Load Testing, etc.
│   ├── services/         # Real API clients, telemetry pollers & load testers
│   ├── store/            # Zustand system state management
│   └── types/            # TypeScript data contracts & cloud interfaces
├── README.md             # Project overview & architectural guide
└── VIVA_PREPARATION_AND_OPERATIONS_GUIDE.txt  # Detailed viva exam notes & operations script
```

---

## 📚 Viva & Operations Guide

For in-depth viva questions, oral defense pointers, architectural justifications, and detailed feature breakdowns, refer to:

👉 **[`VIVA_PREPARATION_AND_OPERATIONS_GUIDE.txt`](VIVA_PREPARATION_AND_OPERATIONS_GUIDE.txt)**

*(Contains 12 comprehensive viva defense topics, architecture definitions, and examiner Q&A answers).*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
