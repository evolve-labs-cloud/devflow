'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  Clock,
  Plus,
  BookOpen,
  Zap,
  FileText,
  Cpu,
  Terminal,
  GitBranch,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Bot
} from 'lucide-react';

interface RecentProject {
  path: string;
  name: string;
  lastOpened: Date;
}

export default function HomePage() {
  const router = useRouter();
  const [projectPath, setProjectPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    // Load recent projects from localStorage
    const stored = localStorage.getItem('devflow:recentProjects');
    if (stored) {
      try {
        const projects = JSON.parse(stored);
        setRecentProjects(projects.slice(0, 5));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleOpenProject = async (path?: string) => {
    const targetPath = path || projectPath;
    if (!targetPath.trim()) {
      setError('Please enter a project path');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/project/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open project');
      }

      // Save to recent projects
      const projectName = targetPath.split('/').pop() || targetPath;
      const newRecent: RecentProject = {
        path: targetPath,
        name: projectName,
        lastOpened: new Date(),
      };
      const updated = [newRecent, ...recentProjects.filter(p => p.path !== targetPath)].slice(0, 5);
      localStorage.setItem('devflow:recentProjects', JSON.stringify(updated));

      // Store project path and redirect to IDE
      localStorage.setItem('devflow:projectPath', targetPath);
      router.push('/ide');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">DevFlow</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="https://github.com/anthropics/claude-code" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Docs</a>
            <a href="https://github.com/evolve-labs-cloud/dexter-devflow" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Spec-Driven Development
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Transform ideas into production code with AI agents.
            From requirements to implementation, guided by specifications.
          </p>

          {/* Open Project Card */}
          <div className="max-w-xl mx-auto bg-[#12121a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Open Project</span>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenProject()}
                placeholder="/path/to/your/project"
                className="flex-1 px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                suppressHydrationWarning
                autoComplete="off"
                data-form-type="other"
              />
              <button
                onClick={() => handleOpenProject()}
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    Open
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-left">{error}</p>
            )}

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Clock className="w-4 h-4" />
                  Recent
                </div>
                <div className="space-y-1">
                  {recentProjects.map((project, i) => (
                    <button
                      key={i}
                      onClick={() => handleOpenProject(project.path)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors truncate"
                    >
                      {project.name}
                      <span className="text-gray-600 ml-2 text-xs">{project.path}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="features" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            From Idea to Production
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            DevFlow guides your development through structured phases,
            ensuring clarity and quality at every step.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Requirements */}
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Requirements</h3>
              <p className="text-gray-400 text-sm mb-4">
                Transform natural language into structured specs with EARS notation.
                Clear acceptance criteria before any code.
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <Bot className="w-4 h-4" />
                @strategist
              </div>
            </div>

            {/* Design */}
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Design</h3>
              <p className="text-gray-400 text-sm mb-4">
                Generate architecture decisions, tech stack recommendations,
                and implementation plans based on your codebase.
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-400">
                <Bot className="w-4 h-4" />
                @architect
              </div>
            </div>

            {/* Implementation */}
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Implementation</h3>
              <p className="text-gray-400 text-sm mb-4">
                Execute discrete, dependency-sequenced tasks.
                AI agents write code following your specs.
              </p>
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Bot className="w-4 h-4" />
                @builder
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-white/5 bg-[#08080c]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={<Sparkles className="w-5 h-5" />}
              title="Autopilot Mode"
              description="Autonomous task execution without step-by-step guidance"
            />
            <FeatureCard
              icon={<GitBranch className="w-5 h-5" />}
              title="Git Integration"
              description="Automatic commits with meaningful messages"
            />
            <FeatureCard
              icon={<Bot className="w-5 h-5" />}
              title="AI Agents"
              description="Specialized agents for each development phase"
            />
            <FeatureCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="Quality Assurance"
              description="Built-in code review and testing"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to transform your workflow?
          </h2>
          <p className="text-gray-400 mb-8">
            Start building with spec-driven development today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => document.querySelector('input')?.focus()}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
            >
              Open a Project
            </button>
            <a
              href="https://github.com/evolve-labs-cloud/dexter-devflow"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-medium rounded-xl transition-colors"
            >
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            DevFlow v0.2.0
          </div>
          <div>
            Powered by Evolve Labs
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#12121a] border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-3">
        {icon}
      </div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
