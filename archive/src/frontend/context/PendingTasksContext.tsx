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

  }
  return context
}
