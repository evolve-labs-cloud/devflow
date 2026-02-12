'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/projectStore';

export default function IDELayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { projects, restoreProjects } = useProjectStore();
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    if (projects.length > 0) {
      // Already have projects loaded
      setRestoring(false);
      return;
    }

    // Try to restore from persisted state
    restoreProjects().then(() => {
      const current = useProjectStore.getState();
      if (current.projects.length === 0) {
        // No projects could be restored, redirect to home
        router.push('/');
      } else {
        setRestoring(false);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (restoring && projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
