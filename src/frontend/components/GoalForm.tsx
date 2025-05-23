import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import {
  CalendarIcon,
  Plus,
  X,
  CheckSquare,
  Square,
  Trash2,
  Loader2
} from "lucide-react"
import { format } from "date-fns"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { goalTemplates } from "@/components/goals/GoalTemplates"

// Import the schema from the frontend utils path
import { goalChecklistItemSchema } from "@/utils/schema"

const goalSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100),
  description: z.string().optional(),
  status: z.string().default("not_started"),
  dueDate: z.date().optional(),
  checklist: z.array(goalChecklistItemSchema).default([])
})

type GoalFormValues = z.infer<typeof goalSchema>

interface GoalFormProps {
  goal?: {
    id: number
    title: string
    description?: string
    status: string
    dueDate?: string
    checklist?: Array<{ id: string; text: string; completed: boolean }>
  }
  templateId?: string | null
  onSuccess?: () => void
}

export default function GoalForm({
  goal,
  templateId,
  onSuccess
}: GoalFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Find the template data if a templateId is provided
  const selectedTemplate = templateId
    ? goalTemplates.find((t) => t.id === templateId)?.prefill
    : null

  // Generate checklist items from template milestones if available
  const templateChecklist = selectedTemplate?.milestones
    ? selectedTemplate.milestones.map((text) => ({
        id: Math.random().toString(36).substring(2, 11),
        text,
        completed: false
      }))
    : []

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title || selectedTemplate?.title || "",
      description: goal?.description || selectedTemplate?.description || "",
      status: goal?.status || "not_started",
      dueDate: goal?.dueDate ? new Date(goal.dueDate) : undefined,
      checklist: goal?.checklist || templateChecklist || []
    }
  })

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      let status = data.status

      // Update status based on checklist
      if (data.checklist.length >= 2) {
        const hasAtLeastOneChecked = data.checklist.some(
          (item) => item.completed
        )
        const areAllChecked = data.checklist.every((item) => item.completed)

        if (
          hasAtLeastOneChecked &&
          !areAllChecked &&
          status === "not_started"
        ) {
          status = "in_progress"
        }
      }

      // Calculate progress
      let progress = 0
      if (data.checklist.length > 0) {
        const completedItems = data.checklist.filter(
          (item) => item.completed
        ).length
        progress = Math.round((completedItems / data.checklist.length) * 100)
      } else {
        progress =
          status === "completed" ? 100 : status === "in_progress" ? 50 : 0
      }

      return apiRequest("POST", "/api/goals", { ...data, status, progress })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] })
      queryClient.invalidateQueries({ queryKey: ["/api/users/statistics"] })
      toast({
        title: "Goal Created",
        description: "Your career goal has been created successfully"
      })
      form.reset()
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create goal: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  const updateGoalMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      return apiRequest("PUT", `/api/goals/${goal?.id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] })
      queryClient.invalidateQueries({ queryKey: ["/api/users/statistics"] })
      toast({
        title: "Goal Updated",
        description: "Your career goal has been updated successfully"
      })
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update goal: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      if (!goal?.id) throw new Error("No goal selected for deletion")
      return apiRequest("DELETE", `/api/goals/${goal.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] })
      queryClient.invalidateQueries({ queryKey: ["/api/users/statistics"] })
      toast({
        title: "Goal Deleted",
        description: "Your career goal has been deleted successfully"
      })
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete goal: ${error.message}`,
        variant: "destructive"
      })
    }
  })

  const onSubmit = async (data: GoalFormValues) => {
    setIsSubmitting(true)
    try {
      if (goal?.id) {
        await updateGoalMutation.mutateAsync(data)
      } else {
        await createGoalMutation.mutateAsync(data)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateId = () => {
    return Math.random().toString(36).substring(2, 11)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Complete Python Course" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your goal in detail"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select goal status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${
                          !field.value ? "text-muted-foreground" : ""
                        }`}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Checklist Field */}
        <FormField
          control={form.control}
          name="checklist"
          render={() => {
            const { fields, append, remove, update } = useFieldArray({
              name: "checklist",
              control: form.control
            })

            return (
              <FormItem className="space-y-3">
                <FormLabel>Goal Checklist (Optional)</FormLabel>
                <div className="flex flex-col space-y-2">
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newItem = {
                            ...item,
                            completed: !item.completed
                          }
                          update(index, newItem)
                        }}
                        className="h-6 w-6"
                      >
                        {item.completed ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                      <Input
                        defaultValue={item.text}
                        onChange={(e) => {
                          // Using onChange with defaultValue
                          // This doesn't trigger a re-render immediately
                          // The text is stored in the input's DOM value
                        }}
                        onBlur={(e) => {
                          // Only update the state when the input loses focus
                          const newItem = { ...item, text: e.target.value }
                          update(index, newItem)
                        }}
                        className="h-8 flex-1"
                        placeholder="Enter a task..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ id: generateId(), text: "", completed: false })
                  }
                  className="mt-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Checklist Item
                </Button>
              </FormItem>
            )
          }}
        />

        <div className="flex justify-between">
          {/* Only show Delete button for existing goals */}
          {goal?.id ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Goal
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this goal and all associated
                    progress. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteGoalMutation.mutate()}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deleteGoalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Goal"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div>
              {/* Empty div to maintain spacing when no delete button */}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
