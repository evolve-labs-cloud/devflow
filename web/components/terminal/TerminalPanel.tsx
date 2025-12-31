'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  Zap,
  FileText,
  Shield,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { AgentIcon } from '@/components/agents/AgentIcons';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';

interface TerminalTab {
  id: string;
  name: string;
  isActive: boolean;
  sessionId: string;
}

// Agent quick actions
const AGENT_ACTIONS = [
  { id: 'strategist', label: 'Strategist', command: 'claude /agents:strategist', color: '#3b82f6' },
  { id: 'architect', label: 'Architect', command: 'claude /agents:architect', color: '#8b5cf6' },
  { id: 'builder', label: 'Builder', command: 'claude /agents:builder', color: '#22c55e' },
  { id: 'guardian', label: 'Guardian', command: 'claude /agents:guardian', color: '#ef4444' },
  { id: 'chronicler', label: 'Chronicler', command: 'claude /agents:chronicler', color: '#f59e0b' },
];

// Quick commands
const QUICK_COMMANDS = [
  { label: 'Claude', command: 'claude', icon: Bot },
  { label: 'New Feature', command: 'claude /quick:new-feature', icon: Zap },
  { label: 'Security', command: 'claude /quick:security-check', icon: Shield },
  { label: 'ADR', command: 'claude /quick:create-adr', icon: FileText },
];

interface TerminalPanelProps {
  projectPath: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onClose?: () => void;
  height?: number;
  onHeightChange?: (height: number) => void;
}

const MIN_HEIGHT = 150;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 256;

