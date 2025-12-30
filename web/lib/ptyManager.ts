import * as pty from 'node-pty';
import { EventEmitter } from 'events';

interface TerminalSession {
  id: string;
  pty: pty.IPty;
  cwd: string;
  createdAt: Date;
}

class PtyManager extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private outputBuffers: Map<string, string[]> = new Map();

  createSession(id: string, cwd: string, cols: number = 80, rows: number = 24): TerminalSession {
    // Determine shell based on platform
    const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh';
    const shellArgs = process.platform === 'win32' ? [] : ['-l'];

    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
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
      this.emit('data', { sessionId: id, data });
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode }) => {
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
}

// Singleton instance
export const ptyManager = new PtyManager();
