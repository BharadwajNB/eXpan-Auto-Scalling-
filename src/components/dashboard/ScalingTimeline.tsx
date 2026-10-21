import React from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ScalingTimeline: React.FC = () => {
  const events = useSystemStore((state) => state.events);
  const clearEvents = useSystemStore((state) => state.clearEvents);
  const navigate = useNavigate();

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'scale-out':
        return <span className="text-[9px] font-mono font-bold text-black bg-white px-1.5 py-0.2 rounded">SCALE OUT</span>;
      case 'scale-in':
        return <span className="text-[9px] font-mono font-bold text-white border border-white/60 px-1.5 py-0.2 rounded">SCALE IN</span>;
      case 'alert':
        return <span className="text-[9px] font-mono font-bold text-white bg-neutral-900 border border-neutral-700 px-1.5 py-0.2 rounded">ALARM</span>;
      default:
        return <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.2 rounded">EVENT</span>;
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 flex flex-col justify-between h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Scaling Audit Log ({events.length})
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <button
            onClick={clearEvents}
            className="text-neutral-500 hover:text-white transition-colors"
            title="Clear event logs"
          >
            Clear
          </button>
          <span className="text-neutral-700">•</span>
          <button
            onClick={() => navigate('/events')}
            className="text-neutral-300 hover:text-white underline"
          >
            View All
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 py-1 min-h-0">
        {events.length === 0 ? (
          <p className="text-[11px] text-neutral-500 text-center py-4 font-mono">No recent scaling triggers.</p>
        ) : (
          events.slice(0, 4).map((evt) => (
            <div
              key={evt.id}
              className="p-2 rounded bg-black border border-neutral-800/80 flex items-start justify-between gap-2 text-[11px]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getEventBadge(evt.type)}
                  <span className="text-neutral-200 font-medium truncate font-sans text-xs">{evt.reason}</span>
                </div>
                {evt.instanceId && (
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Target: <span className="text-white font-semibold">{evt.instanceId}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-mono shrink-0">{evt.timestamp}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-1.5 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400 shrink-0">
        <span>CloudWatch Alarms Active</span>
        <span className="text-white">Target Tracking</span>
      </div>
    </div>
  );
};
