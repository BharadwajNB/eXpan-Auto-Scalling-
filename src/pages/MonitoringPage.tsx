import React from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { 
  RefreshCw,
  Cpu,
  Layers,
  Activity,
  Timer,
  ShieldCheck,
  Download
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 rounded-lg shadow-2xl text-xs font-mono text-white">
        <div className="text-neutral-400 text-[10px] pb-1 border-b border-neutral-800">{label}</div>
        <div className="text-white font-bold text-xs pt-1 flex items-center justify-between gap-3">
          <span className="capitalize">{payload[0].dataKey}:</span>
          <span>{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const MonitoringPage: React.FC = () => {
  const history = useSystemStore((state) => state.history);
  const metrics = useSystemStore((state) => state.metrics);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const timeRange = useSystemStore((state) => state.timeRange);
  const setTimeRange = useSystemStore((state) => state.setTimeRange);
  const tickSimulation = useSystemStore((state) => state.tickSimulation);
  const exportMetrics = useSystemStore((state) => state.exportMetrics);

  const ranges = ['5m', '15m', '30m', '1h', '6h', '24h'] as const;

  const cpuValues = history.map((h) => h.cpu);
  const peakCpu = cpuValues.length > 0 ? Math.max(...cpuValues).toFixed(1) : metrics.cpuUtilization.toFixed(1);

  const trafficValues = history.map((h) => h.requests);
  const peakTraffic = trafficValues.length > 0 ? Math.max(...trafficValues) : metrics.requestsPerSecond;

  const latencyValues = history.map((h) => h.latency);
  const peakLatency = latencyValues.length > 0 ? Math.max(...latencyValues) : metrics.latency;

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1 bg-black text-white select-none">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
              CloudWatch Monitoring
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
              SAMPLING: 2.0s INTERVAL
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Fleet compute, ingress bandwidth, and target response latency metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Segmented Time Range Switcher */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded transition-all ${
                  timeRange === r
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={exportMetrics}
            icon={<Download className="w-3.5 h-3.5" />}
            title="Export time-series metrics as CSV"
          >
            Export CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => tickSimulation()}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Poll
          </Button>
        </div>
      </div>

      {/* Grid of 4 Elevated Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* 1. CPU Chart Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">Fleet CPU Utilization</span>
                <p className="text-[10px] text-neutral-500 font-mono">AWS/EC2 Metric Stream</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-2xl font-bold text-white">
                {metrics.cpuUtilization.toFixed(1)}%
              </div>
              <div className="text-[10px] text-neutral-500">
                Peak: {peakCpu}% • Alarm: &gt; {asgConfig.scaleOutThreshold}%
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="timeLabel" stroke="#737373" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#737373" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={asgConfig.scaleOutThreshold} 
                  stroke="#a3a3a3" 
                  strokeDasharray="3 3" 
                  label={{ value: 'Alarm 70%', fill: '#ffffff', fontSize: 9, position: 'insideTopRight' }} 
                />
                <Area type="monotone" dataKey="cpu" stroke="#ffffff" fill="#ffffff" fillOpacity={0.15} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Memory Chart Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">Memory Allocation</span>
                <p className="text-[10px] text-neutral-500 font-mono">CWAgent RAM %</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-2xl font-bold text-white">
                {metrics.memoryUtilization.toFixed(1)}%
              </div>
              <div className="text-[10px] text-neutral-500">
                512 MB reserved per container
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="timeLabel" stroke="#737373" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#737373" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="memory" stroke="#a3a3a3" fill="#a3a3a3" fillOpacity={0.12} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Ingress Network Chart Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">Ingress Network Throughput</span>
                <p className="text-[10px] text-neutral-500 font-mono">ALB NetworkIn (MB/s & RPS)</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-2xl font-bold text-white">
                {(metrics.requestsPerSecond * 0.45).toFixed(1)} <span className="text-xs font-normal text-neutral-500">MB/s</span>
              </div>
              <div className="text-[10px] text-neutral-500">
                Current: {metrics.requestsPerSecond} req/s • Peak: {peakTraffic} req/s
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="timeLabel" stroke="#737373" fontSize={10} tickLine={false} />
                <YAxis stroke="#737373" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="networkIn" stroke="#ffffff" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Latency Response Time Chart Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Timer className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">Target Response Latency</span>
                <p className="text-[10px] text-neutral-500 font-mono">TargetResponseTime p95 (ms)</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-2xl font-bold text-white">
                {metrics.latency} <span className="text-xs font-normal text-neutral-500">ms</span>
              </div>
              <div className="text-[10px] text-neutral-500">
                Peak: {peakLatency} ms • Target: &lt; 50 ms
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="timeLabel" stroke="#737373" fontSize={10} tickLine={false} />
                <YAxis stroke="#737373" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={50} 
                  stroke="#737373" 
                  strokeDasharray="3 3" 
                  label={{ value: 'SLA 50ms', fill: '#d4d4d4', fontSize: 9, position: 'insideTopRight' }} 
                />
                <Line type="monotone" dataKey="latency" stroke="#a3a3a3" strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
