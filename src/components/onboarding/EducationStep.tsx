'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EducationStepProps {
  major: string
  graduationYear: string
  onMajorChange: (value: string) => void
  onGraduationYearChange: (value: string) => void
  onNext: () => void
  onBack?: () => void,
}

export function EducationStep({
  major,
  graduationYear,
  onMajorChange,
  onGraduationYearChange,
  onNext,
  onBack,
}: EducationStepProps) {
  const graduationYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 7 }, (_, i) => currentYear + i)
  }, [])

  const nextButtonLabel = !major.trim() || !graduationYear
    ? 'Complete all fields to continue'
    : 'Continue to next step'

  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="text-2xl">
          Tell us about your education
        </CardTitle>
        <CardDescription>
          Help us personalize your experience by sharing your academic
          details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="major">What's your major?</Label>
          <Input
            id="major"
            placeholder="e.g., Computer Science, Business, Psychology"
            value={major}
            onChange={(e) => onMajorChange(e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grad-year">Expected graduation year</Label>
          <Select
            value={graduationYear}
            onValueChange={onGraduationYearChange}
          >
            <SelectTrigger id="grad-year">
              <SelectValue placeholder="Select graduation year" />
            </SelectTrigger>
            <SelectContent>
              {graduationYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack} aria-label="Go back to previous step">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!major.trim() || !graduationYear}
          className={!onBack ? 'ml-auto' : ''}
          aria-label={nextButtonLabel}
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </div>
  )
}
