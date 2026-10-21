import React from 'react';
import { 
  Network, 
  Layers, 
  ArrowRight,
  Plus, 
  Minus,
  ExternalLink,
  Globe
} from 'lucide-react';
import { useSystemStore } from '../../store/useSystemStore';
import { useNavigate } from 'react-router-dom';

export const ArchitectureDiagram: React.FC = () => {
  const metrics = useSystemStore((state) => state.metrics);
  const instances = useSystemStore((state) => state.instances);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const lbInfo = useSystemStore((state) => state.lbInfo);
  const loadTest = useSystemStore((state) => state.loadTest);
  const startLoadTest = useSystemStore((state) => state.startLoadTest);
  const stopLoadTest = useSystemStore((state) => state.stopLoadTest);
  const manuallyScale = useSystemStore((state) => state.manuallyScale);
  const selectInstance = useSystemStore((state) => state.selectInstance);
  const navigate = useNavigate();

  const isScalingUp = metrics.scalingState === 'scaling-up';
  const isScalingDown = metrics.scalingState === 'scaling-down';

  const toggleLoad = () => {
    if (loadTest.isActive) {
      stopLoadTest();
    } else {
      startLoadTest('high', 165);
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 flex flex-col justify-between h-full min-h-0 select-none overflow-hidden font-mono text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Cloud Architecture Topology
          </span>
          <span className="text-[10px] text-neutral-300 bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded">
            ap-south-1
          </span>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">
            VPC vpc-0f72a4 (Dual-AZ)
          </span>
        </div>

        <div className="text-[10px] text-neutral-400 flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Target Group: 100% In-Service</span>
          </span>
          <span className="text-neutral-700 hidden md:inline">•</span>
          <span className="text-neutral-300 hidden md:inline">
            Fleet Avg CPU: <strong className="text-white font-bold">{metrics.cpuUtilization.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* Main Architecture Interactive Canvas */}
      <div className="flex-1 flex items-center justify-between gap-1 py-1.5 min-h-0 overflow-x-auto">
        {/* PILLAR 1: Public Internet Ingress Clients */}
        <div
          onClick={toggleLoad}
          className="w-28 sm:w-32 h-full shrink-0 p-2 rounded-lg bg-black border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex flex-col justify-between group relative"
          title="Click to toggle active HTTP traffic generator"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-white" />
              <span className="text-[9px] uppercase font-bold text-neutral-300">
                CLIENTS
              </span>
            </div>
            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border transition-colors ${
              loadTest.isActive 
                ? 'bg-white text-black border-white' 
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 group-hover:text-white'
            }`}>
              {loadTest.isActive ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          <div className="my-auto py-1">
            <div className="text-base sm:text-lg font-bold text-white tracking-tight">
              {metrics.requestsPerSecond} <span className="text-[9px] font-normal text-neutral-500">req/s</span>
            </div>
            <div className="text-[9px] text-neutral-400">TLS 1.3 HTTP</div>
          </div>

          <div className="text-[9px] text-neutral-500 truncate">
            Live Ingress
          </div>

          {/* Right Port */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white translate-x-1/2" />
        </div>

        {/* Connector 1: Clients -> ALB */}
        <div className="w-4 sm:w-6 h-full shrink-0 flex items-center justify-center text-neutral-600">
          <div className="w-full h-px bg-neutral-700 relative flex items-center justify-end">
            <ArrowRight className="w-3 h-3 text-neutral-400 -mr-1" />
          </div>
        </div>

        {/* PILLAR 2: AWS Application Load Balancer */}
        <div
          onClick={() => navigate('/load-balancer')}
          className="w-32 sm:w-36 h-full shrink-0 p-2 rounded-lg bg-black border border-neutral-800 hover:border-white transition-all cursor-pointer flex flex-col justify-between group relative"
          title="Click to inspect Application Load Balancer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-white" />
              <span className="text-[9px] uppercase font-bold text-neutral-300 group-hover:text-white transition-colors">
                AWS ALB (L7)
              </span>
            </div>
            <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-white">
              HEALTHY
            </span>
          </div>

          <div className="my-auto py-1 text-[9px] space-y-0.5">
            <div className="text-white font-bold">tg-expan-prod</div>
            <div className="text-neutral-400">{lbInfo.activeConnections} TCP Sockets</div>
          </div>

          <div className="text-[9px] text-neutral-400 truncate">
            {lbInfo.algorithm === 'Least Outstanding Requests' ? 'Least Conns' : 'Round Robin'}
          </div>

          {/* Symmetrical Output Port at 50% Vertical Center */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white translate-x-1/2" />
        </div>

        {/* Dynamic Symmetrical SVG Fan-Out Routing Bus */}
        <div className="w-6 sm:w-10 h-full shrink-0 relative flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {instances.map((inst, index) => {
              const total = instances.length;
              const yTarget = ((index + 0.5) / total) * 100;
              const isHighCpu = inst.cpu >= asgConfig.scaleOutThreshold;

              return (
                <g key={inst.id}>
                  {/* Background rail */}
                  <path
                    d={`M 0,50 C 45,50 55,${yTarget} 100,${yTarget}`}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1.5"
                  />
                  {/* Animated flowing data beam */}
                  <path
                    d={`M 0,50 C 45,50 55,${yTarget} 100,${yTarget}`}
                    fill="none"
                    stroke={isHighCpu ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}
                    strokeWidth={isHighCpu ? '2.5' : '1.5'}
                    strokeDasharray="4 4"
                    className="animate-flow-dash"
                  />
                  {/* Target Node Connector Dot */}
                  <circle cx="100" cy={yTarget} r="2.5" fill="#ffffff" />
                </g>
              );
            })}
            {/* ALB Center Source Port Dot */}
            <circle cx="0" cy="50" r="3" fill="#ffffff" />
          </svg>
        </div>

        {/* PILLAR 3: VPC Auto Scaling Target Fleet (The Server Blades) */}
        <div className="flex-1 h-full min-w-[240px] p-2 rounded-lg bg-black/60 border border-neutral-800 flex flex-col justify-between relative">
          {/* Cluster Header */}
          <div className="flex items-center justify-between pb-1 border-b border-neutral-850 shrink-0 text-[9px]">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="font-bold uppercase tracking-wider text-white">VPC ASG FLEET POOL</span>
              <span className="text-neutral-500 hidden sm:inline">(Dual-AZ)</span>
            </div>
            <span className="font-bold text-white bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
              {instances.length} / {asgConfig.maxInstances} EC2 NODES
            </span>
          </div>

          {/* Symmetrical Rack Blades */}
          <div className="flex-1 flex flex-col justify-around gap-1 py-1 min-h-0">
            {instances.map((inst, index) => {
              const isHighCpu = inst.cpu >= asgConfig.scaleOutThreshold;
              const isLaunching = inst.status === 'launching';

              return (
                <div
                  key={inst.id}
                  onClick={() => selectInstance(inst)}
                  className={`p-1.5 rounded-md bg-black border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isHighCpu
                      ? 'border-white bg-neutral-900'
                      : isLaunching
                      ? 'border-neutral-500 animate-pulse'
                      : 'border-neutral-800 hover:border-neutral-600'
                  }`}
                  title={`Inspect ${inst.id} (${inst.privateIp})`}
                >
                  {/* Left: Node Index & Zone */}
                  <div className="flex items-center gap-1.5 shrink-0 min-w-[65px]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isHighCpu ? 'bg-white animate-ping' : isLaunching ? 'bg-neutral-500' : 'bg-white'
                      }`}
                    />
                    <span className="text-[10px] font-bold text-white">#{index + 1}</span>
                    <span className="text-[9px] text-neutral-400 bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800">
                      {inst.availabilityZone.replace('ap-south-', '')}
                    </span>
                  </div>

                  {/* Middle: ID & Private IP */}
                  <div className="hidden sm:flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-white truncate">{inst.id}</span>
                    <span className="text-[9px] text-neutral-500 truncate">{inst.privateIp}</span>
                  </div>

                  {/* Right: CPU Bar & Ingress Rate */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-16 sm:w-20">
                      <div className="flex justify-between text-[8px] text-neutral-400 mb-0.5">
                        <span>CPU</span>
                        <span className={isHighCpu ? 'text-white font-bold' : 'text-neutral-200'}>
                          {inst.cpu.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden border border-neutral-800">
                        <div
                          className={`h-full ${isHighCpu ? 'bg-white' : 'bg-neutral-300'} transition-all duration-300`}
                          style={{ width: `${Math.min(100, inst.cpu)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right min-w-[36px]">
                      <span className="text-[10px] font-bold text-white">{inst.requestsPerSecond}</span>
                      <span className="text-[8px] text-neutral-500 block">req/s</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connector 3: Fleet -> Controller */}
        <div className="w-4 sm:w-6 h-full shrink-0 flex items-center justify-center text-neutral-600">
          <div className="w-full h-px bg-neutral-700 relative flex items-center justify-end">
            <ArrowRight className="w-3 h-3 text-neutral-400 -mr-1" />
          </div>
        </div>

        {/* PILLAR 4: CloudWatch Auto Scaling Supervisor Controller (Always Dark Card!) */}
        <div
          onClick={() => navigate('/auto-scaling')}
          className="w-36 sm:w-44 h-full shrink-0 p-2 rounded-lg bg-black border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to view Auto Scaling policies"
        >
          {/* Supervisor Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-white" />
              <span className="text-[9px] uppercase font-bold text-neutral-300 group-hover:text-white transition-colors">
                ASG CONTROLLER
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
          </div>

          {/* Condition Evaluation */}
          <div className="my-1 space-y-1 text-[9px]">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">RULE (IF):</span>
              <span className="text-white font-bold">CPU &gt; {asgConfig.scaleOutThreshold}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">EVALUATION:</span>
              <span className="text-white font-bold">{metrics.cpuUtilization.toFixed(1)}% Avg</span>
            </div>
          </div>

          {/* Status Badge & Steppers (Clean Dark Styling with High-Contrast Pill) */}
          <div className="pt-1 border-t border-neutral-850 flex items-center justify-between">
            <div>
              {isScalingUp ? (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider bg-white text-black animate-pulse">
                  SCALING UP
                </span>
              ) : isScalingDown ? (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider border border-white text-white">
                  SCALING IN
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-medium uppercase tracking-wider bg-neutral-900 border border-neutral-800 text-neutral-300">
                  STABLE
                </span>
              )}
            </div>

            {/* Stepper buttons */}
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => manuallyScale('down')}
                disabled={instances.length <= asgConfig.minInstances}
                className="w-4 h-4 rounded flex items-center justify-center font-bold text-[9px] border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Scale in 1 instance"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={() => manuallyScale('up')}
                disabled={instances.length >= asgConfig.maxInstances}
                className="w-4 h-4 rounded flex items-center justify-center font-bold text-[9px] border border-neutral-700 bg-neutral-900 text-white hover:border-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                title="Scale out 1 instance"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="pt-1.5 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="text-neutral-500 uppercase text-[9px]">DNS ENDPOINT:</span>
          <span className="text-white truncate">{lbInfo.dnsName}</span>
        </div>
        <div className="text-white shrink-0 ml-2">
          Target Tracking: CPU 70% (Floor: {asgConfig.minInstances} • Ceiling: {asgConfig.maxInstances})
        </div>
      </div>
    </div>
  );
};
