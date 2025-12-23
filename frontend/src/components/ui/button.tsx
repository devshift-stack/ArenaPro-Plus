import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md 
   text-sm font-medium transition-all duration-200 
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 
   focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 
   disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]`,
  {
    variants: {
      variant: {
        default: `bg-gradient-to-r from-cyan-500 to-blue-500 text-white 
                  hover:opacity-90 shadow-lg shadow-cyan-500/25`,
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: `border border-slate-700 bg-transparent text-slate-300 
                  hover:border-cyan-500 hover:text-white hover:bg-slate-800`,
        secondary: 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white',
        ghost: 'text-slate-400 hover:bg-slate-800 hover:text-white',
        link: 'text-cyan-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
