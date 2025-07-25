import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback
} from "react"
import { apiRequest } from "@/lib/queryClient"

interface PendingTasksContextType {
  pendingFollowupCount: number
  updatePendingFollowupCount: () => Promise<number>
  updateTaskStatus: (
    applicationId: number,
    followupId: number,
    isCompleted: boolean
  ) => void
  markTaskCompleted: (applicationId: number, followupId: number) => void
  markTaskPending: (applicationId: number, followupId: number) => void
}

// Event names for task status changes and contact followup updates
const TASK_STATUS_CHANGE_EVENT = "taskStatusChange"
const CONTACT_FOLLOWUP_UPDATE_EVENT = "contactFollowupUpdate"

// Custom event interface
interface TaskStatusChangeEvent extends CustomEvent {
  detail: {
    applicationId: number
    followupId: number
    isCompleted: boolean
  }
}

const PendingTasksContext = createContext<PendingTasksContextType | undefined>(
  undefined
)

export function PendingTasksProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available
  const initialCount = (() => {
    try {
      const storedCount = localStorage.getItem("pendingFollowupCount")
      if (storedCount) {
        const count = parseInt(storedCount, 10)
        if (!isNaN(count)) {
          console.log(
            `Initialized pending followup count from localStorage: ${count}`
          )
          return count
        }
      }
    } catch (e) {
      console.error("Error reading pendingFollowupCount from localStorage:", e)
    }
    return 0
  })()

  const [pendingFollowupCount, setPendingFollowupCount] = useState(initialCount)

  // Enhanced function to count all pending followups from localStorage and API
  const updatePendingFollowupCount = useCallback(async (): Promise<number> => {
    try {
      // ... existing localStorage logic ...
      let contactFollowupCount = 0
      let appFollowupCount = 0

      // Calculate contact followup count from localStorage
      const contactFollowupsJson =
        localStorage.getItem("mockContactFollowups") || "[]"
      try {
        const contactFollowups = JSON.parse(contactFollowupsJson)
        if (Array.isArray(contactFollowups)) {
          contactFollowupCount = contactFollowups.filter(
            (f: any) => f && !f.completed
          ).length
        }
      } catch (parseError) {
        console.error(
          "Error parsing contact followups from localStorage:",
          parseError
        )
      }

      // Calculate app followup count from localStorage
      const mockApplicationsJson =
        localStorage.getItem("mockJobApplications") || "[]"
      try {
        const applications = JSON.parse(mockApplicationsJson)
        if (Array.isArray(applications)) {
          for (const app of applications) {
            if (app && app.id) {
              const followupsJson =
                localStorage.getItem(`mockFollowups_${app.id}`) || "[]"
              try {
                const followups = JSON.parse(followupsJson)
                if (Array.isArray(followups)) {
                  appFollowupCount += followups.filter(
                    (f: any) => f && !f.completed
                  ).length
                }
              } catch (appParseError) {
                console.error(
                  `Error parsing followups for app ${app.id}:`,
                  appParseError
                )
              }
            }
          }
        }
      } catch (appParseError) {
        console.error(
          "Error parsing applications from localStorage:",
          appParseError
        )
      }

      const combinedCount = contactFollowupCount + appFollowupCount
      console.log(
        `Combined ${appFollowupCount} application followups and ${contactFollowupCount} contact followups`
      )

      // Update the state with combined count
      setPendingFollowupCount(combinedCount)

      // Save this value to localStorage so it persists across page reloads
      localStorage.setItem("pendingFollowupCount", String(combinedCount))

      // Only fetch from API occasionally to verify data consistency
      // Check if we should make an API call (every 5th call or if local data looks stale)
      const lastApiCheck = localStorage.getItem("lastPendingTasksApiCheck")
      const now = Date.now()
      const shouldCheckApi =
        !lastApiCheck || now - parseInt(lastApiCheck) > 60000 // Check every minute max

      if (!shouldCheckApi) {
        return combinedCount
      }

      // Update last API check timestamp
      localStorage.setItem("lastPendingTasksApiCheck", String(now))

      // Then try to get applications from the API in the background
      // to ensure we have the latest data for application followups
      try {
        const response = await apiRequest("GET", "/api/job-applications")
        if (!response.ok) {
          console.error(`API error fetching applications: ${response.status}`)
          return combinedCount // Return combined count on API error
        }

        const apiApplications = await response.json()

        if (Array.isArray(apiApplications) && apiApplications.length > 0) {
          console.log(`Found ${apiApplications.length} applications from API`)
          // Get API counts for each application
          let apiAppCount = 0
          const apiPromises = apiApplications.map(async (app) => {
            try {
              // First check localStorage as it's the most up-to-date
              const mockFollowupsJson = localStorage.getItem(
                `mockFollowups_${app.id}`
              )
              if (mockFollowupsJson) {
                try {
                  const mockFollowups = JSON.parse(mockFollowupsJson)
                  if (
                    Array.isArray(mockFollowups) &&
                    mockFollowups.length > 0
                  ) {
                    // Count only tasks with completed = false (pending tasks)
                    return mockFollowups.filter((f) => f && !f.completed).length
                  }
                } catch (parseError) {
                  console.error(
                    `Error parsing localStorage followups for app ${app.id}:`,
                    parseError
                  )
                }
              }

              // Try to fetch from API if nothing valid in localStorage
              try {
                const followupResponse = await apiRequest(
                  "GET",
                  `/api/applications/${app.id}/followups`
                )
                if (followupResponse.ok) {
                  const apiFollowups = await followupResponse.json()
                  if (Array.isArray(apiFollowups)) {
                    // Count only tasks with completed = false (pending tasks)
                    return apiFollowups.filter((f) => f && !f.completed).length
                  }
                }
              } catch (apiFollowupError) {
                // API endpoint might not exist yet, just continue
              }

              // Return 0 if we couldn't get a valid count
              return 0
            } catch (error) {
              console.error(
                `Error processing followups for application ${app.id}:`,
                error
              )
              return 0
            }
          })

          // Wait for all API counts to be resolved
          const appCountsArray = await Promise.all(apiPromises)
          apiAppCount = appCountsArray.reduce((sum, count) => sum + count, 0)

          // If API application count differs from localStorage count, update the total
          if (apiAppCount !== appFollowupCount) {
            console.log(
              `API app count (${apiAppCount}) differs from localStorage app count (${appFollowupCount}), updating...`
            )
            const updatedCombinedCount = apiAppCount + contactFollowupCount
            console.log(
              `Combined ${apiAppCount} application followups and ${contactFollowupCount} contact followups`
            )
            setPendingFollowupCount(updatedCombinedCount)
            localStorage.setItem(
              "pendingFollowupCount",
              String(updatedCombinedCount)
            )
            return updatedCombinedCount
          }
        }
      } catch (apiError) {
        // API error, we already have local data so just log the error
        console.error(
          "Error fetching or processing API applications:",
          apiError
        )
      }

      return combinedCount
    } catch (error) {
      console.error("Error updating pending followup count:", error)
      return pendingFollowupCount // Return current count on error
    }
  }, []) // Empty dependency array to make it stable

  // Function to update a task's status and sync the pending count
  const updateTaskStatus = useCallback(
    (applicationId: number, followupId: number, isCompleted: boolean) => {
      try {
        // Get the current followups
        const followupsJson =
          localStorage.getItem(`mockFollowups_${applicationId}`) || "[]"
        const followups = JSON.parse(followupsJson)

        // Find and update the specific task
        const followupIndex = followups.findIndex(
          (f: any) => f.id === followupId
        )

        if (followupIndex !== -1) {
          // Check if the status is actually changing
          const currentStatus = followups[followupIndex].completed
          if (currentStatus !== isCompleted) {
            // Only adjust the counter if the status is actually changing
            if (isCompleted) {
              // Task being marked as completed - decrement count
              setPendingFollowupCount((prev) => Math.max(0, prev - 1))
              console.log(
                `Task ${followupId} marked as completed. Pending count decreased.`
              )
            } else {
              // Task being marked as pending - increment count
              setPendingFollowupCount((prev) => prev + 1)
              console.log(
                `Task ${followupId} marked as pending. Pending count increased.`
              )
            }

            // Update the followup in localStorage
            followups[followupIndex] = {
              ...followups[followupIndex],
              completed: isCompleted,
              updatedAt: new Date().toISOString(),
              completedDate: isCompleted ? new Date().toISOString() : null
            }

            localStorage.setItem(
              `mockFollowups_${applicationId}`,
              JSON.stringify(followups)
            )

            // Dispatch custom events for other components to react to
            // First our own TASK_STATUS_CHANGE_EVENT
            window.dispatchEvent(
              new CustomEvent(TASK_STATUS_CHANGE_EVENT, {
                detail: {
                  applicationId,
                  followupId,
                  isCompleted
                }
              })
            )

            // Also dispatch a regular 'taskStatusChange' event that other components can listen for
            // without having to import TASK_STATUS_CHANGE_EVENT constant
            window.dispatchEvent(
              new CustomEvent("taskStatusChange", {
                detail: {
                  applicationId,
                  followupId,
                  isCompleted
                }
              })
            )

            // Note: We're not calling updatePendingFollowupCount() here anymore
            // since we already updated the count manually above
          }
        }
      } catch (error) {
        console.error("Error updating task status:", error)
      }
    },
    []
  )

  // Helper function to mark a task as completed
  const markTaskCompleted = useCallback(
    (applicationId: number, followupId: number) => {
      updateTaskStatus(applicationId, followupId, true)
    },
    [updateTaskStatus]
  )

  // Helper function to mark a task as pending
  const markTaskPending = useCallback(
    (applicationId: number, followupId: number) => {
      updateTaskStatus(applicationId, followupId, false)
    },
    [updateTaskStatus]
  )

  // Initialize and set up listeners
  useEffect(() => {
    // Initial count on component mount
    updatePendingFollowupCount()

    // Listen for localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.startsWith("mockFollowups_")) {
        updatePendingFollowupCount()
      }
    }

    // Listen for custom task status change events
    const handleTaskStatusChange = () => {
      // We don't need to do anything here because updateTaskStatus already updates the count
      // This is just to enable other components to react to the changes
    }

    // Listen for contact followup update events
    const handleContactFollowupUpdate = () => {
      // When contact followups are updated, refresh the count
      updatePendingFollowupCount()
    }

    // Set up event listeners
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener(
      TASK_STATUS_CHANGE_EVENT,
      handleTaskStatusChange as EventListener
    )
    window.addEventListener(
      CONTACT_FOLLOWUP_UPDATE_EVENT,
      handleContactFollowupUpdate as EventListener
    )
    window.addEventListener(
      "contactFollowupUpdate",
      handleContactFollowupUpdate as EventListener
    )

    // Set up a refresh interval
    const interval = setInterval(() => {
      if (!document.hidden) {
        updatePendingFollowupCount()
      }
    }, 30000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener(
        TASK_STATUS_CHANGE_EVENT,
        handleTaskStatusChange as EventListener
      )
      window.removeEventListener(
        CONTACT_FOLLOWUP_UPDATE_EVENT,
        handleContactFollowupUpdate as EventListener
      )
      window.removeEventListener(
        "contactFollowupUpdate",
        handleContactFollowupUpdate as EventListener
      )
      clearInterval(interval)
    }
  }, []) // Empty dependency array to prevent infinite re-runs

  // Create the context value
  const contextValue: PendingTasksContextType = {
    pendingFollowupCount,
    updatePendingFollowupCount,
    updateTaskStatus,
    markTaskCompleted,
    markTaskPending
  }

  return (
    <PendingTasksContext.Provider value={contextValue}>
      {children}
    </PendingTasksContext.Provider>
  )
}

export function usePendingTasks() {
  const context = useContext(PendingTasksContext)
  if (context === undefined) {
    throw new Error(
      "usePendingTasks must be used within a PendingTasksProvider"
    )
  }
  return context
}
