import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
}

export function Progress({ value, max = 100, className, color, showLabel }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor = color ||
    (pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500');

  return (
    <div className={cn('relative', className)}>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-0.5 block">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
