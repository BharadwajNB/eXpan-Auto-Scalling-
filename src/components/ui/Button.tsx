import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-mono font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-40 disabled:cursor-not-allowed select-none tracking-tight';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3.5 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2',
  };

  const variantStyles = {
    primary: 'bg-white hover:bg-neutral-200 text-black border border-white font-semibold shadow-subtle',
    secondary: 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 hover:border-neutral-700',
    outline: 'bg-transparent hover:bg-neutral-900 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-600',
    danger: 'bg-transparent hover:bg-white hover:text-black text-neutral-300 border border-neutral-800 hover:border-white',
    success: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    ghost: 'bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white border-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
