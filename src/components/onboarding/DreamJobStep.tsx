'use client'

import { ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DreamJobStepProps {
  dreamJob: string
  onDreamJobChange: (value: string) => void
  onComplete: () => void
  onBack: () => void
  isSaving: boolean,
}

export function DreamJobStep({
  dreamJob,
  onDreamJobChange,
  onComplete,
  onBack,
  isSaving,
}: DreamJobStepProps) {
  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="text-2xl">What's your dream job?</CardTitle>
        <CardDescription>
          Tell us about your career aspirations so we can help you get
          there.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dreamJob">Dream job title or role</Label>
          <Input
            id="dreamJob"
            placeholder="e.g., Software Engineer at Google, Marketing Manager, Data Scientist"
            value={dreamJob}
            onChange={(e) => onDreamJobChange(e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Be as specific or general as you'd like - this helps us tailor
            your experience.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} aria-label="Go back to previous step">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={isSaving || !dreamJob.trim()}
          className="min-w-[140px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up your account
            </>
          ) : (
            'Complete account setup'
          )}
        </Button>
      </CardFooter>
    </div>
  )
}
