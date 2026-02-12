import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'node:path';
import os from 'node:os';
import { ptyManager } from '@/lib/ptyManager';
import {
  isValidAgent,
  buildPrompt,
  loadAgentDefinition,
  AGENT_TIMEOUTS,
  TASK_TRACKING_AGENTS,
  PHASE_DONE_MARKER,
  autoUpdateSpecTasks,
} from '@/lib/autopilotConstants';

/**
 * Autopilot Terminal Execute API
 * Runs an agent phase through the terminal PTY (streaming output visible in xterm.js).
 */

interface TerminalExecuteRequest {
  sessionId: string;
  agent: string;
  specContent: string;
  specFilePath?: string;
  previousOutputs: string[];
  projectPath: string;
}

export async function POST(req: NextRequest) {
  let body: TerminalExecuteRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, agent, specContent, specFilePath, previousOutputs, projectPath } = body;

  if (!sessionId || !agent || !specContent || !projectPath) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Sanitize sessionId to prevent path traversal
  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeSessionId || safeSessionId !== sessionId) {
    return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
  }

  if (!isValidAgent(agent)) {
    return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 });
  }

  // Validate projectPath
  const resolved = path.resolve(projectPath);
  if (resolved !== projectPath || projectPath.includes('..')) {
    return NextResponse.json({ error: 'Invalid project path' }, { status: 400 });
  }

  // Verify terminal session exists
  const session = ptyManager.getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Terminal session not found' }, { status: 404 });
  }

  // Load full agent definition from the project's .claude/commands/agents/
  const agentDefinition = await loadAgentDefinition(resolved, agent);
  const fullPrompt = buildPrompt(agent, specContent, previousOutputs || [], agentDefinition);
  const timeoutSec = AGENT_TIMEOUTS[agent];
  const timeoutMs = timeoutSec * 1000;

  // Write prompt to temp file (avoid shell escaping issues)
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `devflow-autopilot-${safeSessionId}-${agent}-${Date.now()}.md`);

  try {
    await fs.writeFile(tmpFile, fullPrompt, { encoding: 'utf-8', mode: 0o600 });

    // Arm the collector before writing the command
    const collectorPromise = ptyManager.armAutopilotCollector(sessionId, timeoutMs + 5000);

    // Write the command to the PTY
    // Uses: claude --print < tmpfile ; echo marker
    // The marker includes $? to capture the exit code of claude
    const command = `cd ${JSON.stringify(resolved)} && claude --print < ${JSON.stringify(tmpFile)}; echo "${PHASE_DONE_MARKER}$?___"\n`;
    ptyManager.write(sessionId, command);

    // Wait for the collector to detect the marker
    const result = await collectorPromise;

    // Clean up temp file
    await fs.unlink(tmpFile).catch(() => {});

    const trimmedOutput = result.output.trim();

    // Auto-update spec tasks
    let tasksCompleted: string[] = [];
    if (
      specFilePath &&
      TASK_TRACKING_AGENTS.includes(agent) &&
      trimmedOutput.length > 0
    ) {
      const resolvedSpec = path.resolve(specFilePath);
      if (resolvedSpec === specFilePath && !specFilePath.includes('..')) {
        tasksCompleted = await autoUpdateSpecTasks(resolvedSpec, trimmedOutput);
      }
    }

    return NextResponse.json({
      success: result.exitCode === 0,
      output: trimmedOutput,
      exitCode: result.exitCode,
      agent,
      tasksCompleted,
      error: result.exitCode !== 0 ? `Agent ${agent} exited with code ${result.exitCode}` : undefined,
    });
  } catch (error) {
    // Clean up temp file on error
    await fs.unlink(tmpFile).catch(() => {});

    // Disarm collector if still active
    ptyManager.disarmAutopilotCollector(sessionId);

    console.error(`Autopilot terminal-execute ${agent} error:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Execution failed';
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
