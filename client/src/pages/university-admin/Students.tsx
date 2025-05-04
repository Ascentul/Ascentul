import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  MoreHorizontal, 
  Download, 
  Eye, 
  Mail, 
  MessageSquare, 
  UserPlus, 
  Users,
  AlertOctagon,
  Clock
} from 'lucide-react';

// Define types for student data
interface Student {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  lastActive: string;
  progressLevel: number;
  year: string;
  major: string;
}

export default function StudentsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  // Mock student data
  const students: Student[] = [
    {
      id: 1,
      name: 'Emma Thompson',
      email: 'emma.t@university.edu',
      status: 'active',
      joinDate: '2024-09-15',
      lastActive: '2025-05-04 09:42:15',
      progressLevel: 78,
      year: 'Senior',
      major: 'Computer Science',
    },
    {
      id: 2,
      name: 'Marcus Chen',
      email: 'mchen@university.edu',
      status: 'active',
      joinDate: '2024-09-02',
      lastActive: '2025-05-03 16:23:47',
      progressLevel: 65,
      year: 'Junior',
      major: 'Business Administration',
    },
    {
      id: 3,
      name: 'Sofia Rodriguez',
      email: 's.rodriguez@university.edu',
      status: 'active',
      joinDate: '2024-08-28',
      lastActive: '2025-05-03 14:05:22',
      progressLevel: 92,
      year: 'Graduate',
      major: 'Psychology',
    },
    {
      id: 4,
      name: 'James Wilson',
      email: 'jwilson@university.edu',
      status: 'inactive',
      joinDate: '2024-09-10',
      lastActive: '2025-04-15 10:31:08',
      progressLevel: 23,
      year: 'Sophomore',
      major: 'Engineering',
    },
    {
      id: 5,
      name: 'Priya Patel',
      email: 'ppatel@university.edu',
      status: 'active',
      joinDate: '2024-08-30',
      lastActive: '2025-05-01 08:15:33',
      progressLevel: 87,
      year: 'Senior',
      major: 'Communication',
    },
    {
      id: 6,
      name: 'Tyler Johnson',
      email: 'tjohnson@university.edu',
      status: 'pending',
      joinDate: '2025-04-30',
      lastActive: 'Never',
      progressLevel: 0,
      year: 'Freshman',
      major: 'Biology',
    },
    {
      id: 7,
      name: 'Hannah Lee',
      email: 'hlee@university.edu',
      status: 'active',
      joinDate: '2024-09-05',
      lastActive: '2025-04-28 11:42:09',
      progressLevel: 59,
      year: 'Junior',
      major: 'Mathematics',
    },
    {
      id: 8,
      name: 'Carlos Diaz',
      email: 'cdiaz@university.edu',
      status: 'active',
      joinDate: '2024-09-12',
      lastActive: '2025-05-02 15:55:22',
      progressLevel: 81,
      year: 'Senior',
      major: 'Marketing',
    },
  ];
  
  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.year.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle export student data
  const handleExportData = () => {
    toast({
      title: 'Student data export started',
      description: 'Your export will be available for download in a few moments.',
    });
    
    setIsExportDialogOpen(false);
    
    // Simulate download completion after a delay
    setTimeout(() => {
      toast({
        title: 'Export complete',
        description: 'Student data has been exported successfully.',
      });
    }, 2000);
  };
  
  // Function to get status badge styling
  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage and view all students enrolled in your university's Ascentul platform.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Student Data</DialogTitle>
                <DialogDescription>
                  Choose the format and data to include in your export.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Export Format</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">CSV</Button>
                    <Button variant="outline" size="sm" className="flex-1">Excel</Button>
                    <Button variant="outline" size="sm" className="flex-1">PDF</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Data to Include</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="basic-info" className="rounded border-gray-300" defaultChecked />
                      <label htmlFor="basic-info" className="text-sm">Basic Information</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="progress" className="rounded border-gray-300" defaultChecked />
                      <label htmlFor="progress" className="text-sm">Progress Metrics</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="activity" className="rounded border-gray-300" defaultChecked />
                      <label htmlFor="activity" className="text-sm">Activity Data</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="career-path" className="rounded border-gray-300" defaultChecked />
                      <label htmlFor="career-path" className="text-sm">Career Path Data</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleExportData}>Export Data</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            size="sm"
            onClick={() => window.location.href = '/university-admin/invite'}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Students
          </Button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  All Students
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Active Only
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Needs Attention
                </Button>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="gap-1 hidden md:flex">
                  <Clock className="h-4 w-4" />
                  Recently Active
                </Button>
                <Button variant="outline" size="sm" className="gap-1 hidden lg:flex">
                  <AlertOctagon className="h-4 w-4" />
                  At Risk
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Students Table */}
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Student Roster</CardTitle>
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2">
                <Users className="h-3 w-3 mr-1" />
                {students.length} Total
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {students.filter(s => s.status === 'active').length} Active
              </Badge>
            </div>
          </div>
          <CardDescription>
            Comprehensive list of all students with access to the Ascentul platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Join Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Year & Major</TableHead>
                  <TableHead className="hidden md:table-cell">Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={student.profileImage} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {student.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(student.joinDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="font-medium">{student.year}</div>
                        <div className="text-sm text-muted-foreground">{student.major}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${student.progressLevel}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{student.progressLevel}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              {student.status === 'active' ? (
                                <>Deactivate Account</>
                              ) : (
                                <>Activate Account</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No students found matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}