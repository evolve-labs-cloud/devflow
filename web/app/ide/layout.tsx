'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/projectStore';
import { useFileStore } from '@/lib/stores/fileStore';

export default function IDELayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentProject, openProject } = useProjectStore();
  const { loadTree } = useFileStore();

  useEffect(() => {
    // Check for stored project path
    const storedPath = localStorage.getItem('devflow:projectPath');

    if (!currentProject && storedPath) {
      openProject(storedPath).then(() => {
        loadTree(storedPath);
      });
    } else if (!storedPath) {
      // No project, redirect to home
      router.push('/');
    }
  }, [currentProject, openProject, loadTree, router]);

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
