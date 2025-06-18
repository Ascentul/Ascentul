import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Loader2,
  Plus,
  School,
  Search,
  Users,
  UserPlus,
  X,
  Filter,
  MoreHorizontal,
  Pencil,
  Eye
} from "lucide-react"
import { Link } from "wouter"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { apiRequest } from "@/lib/queryClient"

// Components
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

// Interface for university data
interface University {
  id: number
  name: string
  slug: string
  licensePlan: string
  licenseSeats: number
  licenseUsed: number
  licenseStart: string
  licenseEnd: string | null
  status: string
  adminEmail?: string
  createdById?: number
  createdAt: string
  updatedAt: string
}

// Interface for university admin
interface UniversityAdmin {
  id: number
  name: string
  email: string
}

// Add university form schema
const addUniversitySchema = z.object({
  name: z.string().min(3, "University name must be at least 3 characters"),
  licensePlan: z.enum(["Starter", "Basic", "Pro", "Enterprise"], {
    required_error: "Please select a plan tier"
  }),
  licenseSeats: z.number().min(1, "Seat limit must be at least 1").default(50),
  licenseStart: z
    .date()
    .or(z.string())
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Please enter a valid start date"
    }),
  licenseEnd: z
    .date()
    .or(z.string())
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Please enter a valid end date"
    }),
  adminEmail: z.string().email("Please enter a valid email address").optional()
})

type AddUniversityFormValues = z.infer<typeof addUniversitySchema>

// Invite admin form schema
const inviteAdminSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  universityId: z.number()
})

type InviteAdminFormValues = z.infer<typeof inviteAdminSchema>

// Badge components for university status and plan
const PlanBadge = ({ plan }: { plan: string }) => {
  const getColor = () => {
    switch (plan) {
      case "Starter":
        return "bg-blue-100 text-blue-800"
      case "Basic":
        return "bg-green-100 text-green-800"
      case "Pro":
        return "bg-purple-100 text-purple-800"
      case "Enterprise":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}
    >
      {plan}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const getColor = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "trial":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}
    >
      {status}
    </span>
  )
}

// Edit university plan form schema
const editPlanSchema = z.object({
  licensePlan: z.enum(["Starter", "Basic", "Pro", "Enterprise"], {
    required_error: "Please select a plan tier"
  }),
  licenseSeats: z.number().min(1, "Seat limit must be at least 1"),
  licenseStart: z
    .date()
    .or(z.string())
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Please enter a valid start date"
    }),
  licenseEnd: z
    .date()
    .or(z.string())
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Please enter a valid end date"
    })
})

type EditPlanFormValues = z.infer<typeof editPlanSchema>

