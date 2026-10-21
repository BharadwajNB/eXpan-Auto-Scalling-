import React, { useState } from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Button } from '../components/ui/Button';
import { 
  Play, 
  Square, 
  Flame, 
  Sparkles,
  Sliders,
  Users,
  Activity,
  Timer,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  BarChart2,
  RotateCcw,
  Clock,
  Radio
} from 'lucide-react';
import type { LoadPreset, TrafficPattern } from '../types';
import { PRESET_PROFILES } from '../services/loadTestSimulator';
import { UnifiedCharts } from '../components/dashboard/UnifiedCharts';

export const LoadTestingPage: React.FC = () => {
  const loadTest = useSystemStore((state) => state.loadTest);
  const metrics = useSystemStore((state) => state.metrics);
  const instances = useSystemStore((state) => state.instances);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const startLoadTest = useSystemStore((state) => state.startLoadTest);
  const stopLoadTest = useSystemStore((state) => state.stopLoadTest);
  const setPreset = useSystemStore((state) => state.setPreset);
  const setTrafficPattern = useSystemStore((state) => state.setTrafficPattern);
  const setErrorInjectionRate = useSystemStore((state) => state.setErrorInjectionRate);
  const setDurationLimit = useSystemStore((state) => state.setDurationLimit);

  const [selectedPreset, setSelectedPreset] = useState<LoadPreset>(loadTest.preset);
  const [customRps, setCustomRps] = useState<number>(PRESET_PROFILES[loadTest.preset].targetRps);

  const handlePresetSelect = (preset: LoadPreset) => {
    setSelectedPreset(preset);
    const newTarget = PRESET_PROFILES[preset].targetRps;
    setCustomRps(newTarget);
    if (loadTest.isActive) {
      startLoadTest(preset, newTarget);
    } else {
      setPreset(preset);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCustomRps(val);
    if (loadTest.isActive) {
      startLoadTest(selectedPreset, val);
    }
  };

  const handleToggleTest = () => {
    if (loadTest.isActive) {
      stopLoadTest();
    } else {
      startLoadTest(selectedPreset, customRps);
    }
  };

  const patterns: { id: TrafficPattern; label: string; desc: string }[] = [
    { id: 'constant', label: 'Constant (Steady)', desc: 'Smooth sustained load at target RPS' },
    { id: 'spike', label: 'Surge / Flash Spike', desc: 'Unpredictable rapid traffic bursts' },
    { id: 'staircase', label: 'Step Ramp (Staircase)', desc: 'Increases in stepped intervals' },
    { id: 'sine', label: 'Sinusoidal (Day/Night)', desc: 'Smooth cyclical tidal wave curves' },
  ];

  const durationLimits = [
    { sec: 0, label: 'Continuous' },
    { sec: 30, label: '30s' },
    { sec: 60, label: '60s' },
    { sec: 120, label: '120s' },
    { sec: 300, label: '300s' },
  ];

  const isCpuAboveThreshold = metrics.cpuUtilization >= asgConfig.scaleOutThreshold;

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1 bg-black text-white select-none">
      {/* Top Header & Simulation Master Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
              HTTP Load Testing & Benchmark Engine
            </h1>
            {loadTest.isActive ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-black tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 fill-black text-black" />
                TRAFFIC TEST ACTIVE ({loadTest.elapsedSeconds}s{loadTest.durationLimit > 0 ? ` / ${loadTest.durationLimit}s` : ''})
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400">
                STANDBY (IDLE)
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Dispatches real concurrent HTTP requests against the ALB Gateway (/api/gateway/work) to benchmark fleet elasticity and trigger CloudWatch alarm thresholds.
          </p>
        </div>

        {/* Master Run/Stop Button & Reset */}
        <div className="flex items-center gap-2 font-mono">
          <Button
            variant="secondary"
            size="md"
            onClick={stopLoadTest}
            disabled={!loadTest.isActive && customRps === PRESET_PROFILES.normal.targetRps}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <Button
            variant={loadTest.isActive ? 'danger' : 'primary'}
            size="md"
            onClick={handleToggleTest}
            icon={loadTest.isActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          >
            {loadTest.isActive ? 'Stop Load Test' : 'Start HTTP Load Test'}
          </Button>
        </div>
      </div>

      {/* 4 Workload Preset Cards */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
          <span>Choose Workload Profile:</span>
          <span>Click to switch profiles in real-time</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(Object.keys(PRESET_PROFILES) as LoadPreset[]).map((key) => {
            const profile = PRESET_PROFILES[key];
            const isCurrent = selectedPreset === key;

            return (
              <div
                key={key}
                onClick={() => handlePresetSelect(key)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  isCurrent
                    ? 'border-white bg-neutral-900 shadow-md ring-1 ring-white/20'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      {profile.label}
                    </span>
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  </div>

                  <div className="text-2xl font-bold font-mono text-white">
                    ~{profile.targetRps} <span className="text-xs font-normal text-neutral-500">req/s</span>
                  </div>

                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3 text-neutral-500" />
                    <span>{profile.concurrentUsers} virtual users</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-800 text-[10px] font-mono flex justify-between items-center">
                  <span className="text-neutral-500">Target Scale:</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    profile.targetInstances > 1 
                      ? 'bg-neutral-800 text-white border border-neutral-700' 
                      : 'text-neutral-400'
                  }`}>
                    {profile.targetInstances} {profile.targetInstances > 1 ? 'EC2 (Scale-Out)' : 'EC2 (Floor)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Traffic Waveform Pattern Selector */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
          <span className="flex items-center gap-1.5 text-white font-bold">
            <Radio className="w-3.5 h-3.5" />
            Ingress Traffic Waveform Pattern
          </span>
          <span>Active Wave: {loadTest.pattern.toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {patterns.map((p) => {
            const isPatternActive = loadTest.pattern === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setTrafficPattern(p.id)}
                className={`p-2.5 rounded-lg border text-left transition-all font-mono ${
                  isPatternActive
                    ? 'border-white bg-neutral-900 shadow-sm ring-1 ring-white/20'
                    : 'border-neutral-800 bg-black hover:border-neutral-700 text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-bold ${isPatternActive ? 'text-white' : 'text-neutral-300'}`}>
                    {p.label}
                  </span>
                  {isPatternActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
                <p className="text-[10px] text-neutral-400 font-sans leading-tight">
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granular Sliders & Error Injection & Live Telemetry Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Fine-Tuning Controls (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4 flex flex-col justify-between font-mono">
          {/* Custom RPS Slider Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Target Ingress RPS
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-black border border-neutral-800 text-white">
                {customRps} req/s
              </span>
            </div>

            <div className="space-y-1.5 py-1">
              <input
                type="range"
                min="10"
                max="800"
                step="10"
                value={customRps}
                onChange={handleSliderChange}
                className="w-full accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>10 req/s (Low)</span>
                <span>350 req/s (Trigger)</span>
                <span>800 req/s (Max)</span>
              </div>
            </div>
          </div>

          {/* Synthetic Error Injection Rate Slider */}
          <div className="space-y-2 pt-2 border-t border-neutral-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                  Error Injection (Chaos)
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-black border border-neutral-800 text-white">
                {(loadTest.errorInjectionRate * 100).toFixed(0)}% 5xx
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="0.15"
              step="0.01"
              value={loadTest.errorInjectionRate}
              onChange={(e) => setErrorInjectionRate(Number(e.target.value))}
              className="w-full accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>0% (Clean)</span>
              <span>5% (Degraded)</span>
              <span>15% (Extreme)</span>
            </div>
          </div>

          {/* Test Duration Limit */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-900">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-white" />
                Execution Duration Limit
              </span>
              <span className="text-white font-bold">
                {loadTest.durationLimit === 0 ? 'Continuous' : `${loadTest.durationLimit}s Limit`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-[11px]">
              {durationLimits.map((d) => (
                <button
                  key={d.sec}
                  type="button"
                  onClick={() => setDurationLimit(d.sec)}
                  className={`py-1 rounded text-center font-bold border transition-colors ${
                    loadTest.durationLimit === d.sec
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Live Telemetry Gauges (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="text-[10px] text-neutral-400 uppercase">Incoming Rate</div>
            <div className="text-xl font-bold text-white mt-1">{metrics.requestsPerSecond} req/s</div>
            <div className="text-[10px] text-neutral-500">Target: {loadTest.targetRps}</div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="text-[10px] text-neutral-400 uppercase">Virtual Sockets</div>
            <div className="text-xl font-bold text-white mt-1">{loadTest.concurrentUsers}</div>
            <div className="text-[10px] text-neutral-500">Concurrent pool</div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="text-[10px] text-neutral-400 uppercase">Avg Response Time</div>
            <div className="text-xl font-bold text-white mt-1">{metrics.latency} ms</div>
            <div className="text-[10px] text-neutral-500">p95 latency</div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="text-[10px] text-neutral-400 uppercase">Error Rate</div>
            <div className="text-xl font-bold text-white mt-1">{metrics.errorRate}%</div>
            <div className="text-[10px] text-neutral-500">HTTP 5xx</div>
          </div>
        </div>
      </div>

      {/* Auto-Scaling Feedback Chain Reaction Pipeline */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            Auto-Scaling Closed-Loop Feedback Reaction
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Lifecycle: Ingress → CloudWatch Alarm → Provisioning → Balanced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className={`p-3 rounded-lg border transition-all ${loadTest.isActive ? 'border-white bg-neutral-900 shadow-sm' : 'border-neutral-800 bg-black'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold text-[11px]">1. TRAFFIC SURGE</span>
              {loadTest.isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </div>
            <p className="text-[11px] text-neutral-300 font-sans">
              Ingress spikes to {metrics.requestsPerSecond} req/s through Application Load Balancer.
            </p>
          </div>

          <div className={`p-3 rounded-lg border transition-all ${isCpuAboveThreshold ? 'border-white bg-neutral-900 shadow-sm' : 'border-neutral-800 bg-black'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold text-[11px]">2. CPU ALARM</span>
              {isCpuAboveThreshold && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </div>
            <p className="text-[11px] text-neutral-300 font-sans">
              Fleet CPU reaches {metrics.cpuUtilization.toFixed(1)}% (&gt; {asgConfig.scaleOutThreshold}% threshold).
            </p>
          </div>

          <div className={`p-3 rounded-lg border transition-all ${instances.length > 1 ? 'border-white bg-neutral-900 shadow-sm' : 'border-neutral-800 bg-black'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold text-[11px]">3. ASG SCALE OUT</span>
              {instances.length > 1 && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </div>
            <p className="text-[11px] text-neutral-300 font-sans">
              ASG provisions new EC2 instance ({instances.length} active) & registers target node.
            </p>
          </div>

          <div className={`p-3 rounded-lg border transition-all ${instances.length > 1 && !isCpuAboveThreshold ? 'border-white bg-neutral-900 shadow-sm' : 'border-neutral-800 bg-black'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold text-[11px]">4. LOAD BALANCED</span>
              {instances.length > 1 && !isCpuAboveThreshold && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </div>
            <p className="text-[11px] text-neutral-300 font-sans">
              ALB balances load across all {instances.length} instances. Average CPU drops to healthy zone.
            </p>
          </div>
        </div>
      </div>

      {/* Live Recharts Telemetry */}
      <div className="h-64">
        <UnifiedCharts />
      </div>
    </div>
  );
};
