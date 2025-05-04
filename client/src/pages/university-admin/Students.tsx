import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  MoreHorizontal,
  Search,
  UserPlus,
  Filter,
  Calendar,
  Mail,
  AlertCircle,
  Ban,
  MessageSquare,
  ArrowUpDown,
  Trash2,
  FileText,
  BarChart,
  Eye,
  ExternalLink,
  Download,
  Send,
  UserCircle
} from 'lucide-react';

// Define student data type
interface Student {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  progress: number;
  profileImage?: string;
}

// Mock data for students
const mockStudents: Student[] = [
  {
    id: 1,
    name: 'Jane Smith',
    email: 'jane.smith@stanford.edu',
    status: 'active',
    lastLogin: '2025-05-03',
    progress: 78,
    profileImage: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    name: 'Michael Johnson',
    email: 'michael.johnson@stanford.edu',
    status: 'active',
    lastLogin: '2025-05-03',
    progress: 65,
    profileImage: 'https://i.pravatar.cc/150?img=2'
  },
  {
    id: 3,
    name: 'Emily Davis',
    email: 'emily.davis@stanford.edu',
    status: 'active',
    lastLogin: '2025-05-02',
    progress: 92,
    profileImage: 'https://i.pravatar.cc/150?img=3'
  },
  {
    id: 4,
    name: 'Daniel Brown',
    email: 'daniel.brown@stanford.edu',
    status: 'inactive',
    lastLogin: '2025-04-28',
    progress: 45,
    profileImage: 'https://i.pravatar.cc/150?img=4'
  },
  {
    id: 5,
    name: 'Sophia Wilson',
    email: 'sophia.wilson@stanford.edu',
    status: 'active',
    lastLogin: '2025-05-03',
    progress: 85,
    profileImage: 'https://i.pravatar.cc/150?img=5'
  },
  {
    id: 6,
    name: 'Ethan Martinez',
    email: 'ethan.martinez@stanford.edu',
    status: 'active',
    lastLogin: '2025-05-01',
    progress: 70,
    profileImage: 'https://i.pravatar.cc/150?img=6'
  },
  {
    id: 7,
    name: 'Olivia Anderson',
    email: 'olivia.anderson@stanford.edu',
    status: 'inactive',
    lastLogin: '2025-04-25',
    progress: 30,
    profileImage: 'https://i.pravatar.cc/150?img=7'
  },
  {
    id: 8,
    name: 'Noah Taylor',
    email: 'noah.taylor@stanford.edu',
    status: 'active',
    lastLogin: '2025-05-02',
    progress: 88,
    profileImage: 'https://i.pravatar.cc/150?img=8'
  },
  {
    id: 9,
    name: 'Ava Thomas',
    email: 'ava.thomas@stanford.edu',
    status: 'active',
    lastLogin: '2025-05-03',
    progress: 74,
    profileImage: 'https://i.pravatar.cc/150?img=9'
  },
  {
    id: 10,
    name: 'William Garcia',
    email: 'william.garcia@stanford.edu',
    status: 'active',
    lastLogin: '2025-05-02',
    progress: 82,
    profileImage: 'https://i.pravatar.cc/150?img=10'
  },
];

// Form schema for adding a new student
const addStudentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .refine((email) => email.endsWith('.edu'), {
      message: "Email must be an educational email (.edu)"
    }),
  status: z.enum(['active', 'inactive']).default('active'),
});

type AddStudentFormValues = z.infer<typeof addStudentSchema>;

