import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositiveChange?: boolean;
  neutralChange?: boolean;
  icon: LucideIcon;
  description?: string;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
}) => {
  return (
    <div className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg p-2.5 flex items-center justify-between transition-colors">
      <div>
        <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider font-mono">
          {title}
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white mt-0.5">
          {value}
        </div>
        {change && (
          <div className="text-[10px] font-mono text-neutral-300 mt-0.5">
            {change}
          </div>
        )}
      </div>

      <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
