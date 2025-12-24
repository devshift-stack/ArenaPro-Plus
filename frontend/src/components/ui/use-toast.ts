// Compatibility wrapper for useToast hook
// Maps the shadcn/ui toast API to our ToastContext API

import { useToast as useToastContext } from '@/contexts/ToastContext';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toastContext = useToastContext();

  const toast = (props: ToastProps) => {
    if (props.variant === 'destructive') {
      toastContext.error(props.title, props.description);
    } else {
      toastContext.success(props.title, props.description);
    }
  };

  return { toast };
}
