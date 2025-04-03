import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@/lib/useUserData';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Define certification types
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

const formSchema = z.object({
  name: z.string().min(2, { message: "Certification name must be at least 2 characters." }),
  provider: z.string().min(2, { message: "Provider name is required." }),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal('')),
  skills: z.string(),
  status: z.enum(['active', 'expired', 'in-progress']),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Certifications() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddCertification, setShowAddCertification] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCertificationId, setSelectedCertificationId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      provider: '',
      status: 'active',
      skills: '',
    },
  });

  // Query to fetch certifications from the API
  const { data: certifications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/certifications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/certifications');
        if (!response.ok) {
          throw new Error('Failed to fetch certifications');
        }
        return await response.json() as Certification[];
      } catch (error) {
        console.error("Error fetching certifications:", error);
        return [] as Certification[];
      }
    }
  });

  // Mutation to add a new certification
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        skills: values.skills.split(',').map(skill => skill.trim()),
      };
      
      const response = await apiRequest('POST', '/api/certifications', payload);
      if (!response.ok) {
        throw new Error('Failed to create certification');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certification Created",
        description: "Your certification has been added successfully",
        variant: "default",
      });
      setShowAddCertification(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to update an existing certification
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: FormValues }) => {
      const payload = {
        ...values,
        skills: values.skills.split(',').map(skill => skill.trim()),
      };
      
      const response = await apiRequest('PUT', `/api/certifications/${id}`, payload);
      if (!response.ok) {
        throw new Error('Failed to update certification');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certification Updated",
        description: "Your certification has been updated successfully",
        variant: "default",
      });
      setShowAddCertification(false);
      setIsEditing(false);
      setSelectedCertificationId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to delete a certification
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/certifications/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete certification');
      }
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Certification Deleted",
        description: "The certification has been removed",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (values: FormValues) => {
    if (isEditing && selectedCertificationId) {
      updateMutation.mutate({ id: selectedCertificationId, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEditCertification = (certification: Certification) => {
    setIsEditing(true);
    setSelectedCertificationId(certification.id);
    setShowAddCertification(true);
    
    form.reset({
      name: certification.name,
      provider: certification.provider,
      issueDate: new Date(certification.issueDate).toISOString().split('T')[0],
      expiryDate: certification.expiryDate ? new Date(certification.expiryDate).toISOString().split('T')[0] : undefined,
      credentialId: certification.credentialId,
      credentialUrl: certification.credentialUrl,
      skills: certification.skills.join(', '),
      status: certification.status,
      description: certification.description,
    });
  };

  const handleDeleteCertification = (id: number) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      deleteMutation.mutate(id);
    }
  };

  const getFilteredCertifications = () => {
    return certifications.filter(cert => {
      const matchesSearch = 
        cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

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
          onClick={() => setShowAddCertification(true)}
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Certification
        </Button>
      </div>
      
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Certification Status
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Active</span>
                  <span className="font-medium">{stats.active} / {stats.total}</span>
                </div>
                <Progress value={(stats.active / stats.total) * 100} className="h-1.5 bg-muted" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>In Progress</span>
                  <span className="font-medium">{stats.inProgress} / {stats.total}</span>
                </div>
                <Progress value={(stats.inProgress / stats.total) * 100} className="h-1.5 bg-muted" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Expired</span>
                  <span className="font-medium">{stats.expired} / {stats.total}</span>
                </div>
                <Progress value={(stats.expired / stats.total) * 100} className="h-1.5 bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
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

        <div className="md:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : getFilteredCertifications().length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {getFilteredCertifications().map((certification) => (
                <Card key={certification.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{certification.name}</CardTitle>
                        <CardDescription>{certification.provider}</CardDescription>
                      </div>
                      <Badge 
                        className={
                          certification.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                          certification.status === 'in-progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                          'bg-red-100 text-red-800 hover:bg-red-100'
                        }
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
                      {certification.issueDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Issued: {new Date(certification.issueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {certification.expiryDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Expires: {new Date(certification.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {certification.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  {(certification.credentialId || certification.credentialUrl) && (
                    <CardFooter className="border-t bg-muted/20 py-2">
                      {certification.credentialId && (
                        <div className="text-xs mr-4">
                          <span className="text-muted-foreground">ID: </span>
                          <span className="font-medium">{certification.credentialId}</span>
                        </div>
                      )}
                      
                      {certification.credentialUrl && (
                        <a 
                          href={certification.credentialUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center ml-auto"
                        >
                          Verify
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Award className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Certifications Found</h3>
              <p className="text-neutral-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? "Try adjusting your filters or search terms"
                  : "Add your professional certifications to showcase your skills"}
              </p>
              <Button onClick={() => setShowAddCertification(true)}>
                Add Your First Certification
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Certification Dialog */}
      <Dialog open={showAddCertification} onOpenChange={setShowAddCertification}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Certification</DialogTitle>
            <DialogDescription>
              Add details about your professional certification
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Additional Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certification Name</FormLabel>
                        <FormControl>
                          <Input placeholder="AWS Solutions Architect" {...field} />
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
                        <FormLabel>Issuing Organization</FormLabel>
                        <FormControl>
                          <Input placeholder="Amazon Web Services" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
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
                          <FormLabel>Expiry Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="credentialId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credential ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="AWS-12345" {...field} />
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
                        <FormLabel>Credential URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://validate.example.com/credential" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills (Comma Separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="AWS, Cloud Computing, Architecture" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter skills associated with this certification, separated by commas
                        </FormDescription>
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
                          <Input placeholder="Brief description of the certification" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddCertification(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Certification</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}