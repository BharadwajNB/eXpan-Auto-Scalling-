import React, { useState } from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Trash2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Terminal,
  Activity,
  RefreshCw
} from 'lucide-react';

export const InstanceDrawer: React.FC = () => {
  const selectedInstance = useSystemStore((state) => state.selectedInstance);
  const selectedInstanceLogs = useSystemStore((state) => state.selectedInstanceLogs);
  const isLoadingLogs = useSystemStore((state) => state.isLoadingLogs);
  const selectInstance = useSystemStore((state) => state.selectInstance);
  const fetchInstanceLogs = useSystemStore((state) => state.fetchInstanceLogs);
  const terminateInstanceManually = useSystemStore((state) => state.terminateInstanceManually);
  const simulateInstanceFailure = useSystemStore((state) => state.simulateInstanceFailure);
  const injectInstanceCpuStress = useSystemStore((state) => state.injectInstanceCpuStress);
  const rebootInstance = useSystemStore((state) => state.rebootInstance);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const instances = useSystemStore((state) => state.instances);

  const [activeTab, setActiveTab] = useState<'metrics' | 'logs'>('metrics');

  if (!selectedInstance) return null;

  const isMinCapacity = instances.length <= asgConfig.minInstances;

  return (
    <Drawer
      isOpen={!!selectedInstance}
      onClose={() => selectInstance(null)}
      title={selectedInstance.name}
      subtitle={`${selectedInstance.id} • ${selectedInstance.instanceType}`}
    >
      {/* Status banner */}
      <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Operational State</div>
            <div className="text-xs font-bold text-white capitalize">{selectedInstance.status}</div>
          </div>
        </div>

        <Badge
          variant={
            selectedInstance.status === 'healthy'
              ? 'slate'
              : selectedInstance.status === 'launching'
              ? 'outline'
              : 'inverted'
          }
          dot
          size="sm"
        >
          {selectedInstance.status.toUpperCase()}
        </Badge>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="flex items-center bg-black p-0.5 rounded-lg border border-neutral-800 font-mono text-xs">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'metrics'
              ? 'bg-white text-black font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Telemetry & Network
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-white text-black font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Live Process Logs
        </button>
      </div>

      {activeTab === 'metrics' ? (
        <div className="space-y-4">
          {/* Live Utilization Metrics */}
          <div className="space-y-2.5 font-mono">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Compute Utilization
            </h4>

            {/* CPU */}
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Cpu className="w-3.5 h-3.5 text-white" />
                  vCPU Utilization
                </span>
                <span className="text-xs font-bold text-white">
                  {selectedInstance.cpu.toFixed(1)}%
                </span>
              </div>
              <Progress value={selectedInstance.cpu} threshold={asgConfig.scaleOutThreshold} size="sm" />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Idle baseline: 14%</span>
                <span className="text-white font-medium">Scale trigger: {asgConfig.scaleOutThreshold}%</span>
              </div>
            </div>

            {/* Memory */}
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <HardDrive className="w-3.5 h-3.5 text-white" />
                  Memory Allocation (4GB)
                </span>
                <span className="text-xs font-bold text-white">
                  {selectedInstance.memory.toFixed(1)}%
                </span>
              </div>
              <Progress value={selectedInstance.memory} size="sm" />
            </div>
          </div>

          {/* Networking & Target Group Info */}
          <div className="space-y-2 font-mono">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Network & Target Group
            </h4>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-900">
                <span className="text-neutral-400">Private IP (VPC)</span>
                <span className="text-white font-bold">{selectedInstance.privateIp}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-900">
                <span className="text-neutral-400">Public Elastic IP</span>
                <span className="text-white font-medium">{selectedInstance.publicIp}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-900">
                <span className="text-neutral-400">Availability Zone</span>
                <span className="text-white">{selectedInstance.availabilityZone}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-900">
                <span className="text-neutral-400">Request Ingress Rate</span>
                <span className="text-white font-bold">
                  {selectedInstance.requestsPerSecond} req/s
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-900">
                <span className="text-neutral-400">Health Probes Passed</span>
                <span className="text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {selectedInstance.healthCheckPasses} probes (100%)
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-neutral-400">Uptime</span>
                <span className="text-white">{selectedInstance.uptime}</span>
              </div>
            </div>
          </div>

          {/* Node Management & Disaster Recovery Testing */}
          <div className="space-y-2 font-mono">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Fault Injection & Operations
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => injectInstanceCpuStress(selectedInstance.id)}
                className="p-2 rounded bg-neutral-950 border border-neutral-800 hover:border-white text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                title="Run intensive CPU benchmark on this process to test threshold alert"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Inject CPU Stress</span>
              </button>

              <button
                type="button"
                onClick={() => rebootInstance(selectedInstance.id)}
                className="p-2 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reboot Process</span>
              </button>

              <button
                type="button"
                onClick={() => simulateInstanceFailure(selectedInstance.id)}
                className="col-span-2 p-2 rounded bg-neutral-950 border border-neutral-800 hover:border-white text-neutral-300 hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                title="Terminate process with SIGKILL to trigger health failure and automated replacement"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
                <span>Crash Node via SIGKILL (Test Self-Healing)</span>
              </button>
            </div>
          </div>

          {/* Terminate Action */}
          <div className="pt-1">
            <Button
              variant="danger"
              size="md"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => terminateInstanceManually(selectedInstance.id)}
              disabled={isMinCapacity}
              title={isMinCapacity ? 'Cannot terminate below minimum ASG capacity (1)' : ''}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isMinCapacity ? 'Minimum ASG Capacity Floor (1)' : 'Drain & Terminate Node'}
            </Button>
          </div>
        </div>
      ) : (
        /* Real Streamed Console Logs */
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span>TAIL -F WORKER_PROCESS.LOG (PID {selectedInstance.id})</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchInstanceLogs(selectedInstance.id)}
                className="text-neutral-400 hover:text-white flex items-center gap-1"
                title="Refresh log buffer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <span className="flex items-center gap-1 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                STREAMING
              </span>
            </div>
          </div>

          <div className="bg-black border border-neutral-800 rounded-lg p-3 font-mono text-[10px] space-y-1.5 text-neutral-300 max-h-96 overflow-y-auto leading-relaxed">
            {selectedInstanceLogs.length === 0 ? (
              <div className="text-neutral-500 py-4 text-center">
                Waiting for worker process stdout/stderr stream...
              </div>
            ) : (
              selectedInstanceLogs.map((logLine, idx) => (
                <div key={idx} className={logLine.startsWith('[ERR]') ? 'text-neutral-100 font-bold' : logLine.startsWith('[HTTP]') ? 'text-white' : 'text-neutral-400'}>
                  {logLine}
                </div>
              ))
            )}
          </div>

          <p className="text-[10px] text-neutral-500 font-sans">
            Real-time stdout/stderr telemetry captured directly from the running worker process.
          </p>
        </div>
      )}
    </Drawer>
  );
};
