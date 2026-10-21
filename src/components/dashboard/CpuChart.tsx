import React, { useState } from 'react';
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
import { useSystemStore } from '../../store/useSystemStore';
import { AlertTriangle } from 'lucide-react';

export const CpuChart: React.FC = () => {
  const history = useSystemStore((state) => state.history);
  const metrics = useSystemStore((state) => state.metrics);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const [activeRange, setActiveRange] = useState<'5m' | '15m' | '30m' | '1h'>('30m');

  const ranges: ('5m' | '15m' | '30m' | '1h')[] = ['5m', '15m', '30m', '1h'];
  const isAboveThreshold = metrics.cpuUtilization >= asgConfig.scaleOutThreshold;

  return (
    <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight font-mono uppercase">CPU Utilization</h3>
            {isAboveThreshold && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-black bg-white px-2 py-0.5 rounded-full font-mono">
                <AlertTriangle className="w-3 h-3 text-black" />
                THRESHOLD EXCEEDED
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            Average CPU utilization across all active EC2 instances
          </p>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center bg-black p-1 rounded-lg border border-neutral-800 self-start sm:self-auto font-mono text-xs">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeRange === range
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
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
              domain={[0, 100]} 
              stroke="#737373" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl text-xs font-mono space-y-1">
                      <div className="text-neutral-400">{data.timeLabel}</div>
                      <div className="text-white font-bold flex items-center justify-between gap-4">
                        <span>CPU Utilization:</span>
                        <span>{data.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="text-neutral-300 flex items-center justify-between gap-4">
                        <span>Active EC2:</span>
                        <span>{data.instances}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <ReferenceLine
              y={asgConfig.scaleOutThreshold}
              stroke="#ffffff"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Scale-Out (${asgConfig.scaleOutThreshold}%)`,
                fill: '#ffffff',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            <ReferenceLine
              y={asgConfig.scaleInThreshold}
              stroke="#737373"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Scale-In (${asgConfig.scaleInThreshold}%)`,
                fill: '#d4d4d4',
                fontSize: 10,
                position: 'insideBottomRight',
              }}
            />

            <Area
              type="monotone"
              dataKey="cpu"
              stroke="#ffffff"
              strokeWidth={2}
              fill="#ffffff"
              fillOpacity={0.15}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-2 border-t border-neutral-800 text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" />
            Current: <strong className="text-white">{metrics.cpuUtilization.toFixed(1)}%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-white inline-block" />
            Scale-Out: <strong className="text-white">{asgConfig.scaleOutThreshold}%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-neutral-500 inline-block" />
            Scale-In: <strong className="text-neutral-400">{asgConfig.scaleInThreshold}%</strong>
          </span>
        </div>
        <div className="text-neutral-500">
          Target Tracking: AWS/EC2/CPUUtilization
        </div>
      </div>
    </div>
  );
};
