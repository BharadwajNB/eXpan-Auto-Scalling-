import React from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { Server, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InstanceOverview: React.FC = () => {
  const instances = useSystemStore((state) => state.instances);
  const selectInstance = useSystemStore((state) => state.selectInstance);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const manuallyScale = useSystemStore((state) => state.manuallyScale);
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 flex flex-col justify-between h-full min-h-0">
      {/* Header with Quick Scale Actions */}
      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Active EC2 Fleet ({instances.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <button
            onClick={() => manuallyScale('down')}
            disabled={instances.length <= asgConfig.minInstances}
            className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-neutral-700"
            title="Manual Scale-In"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => manuallyScale('up')}
            disabled={instances.length >= asgConfig.maxInstances}
            className="px-2 py-0.5 rounded bg-white hover:bg-neutral-200 text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed border border-white flex items-center gap-1 text-[10px]"
            title="Provision new worker instance"
          >
            <Plus className="w-3 h-3" />
            <span>Add Node</span>
          </button>
          <button
            onClick={() => navigate('/instances')}
            className="text-neutral-400 hover:text-white ml-1 text-[10px] underline"
          >
            All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        <table className="w-full text-left text-[11px] font-mono">
          <thead>
            <tr className="text-neutral-500 uppercase text-[9px] border-b border-neutral-800">
              <th className="pb-1 font-medium">Node ID</th>
              <th className="pb-1 font-medium">Status</th>
              <th className="pb-1 w-24 font-medium">CPU</th>
              <th className="pb-1 font-medium">Rate</th>
              <th className="pb-1 font-medium">AZ</th>
              <th className="pb-1 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {instances.map((inst) => {
              const isHighCpu = inst.cpu >= asgConfig.scaleOutThreshold;
              return (
                <tr
                  key={inst.id}
                  onClick={() => selectInstance(inst)}
                  className="hover:bg-neutral-900 cursor-pointer transition-colors"
                >
                  <td className="py-1.5 font-bold text-white">
                    {inst.id}
                  </td>
                  <td className="py-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {inst.status}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-neutral-800 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-white"
                          style={{ width: `${Math.min(100, inst.cpu)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] ${isHighCpu ? 'text-white font-bold' : 'text-neutral-300'}`}>
                        {inst.cpu.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 text-neutral-200 font-medium">
                    {inst.requestsPerSecond} r/s
                  </td>
                  <td className="py-1.5 text-neutral-400 text-[10px]">
                    {inst.availabilityZone.replace('ap-south-', '')}
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectInstance(inst);
                      }}
                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 text-[10px]"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="pt-1.5 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400 shrink-0">
        <span>Capacity Floor: {asgConfig.minInstances} Min</span>
        <span className="text-white">Ceiling: {asgConfig.maxInstances} Max</span>
      </div>
    </div>
  );
};
