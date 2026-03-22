#!/usr/bin/env node
/**
 * Simple test for MemoryManager
 * Usage: node lib/memory/test-memory.js
 */

const path = require('path');
const MemoryManager = require('./MemoryManager');

console.log('🧪 Testing MemoryManager...\n');

// Test 1: Create instance
console.log('Test 1: Creating MemoryManager instance...');
const projectRoot = path.join(__dirname, '..', '..');
const memory = new MemoryManager(projectRoot);
console.log('✅ Instance created\n');

// Test 2: Start session
console.log('Test 2: Starting a test session...');
const sessionId = memory.startSession('Test: Persistent Memory Implementation');
console.log(`✅ Session started: ${sessionId}\n`);

// Test 3: Record decisions
console.log('Test 3: Recording decisions...');
const decision1 = memory.recordDecision(sessionId, {
  agent: 'architect',
  type: 'tech_choice',
  subject: 'JSON file storage for memory',
  rationale: 'Simple, zero dependencies, fast enough for <1000 sessions',
  alternatives: ['SQLite', 'LangGraph Memory', 'Redis']
});
console.log(`✅ Decision recorded: ${decision1}`);

const decision2 = memory.recordDecision(sessionId, {
  agent: 'architect',
  type: 'adr',
  subject: 'Atomic writes with backup',
  rationale: 'Prevent corruption on save failures'
});
console.log(`✅ Decision recorded: ${decision2}\n`);

// Test 4: Record artifacts
console.log('Test 4: Recording artifacts...');
const artifact1 = memory.recordArtifact(sessionId, {
  agent: 'builder',
  type: 'code',
  path: 'lib/memory/MemoryManager.js',
  summary: 'Core MemoryManager implementation with atomic writes'
});
console.log(`✅ Artifact recorded: ${artifact1}`);

const artifact2 = memory.recordArtifact(sessionId, {
  agent: 'architect',
  type: 'design',
  path: 'docs/architecture/deep-agents-phase1-technical-design.md',
  summary: 'Technical design for Phase 1 features'
});
console.log(`✅ Artifact recorded: ${artifact2}\n`);

// Test 5: Add agents to session
console.log('Test 5: Adding agents to session...');
memory.addAgentToSession(sessionId, 'architect');
memory.addAgentToSession(sessionId, 'builder');
console.log('✅ Agents added\n');

// Test 6: Query API
console.log('Test 6: Testing query API...');
const recentDecisions = memory.getRecentDecisions(10);
console.log(`✅ Found ${recentDecisions.length} recent decisions`);

const builderArtifacts = memory.getArtifactsByAgent('builder');
console.log(`✅ Found ${builderArtifacts.length} artifacts by builder`);

const codeArtifacts = memory.getArtifactsByType('code');
console.log(`✅ Found ${codeArtifacts.length} code artifacts\n`);

// Test 7: Context generation
console.log('Test 7: Generating context for agent...');
const context = memory.getContextForAgent('architect', 5);
console.log('✅ Context generated:');
console.log(context);
console.log();

// Test 8: Get stats
console.log('Test 8: Getting memory stats...');
const stats = memory.getStats();
console.log('✅ Memory Statistics:');
console.log(JSON.stringify(stats, null, 2));
console.log();

// Test 9: End session
console.log('Test 9: Ending session...');
memory.endSession(sessionId, 'completed');
console.log('✅ Session ended\n');

// Test 10: Verify persistence
console.log('Test 10: Verifying persistence (reload)...');
const memory2 = new MemoryManager(projectRoot);
const loadedSessions = memory2.getRecentSessions(1);
if (loadedSessions.length > 0 && loadedSessions[0].id === sessionId) {
  console.log('✅ Memory persisted and reloaded successfully!');
} else {
  console.log('❌ Failed to reload memory');
}
console.log();

console.log('🎉 All tests completed!\n');
console.log(`Memory file location: ${path.join(projectRoot, '.devflow', 'memory.json')}`);
