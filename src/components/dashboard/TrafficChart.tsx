import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useSystemStore } from '../../store/useSystemStore';

export const TrafficChart: React.FC = () => {
  const history = useSystemStore((state) => state.history);
  const metrics = useSystemStore((state) => state.metrics);

  // Compute average and peak from current history buffer
  const requestValues = history.map((h) => h.requests);
  const peakRps = requestValues.length > 0 ? Math.max(...requestValues) : metrics.requestsPerSecond;
  const avgRps = requestValues.length > 0
    ? Math.round(requestValues.reduce((a, b) => a + b, 0) / requestValues.length)
    : metrics.requestsPerSecond;

  return (
    <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950 space-y-4">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight font-mono uppercase">Incoming Traffic</h3>
            <span className="text-[11px] font-mono text-white bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-700">
              ALB Ingress
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            Real-time HTTP requests routed by Application Load Balancer
          </p>
        </div>

        {/* Average & Peak Badges */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-black px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-500 text-[10px] block uppercase">Average</span>
            <span className="font-bold text-neutral-200">{avgRps} req/s</span>
          </div>

          <div className="bg-black px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-500 text-[10px] block uppercase">Peak Load</span>
            <span className="font-bold text-white">{peakRps} req/s</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis 
              dataKey="timeLabel" 
              stroke="#737373" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#737373" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl text-xs font-mono space-y-1">
                      <div className="text-neutral-400">{data.timeLabel}</div>
                      <div className="text-white font-bold flex items-center justify-between gap-4">
                        <span>Traffic:</span>
                        <span>{data.requests} req/s</span>
                      </div>
                      <div className="text-neutral-300 flex items-center justify-between gap-4">
                        <span>Avg Latency:</span>
                        <span>{data.latency} ms</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="requests"
              stroke="#ffffff"
              strokeWidth={2}
              fill="#ffffff"
              fillOpacity={0.12}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-neutral-800 text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" />
          Active Rate: <strong className="text-white">{metrics.requestsPerSecond} req/s</strong>
        </span>
        <span className="text-neutral-500">Target Group: tg-expan-prod-80</span>
      </div>
    </div>
  );
};
