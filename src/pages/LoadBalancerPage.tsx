import React, { useState } from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Network, 
  CheckCircle2, 
  Globe, 
  Send, 
  Eye,
  Sliders,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Clock,
  Lock
} from 'lucide-react';

export const LoadBalancerPage: React.FC = () => {
  const lbInfo = useSystemStore((state) => state.lbInfo);
  const instances = useSystemStore((state) => state.instances);
  const metrics = useSystemStore((state) => state.metrics);
  const selectInstance = useSystemStore((state) => state.selectInstance);
  const setLbAlgorithm = useSystemStore((state) => state.setLbAlgorithm);
  const toggleStickiness = useSystemStore((state) => state.toggleStickiness);
  const setDeregistrationDelay = useSystemStore((state) => state.setDeregistrationDelay);
  const setHealthCheckPath = useSystemStore((state) => state.setHealthCheckPath);
  const sendTestProbe = useSystemStore((state) => state.sendTestProbe);
  const showToast = useSystemStore((state) => state.showToast);

  const [crossZone, setCrossZone] = useState(true);
  const [copiedDns, setCopiedDns] = useState(false);
  const [probeInputPath, setProbeInputPath] = useState(lbInfo.healthCheckPath || '/health');

  const healthyCount = instances.filter((i) => i.status === 'healthy').length;

  const toggleCrossZone = () => {
    setCrossZone(!crossZone);
    showToast({
      title: 'Configuration Updated',
      message: `Cross-zone load balancing is now ${!crossZone ? 'ENABLED' : 'DISABLED'}.`,
      type: 'info',
    });
  };

  const copyDns = () => {
    navigator.clipboard.writeText(lbInfo.dnsName);
    setCopiedDns(true);
    showToast({
      title: 'DNS Copied',
      message: `${lbInfo.dnsName} copied to clipboard.`,
      type: 'info',
    });
    setTimeout(() => setCopiedDns(false), 2000);
  };

  const handleApplyPath = (path: string) => {
    setProbeInputPath(path);
    setHealthCheckPath(path);
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1 bg-black text-white select-none font-mono">
      {/* Top Header & Probe Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
              Application Load Balancer (ALB)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
              LAYER 7 • DUALSTACK
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 font-sans">
            HTTP/HTTPS request routing, health check evaluation, session affinity, and dynamic traffic distribution.
          </p>
        </div>

        {/* Action Controls Group */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={copyDns}
            icon={copiedDns ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedDns ? 'Copied DNS' : 'Copy DNS'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={sendTestProbe}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Send Health Probe
          </Button>
        </div>
      </div>

      {/* 4 ALB Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Load Balancer Status</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white flex items-center gap-1.5">
              <span>Healthy</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Dual-AZ (ap-south-1a/b)</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Ingress Request Rate</span>
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">
              {metrics.requestsPerSecond} <span className="text-xs font-normal text-neutral-500">req/s</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Across {healthyCount} target workers</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Active TCP Sockets</span>
            <Network className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">
              {lbInfo.activeConnections} <span className="text-xs font-normal text-neutral-500">TCP</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Keep-alive pool enabled</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Target Health</span>
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">
              {healthyCount} / {instances.length} <span className="text-xs font-normal text-neutral-500">In-Service</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">{instances.length - healthyCount} Unhealthy • 0 Draining</div>
          </div>
        </div>
      </div>

      {/* Algorithm & Ingress Endpoint Configuration Deck */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">ALB Ingress Router</span>
              <p className="text-[10px] text-neutral-500">Port 80 HTTP / Port 443 HTTPS Listener</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Cross-Zone balancing toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 text-[10px] uppercase">Cross-Zone:</span>
              <button
                onClick={toggleCrossZone}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  crossZone
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                }`}
              >
                {crossZone ? 'ENABLED (DUAL-AZ)' : 'DISABLED'}
              </button>
            </div>

            {/* Session Stickiness toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 text-[10px] uppercase">Stickiness:</span>
              <button
                onClick={toggleStickiness}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                  lbInfo.stickinessEnabled
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                }`}
                title="Cookie-based target session affinity"
              >
                <Lock className="w-2.5 h-2.5" />
                {lbInfo.stickinessEnabled ? 'STICKY ON' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>

        {/* Algorithm Segmented Selector Cards */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
            Target Group Routing Algorithm:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div
              onClick={() => setLbAlgorithm('Least Outstanding Requests')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                lbInfo.algorithm === 'Least Outstanding Requests'
                  ? 'border-white bg-neutral-900 shadow-sm'
                  : 'border-neutral-800 bg-black hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Least Outstanding Requests (Recommended)
                </span>
                {lbInfo.algorithm === 'Least Outstanding Requests' && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-sans mt-1">
                Directs new requests to the instance with the lowest active concurrent request count. Best for auto-scaled microservices.
              </p>
            </div>

            <div
              onClick={() => setLbAlgorithm('Round Robin')}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                lbInfo.algorithm === 'Round Robin'
                  ? 'border-white bg-neutral-900 shadow-sm'
                  : 'border-neutral-800 bg-black hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Round Robin (Sequential)
                </span>
                {lbInfo.algorithm === 'Round Robin' && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-sans mt-1">
                Distributes incoming requests equally in sequential cyclical order across all registered healthy targets.
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Target Group Tuning Strip (Deregistration Delay & Health Check Path) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Deregistration Delay */}
          <div className="bg-black p-3 rounded-lg border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400 uppercase font-bold">
                DEREGISTRATION DRAIN DELAY
              </span>
              <span className="text-xs font-bold text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                {lbInfo.deregistrationDelay}s
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="10"
              value={lbInfo.deregistrationDelay}
              onChange={(e) => setDeregistrationDelay(Number(e.target.value))}
              className="w-full accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-neutral-500 font-sans">
              Seconds ALB waits for in-flight requests to complete before terminating a scaled-in target.
            </p>
          </div>

          {/* Health Check Path Selector */}
          <div className="bg-black p-3 rounded-lg border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400 uppercase font-bold">
                HEALTH CHECK PATH
              </span>
              <span className="text-xs font-bold text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                GET {lbInfo.healthCheckPath}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {['/health', '/api/v1/health', '/ping'].map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => handleApplyPath(path)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors ${
                    lbInfo.healthCheckPath === path
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {path}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-500 font-sans">
              HTTP endpoint tested by ALB every 10 seconds to verify target health.
            </p>
          </div>
        </div>

        {/* DNS Endpoint Strip */}
        <div className="bg-black p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-neutral-500 text-[10px] uppercase shrink-0">ALB CNAME:</span>
            <span className="text-white font-semibold truncate">{lbInfo.dnsName}</span>
          </div>
          <button
            onClick={copyDns}
            className="text-[10px] text-neutral-400 hover:text-white shrink-0 flex items-center gap-1 border border-neutral-800 px-2 py-0.5 rounded bg-neutral-900"
          >
            {copiedDns ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Real-time Traffic Split Distribution */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Live Ingress Traffic Allocation ({lbInfo.algorithm})
            </span>
            <p className="text-[10px] text-neutral-500">
              Real-time request distribution across registered worker nodes.
            </p>
          </div>
          <span className="text-xs text-white font-bold px-2 py-0.5 rounded bg-black border border-neutral-800">
            Total Ingress: {metrics.requestsPerSecond} req/s
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {instances.map((inst, index) => {
            const totalRps = Math.max(1, instances.reduce((a, b) => a + b.requestsPerSecond, 0));
            const sharePct = Math.round((inst.requestsPerSecond / totalRps) * 100);

            return (
              <div
                key={inst.id}
                onClick={() => selectInstance(inst)}
                className="bg-black border border-neutral-800 hover:border-neutral-600 p-3 rounded-xl cursor-pointer transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Worker #{index + 1}</span>
                  <span className="text-[10px] text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    {sharePct}% Share
                  </span>
                </div>

                <div className="text-[10px] text-neutral-400 truncate">
                  {inst.id} • {inst.availabilityZone}
                </div>

                {/* Micro Share Progress Track */}
                <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>

                <div className="pt-1.5 border-t border-neutral-800/80 flex justify-between items-center text-xs">
                  <span className="text-neutral-500 text-[10px]">ROUTED RPS:</span>
                  <span className="text-white font-bold">{inst.requestsPerSecond} req/s</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Group Health Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-black">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Target Group: tg-expan-prod
            </span>
            <p className="text-[10px] text-neutral-500">Protocol: HTTP/1.1 • Port 80 • Target Type: instance</p>
          </div>
          <span className="text-[10px] text-white px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900">
            {healthyCount} Targets In-Service
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-black text-neutral-400 uppercase text-[9px] tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Target Node / IP</th>
              <th className="py-2.5 px-3 font-semibold">Port</th>
              <th className="py-2.5 px-3 font-semibold">Health Probe</th>
              <th className="py-2.5 px-3 font-semibold">Evaluation Interval</th>
              <th className="py-2.5 px-3 font-semibold">Latency</th>
              <th className="py-2.5 px-3 font-semibold">Target Status</th>
              <th className="py-2.5 px-3 font-semibold text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {instances.map((inst) => (
              <tr key={inst.id} className="hover:bg-neutral-900/50 transition-colors">
                <td className="py-2.5 px-3 font-bold text-white">
                  <span>{inst.id}</span>
                  <span className="text-[10px] font-normal text-neutral-400 ml-1.5">({inst.privateIp})</span>
                </td>
                <td className="py-2.5 px-3 text-white">80 TCP</td>
                <td className="py-2.5 px-3 text-neutral-300">GET {lbInfo.healthCheckPath} ({inst.status === 'healthy' ? 'HTTP 200 OK' : 'HTTP 504 Timeout'})</td>
                <td className="py-2.5 px-3 text-neutral-400">10s (2 checks)</td>
                <td className="py-2.5 px-3 text-white font-semibold">12 ms</td>
                <td className="py-2.5 px-3">
                  <Badge variant={inst.status === 'healthy' ? 'slate' : 'inverted'} dot size="sm">
                    {inst.status === 'healthy' ? 'IN-SERVICE' : 'UNHEALTHY'}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => selectInstance(inst)}
                    className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 text-[10px] inline-flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
