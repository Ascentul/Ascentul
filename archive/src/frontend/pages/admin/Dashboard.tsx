import { useState } from "react"
import { Link, useLocation, useRoute } from "wouter"
import { useUser, useIsAdminUser } from "@/lib/useUserData"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import AdminOverview from "./AdminOverview"
import SupportPage from "./SupportPage"
import AdminModelsPage from "./ModelsPage"
import OpenAILogsPage from "./OpenAILogsPage"
import EmailAdmin from "./EmailAdmin"
import UserManagement from "./UserManagement"
import TestEmailPage from "./test-email"
import UniversitiesPage from "./universities"
import AnalyticsPage from "./AnalyticsPage"
import BillingPage from "./BillingPage"
import ReviewsPage from "./ReviewsPage"
import ReviewsTab from "./ReviewsTab"
import AdminSettingsTab from "./AdminSettingsTab"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { apiRequest } from "@/lib/queryClient"
import {
  BarChart,
  Users,
  Building,
  Settings,
  Activity,
  BookOpen,
  CreditCard,
  HelpCircle,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  User,
  Plus,
  Search,
  FileDown,
  MoreHorizontal,
  FileEdit,
  Bell,
  Download,
  Eye,
  Trash2,
  Cpu,
  Mail,
  Star
} from "lucide-react"
// Import the components directly
// This avoid the need for separate imports

// Staff user creation form component
const addStaffUserSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
})

type AddStaffUserFormValues = z.infer<typeof addStaffUserSchema>

function AddStaffUserDialog() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const form = useForm<AddStaffUserFormValues>({
    resolver: zodResolver(addStaffUserSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: ""
    }
  })

  const createStaffUserMutation = useMutation({
    mutationFn: async (values: AddStaffUserFormValues) => {
      const res = await apiRequest("POST", "/admin/create-staff", values)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to create staff user")
      }
      return await res.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Staff user created",
        description: `${data.user.name} was added as a staff member.`
      })
      setOpen(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating staff user",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  function onSubmit(values: AddStaffUserFormValues) {
    createStaffUserMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Staff User</DialogTitle>
          <DialogDescription>
            Create a new staff user account. Staff users will have access to the
            staff dashboard.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="staffuser" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Staff Member Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="staff@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Set a strong temporary password for this staff user.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createStaffUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStaffUserMutation.isPending}
              >
                {createStaffUserMutation.isPending ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Staff User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Placeholder for SupportAnalytics component
import { SupportAnalytics } from "@/components/admin/SupportAnalytics"

function SupportSection() {
  const [source, setSource] = useState<string>("all")
  const [issueType, setIssueType] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [search, setSearch] = useState("")

  const {
    data: tickets,
    isLoading,
    error
  } = useQuery({
    queryKey: ["supportTickets", source, issueType, status, search],
    queryFn: async () => {
      // Direct testing of the API with credentials

}

// SidebarItem component has been removed as requested
