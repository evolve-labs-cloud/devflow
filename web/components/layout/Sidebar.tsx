'use client';

import { FileExplorer } from '@/components/explorer/FileExplorer';

export function Sidebar() {
  return (
    <div className="h-full bg-[#0a0a0f]">
      <FileExplorer />
    </div>
  );
}
