/**
 * Shared types for AI Agent system
 */

export type MessageRole = 'user' | 'assistant' | 'system'

export interface AgentMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  input?: Record<string, unknown>
  output?: unknown
  error?: string
}

export interface AgentContext {
  source?: string // e.g., 'dashboard', 'applications', 'resume-studio'
  recordId?: string // e.g., application ID, goal ID
  action?: string // e.g., 'follow-up', 'optimize', 'analyze'
  metadata?: Record<string, unknown>
}

export interface AgentState {
  isOpen: boolean
  context: AgentContext | null
  messages: AgentMessage[]
  isStreaming: boolean
}

export interface SSEEvent {
  type: 'delta' | 'tool' | 'error' | 'done'
  data?: unknown
}

export interface AgentContextType {
  state: AgentState
  openAgent: (context?: AgentContext) => void
  closeAgent: () => void
  setContext: (context: AgentContext) => void
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}
