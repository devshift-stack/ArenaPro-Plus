import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            `flex h-10 w-full rounded-md border bg-slate-900 px-3 py-2 text-sm 
             text-white ring-offset-slate-900 file:border-0 file:bg-transparent 
             file:text-sm file:font-medium placeholder:text-slate-500 
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 
             focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
             transition-colors duration-200`,
            error
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'border-slate-700 focus-visible:border-cyan-500',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightIcon}
          </div>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
