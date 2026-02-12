import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'node:path';
import {
  type AgentName,
  isValidAgent,
  buildPrompt,
  loadAgentDefinition,
  AGENT_TIMEOUTS,
  TASK_TRACKING_AGENTS,
  autoUpdateSpecTasks,
} from '@/lib/autopilotConstants';

/**
 * Autopilot Execute API - Executa uma única fase via Claude CLI --print (execSync fallback)
 */

interface ExecuteRequest {
  agent: string;
  specContent: string;
  specFilePath?: string;
  previousOutputs: string[];
  projectPath: string;
}

export async function POST(req: NextRequest) {
  let body: ExecuteRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { agent, specContent, specFilePath, previousOutputs, projectPath } = body;

  if (!agent || !specContent || !projectPath) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!isValidAgent(agent)) {
    return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 });
  }

  // Validate projectPath - must be absolute and not escape via traversal
  const resolved = path.resolve(projectPath);
  if (resolved !== projectPath || projectPath.includes('..')) {
    return NextResponse.json({ error: 'Invalid project path' }, { status: 400 });
  }

  // Load the full agent definition from the project's .claude/commands/agents/
  const agentDefinition = await loadAgentDefinition(resolved, agent);
  const fullPrompt = buildPrompt(agent, specContent, previousOutputs || [], agentDefinition);
  const timeout = AGENT_TIMEOUTS[agent];

  try {
    const output = execSync('claude --print', {
      cwd: resolved,
      input: fullPrompt,
      encoding: 'utf-8',
      timeout: timeout * 1000,
      maxBuffer: 2 * 1024 * 1024,
    });

    const trimmedOutput = output.trim();

    // Auto-update spec tasks if this agent produces trackable output
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
      success: true,
      output: trimmedOutput,
      agent,
      tasksCompleted,
    });
  } catch (error) {
    console.error(`Autopilot ${agent} error:`, error);

    let errorMessage = 'Execution failed';
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        errorMessage = `Timeout: ${agent} exceeded ${timeout}s`;
      } else if (error.message.includes('ENOENT')) {
        errorMessage = 'Claude CLI not found. Install with: npm i -g @anthropic-ai/claude-code';
      } else {
        errorMessage = error.message.slice(0, 500);
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
