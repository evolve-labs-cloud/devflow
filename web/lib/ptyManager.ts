import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { PHASE_DONE_REGEX } from '@/lib/autopilotConstants';

interface TerminalSession {
  id: string;
  pty: pty.IPty;
  cwd: string;
  createdAt: Date;
}

interface AutopilotCollector {
  buffer: string;
  resolve: (result: { output: string; exitCode: number }) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * Detect the best available shell for the current platform.
 */
function detectShell(): string {
  if (process.platform === 'win32') return 'powershell.exe';

  // Try SHELL env var first
  const envShell = process.env.SHELL;
  if (envShell && existsSync(envShell)) return envShell;

  // Fallback chain for Unix-like systems
  const candidates = ['/bin/zsh', '/bin/bash', '/bin/sh'];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return '/bin/sh';
}

class PtyManager extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private outputBuffers: Map<string, string[]> = new Map();
  private autopilotCollectors: Map<string, AutopilotCollector> = new Map();

  createSession(id: string, cwd: string, cols: number = 80, rows: number = 24): TerminalSession {
    const shell = detectShell();
    const shellArgs = process.platform === 'win32' ? [] : ['-l'];

    // Validate cwd exists, fallback to home directory
    const safeCwd = existsSync(cwd) ? cwd : process.env.HOME || '/tmp';

    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: safeCwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    });

    const session: TerminalSession = {
      id,
      pty: ptyProcess,
      cwd,
      createdAt: new Date(),
    };

    this.sessions.set(id, session);
    this.outputBuffers.set(id, []);

    // Handle data from PTY
    ptyProcess.onData((data) => {
      const buffer = this.outputBuffers.get(id);
      if (buffer) {
        buffer.push(data);
        // Keep buffer size manageable
        if (buffer.length > 1000) {
          buffer.shift();
        }
      }

      // Check autopilot collector for completion marker
      const collector = this.autopilotCollectors.get(id);
      if (collector) {
        collector.buffer += data;
        const markerMatch = collector.buffer.match(PHASE_DONE_REGEX);
        if (markerMatch) {
          const exitCode = parseInt(markerMatch[1], 10);
          // Extract output before the marker
          const output = collector.buffer.split(PHASE_DONE_REGEX)[0];
          clearTimeout(collector.timeout);
          this.autopilotCollectors.delete(id);
          this.emit('autopilot-phase-done', { sessionId: id, output, exitCode });
          collector.resolve({ output, exitCode });
        }
      }

      this.emit('data', { sessionId: id, data });
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode }) => {
      // If there's an active collector, reject it
      const collector = this.autopilotCollectors.get(id);
      if (collector) {
        clearTimeout(collector.timeout);
        this.autopilotCollectors.delete(id);
        collector.reject(new Error(`Terminal exited with code ${exitCode} during autopilot phase`));
      }

      this.emit('exit', { sessionId: id, exitCode });
      this.sessions.delete(id);
      this.outputBuffers.delete(id);
    });

    return session;
  }

  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  write(id: string, data: string): boolean {
    const session = this.sessions.get(id);
    if (session) {
      session.pty.write(data);
      return true;
    }
    return false;
  }

  resize(id: string, cols: number, rows: number): boolean {
    const session = this.sessions.get(id);
    if (session) {
      session.pty.resize(cols, rows);
      return true;
    }
    return false;
  }

  destroySession(id: string): boolean {
    const session = this.sessions.get(id);
    if (session) {
      // Clean up any active collector
      const collector = this.autopilotCollectors.get(id);
      if (collector) {
        clearTimeout(collector.timeout);
        this.autopilotCollectors.delete(id);
        collector.reject(new Error('Session destroyed'));
      }

      session.pty.kill();
      this.sessions.delete(id);
      this.outputBuffers.delete(id);
      return true;
    }
    return false;
  }

  getOutputBuffer(id: string): string[] {
    return this.outputBuffers.get(id) || [];
  }

  clearOutputBuffer(id: string): void {
    const buffer = this.outputBuffers.get(id);
    if (buffer) {
      buffer.length = 0;
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Arm an autopilot collector for a terminal session.
   * Returns a Promise that resolves when the completion marker is detected in the output.
   */
  armAutopilotCollector(sessionId: string, timeoutMs: number): Promise<{ output: string; exitCode: number }> {
    // Disarm any existing collector
    this.disarmAutopilotCollector(sessionId);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.autopilotCollectors.delete(sessionId);
        reject(new Error(`Autopilot phase timed out after ${Math.round(timeoutMs / 1000)}s`));
      }, timeoutMs);

      this.autopilotCollectors.set(sessionId, {
        buffer: '',
        resolve,
        reject,
        timeout,
      });
    });
  }

  /**
   * Disarm (cancel) an active autopilot collector for a session.
   */
  disarmAutopilotCollector(sessionId: string): void {
    const collector = this.autopilotCollectors.get(sessionId);
    if (collector) {
      clearTimeout(collector.timeout);
      this.autopilotCollectors.delete(sessionId);
    }
  }
}

// Singleton instance
export const ptyManager = new PtyManager();
