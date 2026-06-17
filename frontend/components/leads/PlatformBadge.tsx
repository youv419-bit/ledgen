import { cn, getPlatformColor, getPlatformIcon } from '@/lib/utils';

interface PlatformBadgeProps {
  platform: string | null;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  if (!platform || platform === 'unknown') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border bg-gray-100 text-gray-500 border-gray-200', className)}>
        🌐 Unknown
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium capitalize',
      getPlatformColor(platform),
      className
    )}>
      {getPlatformIcon(platform)} {platform}
    </span>
  );
}
