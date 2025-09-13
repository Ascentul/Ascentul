import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  ReactNode
} from "react"
import { apiRequest } from "@/lib/queryClient"
import {
  loadInterviewStagesForApplication,
  getInterviewingApplications
} from "@/lib/interview-utils"

// Event name constants for updates
export const INTERVIEW_COUNT_UPDATE_EVENT = "interviewCountUpdate"
export const APPLICATION_STATUS_CHANGE_EVENT = "applicationStatusChange"
export const INTERVIEW_STAGE_CHANGE_EVENT = "interviewStageChange"

// Context type definition
type UpcomingInterviewsContextType = {
  upcomingInterviewCount: number
  updateInterviewCount: () => Promise<number>
}

// Create the context
const UpcomingInterviewsContext = createContext<
  UpcomingInterviewsContextType | undefined
>(undefined)

export function UpcomingInterviewsProvider({
  children
}: {
  children: ReactNode
}) {
  // Start with 0 and immediately fetch accurate count
  const [upcomingInterviewCount, setUpcomingInterviewCount] = useState(0)

  // Function to count applications in interview stage and upcoming interviews
  const updateInterviewCount = useCallback(async (): Promise<number> => {
    try {
      // First try to load from localStorage using our utility function
      let localApplications = JSON.parse(
        localStorage.getItem("mockJobApplications") || "[]"
      )
      if (!Array.isArray(localApplications)) {
        localApplications = []
      }

      // Filter applications with status "Interviewing" using our utility function
      const interviewingApps = getInterviewingApplications()

      // Count interviewing applications
      const appCount = interviewingApps.length

      // Count upcoming interviews from stages
      let scheduledInterviewsCount = 0

      // DETAILED DEBUGGING APPROACH
      // Count ALL stages regardless of status or date
      const allStages: any[] = []
      const allStagesSet = new Set<number>()

      // Directly count ALL interview stages from localStorage regardless of status

      // Scan all localStorage for interview stages - get a complete picture
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        // Only process interview stage keys
        if (
          !key.includes("mockStages_") &&
          !key.includes("mockInterviewStages_")
        )
          continue

  }
  return context
}
