import { cn } from '@/lib/utils';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
}

export function StatCard({
  title, value, change, changeType = 'up',
  icon: Icon, iconColor = 'text-blue-600 bg-blue-50', description
}: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
        {change && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            changeType === 'up' ? 'text-green-600' :
            changeType === 'down' ? 'text-red-600' : 'text-muted-foreground'
          )}>
            {changeType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{title}</div>
      {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
    </div>
  );
}
