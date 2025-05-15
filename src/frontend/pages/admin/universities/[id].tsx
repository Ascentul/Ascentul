import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ChevronLeft, Loader2, School, Users, Edit, Trash2, UserPlus, User, Mail } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/layouts/AdminLayout";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Interface for university details
interface UniversityDetails {
  id: number;
  name: string;
  studentCount: number;
  adminCount: number;
  createdAt: string;
}

// Interface for university student
interface UniversityStudent {
  id: number;
  name: string;
  email: string;
  enrollmentDate: string;
}

// Interface for university admin
interface UniversityAdmin {
  id: number;
  name: string;
  email: string;
  addedDate: string;
}

// Edit university form schema
const editUniversitySchema = z.object({
  name: z.string().min(3, "University name must be at least 3 characters"),
});

type EditUniversityFormValues = z.infer<typeof editUniversitySchema>;

// Invite user form schema
const inviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["student", "admin"], {
    required_error: "Please select a role",
  }),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export default function UniversityDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/admin/universities/:id");
  const universityId = params?.id ? parseInt(params.id) : 0;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit university form
  const editUniversityForm = useForm<EditUniversityFormValues>({
    resolver: zodResolver(editUniversitySchema),
    defaultValues: {
      name: "",
    }
  });

  // Invite user form
  const inviteUserForm = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      role: "student",
    }
  });

  // Fetch university details
  const { 
    data: university, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["/api/universities", universityId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/universities/${universityId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch university details");
      }
      const data = await response.json();
      
      // Set form default values
      editUniversityForm.setValue("name", data.name);
      
      return data as UniversityDetails;
    },
    enabled: !!universityId,
  });

  // Fetch university students
  const { 
    data: students, 
    isLoading: isLoadingStudents, 
    isError: isErrorStudents,
  } = useQuery({
    queryKey: ["/api/universities", universityId, "students"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/universities/${universityId}/students`);
      if (!response.ok) {
        throw new Error("Failed to fetch university students");
      }
      return await response.json() as UniversityStudent[];
    },
    enabled: !!universityId && activeTab === "students",
  });

  // Fetch university admins
  const { 
    data: admins, 
    isLoading: isLoadingAdmins, 
    isError: isErrorAdmins,
  } = useQuery({
    queryKey: ["/api/universities", universityId, "admins"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/universities/${universityId}/admins`);
      if (!response.ok) {
        throw new Error("Failed to fetch university admins");
      }
      return await response.json() as UniversityAdmin[];
    },
    enabled: !!universityId && activeTab === "admins",
  });

  // Edit university mutation
  const editUniversityMutation = useMutation({
    mutationFn: async (values: EditUniversityFormValues) => {
      const response = await apiRequest("PATCH", `/api/universities/${universityId}`, values);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update university");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities", universityId] });
      queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
      toast({
        title: "University updated",
        description: "The university has been updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update university",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete university mutation
  const deleteUniversityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/universities/${universityId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete university");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
      toast({
        title: "University deleted",
        description: "The university has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      window.history.back();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete university",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (values: InviteUserFormValues) => {
      const payload = {
        email: values.email,
        universityId,
        role: values.role,
      };
      
      const response = await apiRequest("POST", "/api/university-invites", payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invitation");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities", universityId] });
      toast({
        title: "Invitation sent",
        description: "The invitation has been sent successfully",
      });
      setIsInviteDialogOpen(false);
      inviteUserForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submissions
  const onEditSubmit = (values: EditUniversityFormValues) => {
    editUniversityMutation.mutate(values);
  };

  const onInviteSubmit = (values: InviteUserFormValues) => {
    inviteUserMutation.mutate(values);
  };

  const onDeleteConfirm = () => {
    deleteUniversityMutation.mutate();
  };

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Loading and error states
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6">
          <div className="mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/universities">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Universities
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500 text-lg mb-2">Error loading university</div>
              <p className="text-gray-600 mb-4">
                {error instanceof Error ? error.message : "Failed to fetch university details"}
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!university) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6">
          <div className="mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/universities">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Universities
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <School className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium">University not found</h3>
              <p className="text-gray-500 mt-1">
                The requested university could not be found.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/universities">Return to Universities</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/universities">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Universities
            </Link>
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsInviteDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Invite User
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{university.name}</h1>
          <p className="text-gray-600">University ID: {university.id}</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="admins">Administrators</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="text-2xl font-bold">{university.studentCount}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Administrators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-500" />
                    <span className="text-2xl font-bold">{university.adminCount}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <School className="h-5 w-5 mr-2 text-emerald-500" />
                    <span className="text-lg font-medium">
                      {university.createdAt ? formatDate(university.createdAt) : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>University Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-lg">{university.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="mt-1 text-lg">{university.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-lg">
                      {university.createdAt ? formatDate(university.createdAt) : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                    <dd className="mt-1 text-lg">{university.studentCount + university.adminCount}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Students
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      inviteUserForm.setValue("role", "student");
                      setIsInviteDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite Student
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStudents ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : isErrorStudents ? (
                  <div className="text-center py-4">
                    <p className="text-red-500">Failed to load students</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/universities", universityId, "students"] })}
                    >
                      Retry
                    </Button>
                  </div>
                ) : students?.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Enrollment Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students?.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-gray-400" />
                              {student.email}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(student.enrollmentDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Administrators
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      inviteUserForm.setValue("role", "admin");
                      setIsInviteDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite Admin
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAdmins ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : isErrorAdmins ? (
                  <div className="text-center py-4">
                    <p className="text-red-500">Failed to load administrators</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/universities", universityId, "admins"] })}
                    >
                      Retry
                    </Button>
                  </div>
                ) : admins?.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No administrators found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Added Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins?.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-gray-400" />
                              {admin.email}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(admin.addedDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit University Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit University</DialogTitle>
            <DialogDescription>
              Update university information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editUniversityForm}>
            <form onSubmit={editUniversityForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editUniversityForm.control}
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
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editUniversityMutation.isPending}
                >
                  {editUniversityMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to join the university.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...inviteUserForm}>
            <form onSubmit={inviteUserForm.handleSubmit(onInviteSubmit)} className="space-y-4">
              <FormField
                control={inviteUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={inviteUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={field.value === "student" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => field.onChange("student")}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Student
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "admin" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => field.onChange("admin")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Administrator
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={inviteUserMutation.isPending}
                >
                  {inviteUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete University</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {university.name}? This action cannot be undone.
              All associated users, data, and resources will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={onDeleteConfirm}
              disabled={deleteUniversityMutation.isPending}
            >
              {deleteUniversityMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}