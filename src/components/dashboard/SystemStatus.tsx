import React from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { Clock, Cpu } from 'lucide-react';

export const SystemStatus: React.FC = () => {
  const metrics = useSystemStore((state) => state.metrics);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const instances = useSystemStore((state) => state.instances);

  const isScalingUp = metrics.scalingState === 'scaling-up';
  const isScalingDown = metrics.scalingState === 'scaling-down';
  const hasActiveCooldown = asgConfig.activeCooldown > 0;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden bg-neutral-950 ${
        isScalingUp || isScalingDown
          ? 'border-white'
          : 'border-neutral-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Status Text */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative shrink-0 mt-0.5 sm:mt-0">
            <span
              className={`w-3.5 h-3.5 rounded-full inline-block ${
                isScalingUp || isScalingDown ? 'bg-white' : 'bg-neutral-500'
              }`}
            />
            {(isScalingUp || isScalingDown) && (
              <span className="absolute inset-0 rounded-full animate-ping bg-white opacity-75" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider uppercase text-white font-mono">
                {isScalingUp
                  ? '● AUTO SCALING IN PROGRESS — SCALE OUT'
                  : isScalingDown
                  ? '● AUTO SCALING IN PROGRESS — SCALE IN'
                  : '● SYSTEM OPERATIONAL'}
              </h2>
              {hasActiveCooldown && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-white bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-700">
                  <Clock className="w-3 h-3" />
                  Cooldown: {asgConfig.activeCooldown}s
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              {isScalingUp
                ? `High CPU detected (${metrics.cpuUtilization.toFixed(1)}% > ${asgConfig.scaleOutThreshold}%). Launching new EC2 instance to distribute workload.`
                : isScalingDown
                ? `Low CPU utilization sustained (${metrics.cpuUtilization.toFixed(1)}% < ${asgConfig.scaleInThreshold}%). Terminating surplus instances to optimize cloud cost.`
                : `All ${metrics.activeInstances} application instances are healthy and registered with Application Load Balancer. Auto Scaling Group is actively monitoring CPU metrics.`}
            </p>
          </div>
        </div>

        {/* Right Stats Quick View */}
        <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-neutral-800 pt-3 sm:pt-0 sm:pl-5 text-xs font-mono">
          <div>
            <div className="text-[11px] text-neutral-500 uppercase">ASG Policy</div>
            <div className="text-neutral-300 font-semibold flex items-center gap-1 mt-0.5">
              <Cpu className="w-3.5 h-3.5 text-white" />
              Target CPU {asgConfig.scaleOutThreshold}%
            </div>
          </div>

          <div>
            <div className="text-[11px] text-neutral-500 uppercase">Capacity</div>
            <div className="text-white font-bold mt-0.5">
              {instances.length} / {asgConfig.maxInstances} Max
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
