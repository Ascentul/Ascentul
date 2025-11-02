'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { ToolCall } from '@/lib/agent/types'

interface ToolStepCardProps {
  toolCall: ToolCall
}

export function ToolStepCard({ toolCall }: ToolStepCardProps) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Running</Badge>
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getStatusIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <code className="text-sm font-mono font-semibold text-gray-900">
                {toolCall.name}
              </code>
              {getStatusBadge()}
            </div>

            {toolCall.input && (
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-600 mb-1">Input:</p>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(toolCall.input, null, 2)}
                </pre>
              </div>
            )}

            {toolCall.output !== undefined && (
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-600 mb-1">Output:</p>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-40">
                  {typeof toolCall.output === 'string'
                    ? toolCall.output
                    : JSON.stringify(toolCall.output, null, 2)}
                </pre>
              </div>
            )}

            {toolCall.error && (
              <div className="mb-2">
                <p className="text-xs font-medium text-red-600 mb-1">Error:</p>
                <p className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  {toolCall.error}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
