import * as React from 'react'
import { TrendingUp, Zap, Users } from 'lucide-react'

const trustItems = [
  {
    icon: TrendingUp,
    title: 'Career Growth',
    description: 'Track your progress, set meaningful goals, and accelerate your professional development with AI-powered insights.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Tools',
    description: 'Leverage cutting-edge AI to optimize your resume, practice interviews, and get personalized career advice.',
  },
  {
    icon: Users,
    title: 'Professional Network',
    description: 'Connect with like-minded professionals, mentors, and industry experts to expand your career opportunities.',
  },
]

export function TrustRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {trustItems.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={index} className="text-center">
            <Icon
              className="h-10 w-10 text-[#5271FF] mx-auto mb-4"
              aria-hidden="true"
              strokeWidth={1.5}
            />
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {item.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
