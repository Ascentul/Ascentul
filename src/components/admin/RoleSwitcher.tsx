'use client'

import { useState, useEffect } from 'react'
import { Eye, ChevronDown, User, GraduationCap, Briefcase, Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useImpersonation, type ImpersonatableRole, type ImpersonatedPlan } from '@/contexts/ImpersonationContext'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useUser } from '@clerk/nextjs'
import { Id } from 'convex/_generated/dataModel'

interface RoleOption {
  role: ImpersonatableRole
  label: string
  icon: React.ReactNode
  requiresUniversity: boolean
  defaultPlan: ImpersonatedPlan
}

const roleOptions: RoleOption[] = [
  {
    role: 'individual',
    label: 'Individual User',
    icon: <User className="h-4 w-4" />,
    requiresUniversity: false,
    defaultPlan: 'free',
  },
  {
    role: 'student',
    label: 'Student',
    icon: <GraduationCap className="h-4 w-4" />,
    requiresUniversity: true,
    defaultPlan: 'university',
  },
  {
    role: 'advisor',
    label: 'Advisor',
    icon: <Briefcase className="h-4 w-4" />,
    requiresUniversity: true,
    defaultPlan: 'university',
  },
  {
    role: 'university_admin',
    label: 'University Admin',
    icon: <Building2 className="h-4 w-4" />,
    requiresUniversity: true,
    defaultPlan: 'university',
  },
  {
    role: 'staff',
    label: 'Staff',
    icon: <Users className="h-4 w-4" />,
    requiresUniversity: false,
    defaultPlan: 'free',
  },
]

/**
 * Role switcher dropdown for super_admin to impersonate different roles
 */
export function RoleSwitcher() {
  const { user: clerkUser } = useUser()
  const { impersonation, startImpersonating, stopImpersonating, canImpersonate } = useImpersonation()
  const [selectedPlan, setSelectedPlan] = useState<ImpersonatedPlan>('free')

  // Track hydration to avoid SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Fetch universities for roles that require them
  const universities = useQuery(
    api.universities.getAllUniversities,
    canImpersonate && clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  )

  // Don't render until hydrated to avoid mismatch
  if (!isHydrated || !canImpersonate) {
    return null
  }

  // Helper to get role option by role name (avoids fragile array indices)
  const getRoleOption = (role: ImpersonatableRole): RoleOption => {
    const option = roleOptions.find(r => r.role === role)
    if (!option) throw new Error(`Role option not found: ${role}`)
    return option
  }

  const handleRoleSelect = (option: RoleOption, universityId?: Id<"universities">) => {
    if (option.requiresUniversity && !universityId) {
      // Don't select if university is required but not provided
      return
    }

    startImpersonating(option.role, {
      universityId,
      plan: option.role === 'individual' ? selectedPlan : option.defaultPlan,
    })
  }

  const currentLabel = impersonation.isImpersonating
    ? roleOptions.find(r => r.role === impersonation.role)?.label || 'Unknown'
    : 'Super Admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${impersonation.isImpersonating ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-neutral-200'}`}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLabel}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View As Role
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Super Admin (default) */}
          <DropdownMenuItem
            onClick={stopImpersonating}
            className={!impersonation.isImpersonating ? 'bg-neutral-100' : ''}
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary-500" />
              Super Admin
            </span>
            {!impersonation.isImpersonating && (
              <span className="ml-auto text-xs text-neutral-500">(current)</span>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Individual user with plan selection */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className={impersonation.role === 'individual' ? 'bg-neutral-100' : ''}
            >
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Individual User
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>Select Plan</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={impersonation.role === 'individual' ? (impersonation.plan || 'free') : selectedPlan}
                onValueChange={(value) => {
                  setSelectedPlan(value as ImpersonatedPlan)
                  startImpersonating('individual', { plan: value as ImpersonatedPlan })
                }}
              >
                <DropdownMenuRadioItem value="free">Free Plan</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="premium">Premium Plan</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Student - requires university */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className={impersonation.role === 'student' ? 'bg-neutral-100' : ''}
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Student
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>Select University</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {universities && universities.length > 0 ? (
                universities.slice(0, 10).map((uni) => (
                  <DropdownMenuItem
                    key={uni._id}
                    onClick={() => handleRoleSelect(getRoleOption('student'), uni._id)}
                    className={
                      impersonation.role === 'student' && impersonation.universityId === uni._id
                        ? 'bg-neutral-100'
                        : ''
                    }
                  >
                    {uni.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No universities found</DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Advisor - requires university */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className={impersonation.role === 'advisor' ? 'bg-neutral-100' : ''}
            >
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Advisor
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>Select University</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {universities && universities.length > 0 ? (
                universities.slice(0, 10).map((uni) => (
                  <DropdownMenuItem
                    key={uni._id}
                    onClick={() => handleRoleSelect(getRoleOption('advisor'), uni._id)}
                    className={
                      impersonation.role === 'advisor' && impersonation.universityId === uni._id
                        ? 'bg-neutral-100'
                        : ''
                    }
                  >
                    {uni.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No universities found</DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* University Admin - requires university */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className={impersonation.role === 'university_admin' ? 'bg-neutral-100' : ''}
            >
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                University Admin
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>Select University</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {universities && universities.length > 0 ? (
                universities.slice(0, 10).map((uni) => (
                  <DropdownMenuItem
                    key={uni._id}
                    onClick={() => handleRoleSelect(getRoleOption('university_admin'), uni._id)}
                    className={
                      impersonation.role === 'university_admin' && impersonation.universityId === uni._id
                        ? 'bg-neutral-100'
                        : ''
                    }
                  >
                    {uni.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No universities found</DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Staff */}
          <DropdownMenuItem
            onClick={() => handleRoleSelect(getRoleOption('staff'))}
            className={impersonation.role === 'staff' ? 'bg-neutral-100' : ''}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}
