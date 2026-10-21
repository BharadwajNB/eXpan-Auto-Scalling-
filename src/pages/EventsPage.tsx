import React, { useState } from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Search, 
  Trash2, 
  CheckCircle2,
  X,
  History,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Activity
} from 'lucide-react';
import type { ScalingEventType } from '../types';

export const EventsPage: React.FC = () => {
  const events = useSystemStore((state) => state.events);
  const clearEvents = useSystemStore((state) => state.clearEvents);
  const exportEvents = useSystemStore((state) => state.exportEvents);
  const [filterType, setFilterType] = useState<'all' | 'scale-out' | 'scale-in' | 'alert' | 'health-check' | 'chaos'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter((evt) => {
    let matchesType = true;
    if (filterType === 'chaos') {
      matchesType = evt.type === 'instance-unhealthy' || evt.type === 'instance-replaced';
    } else if (filterType !== 'all') {
      matchesType = evt.type === filterType;
    }
    const matchesSearch =
      evt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.instanceId && evt.instanceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.details && evt.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const scaleOutCount = events.filter((e) => e.type === 'scale-out').length;
  const scaleInCount = events.filter((e) => e.type === 'scale-in' || e.type === 'instance-terminated').length;
  const alarmCount = events.filter((e) => e.type === 'alert').length;
  const chaosCount = events.filter((e) => e.type === 'instance-unhealthy' || e.type === 'instance-replaced').length;

  const getEventBadge = (type: ScalingEventType) => {
    switch (type) {
      case 'scale-out':
        return <Badge variant="inverted" dot size="sm">Scale Out</Badge>;
      case 'scale-in':
        return <Badge variant="outline" dot size="sm">Scale In</Badge>;
      case 'alert':
        return <Badge variant="inverted" dot size="sm">CloudWatch Alarm</Badge>;
      case 'instance-started':
        return <Badge variant="slate" dot size="sm">Node Initialized</Badge>;
      case 'instance-terminated':
        return <Badge variant="outline" dot size="sm">Terminated</Badge>;
      case 'instance-unhealthy':
        return <Badge variant="inverted" dot size="sm">Node Failure</Badge>;
      case 'instance-replaced':
        return <Badge variant="inverted" dot size="sm">Self-Healed</Badge>;
      default:
        return <Badge variant="slate" size="sm">Health Probe</Badge>;
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1 bg-black text-white select-none">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
              Scaling Audit Trail
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
              {events.length} TOTAL EVENTS
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Immutable log of horizontal elasticity events, CloudWatch metric threshold evaluations, and health checks.
          </p>
        </div>

        {/* Action Buttons: Export & Clear */}
        <div className="flex items-center gap-2 font-mono">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportEvents('json')}
            disabled={events.length === 0}
            title="Download full audit log as JSON"
          >
            Export JSON
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportEvents('csv')}
            disabled={events.length === 0}
            title="Download full audit log as CSV spreadsheet"
          >
            Export CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={clearEvents}
            disabled={events.length === 0}
            icon={<Trash2 className="w-3.5 h-3.5 text-neutral-400" />}
          >
            Clear Log
          </Button>
        </div>
      </div>

      {/* 4 Audit Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Total Recorded</span>
            <History className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {events.length} <span className="text-xs font-normal text-neutral-500">Events</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Retained in session memory</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Scale-Out Decisions</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {scaleOutCount} <span className="text-xs font-normal text-neutral-500">Launches</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">CPU &gt; 70% threshold actions</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Scale-In Drains</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {scaleInCount} <span className="text-xs font-normal text-neutral-500">Terminated</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Cost optimization decisions</div>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Alarms Evaluated</span>
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {alarmCount} <span className="text-xs font-normal text-neutral-500">Alarms</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">CloudWatch breach logs</div>
          </div>
        </div>
      </div>

      {/* Segmented Filter & Search Bar */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Segmented Tabs */}
        <div className="flex items-center bg-black border border-neutral-800 rounded-lg p-0.5 w-full sm:w-auto font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType('scale-out')}
            className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
              filterType === 'scale-out'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Scale Out ({scaleOutCount})
          </button>
          <button
            onClick={() => setFilterType('scale-in')}
            className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
              filterType === 'scale-in'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Scale In
          </button>
          <button
            onClick={() => setFilterType('alert')}
            className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
              filterType === 'alert'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Alarms ({alarmCount})
          </button>
          <button
            onClick={() => setFilterType('health-check')}
            className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
              filterType === 'health-check'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Health Checks
          </button>
          <button
            onClick={() => setFilterType('chaos')}
            className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
              filterType === 'chaos'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Self-Healing & Crashes ({chaosCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 font-mono">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reason, instance ID..."
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

      {/* Events Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-neutral-800 bg-black text-neutral-400 uppercase text-[9px] tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Timestamp</th>
              <th className="py-2.5 px-3 font-semibold">Event Classification</th>
              <th className="py-2.5 px-3 font-semibold">Target Node</th>
              <th className="py-2.5 px-3 font-semibold">Metric Trigger & Rationale</th>
              <th className="py-2.5 px-3 font-semibold">State</th>
              <th className="py-2.5 px-3 font-semibold text-right">Evaluation Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-500">
                  No scaling events recorded matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="py-2.5 px-3 text-neutral-300 font-bold whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="py-2.5 px-3">{getEventBadge(evt.type)}</td>
                  <td className="py-2.5 px-3 text-white font-bold">{evt.instanceId || 'Fleet-wide'}</td>
                  <td className="py-2.5 px-3 text-neutral-200 font-sans text-xs">{evt.reason}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-white font-semibold uppercase text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-400 font-sans text-[11px] text-right truncate max-w-xs">
                    {evt.details || '—'}
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
