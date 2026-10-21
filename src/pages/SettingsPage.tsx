import React, { useState } from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Button } from '../components/ui/Button';
import { 
  Save, 
  Layers, 
  Globe, 
  Check, 
  Cloud,
  Send,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Server,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface ElasticityPreset {
  name: string;
  tagline: string;
  min: number;
  max: number;
  scaleOut: number;
  scaleIn: number;
  cooldown: number;
}

const PRESET_POLICIES: ElasticityPreset[] = [
  {
    name: 'Production Standard',
    tagline: 'Balanced elasticity & cost guardrails',
    min: 1,
    max: 4,
    scaleOut: 70,
    scaleIn: 30,
    cooldown: 60,
  },
  {
    name: 'Aggressive High-Load',
    tagline: 'Rapid auto-scaling for flash surges',
    min: 2,
    max: 6,
    scaleOut: 60,
    scaleIn: 25,
    cooldown: 30,
  },
  {
    name: 'Cost-Conservative (Eco)',
    tagline: 'Tight bounds & higher capacity thresholds',
    min: 1,
    max: 2,
    scaleOut: 85,
    scaleIn: 40,
    cooldown: 120,
  },
];

export const SettingsPage: React.FC = () => {
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const updateAsgConfig = useSystemStore((state) => state.updateAsgConfig);
  const simulationSpeed = useSystemStore((state) => state.simulationSpeed);
  const setSimulationSpeed = useSystemStore((state) => state.setSimulationSpeed);
  const environment = useSystemStore((state) => state.environment);
  const setEnvironment = useSystemStore((state) => state.setEnvironment);
  const region = useSystemStore((state) => state.region);
  const setRegion = useSystemStore((state) => state.setRegion);
  const lbInfo = useSystemStore((state) => state.lbInfo);
  const setHealthCheckPath = useSystemStore((state) => state.setHealthCheckPath);
  const setDeregistrationDelay = useSystemStore((state) => state.setDeregistrationDelay);
  const toggleStickiness = useSystemStore((state) => state.toggleStickiness);
  const setScalingMetricType = useSystemStore((state) => state.setScalingMetricType);
  const showToast = useSystemStore((state) => state.showToast);

  const [engineMode, setEngineMode] = useState<'cluster' | 'aws'>('cluster');
  const [minInstances, setMinInstances] = useState(asgConfig.minInstances);
  const [maxInstances, setMaxInstances] = useState(asgConfig.maxInstances);
  const [scaleOutThreshold, setScaleOutThreshold] = useState(asgConfig.scaleOutThreshold);
  const [scaleInThreshold, setScaleInThreshold] = useState(asgConfig.scaleInThreshold);
  const [cooldownSeconds, setCooldownSeconds] = useState(asgConfig.cooldownSeconds);
  const [healthPathInput, setHealthPathInput] = useState(lbInfo.healthCheckPath || '/health');
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || '/api');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const applyPreset = (preset: ElasticityPreset) => {
    setMinInstances(preset.min);
    setMaxInstances(preset.max);
    setScaleOutThreshold(preset.scaleOut);
    setScaleInThreshold(preset.scaleIn);
    setCooldownSeconds(preset.cooldown);

    showToast({
      title: `${preset.name} Preset Applied`,
      message: `Configured Min: ${preset.min}, Max: ${preset.max}, Out: ${preset.scaleOut}%, In: ${preset.scaleIn}%, Cooldown: ${preset.cooldown}s. Click Save to persist.`,
      type: 'info',
    });
  };

  const handleResetDefaults = () => {
    applyPreset(PRESET_POLICIES[0]);
    setEnvironment('production');
    setRegion('ap-south-1');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate bounds
    if (minInstances >= maxInstances) {
      showToast({
        title: 'Validation Error',
        message: 'Minimum instances floor must be less than maximum capacity ceiling.',
        type: 'alert',
      });
      return;
    }

    if (scaleInThreshold >= scaleOutThreshold) {
      showToast({
        title: 'Validation Error',
        message: 'Scale-in threshold must be lower than scale-out threshold to avoid thrashing.',
        type: 'alert',
      });
      return;
    }

    updateAsgConfig({
      minInstances: Number(minInstances),
      maxInstances: Number(maxInstances),
      scaleOutThreshold: Number(scaleOutThreshold),
      scaleInThreshold: Number(scaleInThreshold),
      cooldownSeconds: Number(cooldownSeconds),
    });

    setSavedSuccess(true);
    showToast({
      title: 'Configuration Applied',
      message: 'Auto-scaling policies and CloudWatch evaluation thresholds updated.',
      type: 'success',
    });

    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsPinging(true);
    setPingStatus('idle');

    try {
      const res = await fetch(`${apiUrl}/metrics/system`);
      if (res.ok) {
        setPingStatus('success');
        showToast({
          title: 'Connection Verified',
          message: `Endpoint ${apiUrl}/metrics/system responded with HTTP 200 OK.`,
          type: 'success',
        });
      } else {
        setPingStatus('error');
        showToast({
          title: 'Connection Warning',
          message: `Endpoint responded with status HTTP ${res.status}.`,
          type: 'warning',
        });
      }
    } catch (e: any) {
      setPingStatus('error');
      showToast({
        title: 'Connection Failed',
        message: `Could not reach ${apiUrl}: ${e.message}`,
        type: 'alert',
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="h-full overflow-y-auto space-y-4 pr-1 bg-black text-white select-none">
      {/* Top Header & Save Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
              Settings & Elasticity Policies
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
              CONFIG ENGINE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure horizontal auto-scaling thresholds, regional deployment targets, and backend telemetry parameters.
          </p>
        </div>

        {/* Action Controls Group */}
        <div className="flex items-center gap-2 font-mono">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleResetDefaults}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Defaults
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          >
            {savedSuccess ? 'Changes Applied' : 'Save Policies'}
          </Button>
        </div>
      </div>

      {/* Preset Elasticity Profiles Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-white" />
            Quick Policy Profiles:
          </span>
          <span>Click to populate thresholds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {PRESET_POLICIES.map((preset) => {
            const isMatch =
              minInstances === preset.min &&
              maxInstances === preset.max &&
              scaleOutThreshold === preset.scaleOut &&
              scaleInThreshold === preset.scaleIn &&
              cooldownSeconds === preset.cooldown;

            return (
              <div
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isMatch
                    ? 'border-white bg-neutral-900 shadow-sm ring-1 ring-white/20'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      {preset.name}
                    </span>
                    {isMatch && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans">{preset.tagline}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-850 flex items-center justify-between text-[10px] font-mono text-neutral-300">
                  <span>Capacity: {preset.min}-{preset.max} EC2</span>
                  <span>CPU: {preset.scaleIn}% / {preset.scaleOut}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Responsive Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Column 1: Auto Scaling Group (ASG) Thresholds & Policy */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Auto Scaling Group (ASG) Guardrails
              </span>
              <p className="text-[10px] text-neutral-500 font-mono">Dynamic Horizontal Elasticity Constraints</p>
            </div>
          </div>

          {/* Target Tracking Metric Type Selector */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-neutral-400 block text-[10px] uppercase font-bold">
              TARGET TRACKING ALARM METRIC
            </label>
            <div className="grid grid-cols-3 gap-2 bg-black p-1 rounded-lg border border-neutral-800">
              {(['cpu', 'rps', 'memory'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setScalingMetricType(m)}
                  className={`py-1.5 rounded text-xs uppercase font-bold transition-all ${
                    asgConfig.metricType === m
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {m === 'cpu' ? 'Fleet CPU %' : m === 'rps' ? 'RPS / Node' : 'Memory %'}
                </button>
              ))}
            </div>
          </div>

          {/* Min & Max Capacity Steppers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="bg-black p-3 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-[10px] uppercase font-bold">MINIMUM CAPACITY (FLOOR)</span>
                <Server className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMinInstances(Math.max(1, minInstances - 1))}
                  className="w-7 h-7 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-bold border border-neutral-700 flex items-center justify-center"
                >
                  -
                </button>
                <div className="text-xl font-bold text-white">
                  {minInstances} <span className="text-xs font-normal text-neutral-500">EC2</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMinInstances(Math.min(maxInstances - 1, minInstances + 1))}
                  className="w-7 h-7 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-bold border border-neutral-700 flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                High-availability floor constraint: minimum active nodes.
              </p>
            </div>

            <div className="bg-black p-3 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-[10px] uppercase font-bold">MAXIMUM CAPACITY (CEILING)</span>
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMaxInstances(Math.max(minInstances + 1, maxInstances - 1))}
                  className="w-7 h-7 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-bold border border-neutral-700 flex items-center justify-center"
                >
                  -
                </button>
                <div className="text-xl font-bold text-white">
                  {maxInstances} <span className="text-xs font-normal text-neutral-500">EC2</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMaxInstances(Math.min(8, maxInstances + 1))}
                  className="w-7 h-7 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-bold border border-neutral-700 flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                Budget guardrail ceiling: limits maximum EC2 scaling.
              </p>
            </div>
          </div>

          {/* Scale-Out Threshold Slider */}
          <div className="space-y-2 bg-black p-3 rounded-lg border border-neutral-800 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 text-[10px] uppercase font-bold">
                SCALE-OUT CPU THRESHOLD (ALARM)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-white">
                &gt; {scaleOutThreshold}% CPU
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="90"
              step="5"
              value={scaleOutThreshold}
              onChange={(e) => setScaleOutThreshold(Number(e.target.value))}
              className="w-full accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>40% (Aggressive)</span>
              <span>70% (Standard)</span>
              <span>90% (Maximum)</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans pt-1">
              Launches +1 EC2 instance when average cluster CPU exceeds this threshold.
            </p>
          </div>

          {/* Scale-In Threshold Slider */}
          <div className="space-y-2 bg-black p-3 rounded-lg border border-neutral-800 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 text-[10px] uppercase font-bold">
                SCALE-IN CPU THRESHOLD (DRAIN)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-white">
                &lt; {scaleInThreshold}% CPU
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="5"
              value={scaleInThreshold}
              onChange={(e) => setScaleInThreshold(Number(e.target.value))}
              className="w-full accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>15% (Deep Idle)</span>
              <span>30% (Standard)</span>
              <span>50% (High Floor)</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans pt-1">
              Gracefully drains and terminates 1 surplus node when average CPU drops below this threshold.
            </p>
          </div>

          {/* Cooldown Period Input with Chips */}
          <div className="bg-black p-3 rounded-lg border border-neutral-800 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 text-[10px] uppercase font-bold">
                COOLDOWN PERIOD WINDOW
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-white">
                {cooldownSeconds}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[30, 60, 120, 300].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setCooldownSeconds(sec)}
                  className={`flex-1 py-1 rounded text-xs font-bold border transition-colors ${
                    cooldownSeconds === sec
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-500 font-sans">
              Freeze duration following scaling activity to prevent oscillation and rapid thrashing.
            </p>
          </div>
        </div>

        {/* Column 2: Cloud Infrastructure & Networking */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Cloud Deployment & VPC Network
              </span>
              <p className="text-[10px] text-neutral-500 font-mono">Infrastructure Topology & Health Probes</p>
            </div>
          </div>

          {/* Environment Segmented Buttons */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-neutral-400 block text-[10px] uppercase font-bold">
              DEPLOYMENT ENVIRONMENT
            </label>
            <div className="grid grid-cols-3 gap-2 bg-black p-1 rounded-lg border border-neutral-800">
              {(['production', 'staging', 'development'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setEnvironment(env)}
                  className={`py-1.5 rounded text-xs uppercase font-bold transition-all ${
                    environment === env
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* AWS Region Segmented Cards */}
          <div className="space-y-1.5 font-mono text-xs">
            <label className="text-neutral-400 block text-[10px] uppercase font-bold">
              AWS REGIONAL VPC
            </label>
            <div className="space-y-2">
              {[
                { id: 'ap-south-1', name: 'ap-south-1 (Mumbai)', zones: 'Dual-AZ (1a, 1b)', ping: '~12ms' },
                { id: 'us-east-1', name: 'us-east-1 (N. Virginia)', zones: 'Multi-AZ (1a, 1b, 1c)', ping: '~120ms' },
                { id: 'eu-west-1', name: 'eu-west-1 (Ireland)', zones: 'Multi-AZ (1a, 1b)', ping: '~95ms' },
              ].map((r) => {
                const isSelected = region === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-white bg-neutral-900 shadow-sm'
                        : 'border-neutral-800 bg-black hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{r.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-sans mt-0.5">{r.zones}</div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {r.ping}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Group Specifications */}
          <div className="bg-black p-3.5 rounded-lg border border-neutral-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-[10px] uppercase font-bold">
                TARGET GROUP & ALB TUNING
              </span>
              <span className="text-[10px] text-neutral-500">tg-expan-prod</span>
            </div>

            {/* Health Check Path Input */}
            <div className="space-y-1">
              <label className="text-neutral-400 text-[10px] uppercase block font-bold">
                Health Probe Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={healthPathInput}
                  onChange={(e) => setHealthPathInput(e.target.value)}
                  placeholder="/health"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-white font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setHealthCheckPath(healthPathInput)}
                >
                  Apply Path
                </Button>
              </div>
            </div>

            {/* Deregistration Delay & Stickiness */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-900">
              <div className="p-2.5 rounded bg-neutral-950 border border-neutral-850 space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-500 uppercase">DRAIN DELAY</span>
                  <span className="text-white font-bold">{lbInfo.deregistrationDelay}s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="10"
                  value={lbInfo.deregistrationDelay}
                  onChange={(e) => setDeregistrationDelay(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer h-1 bg-neutral-800 rounded appearance-none"
                />
              </div>

              <div 
                onClick={toggleStickiness}
                className="p-2.5 rounded bg-neutral-950 border border-neutral-850 flex flex-col justify-between cursor-pointer hover:border-neutral-700 transition-colors"
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-500 uppercase">COOKIE STICKINESS</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${lbInfo.stickinessEnabled ? 'bg-white' : 'bg-neutral-600'}`} />
                </div>
                <span className="text-white font-bold text-xs">
                  {lbInfo.stickinessEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Simulation Engine & Backend Integration */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Cloud className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Backend & Simulation Integration Engine
              </span>
              <p className="text-[10px] text-neutral-500 font-mono">Telemetry Data Ingestion & Live AWS Gateway Mode</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-neutral-500 text-[10px] uppercase">Engine Mode:</span>
            <div className="flex items-center bg-black p-0.5 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setEngineMode('cluster')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  engineMode === 'cluster'
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ● CLUSTER ENGINE
              </button>
              <button
                type="button"
                onClick={() => setEngineMode('aws')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  engineMode === 'aws'
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ○ AWS CONNECTOR
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Polling Accelerators */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-bold">
            <span>Telemetry Sampling & Polling Rate</span>
            <span className="text-white">Active: {simulationSpeed} Rate</span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-black p-1 rounded-lg border border-neutral-800">
            {(['1x', '2x', '4x'] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSimulationSpeed(spd)}
                className={`py-2 px-3 rounded text-left transition-all ${
                  simulationSpeed === spd
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold uppercase">
                  {spd === '1x' ? '1x Normal' : spd === '2x' ? '2x Fast' : '4x Turbo'}
                </div>
                <div className="text-[10px] opacity-75 font-sans">
                  {spd === '1x' ? '2.0s interval' : spd === '2x' ? '1.0s interval' : '0.5s instant'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* API Endpoint & Diagnostics */}
        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-neutral-400 block mb-1.5 text-[10px] uppercase font-bold">
              API GATEWAY ENDPOINT (VITE_API_BASE_URL)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.yourexpan.com/v1"
                className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-white transition-colors font-mono"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                loading={isPinging}
                icon={<Send className="w-3 h-3" />}
              >
                Test Endpoint
              </Button>
            </div>
          </div>

          {/* Diagnostic Status Box */}
          <div className="bg-black p-3 rounded-lg border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white font-bold">Diagnostic Status: Ready</span>
            </div>
            <div className="flex items-center gap-4 text-neutral-400 text-[10px]">
              <span>Protocol: TLS 1.3 / HTTPS</span>
              <span>CORS: Allowed</span>
              <span className="text-white">Latency: 14ms (p95)</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
