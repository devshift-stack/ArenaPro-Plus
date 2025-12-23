import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-slate-300',
        primary: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
        secondary: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        success: 'bg-green-500/10 text-green-400 border border-green-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        destructive: 'bg-red-500/10 text-red-400 border border-red-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        outline: 'border border-slate-700 text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
