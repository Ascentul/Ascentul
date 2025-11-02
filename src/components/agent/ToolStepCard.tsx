'use client'

import React from 'react'
import { Loader2, XCircle } from 'lucide-react'
import type { ToolCall } from '@/lib/agent/types'

interface ToolStepCardProps {
  toolCall: ToolCall
}

// Friendly tool name mappings
const TOOL_NAMES: Record<string, string> = {
  get_user_snapshot: 'Retrieving your profile',
  get_profile_gaps: 'Analyzing your profile',
  upsert_profile_field: 'Updating profile',
  search_jobs: 'Searching for jobs',
  save_job: 'Saving job',
  create_goal: 'Creating goal',
  update_goal: 'Updating goal',
  delete_goal: 'Deleting goal',
  create_application: 'Creating application',
  update_application: 'Updating application',
  delete_application: 'Deleting application',
}

export function ToolStepCard({ toolCall }: ToolStepCardProps) {
  // Only show errors, hide successful operations
  if (toolCall.status === 'error' && toolCall.error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
        <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{toolCall.error}</span>
      </div>
    )
  }

  // Show loading state for pending/running operations
  if (toolCall.status === 'pending' || toolCall.status === 'running') {
    const friendlyName = TOOL_NAMES[toolCall.name] || toolCall.name
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
        <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
        <span>{friendlyName}...</span>
      </div>
    )
  }

  // Hide successful completions (user will see the result in the text response)
  return null
}
