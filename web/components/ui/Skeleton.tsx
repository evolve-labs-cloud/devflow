'use client';

import { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-white/5',
        className
      )}
      style={style}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('p-4 rounded-lg border border-white/10 bg-white/5', className)}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

interface SkeletonListProps {
  items?: number;
  className?: string;
}

export function SkeletonList({ items = 5, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

interface SkeletonTreeProps {
  depth?: number;
  items?: number;
  className?: string;
}

export function SkeletonTree({ depth = 2, items = 5, className }: SkeletonTreeProps) {
  const renderItems = (level: number, count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <div key={`${level}-${i}`}>
        <div
          className="flex items-center gap-2 py-1"
          style={{ paddingLeft: level * 16 }}
        >
          <Skeleton className="w-4 h-4" />
          <Skeleton className={cn('h-4', i % 3 === 0 ? 'w-24' : i % 2 === 0 ? 'w-32' : 'w-20')} />
        </div>
        {level < depth && i % 2 === 0 && renderItems(level + 1, 2)}
      </div>
    ));
  };

  return (
    <div className={cn('space-y-1', className)}>
      {renderItems(0, items)}
    </div>
  );
}
