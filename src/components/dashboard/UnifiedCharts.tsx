import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { useSystemStore } from '../../store/useSystemStore';
import { AlertTriangle } from 'lucide-react';

export const UnifiedCharts: React.FC = () => {
  const history = useSystemStore((state) => state.history);
  const metrics = useSystemStore((state) => state.metrics);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const chartViewMode = useSystemStore((state) => state.chartViewMode);
  const setChartViewMode = useSystemStore((state) => state.setChartViewMode);

  const isAboveThreshold = metrics.cpuUtilization >= asgConfig.scaleOutThreshold;

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 flex flex-col justify-between h-full min-h-0">
      {/* Header with View Tabs */}
      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            {chartViewMode === 'traffic' ? 'Ingress Request Rate' : 'CPU Utilization & Thresholds'}
          </span>
          {isAboveThreshold && chartViewMode !== 'traffic' && (
            <span className="text-[10px] font-mono bg-white text-black font-bold px-1.5 py-0.2 rounded border border-white flex items-center gap-1">
              &gt; {asgConfig.scaleOutThreshold}% Alert
            </span>
          )}
        </div>

        {/* Tab switchers: Split, CPU, Traffic */}
        <div className="flex items-center bg-black p-0.5 rounded border border-neutral-800 text-[10px] font-mono">
          <button
            onClick={() => setChartViewMode('split')}
            className={`px-2 py-0.5 rounded transition-colors ${
              chartViewMode === 'split'
                ? 'bg-white text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setChartViewMode('cpu')}
            className={`px-2 py-0.5 rounded transition-colors ${
              chartViewMode === 'cpu'
                ? 'bg-white text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            CPU
          </button>
          <button
            onClick={() => setChartViewMode('traffic')}
            className={`px-2 py-0.5 rounded transition-colors ${
              chartViewMode === 'traffic'
                ? 'bg-white text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Traffic
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-0 pt-1.5">
        <ResponsiveContainer width="100%" height="100%">
          {chartViewMode === 'traffic' ? (
            <AreaChart data={history} margin={{ top: 5, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="trafficBwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#525252" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#525252" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-black p-2 rounded border border-neutral-700 text-[10px] font-mono shadow-md">
                        <div className="text-neutral-400">{d.timeLabel}</div>
                        <div className="text-white font-bold">{d.requests} req/s</div>
                        <div className="text-neutral-400">Latency: {d.latency} ms</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="requests" stroke="#ffffff" strokeWidth={1.5} fill="url(#trafficBwGrad)" isAnimationActive={false} />
            </AreaChart>
          ) : chartViewMode === 'cpu' ? (
            <AreaChart data={history} margin={{ top: 5, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuBwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#525252" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#525252" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-black p-2 rounded border border-neutral-700 text-[10px] font-mono shadow-md">
                        <div className="text-neutral-400">{d.timeLabel}</div>
                        <div className="text-white font-bold">CPU: {d.cpu.toFixed(1)}%</div>
                        <div className="text-neutral-400">Fleet: {d.instances} EC2</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={asgConfig.scaleOutThreshold} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: `70% ALARM`, fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={asgConfig.scaleInThreshold} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: `30% IN`, fill: '#10b981', fontSize: 9, position: 'insideBottomRight' }} />
              <Area type="monotone" dataKey="cpu" stroke={isAboveThreshold ? '#ef4444' : '#ffffff'} strokeWidth={1.8} fill="url(#cpuBwGrad)" isAnimationActive={false} />
            </AreaChart>
          ) : (
            // Split dual metrics: CPU (solid line) and Traffic (neutral dashed line)
            <AreaChart data={history} margin={{ top: 5, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="splitCpuBwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isAboveThreshold ? '#ef4444' : '#ffffff'} stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#525252" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#525252" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-black p-2 rounded border border-neutral-700 text-[10px] font-mono shadow-md">
                        <div className="text-neutral-400">{d.timeLabel}</div>
                        <div className="text-white font-bold">CPU: {d.cpu.toFixed(1)}%</div>
                        <div className="text-neutral-300">Traffic: {d.requests} req/s</div>
                        <div className="text-neutral-400">Instances: {d.instances}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={asgConfig.scaleOutThreshold} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: `70% ALARM`, fill: '#ef4444', fontSize: 8 }} />
              <ReferenceLine y={asgConfig.scaleInThreshold} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: `30% IN`, fill: '#10b981', fontSize: 8 }} />
              <Area type="monotone" dataKey="cpu" stroke={isAboveThreshold ? '#ef4444' : '#ffffff'} strokeWidth={1.8} fill="url(#splitCpuBwGrad)" isAnimationActive={false} />
              <Area type="monotone" dataKey="requests" stroke="#737373" strokeWidth={1.5} fill="none" strokeDasharray="3 3" isAnimationActive={false} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Sub-bar */}
      <div className="pt-1.5 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            CPU: <strong className="text-white font-medium">{metrics.cpuUtilization.toFixed(1)}%</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            Rate: <strong className="text-white font-medium">{metrics.requestsPerSecond} req/s</strong>
          </span>
        </div>
        <div className="text-neutral-400 hidden sm:block">
          ASG Cooldown: {asgConfig.activeCooldown > 0 ? `${asgConfig.activeCooldown}s` : 'Idle'}
        </div>
      </div>
    </div>
  );
};
