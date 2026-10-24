import React, { useState } from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { 
  Server, 
  Cpu, 
  Activity, 
  Timer, 
  Network, 
  DollarSign, 
  RefreshCw,
  Flame,
  CheckCircle2,
  Clock,
  Plus,
  Minus
} from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ArchitectureDiagram } from '../components/dashboard/ArchitectureDiagram';
import { UnifiedCharts } from '../components/dashboard/UnifiedCharts';
import { InstanceOverview } from '../components/dashboard/InstanceOverview';
import { ScalingTimeline } from '../components/dashboard/ScalingTimeline';

export const DashboardPage: React.FC = () => {
  const metrics = useSystemStore((state) => state.metrics);
  const instances = useSystemStore((state) => state.instances);
  const timeRange = useSystemStore((state) => state.timeRange);
  const setTimeRange = useSystemStore((state) => state.setTimeRange);
  const tickSimulation = useSystemStore((state) => state.tickSimulation);
  const showToast = useSystemStore((state) => state.showToast);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const loadTest = useSystemStore((state) => state.loadTest);
  const startLoadTest = useSystemStore((state) => state.startLoadTest);
  const stopLoadTest = useSystemStore((state) => state.stopLoadTest);
  const manuallyScale = useSystemStore((state) => state.manuallyScale);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    tickSimulation();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast({
        title: 'Telemetry Refreshed',
        message: 'Polled CloudWatch metrics and ALB target checks.',
        type: 'info',
      });
    }, 300);
  };

  const toggleQuickLoad = () => {
    if (loadTest.isActive) {
      stopLoadTest();
    } else {
      startLoadTest('high', 165);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-2 overflow-hidden select-none bg-black text-white">
      {/* Top Command & Status Bar */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Title & Region */}
        <div className="flex items-center gap-2">
          <h1 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Cloud Infrastructure Operations
          </h1>
          <span className="text-[10px] font-mono text-neutral-300 bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800">
            ap-south-1
          </span>
        </div>

        {/* Center: Live Operational Status */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>ALL TARGETS OPERATIONAL (100% IN-SERVICE)</span>
          </span>
          <span className="text-neutral-700">•</span>
          <span className="text-neutral-400">
            POLICY: TARGET TRACKING (CPU &gt; {asgConfig.scaleOutThreshold}%)
          </span>
          {asgConfig.activeCooldown > 0 && (
            <span className="text-white flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded">
              <Clock className="w-3 h-3" />
              Cooldown: {asgConfig.activeCooldown}s
            </span>
          )}
        </div>

        {/* Right: Controls (Add Node, Test Auto-Scaling, Range, Refresh) */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {/* Quick Manual Add Instance */}
          <button
            onClick={() => manuallyScale('up')}
            disabled={instances.length >= asgConfig.maxInstances}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black hover:bg-neutral-200 border border-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            title="Provision new EC2 worker instance on next available port"
          >
            <Plus className="w-3 h-3" />
            <span>ADD NODE</span>
          </button>

          {/* Scale In */}
          <button
            onClick={() => manuallyScale('down')}
            disabled={instances.length <= asgConfig.minInstances}
            className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Terminate surplus instance"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Quick Auto-Scaling Stress / Surge Test */}
          <button
            onClick={toggleQuickLoad}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
              loadTest.isActive
                ? 'bg-amber-400 text-black border-amber-400 animate-pulse'
                : 'bg-neutral-900 hover:bg-neutral-800 text-amber-300 border-amber-400/40 hover:border-amber-400'
            }`}
            title="Inject 165 req/s load to test Auto-Scaling threshold breach (> 70% CPU)"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{loadTest.isActive ? 'STOP SURGE LOAD' : '⚡ TEST AUTO-SCALING'}</span>
          </button>

          {/* Time range segmented tab group */}
          <div className="flex items-center bg-black p-0.5 rounded border border-neutral-800 ml-1">
            {(['5m', '15m', '30m', '1h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  timeRange === r
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Manual poll */}
          <button
            onClick={handleManualRefresh}
            className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
            title="Poll metrics"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Row 2: Compact 6-Metric Stat Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 shrink-0">
        <MetricCard
          title="Active Fleet"
          value={`${metrics.activeInstances} / ${asgConfig.maxInstances}`}
          change={metrics.activeInstances > 1 ? `+${metrics.activeInstances - 1} scaled` : 'Baseline'}
          isPositiveChange={metrics.activeInstances > 1}
          neutralChange={metrics.activeInstances === 1}
          icon={Server}
        />

        <MetricCard
          title="Avg Instance CPU"
          value={`${metrics.cpuUtilization.toFixed(1)}%`}
          change={metrics.cpuUtilization > 70 ? 'Threshold Alert' : 'Normal Range'}
          isPositiveChange={metrics.cpuUtilization < 70}
          icon={Cpu}
        />

        <MetricCard
          title="Ingress Traffic"
          value={`${metrics.requestsPerSecond} r/s`}
          change={`${(metrics.requestsPerSecond * 0.05).toFixed(1)} MB/s`}
          isPositiveChange={true}
          icon={Activity}
        />

        <MetricCard
          title="Target Latency"
          value={`${metrics.latency} ms`}
          change="p95 Target"
          neutralChange={true}
          icon={Timer}
        />

        <MetricCard
          title="Target Health"
          value={`${metrics.loadBalancerHealth}%`}
          change="0 Unhealthy"
          neutralChange={true}
          icon={Network}
        />

        <MetricCard
          title="Resource Cost"
          value={`$${metrics.estimatedCostPerHour.toFixed(3)}/h`}
          change={`$${(metrics.estimatedCostPerHour * 24 * 30).toFixed(1)}/mo`}
          neutralChange={true}
          icon={DollarSign}
        />
      </div>

      {/* Row 3: Main Split Content Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-2">
        {/* Left Column (7 cols): Architecture & Unified Recharts */}
        <div className="col-span-12 xl:col-span-7 flex flex-col gap-2 min-h-0 h-full">
          {/* Top Half: Architecture Flow */}
          <div className="h-[44%] min-h-0">
            <ArchitectureDiagram />
          </div>

          {/* Bottom Half: Unified Recharts */}
          <div className="h-[56%] min-h-0">
            <UnifiedCharts />
          </div>
        </div>

        {/* Right Column (5 cols): Live Compute Fleet Table & Scaling Audit */}
        <div className="col-span-12 xl:col-span-5 flex flex-col gap-2 min-h-0 h-full">
          {/* Top Half: Fleet Table */}
          <div className="h-[54%] min-h-0">
            <InstanceOverview />
          </div>

          {/* Bottom Half: Scaling Audit Log */}
          <div className="h-[46%] min-h-0">
            <ScalingTimeline />
          </div>
        </div>
      </div>
    </div>
  );
};
