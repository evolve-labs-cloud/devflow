/**
 * Type definitions for DevFlow Memory System
 * Using JSDoc for type safety without TypeScript
 */

/**
 * @typedef {Object} Memory
 * @property {string} version - Schema version (e.g., "1.0.0")
 * @property {string} project - Project name
 * @property {string} lastUpdated - ISO timestamp
 * @property {Session[]} sessions - All sessions
 * @property {Decision[]} decisions - All decisions
 * @property {Artifact[]} artifacts - All artifacts
 */

/**
 * @typedef {Object} Session
 * @property {string} id - UUID
 * @property {string} startedAt - ISO timestamp
 * @property {string} [endedAt] - ISO timestamp
 * @property {string[]} agents - Agent IDs that participated
 * @property {string} task - User's request/task description
 * @property {'completed'|'failed'|'in_progress'} outcome - Session outcome
 */

/**
 * @typedef {Object} Decision
 * @property {string} id - UUID
 * @property {string} sessionId - Parent session ID
 * @property {string} agent - Agent who made the decision
 * @property {'adr'|'tech_choice'|'priority'} type - Decision type
 * @property {string} subject - Short summary
 * @property {string} rationale - Why this decision was made
 * @property {string[]} [alternatives] - Other options considered
 * @property {string} madeAt - ISO timestamp
 * @property {'pending'|'in_progress'|'done'} implementationStatus - Implementation status
 */

/**
 * @typedef {Object} Artifact
 * @property {string} id - UUID
 * @property {string} sessionId - Parent session ID
 * @property {string} agent - Agent who created it
 * @property {'prd'|'design'|'code'|'test'|'doc'|'adr'|'sdd'} type - Artifact type
 * @property {string} path - File path
 * @property {string} summary - Brief description
 * @property {string} createdAt - ISO timestamp
 */

module.exports = {
  // Types are exported via JSDoc comments
};
