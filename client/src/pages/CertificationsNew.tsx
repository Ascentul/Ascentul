import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useUser } from '@/lib/useUserData';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import { 
  Award, 
  Search, 
  Calendar, 
  PlusCircle, 
  ExternalLink, 
  FileText, 
  BarChart2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Pencil
} from 'lucide-react';

// Types
type Certification = {
  id: number;
  name: string;
  provider: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills: string[];
  status: 'active' | 'expired' | 'in-progress';
  description?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Certification name must be at least 2 characters." }),
  provider: z.string().min(2, { message: "Provider name is required." }),
  issueDate: z.string().min(1, { message: "Issue date is required." }),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal('')),
  skills: z.string(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CertificationsNew() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddCertification, setShowAddCertification] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCertificationId, setSelectedCertificationId] = useState<number | null>(null);

  // Initialize react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      provider: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
      skills: '',
      description: '',
    },
  });

  // Query to fetch certifications from the API
  const { data: certifications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/certifications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/certifications');
        return await response.json() as Certification[];
      } catch (error) {
        console.error("Error fetching certifications:", error);
        return [] as Certification[];
      }
    }
  });

  // Create certification mutation
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        skills: values.skills.split(',').map(skill => skill.trim()).filter(Boolean),
      };
      
      const response = await apiRequest('POST', '/api/certifications', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certification has been added successfully",
      });
      setShowAddCertification(false);
      form.reset();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add certification: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update certification mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: FormValues }) => {
      const payload = {
        ...values,
        skills: values.skills.split(',').map(skill => skill.trim()).filter(Boolean),
      };
      
      const response = await apiRequest('PUT', `/api/certifications/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certification has been updated successfully",
      });
      setShowAddCertification(false);
      setIsEditing(false);
      setSelectedCertificationId(null);
      form.reset();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update certification: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete certification mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/certifications/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certification has been deleted",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete certification: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    if (isEditing && selectedCertificationId) {
      updateMutation.mutate({ id: selectedCertificationId, values });
    } else {
      createMutation.mutate(values);
    }
  };

  // Handle certification editing
  const handleEditCertification = (certification: Certification) => {
    setIsEditing(true);
    setSelectedCertificationId(certification.id);
    setShowAddCertification(true);
    
    form.reset({
      name: certification.name,
      provider: certification.provider,
      issueDate: new Date(certification.issueDate).toISOString().split('T')[0],
      expiryDate: certification.expiryDate ? new Date(certification.expiryDate).toISOString().split('T')[0] : '',
      credentialId: certification.credentialId || '',
      credentialUrl: certification.credentialUrl || '',
      skills: certification.skills.join(', '),
      description: certification.description || '',
    });
  };

  // Handle certification deletion
  const handleDeleteCertification = (id: number) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter certifications based on search and status
  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = 
      cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats calculations
  const stats = {
    total: certifications.length,
    active: certifications.filter(c => c.status === 'active').length,
    expired: certifications.filter(c => c.status === 'expired').length,
    inProgress: certifications.filter(c => c.status === 'in-progress').length,
  };

  // Group skills across all certifications
  const allSkills = certifications.reduce((acc, cert) => {
    cert.skills.forEach(skill => {
      const existingSkill = acc.find(s => s.name === skill);
      if (existingSkill) {
        existingSkill.count++;
      } else {
        acc.push({ name: skill, count: 1 });
      }
    });
    return acc;
  }, [] as { name: string, count: number }[]).sort((a, b) => b.count - a.count);

  // Get upcoming expiring certifications
  const upcomingExpirations = certifications
    .filter(cert => cert.expiryDate && new Date(cert.expiryDate) > new Date())
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 3);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Certifications</h2>
        <Button 
          onClick={() => {
            setIsEditing(false);
            setSelectedCertificationId(null);
            form.reset({
              name: '',
              provider: '',
              issueDate: new Date().toISOString().split('T')[0],
              expiryDate: '',
              credentialId: '',
              credentialUrl: '',
              skills: '',
              description: '',
            });
            setShowAddCertification(true);
          }}
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Certification
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Certifications
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.active} active, {stats.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Skills
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {allSkills.slice(0, 5).map(skill => (
                <Badge key={skill.name} variant="secondary" className="text-xs">
                  {skill.name} ({skill.count})
                </Badge>
              ))}
              {allSkills.length === 0 && (
                <p className="text-xs text-muted-foreground">No skills added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expiring Soon
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingExpirations.map(cert => (
                <div key={cert.id} className="flex justify-between items-center text-sm">
                  <span className="truncate max-w-[70%]">{cert.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(cert.expiryDate!).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {upcomingExpirations.length === 0 && (
                <p className="text-xs text-muted-foreground">No upcoming expirations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        {/* Filters Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel>Search</FormLabel>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certifications..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <FormLabel>Status</FormLabel>
              <Select
                defaultValue="all"
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Certifications List */}
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredCertifications.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCertifications.map((certification) => (
                <Card key={certification.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{certification.name}</CardTitle>
                        <CardDescription>{certification.provider}</CardDescription>
                      </div>
                      <Badge 
                        className={`flex items-center ${
                          certification.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                          certification.status === 'in-progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                          'bg-red-100 text-red-800 hover:bg-red-100'
                        }`}
                      >
                        {certification.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {certification.status === 'in-progress' && <Clock className="h-3 w-3 mr-1" />}
                        {certification.status === 'expired' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {certification.status === 'active' ? 'Active' : 
                         certification.status === 'in-progress' ? 'In Progress' : 'Expired'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {certification.description && (
                      <p className="text-sm text-muted-foreground mb-4">{certification.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Issued:</span> {new Date(certification.issueDate).toLocaleDateString()}
                      </div>
                      {certification.expiryDate && (
                        <div>
                          <span className="text-muted-foreground">Expires:</span> {new Date(certification.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                      {certification.credentialId && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Credential ID:</span> {certification.credentialId}
                        </div>
                      )}
                    </div>
                    
                    {certification.skills.length > 0 && (
                      <div className="mt-4">
                        <span className="text-xs text-muted-foreground block mb-1">Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {certification.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <div>
                      {certification.credentialUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(certification.credentialUrl, '_blank')}
                          className="gap-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Verify
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditCertification(certification)}
                        className="gap-1 text-xs"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteCertification(certification.id)}
                        className="gap-1 text-xs text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-2">
                  {searchQuery || statusFilter !== 'all' 
                    ? "No matching certifications found" 
                    : "You haven't added any certifications yet"}
                </p>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedCertificationId(null);
                    form.reset();
                    setShowAddCertification(true);
                  }}
                  className="mt-2"
                >
                  Add Your First Certification
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Certification Dialog */}
      <Dialog open={showAddCertification} onOpenChange={setShowAddCertification}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Certification" : "Add Certification"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update your certification details below" 
                : "Add your professional certification details below"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certification Name</FormLabel>
                      <FormControl>
                        <Input placeholder="AWS Certified Solutions Architect" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider/Issuer</FormLabel>
                      <FormControl>
                        <Input placeholder="Amazon Web Services" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (if applicable)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Leave blank for non-expiring certifications</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="credentialId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential ID (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC-123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="credentialUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential Verification URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/verify" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="AWS, Cloud Architecture, Security" {...field} />
                    </FormControl>
                    <FormDescription>Enter skills associated with this certification</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the certification"
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddCertification(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center gap-1">
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      {isEditing ? "Updating..." : "Saving..."}
                    </span>
                  ) : (
                    isEditing ? "Update Certification" : "Add Certification"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}