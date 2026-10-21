import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'inverted' | 'outline' | 'slate' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'blue' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-neutral-900 text-neutral-300 border-neutral-800',
    slate: 'bg-neutral-900 text-neutral-300 border-neutral-800',
    inverted: 'bg-white text-black font-bold border-white',
    outline: 'border border-white/40 text-white bg-transparent',
    emerald: 'bg-white/10 text-white border-white/20',
    amber: 'bg-white text-black font-bold border-white',
    rose: 'border border-white/60 text-white font-bold bg-white/5',
    cyan: 'bg-neutral-900 text-neutral-200 border-neutral-800',
    blue: 'bg-neutral-900 text-neutral-200 border-neutral-800',
    purple: 'bg-neutral-900 text-neutral-200 border-neutral-800',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-mono tracking-wider',
    md: 'text-xs px-2.5 py-0.5 font-mono tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'amber' || variant === 'inverted' ? 'bg-black' : 'bg-white'
          }`}
        />
      )}
      {children}
    </span>
  );
};
