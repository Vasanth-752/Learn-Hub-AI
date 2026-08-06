import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'ai' | 'manual' | 'completed';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'badge',
    secondary: 'badge bg-primary-container/20 text-primary',
    ai: 'badge-ai',
    manual: 'badge-manual',
    completed: 'badge-completed',
  };

  return (
    <span className={cn(variants[variant], className)} {...props}>
      {children}
    </span>
  );
}