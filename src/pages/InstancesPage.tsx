import React, { useState } from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Server, 
  Search, 
  RefreshCw, 
  Plus, 
  Minus,
  Trash2, 
  Eye,
  X,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import type { InstanceStatus } from '../types';

export const InstancesPage: React.FC = () => {
  const instances = useSystemStore((state) => state.instances);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const selectInstance = useSystemStore((state) => state.selectInstance);
  const manuallyScale = useSystemStore((state) => state.manuallyScale);
  const terminateInstanceManually = useSystemStore((state) => state.terminateInstanceManually);
  const tickSimulation = useSystemStore((state) => state.tickSimulation);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InstanceStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    tickSimulation();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const filteredInstances = instances.filter((inst) => {
    const matchesSearch =
      inst.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.availabilityZone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.privateIp.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const healthyCount = instances.filter((i) => i.status === 'healthy').length;
  const launchingCount = instances.filter((i) => i.status === 'launching').length;
  const terminatingCount = instances.filter((i) => i.status === 'terminating').length;

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1 bg-black text-white select-none">
      {/* Top Header & Fleet Management Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
              Compute Fleet Inventory
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
              {instances.length} / {asgConfig.maxInstances} RUNNING
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Active EC2 worker nodes registered with Target Group (Dual-AZ High Availability).
          </p>
        </div>

        {/* Action Controls Group */}
        <div className="flex items-center gap-2 font-mono">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => manuallyScale('down')}
            disabled={instances.length <= asgConfig.minInstances}
            title={instances.length <= asgConfig.minInstances ? 'Cannot scale below minimum floor (1)' : 'Terminate surplus instance'}
            icon={<Minus className="w-3.5 h-3.5" />}
          >
            Scale In
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => manuallyScale('up')}
            disabled={instances.length >= asgConfig.maxInstances}
            title={instances.length >= asgConfig.maxInstances ? 'Maximum capacity ceiling reached (4)' : 'Provision new worker instance'}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Provision Node
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Poll
          </Button>
        </div>
      </div>

      {/* 4 Fleet Capacity HUD Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Active Capacity</span>
            <Server className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {instances.length} <span className="text-xs font-normal text-neutral-500">EC2</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Floor: {asgConfig.minInstances} • Ceiling: {asgConfig.maxInstances}</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Target Health</span>
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {healthyCount} <span className="text-xs font-normal text-neutral-500">Healthy</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">100% In-Service HTTP 200</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Pending Transitions</span>
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {launchingCount + terminatingCount} <span className="text-xs font-normal text-neutral-500">Queued</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{launchingCount} Init • {terminatingCount} Draining</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Total Throughput</span>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {instances.reduce((acc, i) => acc + i.requestsPerSecond, 0)} <span className="text-xs font-normal text-neutral-500">req/s</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Distributed by ALB</div>
          </div>
        </div>
      </div>

      {/* Segmented Filter & Search Control Bar */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Segmented Tabs */}
        <div className="flex items-center bg-black border border-neutral-800 rounded-lg p-0.5 w-full sm:w-auto font-mono text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All ({instances.length})
          </button>
          <button
            onClick={() => setStatusFilter('healthy')}
            className={`px-3 py-1 rounded-md transition-all ${
              statusFilter === 'healthy'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Healthy ({healthyCount})
          </button>
          <button
            onClick={() => setStatusFilter('launching')}
            className={`px-3 py-1 rounded-md transition-all ${
              statusFilter === 'launching'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Launching ({launchingCount})
          </button>
          <button
            onClick={() => setStatusFilter('terminating')}
            className={`px-3 py-1 rounded-md transition-all ${
              statusFilter === 'terminating'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Draining ({terminatingCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 font-mono">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter ID, IP, AZ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-black border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 outline-none focus:border-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Fleet Inventory Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-neutral-800 bg-black text-neutral-400 uppercase text-[9px] tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Instance ID / IP</th>
              <th className="py-2.5 px-3 font-semibold">State</th>
              <th className="py-2.5 px-3 font-semibold w-40">CPU Load</th>
              <th className="py-2.5 px-3 font-semibold">RAM Usage</th>
              <th className="py-2.5 px-3 font-semibold">Traffic Share</th>
              <th className="py-2.5 px-3 font-semibold">Uptime</th>
              <th className="py-2.5 px-3 font-semibold">Zone</th>
              <th className="py-2.5 px-3 font-semibold text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredInstances.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-500">
                  No compute instances match your active filter criteria.
                </td>
              </tr>
            ) : (
              filteredInstances.map((inst) => (
                <tr
                  key={inst.id}
                  onClick={() => selectInstance(inst)}
                  className="hover:bg-neutral-900/50 transition-colors group cursor-pointer"
                >
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{inst.id}</span>
                      <span className="text-[10px] font-normal text-neutral-400">({inst.privateIp})</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-sans">{inst.name}</div>
                  </td>

                  <td className="py-2.5 px-3">
                    <Badge
                      variant={
                        inst.status === 'healthy'
                          ? 'slate'
                          : inst.status === 'launching'
                          ? 'outline'
                          : 'inverted'
                      }
                      dot
                      size="sm"
                    >
                      {inst.status.toUpperCase()}
                    </Badge>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white font-bold">{inst.cpu.toFixed(1)}%</span>
                        <span className="text-neutral-500">Threshold 70%</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-white transition-all duration-300"
                          style={{ width: `${Math.min(100, inst.cpu)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-neutral-300">
                    <div className="font-semibold text-white">{inst.memory.toFixed(1)}%</div>
                    <div className="text-[10px] text-neutral-500">512 MB / 1 GB</div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white">{inst.requestsPerSecond} req/s</div>
                    <div className="text-[10px] text-neutral-500">
                      {instances.length > 0
                        ? `${Math.round((inst.requestsPerSecond / Math.max(1, instances.reduce((a, b) => a + b.requestsPerSecond, 0))) * 100)}% of ingress`
                        : '0%'}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-neutral-300">{inst.uptime}</td>
                  <td className="py-2.5 px-3 text-neutral-400 text-[11px]">{inst.availabilityZone}</td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectInstance(inst);
                        }}
                        className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          terminateInstanceManually(inst.id);
                        }}
                        disabled={instances.length <= asgConfig.minInstances}
                        title={instances.length <= asgConfig.minInstances ? 'Cannot terminate below minimum floor capacity (1)' : 'Terminate instance'}
                        className="p-1.5 rounded bg-neutral-900 hover:bg-white hover:text-black text-neutral-400 border border-neutral-800 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        aria-label="Terminate instance"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
