import React from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Minus,
  Activity,
  Layers,
  Clock,
  ShieldCheck,
  Server,
  Zap,
  Sliders
} from 'lucide-react';
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

export const AutoScalingPage: React.FC = () => {
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const instances = useSystemStore((state) => state.instances);
  const metrics = useSystemStore((state) => state.metrics);
  const history = useSystemStore((state) => state.history);
  const manuallyScale = useSystemStore((state) => state.manuallyScale);
  const bypassCooldown = useSystemStore((state) => state.bypassCooldown);
  const setScalingMetricType = useSystemStore((state) => state.setScalingMetricType);

  const isScalingUp = metrics.scalingState === 'scaling-up';
  const isScalingDown = metrics.scalingState === 'scaling-down';

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1 bg-black text-white select-none">
      {/* Top Header & Elasticity Stepper Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
              Auto Scaling Group (ASG)
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
              TARGET: {asgConfig.metricType.toUpperCase()} ({asgConfig.metricType === 'rps' ? '120 req/s' : `${asgConfig.scaleOutThreshold}%`})
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Dynamic horizontal capacity scaling driven by real-time CloudWatch alarm metric evaluation.
          </p>
        </div>

        {/* Stepper & Status Controls */}
        <div className="flex items-center gap-2 font-mono">
          {/* Target Metric Type Selector */}
          <div className="hidden lg:flex items-center bg-black border border-neutral-800 rounded-lg p-0.5 text-xs">
            {(['cpu', 'rps', 'memory'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setScalingMetricType(m)}
                className={`px-2 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                  asgConfig.metricType === m
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m === 'cpu' ? 'CPU %' : m === 'rps' ? 'RPS / Node' : 'RAM %'}
              </button>
            ))}
          </div>

          {asgConfig.activeCooldown > 0 ? (
            <button
              onClick={bypassCooldown}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border border-white text-white bg-neutral-900 font-bold hover:bg-white hover:text-black transition-colors"
              title="Click to instantly bypass active cooldown timer"
            >
              <Clock className="w-3.5 h-3.5 animate-spin text-current" />
              <span>COOLDOWN: {asgConfig.activeCooldown}s (BYPASS)</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border border-neutral-800 bg-neutral-950 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              EVALUATION READY
            </span>
          )}

          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => manuallyScale('down')}
              disabled={instances.length <= asgConfig.minInstances}
              title={instances.length <= asgConfig.minInstances ? 'Cannot scale below minimum floor (1)' : 'Manual scale-in'}
              icon={<Minus className="w-3.5 h-3.5" />}
            >
              Scale In
            </Button>

            <span className="px-3 text-xs font-bold text-white">
              {instances.length} / {asgConfig.maxInstances}
            </span>

            <Button
              variant="primary"
              size="sm"
              onClick={() => manuallyScale('up')}
              disabled={instances.length >= asgConfig.maxInstances}
              title={instances.length >= asgConfig.maxInstances ? `Maximum capacity ceiling reached (${asgConfig.maxInstances})` : 'Manual scale-out'}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Scale Out
            </Button>
          </div>
        </div>
      </div>

      {/* Capacity Allocation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Desired Fleet</span>
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {asgConfig.desiredInstances} <span className="text-xs font-normal text-neutral-500">EC2</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Target Fleet Capacity</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Minimum Floor</span>
            <Server className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {asgConfig.minInstances} <span className="text-xs font-normal text-neutral-500">EC2</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">HA Baseline Constraint</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Maximum Ceiling</span>
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {asgConfig.maxInstances} <span className="text-xs font-normal text-neutral-500">EC2</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Cost Guardrail Ceiling</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Current In-Service</span>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {instances.length} <span className="text-xs font-normal text-neutral-500">Active</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Fleet Utilization: {metrics.cpuUtilization.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Dynamic Elasticity Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Scale Out Policy */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Scale-Out Policy</span>
                <p className="text-[10px] text-neutral-500 font-mono">Alarm Metric: AWS/EC2/CPUUtilization</p>
              </div>
            </div>
            <Badge variant={isScalingUp ? 'inverted' : 'slate'} dot={isScalingUp} size="sm">
              {isScalingUp ? 'ALARM TRIGGERED' : 'MONITORING'}
            </Badge>
          </div>

          <div className="bg-black p-3.5 rounded-lg border border-neutral-800 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
              <span className="text-neutral-500 text-[10px] uppercase">TRIGGER CONDITION (IF):</span>
              <span className="text-white font-bold">Average Fleet CPU &gt; {asgConfig.scaleOutThreshold}%</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
              <span className="text-neutral-500 text-[10px] uppercase">AUTOMATION ACTION (THEN):</span>
              <span className="text-neutral-200 font-bold">+1 EC2 Instance Launch</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 text-[10px] uppercase">COOLDOWN WINDOW:</span>
              <span className="text-white">{asgConfig.cooldownSeconds} seconds</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
            <span>Evaluation Period: 1 consecutive check (10s)</span>
            <span className="text-white">Current CPU: {metrics.cpuUtilization.toFixed(1)}%</span>
          </div>
        </div>

        {/* Scale In Policy */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <ArrowDownRight className="w-3.5 h-3.5 text-neutral-300" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Scale-In Policy</span>
                <p className="text-[10px] text-neutral-500 font-mono">Cost Optimization: Graceful Termination</p>
              </div>
            </div>
            <Badge variant={isScalingDown ? 'inverted' : 'slate'} dot={isScalingDown} size="sm">
              {isScalingDown ? 'DRAINING ACTIVE' : 'MONITORING'}
            </Badge>
          </div>

          <div className="bg-black p-3.5 rounded-lg border border-neutral-800 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
              <span className="text-neutral-500 text-[10px] uppercase">TRIGGER CONDITION (IF):</span>
              <span className="text-white font-bold">Average Fleet CPU &lt; {asgConfig.scaleInThreshold}%</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
              <span className="text-neutral-500 text-[10px] uppercase">AUTOMATION ACTION (THEN):</span>
              <span className="text-neutral-200 font-bold">-1 EC2 Graceful Termination</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 text-[10px] uppercase">DRAIN DURATION:</span>
              <span className="text-white">30 seconds graceful</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
            <span>Deregistration Delay: Sockets gracefully completed</span>
            <span className="text-white">Floor: {asgConfig.minInstances} EC2 protected</span>
          </div>
        </div>
      </div>

      {/* Capacity Scaling History (Step Graph) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Fleet Capacity History (Step Curve)
            </span>
            <p className="text-[10px] text-neutral-500 font-mono">
              Visualizes real-time horizontal scaling transitions between baseline floor and maximum ceiling.
            </p>
          </div>
          <span className="text-xs font-mono text-white font-bold px-2 py-0.5 rounded bg-black border border-neutral-800">
            {instances.length} / {asgConfig.maxInstances} Active Instances
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#737373" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[0, asgConfig.maxInstances + 1]} stroke="#737373" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip />
              <ReferenceLine y={asgConfig.maxInstances} stroke="#a3a3a3" strokeDasharray="3 3" label={{ value: `Max Ceiling (${asgConfig.maxInstances})`, fill: '#ffffff', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={asgConfig.minInstances} stroke="#737373" strokeDasharray="3 3" label={{ value: `Min Floor (${asgConfig.minInstances})`, fill: '#d4d4d4', fontSize: 9, position: 'insideBottomRight' }} />
              <Area type="stepAfter" dataKey="instances" stroke="#ffffff" strokeWidth={2} fill="#ffffff" fillOpacity={0.12} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
