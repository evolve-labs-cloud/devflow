// File types
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
  size?: number;
  modifiedAt?: string;
}

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: string;
}

// Chat types
export interface ChatImage {
  id: string;
  data: string; // base64 data
  mimeType: string;
  name?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: ChatImage[];
  agent?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  messageCount: number;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  description: string;
  shortDescription: string;
}

// Project types
export interface ProjectInfo {
  path: string;
  name: string;
  isValid: boolean;
  hasDevflow: boolean;
  hasClaudeProject: boolean;
  stats: ProjectStats;
}

export interface ProjectStats {
  specs: number;
  stories: number;
  adrs: number;
  agents: number;
}

// Health types
export interface HealthStatus {
  claudeCli: {
    installed: boolean;
    authenticated: boolean;
    version?: string;
    error?: string;
  };
  project: {
    valid: boolean;
    hasDevflow: boolean;
    hasClaudeProject: boolean;
  };
  system: {
    platform: string;
    nodeVersion: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Spec types (Kiro-style workflow)
export type SpecPhase = 'requirements' | 'design' | 'tasks';

export interface Spec {
  id: string;
  name: string;
  description: string;
  phase: SpecPhase;
  status: 'draft' | 'approved' | 'implemented';
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
}

export interface Requirement {
  id: string;
  specId: string;
  title: string;
  description: string;
  type: 'functional' | 'non-functional' | 'constraint';
  priority: 'must' | 'should' | 'could' | 'wont';
  acceptanceCriteria: string[];
  status: 'draft' | 'approved' | 'implemented';
  filePath?: string;
}

export interface DesignDecision {
  id: string;
  specId: string;
  title: string;
  context: string;
  decision: string;
  consequences: string[];
  alternatives?: string[];
  status: 'proposed' | 'accepted' | 'deprecated';
  filePath?: string;
}

// Task types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  specId?: string;
  filePath?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  assignedAgent?: string;
  estimatedTokens?: number;
  createdAt: Date;
  completedAt?: Date;
}

// Model types
export type ModelId = 'claude-sonnet-4' | 'claude-opus-4' | 'auto';

export interface ModelConfig {
  id: ModelId;
  name: string;
  description: string;
  icon: string;
}

// Autopilot types
export interface AutopilotConfig {
  enabled: boolean;
  maxIterations: number;
  pauseOnError: boolean;
  requireApproval: 'none' | 'files' | 'all';
}