export default function StudentManagement() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);

  // Filter students based on search query and status filter
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle student profile view
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  // Handle student deletion
  const handleDeleteStudent = (studentId: number) => {
    setStudents(students.filter(student => student.id !== studentId));
    setIsDeleteDialogOpen(false);
    
    toast({
      title: 'Student Removed',
      description: 'The student has been removed from the platform.',
    });
  };

  // Function to reset a student's password
  const handleResetPassword = (studentId: number) => {
    toast({
      title: 'Password Reset Link Sent',
      description: 'A password reset link has been sent to the student\'s email.',
    });
  };

  // Function to deactivate a student
  const handleDeactivateStudent = (studentId: number) => {
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, status: 'inactive' as 'inactive' } 
        : student
    ));
    
    toast({
      title: 'Student Deactivated',
      description: 'The student account has been deactivated.',
    });
  };

  // Function to activate a student
  const handleActivateStudent = (studentId: number) => {
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, status: 'active' as 'active' } 
        : student
    ));
    
    toast({
      title: 'Student Activated',
      description: 'The student account has been activated.',
    });
  };
  
  // Function to get the initials from a name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Function to handle export report
  const handleExportReport = () => {
    toast({
      title: 'Report Exported',
      description: `Analytics report for ${selectedStudent?.name} has been exported successfully.`,
    });
  };
  
  // State for message dialog
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  
  // Function to handle sending message to student
  const handleSendMessage = () => {
    if (!messageContent.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message before sending.',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Message Sent',
      description: `Your message has been sent to ${selectedStudent?.name}.`,
    });
    
    setMessageContent('');
    setIsMessageDialogOpen(false);
  };
  
  // State for email dialog
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  
  // Function to handle sending email to student
  const handleSendEmail = () => {
    if (!emailSubject.trim()) {
      toast({
        title: 'Subject Required',
        description: 'Please enter an email subject before sending.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!emailContent.trim()) {
      toast({
        title: 'Email Content Required',
        description: 'Please enter email content before sending.',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Email Sent',
      description: `Your email has been sent to ${selectedStudent?.name}.`,
    });
    
    setEmailSubject('');
    setEmailContent('');
    setIsEmailDialogOpen(false);
  };

  // Setup form for adding a new student
  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      name: '',
      email: '',
      status: 'active',
    },
  });

  // Function to handle adding a new student
  const handleAddStudent = (data: AddStudentFormValues) => {
    // Generate a random ID (in a real app, this would come from the backend)
    const maxId = students.reduce((max, student) => Math.max(max, student.id), 0);
    const newId = maxId + 1;
    
    // Create the new student
    const newStudent: Student = {
      id: newId,
      name: data.name,
      email: data.email,
      status: data.status,
      lastLogin: 'Never',
      progress: 0,
      profileImage: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`, // Random avatar
    };
    
    // Add the student to the list
    setStudents([...students, newStudent]);
    
    // Close the dialog and reset the form
    setIsAddDialogOpen(false);
    form.reset();
    
    // Show success message
    toast({
      title: 'Student Added',
      description: `${data.name} has been added successfully. An invite email has been sent.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">
          View, manage, and monitor student accounts and their platform activity.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {statusFilter === 'all' ? 'All Students' : 
                 statusFilter === 'active' ? 'Active' : 'Inactive'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                {statusFilter === 'all' && <Check className="mr-2 h-4 w-4" />}
                All Students
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                {statusFilter === 'active' && <Check className="mr-2 h-4 w-4" />}
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                {statusFilter === 'inactive' && <Check className="mr-2 h-4 w-4" />}
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No students found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.profileImage} alt={student.name} />
                          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">{student.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {student.lastLogin}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-secondary rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              student.progress >= 70 
                                ? 'bg-green-500' 
                                : student.progress >= 40 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{student.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewStudent(student)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudent(student);
                            setIsEmailDialogOpen(true);
                          }}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudent(student);
                            setIsMessageDialogOpen(true);
                          }}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleResetPassword(student.id)}>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          {student.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleDeactivateStudent(student.id)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Deactivate Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivateStudent(student.id)}>
                              <Check className="mr-2 h-4 w-4" />
                              Activate Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredStudents.length} of {students.length} students
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Student Profile View Dialog */}
      {selectedStudent && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Student Profile</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedStudent.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="col-span-1 flex flex-col items-center gap-4">
                <Avatar className="h-28 w-28">
                  <AvatarImage src={selectedStudent.profileImage} alt={selectedStudent.name} />
                  <AvatarFallback className="text-2xl">{getInitials(selectedStudent.name)}</AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                  <div className="mt-2">
                    <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {selectedStudent.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="w-full space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => setIsEmailDialogOpen(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => setIsMessageDialogOpen(true)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View in LMS
                  </Button>
                </div>
              </div>
              
              <div className="col-span-2">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="progress" className="flex-1">Progress</TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Student ID</p>
                        <p className="text-sm text-muted-foreground">STU-{selectedStudent.id.toString().padStart(6, '0')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Joined Date</p>
                        <p className="text-sm text-muted-foreground">Jan 10, 2025</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Last Login</p>
                        <p className="text-sm text-muted-foreground">{selectedStudent.lastLogin}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Degree Program</p>
                        <p className="text-sm text-muted-foreground">Bachelor of Science in Computer Science</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Graduation Year</p>
                        <p className="text-sm text-muted-foreground">2026</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Career Interest</p>
                        <p className="text-sm text-muted-foreground">Software Development, Data Science</p>
                      </div>
                    </div>
                    

                  </TabsContent>
                  
                  <TabsContent value="progress" className="pt-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Career Development Progress</h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <h5 className="font-medium">Resume Building</h5>
                            <p className="text-sm text-muted-foreground">Last updated: Apr 28, 2025</p>
                          </div>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <h5 className="font-medium">LinkedIn Profile Optimization</h5>
                            <p className="text-sm text-muted-foreground">Last updated: May 1, 2025</p>
                          </div>
                          <Badge variant="outline">In Progress</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <h5 className="font-medium">Mock Interview Sessions</h5>
                            <p className="text-sm text-muted-foreground">2 of 5 completed</p>
                          </div>
                          <Badge variant="outline">In Progress</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <h5 className="font-medium">Career Path Exploration</h5>
                            <p className="text-sm text-muted-foreground">3 paths explored</p>
                          </div>
                          <Badge variant="outline">In Progress</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between pb-2">
                          <div>
                            <h5 className="font-medium">Job Application Tracking</h5>
                            <p className="text-sm text-muted-foreground">0 applications tracked</p>
                          </div>
                          <Badge variant="outline">Not Started</Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="activity" className="pt-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Recent Activity</h4>
                      
                      <div className="space-y-4">
                        <div className="border-l-2 border-primary pl-4 pb-4 relative">
                          <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]"></div>
                          <p className="text-sm font-medium">Updated Resume</p>
                          <p className="text-xs text-muted-foreground">May 3, 2025 at 2:45 PM</p>
                        </div>
                        
                        <div className="border-l-2 border-primary pl-4 pb-4 relative">
                          <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]"></div>
                          <p className="text-sm font-medium">Completed LinkedIn Profile Review</p>
                          <p className="text-xs text-muted-foreground">May 1, 2025 at 10:30 AM</p>
                        </div>
                        
                        <div className="border-l-2 border-primary pl-4 pb-4 relative">
                          <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]"></div>
                          <p className="text-sm font-medium">Started Mock Interview Session</p>
                          <p className="text-xs text-muted-foreground">Apr 28, 2025 at 3:15 PM</p>
                        </div>
                        
                        <div className="border-l-2 border-primary pl-4 pb-4 relative">
                          <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]"></div>
                          <p className="text-sm font-medium">Explored Software Engineering Career Path</p>
                          <p className="text-xs text-muted-foreground">Apr 25, 2025 at 11:20 AM</p>
                        </div>
                        
                        <div className="border-l-2 border-primary pl-4 relative">
                          <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]"></div>
                          <p className="text-sm font-medium">Completed Career Assessment</p>
                          <p className="text-xs text-muted-foreground">Apr 22, 2025 at 9:45 AM</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter student details below. An invitation email will be sent to the student.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddStudent)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student's full name" {...field} />
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
                        placeholder="student@university.edu" 
                        type="email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Must be a valid .edu email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Status</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue="active"
                          {...field}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </FormControl>
                    </div>
                    <FormDescription>
                      Students with inactive status won't be able to log in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Student Analytics Dialog */}
      {selectedStudent && (
        <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Student Analytics</DialogTitle>
              <DialogDescription>
                Detailed analytics and insights for {selectedStudent.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Platform Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8.3 hrs</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Career Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+24%</div>
                    <p className="text-xs text-muted-foreground">Since first assessment</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Skills Acquired</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">7</div>
                    <p className="text-xs text-muted-foreground">2 in progress</p>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
                <div className="relative">
                  <div className="absolute h-full w-px bg-border left-7 top-0"></div>
                  <ul className="space-y-4">
                    <li className="flex gap-4">
                      <div className="relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <FileText className="h-3 w-3" />
                        <span className="sr-only">Resume</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Updated Resume</p>
                        <p className="text-sm text-muted-foreground">May 3, 2025 at 2:45 PM</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <UserCircle className="h-3 w-3" />
                        <span className="sr-only">Profile</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completed LinkedIn Profile Review</p>
                        <p className="text-sm text-muted-foreground">May 1, 2025 at 10:30 AM</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span className="sr-only">Interview</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completed Mock Interview Session</p>
                        <p className="text-sm text-muted-foreground">Apr 28, 2025 at 3:15 PM</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Skills Development</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Resume Building</span>
                      <span className="text-sm text-muted-foreground">90%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Interview Preparation</span>
                      <span className="text-sm text-muted-foreground">75%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Networking</span>
                      <span className="text-sm text-muted-foreground">60%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Job Application Strategy</span>
                      <span className="text-sm text-muted-foreground">45%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAnalyticsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={handleExportReport}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedStudent?.name} from the platform? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedStudent && handleDeleteStudent(selectedStudent.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Message Dialog */}
      {selectedStudent && (
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a direct message to {selectedStudent.name}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="Message subject"
                  defaultValue={`Regarding your career development progress`}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Type your message here..." 
                  className="min-h-[150px]"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Email Dialog */}
      {selectedStudent && (
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email</DialogTitle>
              <DialogDescription>
                Send an email to {selectedStudent.name} at {selectedStudent.email}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="emailSubject">Subject</Label>
                <Input 
                  id="emailSubject" 
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailContent">Email Content</Label>
                <Textarea 
                  id="emailContent" 
                  placeholder="Type your email content here..." 
                  className="min-h-[200px]"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}