import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Link } from "wouter"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Calendar,
  ArrowUpRight,
  Clock,
  Users,
  Mail,
  Phone
} from "lucide-react"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { usePendingTasks } from "@/context/PendingTasksContext"

// Job Application Follow-up Action interface
interface FollowupAction {
  id: number
  applicationId: number
  type: string
  description: string
  dueDate: string | null
  completed: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

// Job Application interface
interface Application {
  id: number
  company: string
  position: string
  status: string
}

// Contact Follow-up Action with Contact interface
interface ContactFollowupAction {
  id: number
  type: string
  description: string
  dueDate: string | null
  completed: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  contact: {
    id: number
    fullName: string
    company: string | null
    email: string | null
    phone: string | null
  }
}

// Combined Follow-up Action type
type CombinedFollowup =
  | (FollowupAction & { application?: Application; source: "application" })
  | (ContactFollowupAction & { source: "contact" })

interface CombinedFollowupActionsProps {
  limit?: number
  showTitle?: boolean
}

export function CombinedFollowupActions({
  limit = 5,
  showTitle = true
}: CombinedFollowupActionsProps) {
  // State declarations
  const [followupActions, setFollowupActions] = useState<CombinedFollowup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<
    "all" | "applications" | "contacts"
  >("all")

  // Hook declarations
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { updatePendingFollowupCount } = usePendingTasks()

  // Refs to store current data without causing re-renders
  const applicationsRef = useRef<Application[]>([])
  const contactFollowupsRef = useRef<ContactFollowupAction[]>([])

  // Fetch job application followups
  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/job-applications"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/job-applications")
        if (!response.ok) throw new Error(`API error: ${response.status}`)
        return await response.json()
      } catch (error) {
        console.error("Error fetching applications from API:", error)
        return []
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })

  // Fetch contact followups
  const { data: contactFollowups = [] } = useQuery<ContactFollowupAction[]>({
    queryKey: ["/api/contacts/all-followups"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/contacts/all-followups")
        if (!response.ok) throw new Error(`API error: ${response.status}`)
        return await response.json()
      } catch (error) {
        console.error("Error fetching contact followups from API:", error)
        return []
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })

  // Update refs when data changes
  useEffect(() => {
    if (applications) {
      applicationsRef.current = applications
    }
  }, [applications])

  useEffect(() => {
    if (contactFollowups) {
      contactFollowupsRef.current = contactFollowups
    }
  }, [contactFollowups])

  // Load application followups from localStorage and API
  const loadApplicationFollowups = useCallback(
    async (apps: Application[] = []): Promise<CombinedFollowup[]> => {
      const currentApplications = apps
      const pendingFollowups: CombinedFollowup[] = []

      // First load all localStorage applications and their followups
      try {
        // Get all mockJobApplications from localStorage
        const mockAppsJson = localStorage.getItem("mockJobApplications")
        if (mockAppsJson) {
          const mockApps = JSON.parse(mockAppsJson)
          if (Array.isArray(mockApps)) {
            console.log(`Found ${mockApps.length} applications in localStorage`)

            // Process each localStorage application for followups
            for (const app of mockApps) {
              try {
                const followupsJson = localStorage.getItem(
                  `mockFollowups_${app.id}`
                )
                if (followupsJson) {
                  const followups = JSON.parse(followupsJson)
                  if (Array.isArray(followups)) {
                    followups
                      .filter((f: any) => f && !f.completed)
                      .forEach((followup: any) => {
                        pendingFollowups.push({
                          ...followup,
                          applicationId: followup.applicationId || app.id,
                          application: app,
                          source: "application"
                        })
                      })
                  }
                }
              } catch (storageError) {
                console.error(
                  `Error loading followups from localStorage for app ${app.id}:`,
                  storageError
                )
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading applications from localStorage:", error)
      }

      // Now process each database application for followups
      for (const app of currentApplications) {
        try {
          // Skip if the ID is too large for PostgreSQL integer (probably a client-side ID)
          if (`${app.id}`.length > 10) {
            console.log(
              `Skipping API fetch for large application ID: ${app.id}`
            )
            continue
          }

          // Try to get from API first
          const apiResponse = await apiRequest(
            "GET",
            `/api/applications/${app.id}/followups`
          )
          if (apiResponse.ok) {
            const followups = await apiResponse.json()

            // Process API followups
            if (followups && Array.isArray(followups)) {
              followups
                .filter((f: FollowupAction) => f && !f.completed)
                .forEach((followup: FollowupAction) => {
                  // Check if this followup is already in the pendingFollowups
                  const exists = pendingFollowups.some(
                    (pf) => pf.source === "application" && pf.id === followup.id
                  )

                  if (!exists) {
                    pendingFollowups.push({
                      ...followup,
                      applicationId: followup.applicationId || app.id,
                      application: app,
                      source: "application"
                    })
                  }
                })
            }
          }
        } catch (error) {
          console.error(
            `Error loading followups for application ${app.id}:`,
            error
          )
        }
      }

      return pendingFollowups
    },
    []
  )

  // Process contact followups
  const processContactFollowups = useCallback(
    (contactFups: ContactFollowupAction[] = []): CombinedFollowup[] => {
      const currentContactFollowups = contactFups
      if (!Array.isArray(currentContactFollowups)) return []

      return currentContactFollowups
        .filter((followup) => followup && !followup.completed)
        .map((followup) => ({
          ...followup,
          source: "contact"
        }))
    },
    []
  )

  // Sort all followups by due date
  const sortFollowups = useCallback(
    (followups: CombinedFollowup[]): CombinedFollowup[] => {
      return followups.sort((a, b) => {
        // Sort by due date first (earliest due dates first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }

        // Items with due dates come before those without
        if (a.dueDate && !b.dueDate) return -1
        if (!a.dueDate && b.dueDate) return 1

        // Then sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    },
    []
  )

  // Refresh all followups data and combine them
  const refreshFollowups = useCallback(
    async (apps?: Application[], contacts?: ContactFollowupAction[]) => {
      try {
        setIsLoading(true)

        // Use current data or passed data
        const currentApps = apps || applicationsRef.current || []
        const currentContacts = contacts || contactFollowupsRef.current || []

        // Get application followups
        const appFollowups = await loadApplicationFollowups(currentApps)

        // Get contact followups
        const contactFups = processContactFollowups(currentContacts)

        // Combine and sort all followups
        const allFollowups = [...appFollowups, ...contactFups]
        const sortedFollowups = sortFollowups(allFollowups)

        console.log(
          `Combined ${appFollowups.length} application followups and ${contactFups.length} contact followups`
        )
        setFollowupActions(sortedFollowups)
      } catch (error) {
        console.error("Error refreshing followups:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [] // Empty dependency array to make it stable
  )

  // Initial load and refresh when data changes
  useEffect(() => {
    // Only run once on mount, not on every data change
    const timeoutId = setTimeout(() => {
      refreshFollowups(applicationsRef.current, contactFollowupsRef.current)
    }, 100) // Small delay to ensure data is loaded

    return () => clearTimeout(timeoutId)
  }, []) // Empty dependency array - run only once on mount

  // Set up refresh interval (every 30 seconds) - stable dependency
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFollowups(applicationsRef.current, contactFollowupsRef.current)
    }, 30000)
    return () => clearInterval(interval)
  }, []) // Empty dependency array for stable interval

  // Handle toggling application followup status
  const toggleApplicationFollowup = useMutation({
    mutationFn: async (params: {
      followupId: number
      applicationId: number
      completed: boolean
    }) => {
      const { followupId, applicationId, completed } = params
      const endpoint = completed
        ? `/api/applications/${applicationId}/followups/${followupId}/complete`
        : `/api/applications/${applicationId}/followups/${followupId}/uncomplete`

      const response = await apiRequest("POST", endpoint)
      if (!response.ok) throw new Error("Failed to update followup status")
      return await response.json()
    },
    onSuccess: () => {
      // Refresh followups with current data
      refreshFollowups(applicationsRef.current, contactFollowupsRef.current)
      updatePendingFollowupCount().catch(console.error)
      toast({
        title: "Followup updated",
        description: "The followup status has been updated successfully."
      })
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update the followup status. Please try again.",
        variant: "destructive"
      })
    }
  })

  // Handle toggling contact followup status
  const toggleContactFollowup = useMutation({
    mutationFn: async (params: { followupId: number; completed: boolean }) => {
      const { followupId, completed } = params
      const endpoint = completed
        ? `/api/contacts/followups/${followupId}/complete`
        : `/api/contacts/followups/${followupId}/uncomplete`

      const response = await apiRequest("POST", endpoint)
      if (!response.ok)
        throw new Error("Failed to update contact followup status")
      return await response.json()
    },
    onSuccess: () => {
      // Invalidate the contacts followups query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["/api/contacts/all-followups"]
      })

      // Dispatch the contact followup update event for other components to react to
      window.dispatchEvent(new CustomEvent("contactFollowupUpdate"))

      // Also dispatch our custom event for consistency
      window.dispatchEvent(new CustomEvent("CONTACT_FOLLOWUP_UPDATE_EVENT"))

      // Update the pending task count
      updatePendingFollowupCount().catch(console.error)

      toast({
        title: "Contact followup updated",
        description:
          "The contact followup status has been updated successfully."
      })
    },
    onError: () => {
      toast({
        title: "Update failed",
        description:
          "Failed to update the contact followup status. Please try again.",
        variant: "destructive"
      })
    }
  })

  // Handle toggle followup status (detect type and call appropriate mutation)
  const handleToggleStatus = (followup: CombinedFollowup) => {
    // Create a copy of the followups array for optimistic UI update
    const updatedFollowups = followupActions.map((f) =>
      f.id === followup.id && f.source === followup.source
        ? { ...f, completed: !f.completed }
        : f
    )

    // Update state immediately for better UX
    setFollowupActions(updatedFollowups)

    // Call the appropriate API based on the followup source
    if (followup.source === "application" && "application" in followup) {
      // Check if this is a localStorage-based application (client-side ID)
      if (`${followup.applicationId}`.length > 10) {
        // Handle localStorage update directly for client-side application
        try {
          const followupsJson = localStorage.getItem(
            `mockFollowups_${followup.applicationId}`
          )
          if (followupsJson) {
            const followups = JSON.parse(followupsJson)
            if (Array.isArray(followups)) {
              // Update the specific followup
              const updatedLocalFollowups = followups.map((f: any) =>
                f.id === followup.id
                  ? { ...f, completed: !followup.completed }
                  : f
              )

              // Save back to localStorage
              localStorage.setItem(
                `mockFollowups_${followup.applicationId}`,
                JSON.stringify(updatedLocalFollowups)
              )

              // Update the counter via context
              updatePendingFollowupCount().catch(console.error)

              // Trigger a refresh after short delay
              setTimeout(
                () =>
                  refreshFollowups(
                    applicationsRef.current,
                    contactFollowupsRef.current
                  ),
                300
              )

              toast({
                title: "Followup updated",
                description:
                  "The followup status has been updated successfully."
              })
            }
          }
        } catch (error) {
          console.error("Error updating localStorage followup:", error)
          toast({
            title: "Update failed",
            description:
              "Failed to update the followup status in local storage.",
            variant: "destructive"
          })
        }
      } else {
        // Call the server API to update for database-based application
        toggleApplicationFollowup.mutate({
          followupId: followup.id,
          applicationId: followup.applicationId,
          completed: !followup.completed
        })
      }
    } else if (followup.source === "contact" && "contact" in followup) {
      // Call the server API to update for contact followup
      toggleContactFollowup.mutate({
        followupId: followup.id,
        completed: !followup.completed
      })
    }
  }

  // Helper function to render followup type badge
  const renderFollowupType = (followup: CombinedFollowup) => {
    // Clean up the type by removing prefix
    const baseType = followup.type.replace("contact_", "").replace("_", " ")

    // Determine icon and style based on source and type
    let icon = <Clock className="h-4 w-4 mr-1.5" />
    if (followup.source === "contact") {
      if (baseType.includes("email")) icon = <Mail className="h-4 w-4 mr-1.5" />
      else if (baseType.includes("call"))
        icon = <Phone className="h-4 w-4 mr-1.5" />
      else if (baseType.includes("meeting"))
        icon = <Users className="h-4 w-4 mr-1.5" />
    }

    return (
      <span className="text-sm font-medium capitalize flex items-center">
        {icon}
        {baseType}
      </span>
    )
  }

  // Use memoized filtered followups based on current filter selection
  const filteredFollowups = useMemo(() => {
    if (activeFilter === "all") return followupActions
    return followupActions.filter(
      (followup) =>
        followup.source ===
        (activeFilter === "applications" ? "application" : "contact")
    )
  }, [followupActions, activeFilter])

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <h3 className="text-lg font-medium mb-4 px-1">
            Upcoming Follow-up Actions
          </h3>
        )}
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading follow-up actions...</span>
        </div>
      </div>
    )
  }

  // Render empty state
  if (filteredFollowups.length === 0) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <h3 className="text-lg font-medium mb-4 px-1">
            Upcoming Follow-up Actions
          </h3>
        )}

        {/* Filter buttons */}
        <div className="flex space-x-2 mb-3 px-1">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className="text-xs h-8 px-3"
          >
            All
          </Button>
          <Button
            variant={activeFilter === "applications" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("applications")}
            className="text-xs h-8 px-3"
          >
            Applications
          </Button>
          <Button
            variant={activeFilter === "contacts" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("contacts")}
            className="text-xs h-8 px-3"
          >
            Contacts
          </Button>
        </div>

        <Card className="p-8 flex flex-col items-center justify-center text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">No Follow-up Actions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You don't have any{" "}
            {activeFilter !== "all" ? activeFilter + " " : ""}follow-up actions
            pending.
          </p>
        </Card>
      </div>
    )
  }

  // Render the list of follow-up actions
  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-lg font-medium mb-4 px-1">
          Upcoming Follow-up Actions
        </h3>
      )}

      {/* Filter buttons - aligned left with reduced padding */}
      <div className="flex space-x-2 mb-3 px-1">
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("all")}
          className="text-xs h-8 px-3"
        >
          All
        </Button>
        <Button
          variant={activeFilter === "applications" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("applications")}
          className="text-xs h-8 px-3"
        >
          Applications
        </Button>
        <Button
          variant={activeFilter === "contacts" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("contacts")}
          className="text-xs h-8 px-3"
        >
          Contacts
        </Button>
      </div>

      {/* Followup cards with improved layout */}
      <div className="space-y-3">
        {filteredFollowups.slice(0, limit).map((followup) => (
          <Card
            key={`${followup.source}-${followup.id}`}
            className="p-0 border shadow-sm overflow-hidden"
          >
            <div className="flex flex-col">
              {/* Main content area with consistent padding */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Entity name with badge - more prominent */}
                    <div className="mb-2">
                      {followup.source === "application" &&
                        "application" in followup && (
                          <span className="font-semibold text-sm">
                            {followup.application?.company}
                          </span>
                        )}

                      {followup.source === "contact" &&
                        "contact" in followup && (
                          <span className="font-semibold text-sm">
                            {followup.contact?.fullName}
                          </span>
                        )}
                    </div>

                    {/* Action type with icon */}
                    <div className="mb-2">{renderFollowupType(followup)}</div>

                    {/* Description - smaller text, proper wrapping */}
                    <p className="text-sm text-muted-foreground pr-4">
                      {followup.description}
                    </p>

                    {/* Due date */}
                    {followup.dueDate && (
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1.5" />
                        <span>
                          Due:{" "}
                          {format(new Date(followup.dueDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right-aligned actions in vertical stack */}
                  <div className="flex flex-col items-end space-y-2">
                    {/* Status toggle */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {followup.completed ? "Completed" : "Pending"}
                      </span>
                      <Switch
                        checked={followup.completed}
                        onCheckedChange={() => handleToggleStatus(followup)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>

                    {/* View details link */}
                    {followup.source === "application" &&
                      "application" in followup && (
                        <Link
                          href={`/job-applications/${followup.applicationId}`}
                          className="mt-1"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                    {followup.source === "contact" && "contact" in followup && (
                      <Link
                        href={`/networking/${followup.contact.id}`}
                        className="mt-1"
                      >
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* "View more" links - conditionally shown */}
      {followupActions.length > limit && (
        <div className="pt-2 flex gap-3 px-1">
          <Link href="/job-applications">
            <Button variant="outline" size="sm">
              View Applications
            </Button>
          </Link>
          <Link href="/networking">
            <Button variant="outline" size="sm">
              View Contacts
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
