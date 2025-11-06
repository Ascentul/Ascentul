'use client'

import React from 'react'
import { Loader2, XCircle, Briefcase, TrendingUp, DollarSign, Clock } from 'lucide-react'
import type { ToolCall, CareerPathOutput, CareerPathNode, CareerLevel, GrowthPotential } from '@/lib/agent/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { logError } from '@/lib/logger'

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
  create_interview_stage: 'Scheduling interview',
  update_interview_stage: 'Updating interview',
  create_followup: 'Creating follow-up task',
  update_followup: 'Updating follow-up',
  generate_career_path: 'Generating career path',
  create_contact: 'Creating contact',
  update_contact: 'Updating contact',
  delete_contact: 'Deleting contact',
  log_contact_interaction: 'Logging interaction',
  create_contact_followup: 'Creating contact follow-up',
  update_contact_followup: 'Updating contact follow-up',
  delete_contact_followup: 'Deleting contact follow-up',
}

// Level badge colors matching the career path page
const LEVEL_COLORS: Record<CareerLevel, string> = {
  entry: 'bg-blue-100 text-blue-800 border-blue-200',
  mid: 'bg-green-100 text-green-800 border-green-200',
  senior: 'bg-purple-100 text-purple-800 border-purple-200',
  lead: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  executive: 'bg-red-100 text-red-800 border-red-200',
}

// Growth potential colors
const GROWTH_COLORS: Record<GrowthPotential, string> = {
  low: 'text-amber-600',
  medium: 'text-blue-600',
  high: 'text-green-600',
  stable: 'text-gray-600',
}

export function ToolStepCard({ toolCall }: ToolStepCardProps) {
  const router = useRouter()

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

  // Special rendering for career path results
  if (toolCall.status === 'success' && toolCall.output && typeof toolCall.output === 'object') {
    const output = toolCall.output as CareerPathOutput

    // Check if this is a career path output
    if (output.type === 'career_path' && output.careerPath?.nodes && output.careerPath.nodes.length > 0) {

      // Get the pathId from the output
      const pathId = typeof (output as any).pathId === 'string' ? (output as any).pathId : undefined
      return (
        <div className="space-y-3 mt-2">
          <div className="grid gap-3">
            {output.careerPath.nodes.map((node: CareerPathNode, index: number) => {
              // Store the career path data and navigate to the career path page
              const handleNodeClick = () => {
                const dataToStore = {
                  pathId,
                  selectedNodeIndex: index,
                  timestamp: Date.now(),
                }
                localStorage.setItem('agent_career_path_selection', JSON.stringify(dataToStore))

                // Dispatch event for any listeners
                try {
                  window.dispatchEvent(
                    new CustomEvent('agent:career-path-selection', { detail: dataToStore })
                  )
                } catch (error) {
                  logError('Failed to dispatch career path selection event', error)
                }

                // Navigate to career path page
                const url = `/career-path${pathId ? `?pathId=${encodeURIComponent(pathId)}` : ''}`
                router.push(url)
              }

              return (
                <Card
                  key={node.id || index}
                  onClick={handleNodeClick}
                  className="p-4 hover:shadow-lg hover:border-primary transition-all cursor-pointer group"
                >
                    <div className="space-y-3">
                      {/* Header with title and level */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {node.title}
                          </h4>
                        </div>
                        <Badge className={`${LEVEL_COLORS[node.level] || 'bg-gray-100 text-gray-800'} text-xs border`}>
                          {node.level}
                        </Badge>
                      </div>

                      {/* Salary and Experience */}
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>{node.salaryRange}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{node.yearsExperience} years</span>
                        </div>
                        {node.growthPotential && (
                          <div className={`flex items-center gap-1 ${GROWTH_COLORS[node.growthPotential] || 'text-gray-600'}`}>
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="capitalize">{node.growthPotential} growth</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {node.description}
                      </p>

                      {/* Skills */}
                      {node.skills && node.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {node.skills.slice(0, 6).map((skill: string, skillIndex: number) => (
                            <Badge
                              key={skillIndex}
                              variant="outline"
                              className="text-xs py-0 px-2 bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {node.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs py-0 px-2">
                              +{node.skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                </Card>
              )
            })}
          </div>
          <div className="text-xs text-gray-500 text-center pt-2">
            Click any stage to view full details on the Career Path page
          </div>
        </div>
      )
    }
  }

  // Hide successful completions for other tools (user will see the result in the text response)
  return null
}
