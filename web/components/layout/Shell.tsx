'use client';

import { ReactNode } from 'react';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {children}
    </div>
  );
}
