import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

export function ScoreBadge({ score, showLabel = false, size = 'sm', className }: ScoreBadgeProps) {
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('font-bold rounded-full border', sizeMap[size], getScoreColor(score))}>
        {score}
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{getScoreLabel(score)}</span>
      )}
    </div>
  );
}