export function TerminalPanel({
  projectPath,
  isMaximized,
  onToggleMaximize,
  onClose,
  height = DEFAULT_HEIGHT,
  onHeightChange,
}: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Buffer for batching terminal writes
  const writeBufferRef = useRef<string>('');
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const hasShownConnectToast = useRef(false);
  const WRITE_BUFFER_DELAY = 10; // ms - batch writes within this window
  const RESIZE_DEBOUNCE_DELAY = 150; // ms - debounce resize events

  const { terminalFontSize } = useSettingsStore();

  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: '1', name: 'Terminal 1', isActive: true, sessionId: `terminal-${Date.now()}-1` }
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const activeTab = tabs.find(t => t.isActive);

  // Handle resize drag
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + deltaY));
      onHeightChange?.(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [height, onHeightChange]);

  // Initialize terminal
  const initTerminal = useCallback(async (sessionId: string) => {
    if (!containerRef.current) return;

    // Cleanup existing terminal
    if (terminalRef.current) {
      terminalRef.current.dispose();
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new terminal instance
    const terminal = new Terminal({
      theme: {
        background: '#0a0a0f',
        foreground: '#e4e4e7',
        cursor: '#a855f7',
        cursorAccent: '#0a0a0f',
        selectionBackground: '#a855f740',
        selectionForeground: '#ffffff',
        black: '#18181b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e4e4e7',
        brightBlack: '#71717a',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: terminalFontSize,
      fontWeight: '400',
      fontWeightBold: '600',
      letterSpacing: 0,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    terminal.open(containerRef.current);

    // Load WebGL addon for sharper rendering on high-DPI displays
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        webglAddon.dispose();
      });
      terminal.loadAddon(webglAddon);
    } catch {
      // WebGL not supported, fall back to canvas renderer
      console.warn('WebGL not supported, using canvas renderer');
    }

    // Wait for container to be ready
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch {
        // Ignore fit errors during init
      }
    }, 100);

    setIsConnecting(true);

    // Create PTY session
    try {
      const createResponse = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          sessionId,
          cwd: projectPath,
          cols: terminal.cols,
          rows: terminal.rows,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create terminal session');
      }

      // Connect to SSE stream
      const eventSource = new EventSource(`/api/terminal?sessionId=${sessionId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        isConnectedRef.current = true;
        // Only show toast once per session
        if (!hasShownConnectToast.current) {
          hasShownConnectToast.current = true;
          toast.success('Terminal ready', { duration: 1500 });
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'data' && message.data) {
            terminal.write(message.data);
          } else if (message.type === 'exit') {
            terminal.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n');
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        // Use ref to check if was connected (closure issue)
        if (isConnectedRef.current) {
          toast.error('Terminal disconnected');
        }
        setIsConnected(false);
        setIsConnecting(false);
        isConnectedRef.current = false;
      };

      // Handle terminal input with buffering
      // Batches multiple keystrokes into single API calls for better performance
      terminal.onData((data) => {
        // Add to buffer
        writeBufferRef.current += data;

        // Clear existing timeout
        if (writeTimeoutRef.current) {
          clearTimeout(writeTimeoutRef.current);
        }

        // Flush buffer after delay OR immediately for special keys
        const isSpecialKey = data === '\r' || data === '\x03' || data === '\x04'; // Enter, Ctrl+C, Ctrl+D
        const delay = isSpecialKey ? 0 : WRITE_BUFFER_DELAY;

        writeTimeoutRef.current = setTimeout(() => {
          const bufferedData = writeBufferRef.current;
          writeBufferRef.current = '';

          if (bufferedData) {
            fetch('/api/terminal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'write',
                sessionId,
                data: bufferedData,
              }),
            }).catch(() => {
              // Ignore write errors
            });
          }
        }, delay);
      });

    } catch (error) {
      console.error('Terminal init error:', error);
      terminal.write('\x1b[31mFailed to connect to terminal session\x1b[0m\r\n');
      setIsConnecting(false);
    }
  }, [projectPath, terminalFontSize]);

  // Handle resize with debouncing
  const handleResize = useCallback(() => {
    // Clear existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Debounce the resize
    resizeTimeoutRef.current = setTimeout(() => {
      if (!fitAddonRef.current || !terminalRef.current || !activeTab) return;

      try {
        fitAddonRef.current.fit();
        const { cols, rows } = terminalRef.current;

        fetch('/api/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resize',
            sessionId: activeTab.sessionId,
            cols,
            rows,
          }),
        }).catch(() => {
          // Ignore resize errors
        });
      } catch {
        // Ignore fit errors
      }
    }, RESIZE_DEBOUNCE_DELAY);
  }, [activeTab]);

  // Initialize terminal on mount
  useEffect(() => {
    if (activeTab) {
      initTerminal(activeTab.sessionId);
    }

    return () => {
      // Cleanup timeouts
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      writeBufferRef.current = '';
      hasShownConnectToast.current = false;

      if (terminalRef.current) {
        terminalRef.current.dispose();
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (activeTab) {
        fetch('/api/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'destroy',
            sessionId: activeTab.sessionId,
          }),
        }).catch(() => {});
      }
    };
  }, [activeTab?.sessionId, initTerminal]);

  // Setup resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [handleResize]);

  // Handle maximize/minimize
  useEffect(() => {
    // Delay fit to allow layout to settle
    const timer = setTimeout(() => {
      handleResize();
    }, 100);
    return () => clearTimeout(timer);
  }, [isMaximized, handleResize]);

  // Tab management
  const addTab = () => {
    const newId = String(Date.now());
    const newSessionId = `terminal-${newId}`;

    // Destroy current session
    if (activeTab) {
      eventSourceRef.current?.close();
      fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'destroy',
          sessionId: activeTab.sessionId,
        }),
      }).catch(() => {});
    }

    setTabs([
      ...tabs.map(t => ({ ...t, isActive: false })),
      { id: newId, name: `Terminal ${tabs.length + 1}`, isActive: true, sessionId: newSessionId }
    ]);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;

    const tabToClose = tabs.find(t => t.id === id);
    if (tabToClose) {
      fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'destroy',
          sessionId: tabToClose.sessionId,
        }),
      }).catch(() => {});
    }

    const remaining = tabs.filter(t => t.id !== id);
    if (tabs.find(t => t.id === id)?.isActive && remaining.length > 0) {
      remaining[0].isActive = true;
    }
    setTabs(remaining);
  };

  const selectTab = (id: string) => {
    if (activeTab?.id === id) return;

    // Cleanup current session connection
    if (activeTab) {
      eventSourceRef.current?.close();
    }

    setTabs(tabs.map(t => ({ ...t, isActive: t.id === id })));
  };

  // Write a command to the terminal (types it and executes)
  const writeCommand = useCallback((command: string) => {
    if (!activeTab) return;

    // Write the command to the PTY (with Enter key)
    fetch('/api/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'write',
        sessionId: activeTab.sessionId,
        data: command + '\r',
      }),
    }).catch(() => {});
  }, [activeTab]);

  return (
    <div
      className={cn(
        'flex flex-col bg-[#0a0a0f] text-white border-t border-white/10',
        isMaximized && 'h-full'
      )}
      style={isMaximized ? undefined : { height }}
    >
      {/* Resize Handle */}
      {!isMaximized && (
        <div
          className={cn(
            'h-1 cursor-row-resize group flex items-center justify-center',
            'hover:bg-purple-500/30 transition-colors',
            isResizing && 'bg-purple-500/50'
          )}
          onMouseDown={handleResizeStart}
        >
          <div className={cn(
            'w-12 h-0.5 rounded-full bg-white/20 group-hover:bg-purple-400/50 transition-colors',
            isResizing && 'bg-purple-400'
          )} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#12121a] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded text-xs cursor-pointer group',
                tab.isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <TerminalIcon className="w-3 h-3" />
              {tab.name}
              {tab.isActive && (
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isConnected ? 'bg-green-400' : isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                )} />
              )}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMaximize}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 p-1"
        style={{ backgroundColor: '#0a0a0f' }}
      />

      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#12121a] border-t border-white/10 flex-shrink-0 overflow-x-auto">
        {/* Quick Commands */}
        <div className="flex items-center gap-1">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => writeCommand(cmd.command)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title={cmd.command}
            >
              <cmd.icon className="w-3 h-3" />
              {cmd.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Agent Actions */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Agents:</span>
          {AGENT_ACTIONS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => writeCommand(agent.command)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors hover:bg-white/10"
              style={{ color: agent.color }}
              title={agent.command}
            >
              <AgentIcon agentId={agent.id} size={12} />
              {agent.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
