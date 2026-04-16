/**
 * MemoryManager - Persistent Memory System for DevFlow
 *
 * Automatically persists decisions, artifacts, and sessions to .devflow/memory.json
 * Provides query API for agents to retrieve context from previous sessions
 *
 * @module lib/memory/MemoryManager
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

/**
 * @typedef {import('./types').Memory} Memory
 * @typedef {import('./types').Session} Session
 * @typedef {import('./types').Decision} Decision
 * @typedef {import('./types').Artifact} Artifact
 */

class MemoryManager {
  /**
   * @param {string} projectRoot - Project root directory
   */
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.memoryPath = path.join(projectRoot, '.devflow', 'memory.json');
    this.memory = this.load();
  }

  /**
   * Load memory from disk or create empty
   * @private
   * @returns {Memory}
   */
  load() {
    if (fs.existsSync(this.memoryPath)) {
      try {
        const data = fs.readFileSync(this.memoryPath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.error('[MemoryManager] Failed to load memory, creating new:', error.message);
        return this.createEmpty();
      }
    }
    return this.createEmpty();
  }

  /**
   * Create empty memory structure
   * @private
   * @returns {Memory}
   */
  createEmpty() {
    const projectName = path.basename(this.projectRoot);
    return {
      version: '1.0.0',
      project: projectName,
      lastUpdated: new Date().toISOString(),
      sessions: [],
      decisions: [],
      artifacts: []
    };
  }

  /**
   * Save memory to disk (atomic write with backup)
   * @private
   */
  save() {
    const dir = path.dirname(this.memoryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Update timestamp
    this.memory.lastUpdated = new Date().toISOString();

    // Atomic write: write to temp, then rename
    const tempPath = `${this.memoryPath}.tmp`;
    const backupPath = `${this.memoryPath}.backup`;

    try {
      // Write to temp file
      fs.writeFileSync(tempPath, JSON.stringify(this.memory, null, 2), 'utf-8');

      // Backup existing if it exists
      if (fs.existsSync(this.memoryPath)) {
        fs.copyFileSync(this.memoryPath, backupPath);
      }

      // Rename temp to actual
      fs.renameSync(tempPath, this.memoryPath);

      // Cleanup old backup (keep only 1)
      if (fs.existsSync(backupPath)) {
        // Keep backup for safety, could rotate multiple backups here
      }
    } catch (error) {
      console.error('[MemoryManager] Failed to save memory:', error.message);
      // Restore from backup if save failed
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, this.memoryPath);
      }
      throw error;
    }
  }

  // ==================== Session Management ====================

  /**
   * Start a new session
   * @param {string} task - Task description
   * @returns {string} Session ID (UUID)
   */
  startSession(task) {
    const sessionId = randomUUID();
    this.memory.sessions.push({
      id: sessionId,
      startedAt: new Date().toISOString(),
      agents: [],
      task,
      outcome: 'in_progress'
    });
    this.save();
    return sessionId;
  }

  /**
   * End a session
   * @param {string} sessionId - Session ID
   * @param {'completed'|'failed'} outcome - Final outcome
   */
  endSession(sessionId, outcome) {
    const session = this.memory.sessions.find(s => s.id === sessionId);
    if (session) {
      session.endedAt = new Date().toISOString();
      session.outcome = outcome;
      this.save();
    } else {
      console.warn(`[MemoryManager] Session not found: ${sessionId}`);
    }
  }

  /**
   * Add agent to session
   * @param {string} sessionId - Session ID
   * @param {string} agent - Agent ID
   */
  addAgentToSession(sessionId, agent) {
    const session = this.memory.sessions.find(s => s.id === sessionId);
    if (session && !session.agents.includes(agent)) {
      session.agents.push(agent);
      this.save();
    }
  }

  // ==================== Decision Recording ====================

  /**
   * Record a decision made by an agent
   * @param {string} sessionId - Session ID
   * @param {Object} data - Decision data
   * @param {string} data.agent - Agent who made the decision
   * @param {'adr'|'tech_choice'|'priority'} data.type - Decision type
   * @param {string} data.subject - Short summary
   * @param {string} data.rationale - Why this decision
   * @param {string[]} [data.alternatives] - Other options considered
   * @returns {string} Decision ID (UUID)
   */
  recordDecision(sessionId, data) {
    const decisionId = randomUUID();
    this.memory.decisions.push({
      id: decisionId,
      sessionId,
      agent: data.agent,
      type: data.type,
      subject: data.subject,
      rationale: data.rationale,
      alternatives: data.alternatives || [],
      madeAt: new Date().toISOString(),
      implementationStatus: 'pending'
    });
    this.save();
    return decisionId;
  }

  /**
   * Update decision implementation status
   * @param {string} decisionId - Decision ID
   * @param {'pending'|'in_progress'|'done'} status - New status
   */
  updateDecisionStatus(decisionId, status) {
    const decision = this.memory.decisions.find(d => d.id === decisionId);
    if (decision) {
      decision.implementationStatus = status;
      this.save();
    }
  }

  // ==================== Artifact Recording ====================

  /**
   * Record an artifact created by an agent
   * @param {string} sessionId - Session ID
   * @param {Object} data - Artifact data
   * @param {string} data.agent - Agent who created it
   * @param {'prd'|'design'|'code'|'test'|'doc'|'adr'|'sdd'} data.type - Artifact type
   * @param {string} data.path - File path
   * @param {string} data.summary - Brief description
   * @returns {string} Artifact ID (UUID)
   */
  recordArtifact(sessionId, data) {
    const artifactId = randomUUID();
    this.memory.artifacts.push({
      id: artifactId,
      sessionId,
      agent: data.agent,
      type: data.type,
      path: data.path,
      summary: data.summary,
      createdAt: new Date().toISOString()
    });
    this.save();
    return artifactId;
  }

  // ==================== Query API ====================

  /**
   * Get recent decisions
   * @param {number} [limit=10] - Max number of decisions
   * @returns {Decision[]}
   */
  getRecentDecisions(limit = 10) {
    return [...this.memory.decisions]
      .sort((a, b) => new Date(b.madeAt).getTime() - new Date(a.madeAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get recent sessions
   * @param {number} [limit=5] - Max number of sessions
   * @returns {Session[]}
   */
  getRecentSessions(limit = 5) {
    return [...this.memory.sessions]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get artifacts by type
   * @param {'prd'|'design'|'code'|'test'|'doc'|'adr'|'sdd'} type - Artifact type
   * @returns {Artifact[]}
   */
  getArtifactsByType(type) {
    return this.memory.artifacts.filter(a => a.type === type);
  }

  /**
   * Get artifacts by agent
   * @param {string} agent - Agent ID
   * @param {number} [limit=10] - Max number of artifacts
   * @returns {Artifact[]}
   */
  getArtifactsByAgent(agent, limit = 10) {
    return this.memory.artifacts
      .filter(a => a.agent === agent)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Search decisions by keyword
   * @param {string} query - Search query
   * @returns {Decision[]}
   */
  searchDecisions(query) {
    const lowerQuery = query.toLowerCase();
    return this.memory.decisions.filter(d =>
      d.subject.toLowerCase().includes(lowerQuery) ||
      d.rationale.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Session|undefined}
   */
  getSession(sessionId) {
    return this.memory.sessions.find(s => s.id === sessionId);
  }

  /**
   * Get all decisions for a session
   * @param {string} sessionId - Session ID
   * @returns {Decision[]}
   */
  getSessionDecisions(sessionId) {
    return this.memory.decisions.filter(d => d.sessionId === sessionId);
  }

  /**
   * Get all artifacts for a session
   * @param {string} sessionId - Session ID
   * @returns {Artifact[]}
   */
  getSessionArtifacts(sessionId) {
    return this.memory.artifacts.filter(a => a.sessionId === sessionId);
  }

  // ==================== Context Generation ====================

  /**
   * Generate memory context for an agent
   * @param {string} agent - Agent ID
   * @param {number} [limit=5] - Max items to include
   * @returns {string} Formatted context as markdown
   */
  getContextForAgent(agent, limit = 5) {
    // Each agent sees decisions from the agents it depends on in the pipeline.
    // This prevents irrelevant context from polluting the attention budget.
    const RELEVANT_SOURCES = {
      strategist:     ['strategist'],
      architect:      ['strategist', 'architect'],
      'system-designer': ['architect', 'system-designer'],
      builder:        ['architect', 'system-designer', 'builder'],
      guardian:       ['architect', 'system-designer', 'builder', 'guardian'],
      challenger:     ['guardian', 'builder', 'architect'],
      chronicler:     ['strategist', 'architect', 'system-designer', 'builder', 'guardian', 'challenger', 'chronicler'],
    };

    const relevantSources = RELEVANT_SOURCES[agent] || [agent];
    const allDecisions = this.getRecentDecisions(limit * relevantSources.length);
    const relevantDecisions = allDecisions
      .filter(d => relevantSources.includes(d.agent))
      .slice(0, limit);

    const recentArtifacts = this.getArtifactsByAgent(agent, limit);
    const recentSessions = this.getRecentSessions(3);

    let context = '## 📚 Memory Context\n\n';

    // Recent sessions (last task context)
    if (recentSessions.length > 0) {
      context += '### Recent Sessions:\n';
      recentSessions.forEach(s => {
        const date = new Date(s.startedAt).toLocaleDateString();
        const status = s.outcome === 'completed' ? '✅' : s.outcome === 'failed' ? '❌' : '🔄';
        context += `- ${status} **${s.task}** (${date})\n`;
        context += `  Agents: ${s.agents.join(', ')}\n`;
      });
      context += '\n';
    }

    // Decisions filtered to what this agent needs to know
    if (relevantDecisions.length > 0) {
      context += `### Decisions relevant to @${agent}:\n`;
      relevantDecisions.forEach(d => {
        const date = new Date(d.madeAt).toLocaleDateString();
        const status = d.implementationStatus === 'done' ? '✅' :
                      d.implementationStatus === 'in_progress' ? '🔄' : '📋';
        context += `- ${status} **${d.subject}** (@${d.agent}, ${date})\n`;
        context += `  Rationale: ${d.rationale}\n`;
        if (d.alternatives && d.alternatives.length > 0) {
          context += `  Alternatives considered: ${d.alternatives.join(', ')}\n`;
        }
      });
      context += '\n';
    }

    // Artifacts this agent produced in past sessions
    if (recentArtifacts.length > 0) {
      context += `### Past artifacts by @${agent}:\n`;
      recentArtifacts.forEach(a => {
        const date = new Date(a.createdAt).toLocaleDateString();
        context += `- **${a.type}**: ${a.path} (${date})\n`;
        context += `  ${a.summary}\n`;
      });
      context += '\n';
    }

    return context.trim();
  }

  /**
   * Get full memory stats
   * @returns {Object} Memory statistics
   */
  getStats() {
    return {
      version: this.memory.version,
      project: this.memory.project,
      lastUpdated: this.memory.lastUpdated,
      totalSessions: this.memory.sessions.length,
      completedSessions: this.memory.sessions.filter(s => s.outcome === 'completed').length,
      failedSessions: this.memory.sessions.filter(s => s.outcome === 'failed').length,
      inProgressSessions: this.memory.sessions.filter(s => s.outcome === 'in_progress').length,
      totalDecisions: this.memory.decisions.length,
      pendingDecisions: this.memory.decisions.filter(d => d.implementationStatus === 'pending').length,
      totalArtifacts: this.memory.artifacts.length,
      artifactsByType: {
        prd: this.memory.artifacts.filter(a => a.type === 'prd').length,
        design: this.memory.artifacts.filter(a => a.type === 'design').length,
        code: this.memory.artifacts.filter(a => a.type === 'code').length,
        test: this.memory.artifacts.filter(a => a.type === 'test').length,
        doc: this.memory.artifacts.filter(a => a.type === 'doc').length,
        adr: this.memory.artifacts.filter(a => a.type === 'adr').length,
        sdd: this.memory.artifacts.filter(a => a.type === 'sdd').length
      }
    };
  }
}

module.exports = MemoryManager;
