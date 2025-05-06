import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, School, Search, Users, UserPlus, X } from "lucide-react";
import { Link } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/layouts/AdminLayout";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";

// Interface for university data
interface University {
  id: number;
  name: string;
  studentCount: number;
  adminCount: number;
}

// Interface for university admin
interface UniversityAdmin {
  id: number;
  name: string;
  email: string;
}

// Add university form schema
const addUniversitySchema = z.object({
  name: z.string().min(3, "University name must be at least 3 characters"),
});

type AddUniversityFormValues = z.infer<typeof addUniversitySchema>;

// Invite admin form schema
const inviteAdminSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  universityId: z.number(),
});

type InviteAdminFormValues = z.infer<typeof inviteAdminSchema>;

export default function UniversitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUniversityOpen, setIsAddUniversityOpen] = useState(false);
  const [manageAccessDrawer, setManageAccessDrawer] = useState<{ isOpen: boolean; universityId: number | null; universityName: string }>({
    isOpen: false,
    universityId: null,
    universityName: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add university form
  const addUniversityForm = useForm<AddUniversityFormValues>({
    resolver: zodResolver(addUniversitySchema),
    defaultValues: {
      name: ""
    }
  });

  // Invite admin form
  const inviteAdminForm = useForm<InviteAdminFormValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: {
      email: "",
      universityId: 0
    }
  });

  // Reset forms when dialogs close
  const onAddUniversityClose = () => {
    setIsAddUniversityOpen(false);
    addUniversityForm.reset();
  };

  const onManageAccessClose = () => {
    setManageAccessDrawer({ isOpen: false, universityId: null, universityName: "" });
    inviteAdminForm.reset();
  };

  // Fetch universities data
  const { 
    data: universities, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["/api/universities"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/universities");
      if (!response.ok) {
        throw new Error("Failed to fetch universities");
      }
      const data = await response.json();
      return data as University[];
    }
  });

  // Fetch university admins
  const { 
    data: universityAdmins,
    isLoading: isLoadingAdmins,
    isError: isErrorAdmins 
  } = useQuery({
    queryKey: ["/api/universities", manageAccessDrawer.universityId, "admins"],
    queryFn: async () => {
      if (!manageAccessDrawer.universityId) return [];
      
      const response = await apiRequest("GET", `/api/universities/${manageAccessDrawer.universityId}/admins`);
      if (!response.ok) {
        throw new Error("Failed to fetch university admins");
      }
      const data = await response.json();
      return data as UniversityAdmin[];
    },
    enabled: !!manageAccessDrawer.universityId && manageAccessDrawer.isOpen
  });

  // Add university mutation
  const addUniversityMutation = useMutation({
    mutationFn: async (values: AddUniversityFormValues) => {
      const response = await apiRequest("POST", "/api/universities", values);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add university");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
      toast({
        title: "University added",
        description: "The university has been added successfully",
      });
      onAddUniversityClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add university",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Invite admin mutation
  const inviteAdminMutation = useMutation({
    mutationFn: async (values: InviteAdminFormValues) => {
      const response = await apiRequest("POST", "/api/university-invites", values);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invitation");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities", manageAccessDrawer.universityId, "admins"] });
      toast({
        title: "Invitation sent",
        description: "The admin invitation has been sent successfully",
      });
      inviteAdminForm.reset({ 
        email: "", 
        universityId: manageAccessDrawer.universityId || 0 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle add university form submission
  const onAddUniversitySubmit = (values: AddUniversityFormValues) => {
    addUniversityMutation.mutate(values);
  };

  // Handle invite admin form submission
  const onInviteAdminSubmit = (values: InviteAdminFormValues) => {
    inviteAdminMutation.mutate(values);
  };

  // Open manage access drawer for a university
  const openManageAccess = (university: University) => {
    setManageAccessDrawer({ 
      isOpen: true, 
      universityId: university.id, 
      universityName: university.name 
    });
    
    inviteAdminForm.setValue("universityId", university.id);
  };

  // Filter universities based on search query
  const filteredUniversities = universities?.filter(university =>
    university.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Universities</h1>
            <p className="text-gray-600 mt-1">Manage university accounts and access</p>
          </div>
          <Button 
            className="mt-3 md:mt-0" 
            onClick={() => setIsAddUniversityOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add University
          </Button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search universities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-2">Error loading universities</div>
              <p>There was a problem fetching university data. Please try again later.</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredUniversities?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <School className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium">No universities found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery ? "No universities match your search criteria" : "No universities have been added yet"}
              </p>
              {searchQuery && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUniversities?.map((university) => (
              <Card key={university.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-lg">{university.name}</h3>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">{university.studentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admins:</span>
                      <span className="font-medium">{university.adminCount}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 flex justify-end gap-2 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/universities/${university.id}`}>View Details</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openManageAccess(university)}
                  >
                    Manage Access
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
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
            <form onSubmit={addUniversityForm.handleSubmit(onAddUniversitySubmit)} className="space-y-4">
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
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onAddUniversityClose}>
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

      {/* Manage Access Drawer */}
      <Drawer open={manageAccessDrawer.isOpen} onOpenChange={(open) => !open && onManageAccessClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Manage Access - {manageAccessDrawer.universityName}</DrawerTitle>
            <DrawerDescription>
              View administrators and invite new ones to manage this university.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Current Administrators
              </h3>
              
              {isLoadingAdmins ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : isErrorAdmins ? (
                <div className="text-red-500 text-sm">
                  Failed to load administrators
                </div>
              ) : universityAdmins?.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  No administrators found for this university
                </div>
              ) : (
                <div className="space-y-2">
                  {universityAdmins?.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <div className="font-medium">{admin.name}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Invite Administrator
              </h3>
              
              <Form {...inviteAdminForm}>
                <form onSubmit={inviteAdminForm.handleSubmit(onInviteAdminSubmit)} className="space-y-4">
                  <FormField
                    control={inviteAdminForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="admin@university.edu" 
                            type="email" 
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
                    {inviteAdminMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Invitation
                  </Button>
                </form>
              </Form>
            </div>
          </div>
          
          <DrawerFooter>
            <Button onClick={onManageAccessClose}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AdminLayout>
  );
}