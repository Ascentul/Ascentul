'use client'

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

  const selectedTemplate = templateId
    ? goalTemplates.find((t) => t.id === templateId)?.prefill
    : null

  const templateChecklist = selectedTemplate?.milestones
    ? selectedTemplate.milestones.map((milestone, index) => ({
        id: `template-${index}`,
        text: milestone,
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "checklist"
  })

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      const url = goal ? `/api/goals/${goal.id}` : '/api/goals'
      const method = goal ? 'PUT' : 'POST'
      
      const payload = {
        ...data,
        dueDate: data.dueDate?.toISOString(),
        progress: 0
      }
      
      return apiRequest(method, url, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] })
      queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] })
      
      toast({
        title: goal ? "Goal Updated" : "Goal Created",
        description: goal 
          ? "Your goal has been updated successfully" 
          : "Your new goal has been created successfully",
        variant: 'success',
      })
      
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save goal. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = async (data: GoalFormValues) => {
    setIsSubmitting(true)
    try {
      await createGoalMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addChecklistItem = () => {
    append({
      id: `item-${Date.now()}`,
      text: "",
      completed: false
    })
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
                <Input placeholder="Enter your goal title" {...field} />
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your goal in more detail"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
              <FormItem>
                <FormLabel>Due Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Checklist Items</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChecklistItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-4">
                No checklist items yet. Add some to track your progress!
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={addChecklistItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name={`checklist.${index}.completed`}
                    render={({ field: checkboxField }) => (
                      <FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => checkboxField.onChange(!checkboxField.value)}
                        >
                          {checkboxField.value ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </FormControl>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`checklist.${index}.text`}
                    render={({ field: textField }) => (
                      <FormControl>
                        <Input
                          placeholder="Enter checklist item"
                          className="flex-1"
                          {...textField}
                        />
                      </FormControl>
                    )}
                  />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Checklist Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this checklist item? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => remove(index)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {goal ? "Updating..." : "Creating..."}
              </>
            ) : (
              goal ? "Update Goal" : "Create Goal"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}