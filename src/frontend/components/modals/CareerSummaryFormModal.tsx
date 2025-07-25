import React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Define the form schema
const careerSummaryFormSchema = z.object({
  summary: z
    .string()
    .min(1, { message: "Career summary is required" })
    .max(750, {
      message: "Career summary must not exceed 750 characters"
    })
})

type CareerSummaryFormValues = z.infer<typeof careerSummaryFormSchema>

interface CareerSummaryFormModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  defaultValue?: string
  onSuccess?: () => void
}

export function CareerSummaryFormModal({
  open,
  onOpenChange,
  onClose,
  defaultValue = "",
  onSuccess
}: CareerSummaryFormModalProps) {
  const { toast } = useToast()

  // Initialize the form
  const form = useForm<CareerSummaryFormValues>({
    resolver: zodResolver(careerSummaryFormSchema),
    defaultValues: {
      summary: defaultValue || ""
    }
  })

  // Update form when defaultValue changes or dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        summary: defaultValue || ""
      })
    }
  }, [open, defaultValue, form])

  // Form submission mutation
  const mutation = useMutation({
    mutationFn: async (values: CareerSummaryFormValues) => {
      console.log(
        "⭐️ Submitting career summary form with length:",
        values.summary.length
      )

      const response = await apiRequest(
        "PUT",
        "/api/career-data/career-summary",
        {
          careerSummary: values.summary
        }
      )

      if (!response.ok) {
        console.error("❌ API request failed with status:", response.status)
        // Try to get more detailed error information
        try {
          const errorData = await response.json()
          console.error("Error details:", errorData)
          throw new Error(
            errorData.error ||
              errorData.message ||
              "Failed to save career summary"
          )
        } catch (parseError) {
          console.error("Could not parse error response:", parseError)
          throw new Error(
            `Failed to save career summary (${response.status}: ${response.statusText})`
          )
        }
      }

      console.log("✅ Career summary saved successfully")
      return await response.json()
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "Career summary updated",
        description: "Your career summary has been saved successfully."
      })

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/career-data"] })

      // Close the modal
      handleDialogOpenChange(false)

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: (error: Error) => {
      console.error("❌ Mutation error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Custom handler for dialog close events
  const handleDialogOpenChange = (openState: boolean) => {
    if (onOpenChange) {
      onOpenChange(openState)
    } else if (!openState && onClose) {
      onClose()
    }
  }

  // Submit handler
  const onSubmit = (values: CareerSummaryFormValues) => {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Career Summary</DialogTitle>
          <DialogDescription>
            Provide a concise overview of your professional background, skills,
            and career aspirations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Career Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write a professional summary that highlights your experience, skills, and career goals..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch("summary")?.length || 0}/750 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Summary"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
