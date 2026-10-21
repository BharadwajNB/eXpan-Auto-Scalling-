import React from 'react';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  threshold?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  threshold,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightStyles = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-[10px] mb-1 font-mono">
          <span className="text-neutral-400">Utilization</span>
          <span className="font-semibold text-white">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 relative ${heightStyles[size]}`}>
        {threshold && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
            style={{ left: `${threshold}%` }}
            title={`Threshold: ${threshold}%`}
          />
        )}
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percentage >= 70 ? 'bg-white' : 'bg-neutral-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
