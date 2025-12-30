'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ResizeDirection = 'horizontal' | 'vertical';
type ResizeSide = 'left' | 'right' | 'top' | 'bottom';

interface ResizeHandleProps {
  direction: ResizeDirection;
  side: ResizeSide;
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

export function ResizeHandle({
  direction,
  side,
  onResize,
  onResizeEnd,
  className,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
  }, [direction]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    let delta = currentPos - startPosRef.current;

    // Invert delta for left/top sides
    if (side === 'left' || side === 'top') {
      delta = -delta;
    }

    onResize(delta);
    startPosRef.current = currentPos;
  }, [isDragging, direction, side, onResize]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onResizeEnd?.();
    }
  }, [isDragging, onResizeEnd]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className={cn(
        'group flex-shrink-0 transition-colors',
        isHorizontal
          ? 'w-1 cursor-col-resize hover:w-1'
          : 'h-1 cursor-row-resize hover:h-1',
        'relative',
        className
      )}
    >
      {/* Visual indicator */}
      <div
        className={cn(
          'absolute transition-all duration-150',
          isHorizontal
            ? 'inset-y-0 left-0 w-1 group-hover:w-1 group-hover:bg-purple-500/50'
            : 'inset-x-0 top-0 h-1 group-hover:h-1 group-hover:bg-purple-500/50',
          isDragging && 'bg-purple-500'
        )}
      />
      {/* Extended hit area */}
      <div
        className={cn(
          'absolute',
          isHorizontal
            ? 'inset-y-0 -left-1 -right-1 w-3'
            : 'inset-x-0 -top-1 -bottom-1 h-3'
        )}
      />
    </div>
  );
}
