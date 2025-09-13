'use client'

import { format } from 'date-fns'
import { CheckCircle, Calendar } from 'lucide-react'

interface Goal {
  id: number
  title: string
  description?: string
  completedAt?: string
  status: string
}

interface GoalTimelineProps {
  goals: Goal[]
}

export default function GoalTimeline({ goals }: GoalTimelineProps) {
  const sortedGoals = goals
    .filter(goal => goal.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())

  if (sortedGoals.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No completed goals to display in timeline</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {sortedGoals.map((goal, index) => (
          <div key={goal.id} className="relative flex items-start space-x-4 pb-6">
            {/* Timeline dot */}
            <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-green-100 rounded-full border-2 border-green-500">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Completed {format(new Date(goal.completedAt!), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}