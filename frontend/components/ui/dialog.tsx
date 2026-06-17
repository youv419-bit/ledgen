'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Dialog({ open, onClose, title, description, children, className, size = 'md' }: DialogProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn(
        'relative z-10 w-full bg-background rounded-xl shadow-xl border border-border',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        sizeMap[size],
        className
      )}>
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div>
              {title && <h2 className="font-semibold text-base">{title}</h2>}
              {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-3 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Content */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