export default function UniversitiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUniversityOpen, setIsAddUniversityOpen] = useState(false)
  const [manageAccessDrawer, setManageAccessDrawer] = useState<{
    isOpen: boolean
    universityId: number | null
    universityName: string
  }>({
    isOpen: false,
    universityId: null,
    universityName: ""
  })
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false)
  const [selectedUniversity, setSelectedUniversity] =
    useState<University | null>(null)
  const [filters, setFilters] = useState({
    plan: "all",
    status: "all"
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Add university form
  const addUniversityForm = useForm<AddUniversityFormValues>({
    resolver: zodResolver(addUniversitySchema),
    defaultValues: {
      name: "",
      licensePlan: "Starter",
      licenseSeats: 50,
      licenseStart: new Date().toISOString().split("T")[0], // Today's date
      licenseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0], // 1 year from now
      adminEmail: ""
    }
  })

  // Invite admin form
  const inviteAdminForm = useForm<InviteAdminFormValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: {
      email: "",
      universityId: 0
    }
  })

  // Edit plan form
  const editPlanForm = useForm<EditPlanFormValues>({
    resolver: zodResolver(editPlanSchema),
    defaultValues: {
      licensePlan: "Starter",
      licenseSeats: 50,
      licenseStart: "",
      licenseEnd: ""
    }
  })

  // Reset forms when dialogs close
  const onAddUniversityClose = () => {
    setIsAddUniversityOpen(false)
    addUniversityForm.reset()
  }

  const onManageAccessClose = () => {
    setManageAccessDrawer({
      isOpen: false,
      universityId: null,
      universityName: ""
    })
    inviteAdminForm.reset()
  }

  const onViewDetailsClose = () => {
    setIsViewDetailsOpen(false)
    setSelectedUniversity(null)
  }

  const onEditPlanClose = () => {
    setIsEditPlanOpen(false)
    setSelectedUniversity(null)
    editPlanForm.reset()
  }

  // Fetch universities data
  const {
    data: universities,
    isLoading,
    isError,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ["/api/universities"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/universities")
        if (!response.ok) {
          throw new Error("Failed to fetch universities")
        }
        const data = await response.json()
        return data as University[]
      } catch (error: any) {
        // Check if it's an authentication error
        if (error.status === 401) {
          throw new Error("Please log in as an admin to view universities")
        }
        // Re-throw the original error
        throw error
      }
    }
  })

  // Fetch university admins
  const {
    data: universityAdmins,
    isLoading: isLoadingAdmins,
    isError: isErrorAdmins
  } = useQuery({
    queryKey: ["/api/universities", manageAccessDrawer.universityId, "admins"],
    queryFn: async () => {
      if (!manageAccessDrawer.universityId) return []

      const response = await apiRequest(
        "GET",
        `/api/universities/${manageAccessDrawer.universityId}/admins`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch university admins")
      }
      const data = await response.json()
      return data as UniversityAdmin[]
    },
    enabled: !!manageAccessDrawer.universityId && manageAccessDrawer.isOpen
  })

  // Add university mutation
  const addUniversityMutation = useMutation({
    mutationFn: async (values: AddUniversityFormValues) => {
      try {
        const response = await apiRequest("POST", "/api/universities", values)
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Failed to add university")
        }
        return await response.json()
      } catch (error: any) {
        // Check if it's an authentication error
        if (error.status === 401) {
          throw new Error("Please log in as an admin to create universities")
        }
        // Check if it's a network error or API not found
        if (error.message?.includes("fetch")) {
          throw new Error("Unable to connect to the server. Please try again.")
        }
        // Re-throw the original error
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities"] })
      toast({
        title: "University added",
        description: "The university has been added successfully"
      })
      onAddUniversityClose()
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add university",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Invite admin mutation
  const inviteAdminMutation = useMutation({
    mutationFn: async (values: InviteAdminFormValues) => {
      const response = await apiRequest(
        "POST",
        "/api/university-invites",
        values
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send invitation")
      }
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/api/universities",
          manageAccessDrawer.universityId,
          "admins"
        ]
      })
      toast({
        title: "Invitation sent",
        description: "The admin invitation has been sent successfully"
      })
      inviteAdminForm.reset({
        email: "",
        universityId: manageAccessDrawer.universityId || 0
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Edit university plan mutation
  const editPlanMutation = useMutation({
    mutationFn: async (values: EditPlanFormValues & { id: number }) => {
      const { id, ...planData } = values
      const response = await apiRequest(
        "PUT",
        `/api/universities/${id}`,
        planData
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update university plan")
      }
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities"] })
      toast({
        title: "Plan updated",
        description: "The university plan has been updated successfully"
      })
      onEditPlanClose()
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update plan",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Handle add university form submission
  const onAddUniversitySubmit = (values: AddUniversityFormValues) => {
    addUniversityMutation.mutate(values)
  }

  // Handle invite admin form submission
  const onInviteAdminSubmit = (values: InviteAdminFormValues) => {
    inviteAdminMutation.mutate(values)
  }

  // Handle edit plan form submission
  const onEditPlanSubmit = (values: EditPlanFormValues) => {
    if (!selectedUniversity) return

    editPlanMutation.mutate({
      ...values,
      id: selectedUniversity.id
    })
  }

  // Open manage access drawer for a university
  const openManageAccess = (university: University) => {
    setManageAccessDrawer({
      isOpen: true,
      universityId: university.id,
      universityName: university.name
    })

    inviteAdminForm.setValue("universityId", university.id)
  }

  // Open view details modal for a university
  const openViewDetails = (university: University) => {
    setSelectedUniversity(university)
    setIsViewDetailsOpen(true)
  }

  // Open edit plan modal for a university
  const openEditPlan = (university: University) => {
    setSelectedUniversity(university)

    // Initialize form with current values
    editPlanForm.reset({
      licensePlan: university.licensePlan as
        | "Starter"
        | "Basic"
        | "Pro"
        | "Enterprise",
      licenseSeats: university.licenseSeats,
      licenseStart: university.licenseStart.split("T")[0],
      licenseEnd: university.licenseEnd
        ? university.licenseEnd.split("T")[0]
        : ""
    })

    setIsEditPlanOpen(true)
  }

  // Filter universities based on search query and filters
  const filteredUniversities = universities?.filter((university) => {
    const matchesSearch = university.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesPlan =
      filters.plan === "all" || university.licensePlan === filters.plan
    const matchesStatus =
      filters.status === "all" ||
      university.status.toLowerCase() === filters.status.toLowerCase()
    return matchesSearch && matchesPlan && matchesStatus
  })

  return (
    <>
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Universities</h1>
            <p className="text-gray-600 mt-1">
              Manage university accounts and access
            </p>
          </div>
          <Button
            className="mt-3 md:mt-0"
            onClick={() => setIsAddUniversityOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add University
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.plan}
                  onValueChange={(value) =>
                    setFilters({ ...filters, plan: value })
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Universities Table */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Universities</CardTitle>
              <div className="text-sm text-muted-foreground">
                {filteredUniversities?.length} universities found
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : isError ? (
              <div className="p-6 text-center">
                <div className="text-red-500 mb-2">
                  Error loading universities
                </div>
                <p className="mb-2">
                  {queryError?.message ||
                    "There was a problem fetching university data. Please try again later."}
                </p>
                {queryError?.message?.includes("log in") && (
                  <p className="text-sm text-muted-foreground mb-4">
                    You may need to refresh the page or log in again to access
                    admin features.
                  </p>
                )}
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : filteredUniversities?.length === 0 ? (
              <div className="p-6 text-center">
                <School className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium">No universities found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery ||
                  filters.plan !== "all" ||
                  filters.status !== "all"
                    ? "No universities match your search criteria"
                    : "No universities have been added yet"}
                </p>
                {(searchQuery ||
                  filters.plan !== "all" ||
                  filters.status !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("")
                      setFilters({ plan: "all", status: "all" })
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>University</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Contract
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Admins
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUniversities?.map((university) => (
                      <TableRow key={university.id}>
                        <TableCell>
                          <div className="font-medium">{university.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {university.slug}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PlanBadge plan={university.licensePlan} />
                            <span className="text-xs text-muted-foreground">
                              {university.licenseSeats} seats
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {university.licenseUsed} /{" "}
                              {university.licenseSeats}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(
                                (university.licenseUsed /
                                  university.licenseSeats) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            {new Date(
                              university.licenseStart
                            ).toLocaleDateString()}{" "}
                            —
                            {university.licenseEnd
                              ? new Date(
                                  university.licenseEnd
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={university.status} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted"
                            onClick={() => openManageAccess(university)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            <span>0</span>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openViewDetails(university)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditPlan(university)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openManageAccess(university)}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Manage Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add University Dialog */}
      <Dialog open={isAddUniversityOpen} onOpenChange={setIsAddUniversityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add University</DialogTitle>
            <DialogDescription>
              Create a new university record in the system.
            </DialogDescription>
          </DialogHeader>

          <Form {...addUniversityForm}>
            <form
              onSubmit={addUniversityForm.handleSubmit(onAddUniversitySubmit)}
              className="space-y-4"
            >
              <FormField
                control={addUniversityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter university name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addUniversityForm.control}
                name="licensePlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Starter">Starter</SelectItem>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addUniversityForm.control}
                name="licenseSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Seats</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Number of seats"
                        min={1}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addUniversityForm.control}
                  name="licenseStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          value={String(field.value).split("T")[0]}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addUniversityForm.control}
                  name="licenseEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          value={String(field.value).split("T")[0]}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addUniversityForm.control}
                name="adminEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email (Optional)</FormLabel>
                    <FormDescription>
                      If provided, an invitation will be sent to the admin.
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="admin@university.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={onAddUniversityClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addUniversityMutation.isPending}
                >
                  {addUniversityMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add University
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage University Access Drawer */}
      <Drawer
        open={manageAccessDrawer.isOpen}
        onOpenChange={(isOpen) => !isOpen && onManageAccessClose()}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Manage Access for {manageAccessDrawer.universityName}
            </DrawerTitle>
            <DrawerDescription>
              Invite administrators to manage this university.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 py-2">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">
                Current Administrators
              </h4>
              {isLoadingAdmins ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : isErrorAdmins ? (
                <div className="text-sm text-red-500 py-2">
                  Error loading administrators
                </div>
              ) : universityAdmins?.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No administrators yet
                </div>
              ) : (
                <div className="space-y-2">
                  {universityAdmins?.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                    >
                      <div>
                        <div className="font-medium text-sm">{admin.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {admin.email}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove administrator</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">
                Invite New Administrator
              </h4>
              <Form {...inviteAdminForm}>
                <form
                  onSubmit={inviteAdminForm.handleSubmit(onInviteAdminSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={inviteAdminForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="admin@university.edu"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={inviteAdminMutation.isPending}
                  >
                    {inviteAdminMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Invitation...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          <DrawerFooter>
            <Button variant="outline" onClick={onManageAccessClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* View University Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedUniversity && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedUniversity.name}</DialogTitle>
                <DialogDescription>
                  University details and contract information
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Slug
                    </h4>
                    <p className="text-sm">{selectedUniversity.slug}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Status
                    </h4>
                    <div className="mt-1">
                      <StatusBadge status={selectedUniversity.status} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    License
                  </h4>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Plan:</span>
                      <PlanBadge plan={selectedUniversity.licensePlan} />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">Seats:</span>
                      <span className="text-sm font-medium">
                        {selectedUniversity.licenseUsed} /{" "}
                        {selectedUniversity.licenseSeats}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">Period:</span>
                      <span className="text-sm">
                        {new Date(
                          selectedUniversity.licenseStart
                        ).toLocaleDateString()}{" "}
                        —
                        {selectedUniversity.licenseEnd
                          ? new Date(
                              selectedUniversity.licenseEnd
                            ).toLocaleDateString()
                          : "No end date"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Timeline
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Created:</span>
                      <span className="text-sm">
                        {new Date(
                          selectedUniversity.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Updated:</span>
                      <span className="text-sm">
                        {new Date(
                          selectedUniversity.updatedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={onViewDetailsClose}>
                  Close
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onViewDetailsClose()
                      openEditPlan(selectedUniversity)
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Plan
                  </Button>

                  <Button
                    onClick={() => {
                      onViewDetailsClose()
                      openManageAccess(selectedUniversity)
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Access
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit University Plan Dialog */}
      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent>
          {selectedUniversity && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Edit Plan for {selectedUniversity.name}
                </DialogTitle>
                <DialogDescription>
                  Update the university's plan tier and license details
                </DialogDescription>
              </DialogHeader>

              <Form {...editPlanForm}>
                <form
                  onSubmit={editPlanForm.handleSubmit(onEditPlanSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={editPlanForm.control}
                    name="licensePlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a plan tier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Starter">Starter</SelectItem>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Pro">Pro</SelectItem>
                            <SelectItem value="Enterprise">
                              Enterprise
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editPlanForm.control}
                    name="licenseSeats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Seats</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Number of seats"
                            min={1}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Currently using: {selectedUniversity.licenseUsed}{" "}
                          seats
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editPlanForm.control}
                      name="licenseStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Start Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              value={String(field.value).split("T")[0]}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editPlanForm.control}
                      name="licenseEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License End Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              value={String(field.value).split("T")[0]}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for no end date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={onEditPlanClose}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editPlanMutation.isPending}>
                      {editPlanMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Plan
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
