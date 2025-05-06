import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RefreshCw, Mail, Plus, Building } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Invite, University } from "@shared/schema";
import AdminLayout from "../../layouts/AdminLayout";
import { useIsSystemAdmin } from "@/lib/useUserData";

const inviteFormSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  universityName: z.string().min(3, "University name must be at least 3 characters"),
  role: z.string().default("university_admin"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function UniversitiesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const isSystemAdmin = useIsSystemAdmin();
  
  // Log for debugging
  useEffect(() => {
    console.log("UniversitiesPage loaded successfully");
    console.log("Is system admin:", isSystemAdmin);
  }, [isSystemAdmin]);

  // Query to get all invites with error handling for missing invites table
  const {
    data: invites,
    isLoading: isLoadingInvites,
    isError: isErrorInvites,
    error: invitesError,
  } = useQuery({
    queryKey: ["/api/university-invites"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/university-invites");
        if (!response.ok) {
          console.warn("Issue fetching invites, will use empty array");
          return { invites: [] };
        }
        return response.json();
      } catch (err) {
        console.warn("Error fetching invites:", err);
        return { invites: [] };
      }
    },
    // Don't retry fetching if there's a server error like missing table
    retry: false,
  });

  // Query to get all universities
  const {
    data: universities,
    isLoading: isLoadingUniversities,
    isError: isErrorUniversities,
    error: universitiesError,
  } = useQuery({
    queryKey: ["/api/universities"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/universities");
      if (!response.ok) {
        throw new Error("Failed to fetch universities");
      }
      return response.json();
    }
  });

  // Mutation to create a new invite
  const createInviteMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      const response = await apiRequest("POST", "/api/university-invites", data);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create invite");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The university admin invitation has been sent successfully.",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/university-invites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to resend an invite
  const resendInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      const response = await apiRequest("POST", `/api/university-invites/resend/${inviteId}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to resend invite");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation resent",
        description: "The invitation email has been resent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/university-invites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      universityName: "",
      role: "university_admin",
    },
  });

  function onSubmit(data: InviteFormValues) {
    createInviteMutation.mutate(data);
  }

  function handleResendInvite(inviteId: number) {
    resendInviteMutation.mutate(inviteId);
  }

  function getBadgeVariant(status: string) {
    switch (status) {
      case "pending":
        return "warning";
      case "accepted":
        return "success";
      case "expired":
        return "destructive";
      default:
        return "secondary";
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        {(isErrorUniversities || isErrorInvites) && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle className="flex items-center">
              <span className="mr-2">⚠️</span>
              API Connection Issue
            </AlertTitle>
            <AlertDescription>
              There was a problem connecting to the university management APIs. Some features may be limited.
              Please try refreshing the page or contact technical support if the issue persists.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">University Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage university accounts and admin invitations
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Invite University Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite University Administrator</DialogTitle>
                <DialogDescription>
                  Send an invitation email to a university administrator. They'll receive a secure link
                  to set up their account.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@university.edu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="universityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University Name</FormLabel>
                        <FormControl>
                          <Input placeholder="University of Example" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the full name of the university
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createInviteMutation.isPending}
                      className="w-full"
                    >
                      {createInviteMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending Invitation...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Universities List */}
          <Card>
            <CardHeader>
              <CardTitle>Universities</CardTitle>
              <CardDescription>
                List of universities registered on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUniversities ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : isErrorUniversities ? (
                <div className="text-center p-4 text-destructive">
                  Error: {String(universitiesError)}
                </div>
              ) : !universities || !Array.isArray(universities) || universities.length === 0 ? (
                <div className="flex flex-col items-center p-8 border rounded-lg bg-gradient-to-b from-blue-50 to-white">
                  <Building className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-bold text-lg mb-2">No Universities Yet</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Universities will appear here once invitations are accepted
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Invite University Admin
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {universities.map((university: University) => (
                    <div
                      key={university.id}
                      className="p-4 border rounded-lg transition-all hover:bg-muted/20"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{university.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {university.adminEmail ? "1 administrator" : "No administrators"}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invitations List */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Invitations</CardTitle>
              <CardDescription>
                Pending and processed invitations for university administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInvites ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : isErrorInvites ? (
                <div className="text-center p-4 text-destructive">
                  Error: {String(invitesError)}
                </div>
              ) : !invites || !Array.isArray(invites) || invites.length === 0 ? (
                <div className="flex flex-col items-center p-8 border rounded-lg bg-gradient-to-b from-blue-50 to-white">
                  <Building className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-bold text-lg mb-2">No Invitations Yet</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Get started by inviting university administrators
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Send First Invitation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite: Invite) => (
                    <div
                      key={invite.id}
                      className="p-4 border rounded-lg transition-all hover:bg-muted/20"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex gap-2 items-center">
                            <h3 className="font-medium">{invite.email}</h3>
                            <Badge variant="outline" className={`
                              ${invite.status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
                              ${invite.status === "accepted" ? "bg-green-100 text-green-800 border-green-300" : ""}
                              ${invite.status === "expired" ? "bg-red-100 text-red-800 border-red-300" : ""}
                            `}>
                              {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mt-1">{invite.universityName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sent: {invite.sentAt ? format(new Date(invite.sentAt), 'MMM d, yyyy') : 'N/A'} 
                            {invite.status === "pending" && invite.expiresAt && (
                              <> · Expires: {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}</>
                            )}
                            {invite.status === "accepted" && invite.acceptedAt && (
                              <> · Accepted: {format(new Date(invite.acceptedAt), 'MMM d, yyyy')}</>
                            )}
                          </p>
                        </div>
                        {invite.status === "pending" || invite.status === "expired" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvite(invite.id)}
                            disabled={resendInviteMutation.isPending}
                          >
                            {resendInviteMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              "Resend"
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}