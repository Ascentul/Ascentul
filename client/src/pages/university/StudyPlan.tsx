import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, MoreHorizontal, PlusCircle, Check, ChevronDown, BookOpen, Clock, MapPin, Users, Calendar as CalendarIcon2, Pencil, Trash2, Clipboard, AlertCircle, CheckCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

// Mock data until we have API endpoints
const studyPlanSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  academicTerm: z.string().min(1, { message: "Academic term is required" }),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }).optional(),
});

const courseSchema = z.object({
  courseCode: z.string().min(1, { message: "Course code is required" }),
  courseName: z.string().min(1, { message: "Course name is required" }),
  credits: z.coerce.number().min(1).max(6),
  schedule: z.string().optional(),
  instructor: z.string().optional(),
  location: z.string().optional(),
  priority: z.coerce.number().min(1).max(5),
  status: z.enum(["planned", "in-progress", "completed"]),
  notes: z.string().optional(),
});

const assignmentSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  status: z.enum(["pending", "in-progress", "completed"]),
  weight: z.coerce.number().min(1).max(100),
});

export default function StudyPlan() {
  const { toast } = useToast();
  const [selectedStudyPlan, setSelectedStudyPlan] = useState<number | null>(null);
  const [isAddingStudyPlan, setIsAddingStudyPlan] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  // Fetch study plans
  const { data: studyPlans, isLoading: studyPlansLoading } = useQuery({
    queryKey: ["/api/university/study-plans"],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          title: "Spring 2025 Semester",
          description: "Computer Science - Junior Year, Second Semester",
          academicTerm: "Spring 2025",
          startDate: "2025-01-12T00:00:00Z",
          endDate: "2025-05-01T00:00:00Z",
          courses: [
            {
              id: 101,
              courseCode: "CS-301",
              courseName: "Algorithms and Data Structures",
              credits: 4,
              schedule: "MWF 10:00-11:30",
              instructor: "Dr. Richard Karp",
              location: "Science Center 142",
              priority: 1,
              status: "in-progress",
              progress: 35,
              assignments: [
                {
                  id: 1001,
                  title: "Binary Search Trees Implementation",
                  description: "Implement a self-balancing binary search tree and perform operations",
                  dueDate: "2025-02-15T23:59:59Z",
                  status: "completed",
                  weight: 15,
                  grade: "A-",
                },
                {
                  id: 1002,
                  title: "Graph Algorithms Project",
                  description: "Implement Dijkstra's and A* algorithms and compare performance",
                  dueDate: "2025-03-10T23:59:59Z",
                  status: "in-progress",
                  weight: 25,
                },
              ],
            },
            {
              id: 102,
              courseCode: "CS-325",
              courseName: "Database Systems",
              credits: 3,
              schedule: "TR 1:00-2:30",
              instructor: "Dr. Michael Stonebraker",
              location: "Engineering Building 201",
              priority: 2,
              status: "in-progress",
              progress: 40,
              assignments: [
                {
                  id: 1003,
                  title: "ER Diagram Design",
                  description: "Design a database for a hospital management system",
                  dueDate: "2025-02-08T23:59:59Z",
                  status: "completed",
                  weight: 10,
                  grade: "A",
                },
                {
                  id: 1004,
                  title: "SQL Query Optimization",
                  description: "Optimize given queries and explain your approach",
                  dueDate: "2025-03-01T23:59:59Z",
                  status: "completed",
                  weight: 15,
                  grade: "B+",
                },
                {
                  id: 1005,
                  title: "Database Implementation Project",
                  description: "Build a working application with a backend database",
                  dueDate: "2025-04-15T23:59:59Z",
                  status: "pending",
                  weight: 30,
                },
              ],
            },
            {
              id: 103,
              courseCode: "MATH-301",
              courseName: "Linear Algebra",
              credits: 3,
              schedule: "MWF 2:00-3:00",
              instructor: "Dr. Gilbert Strang",
              location: "Mathematics Building 110",
              priority: 3,
              status: "in-progress",
              progress: 45,
              assignments: [
                {
                  id: 1006,
                  title: "Vector Space Homework",
                  dueDate: "2025-02-05T23:59:59Z",
                  status: "completed",
                  weight: 5,
                  grade: "A",
                },
                {
                  id: 1007,
                  title: "Midterm Exam",
                  dueDate: "2025-03-05T14:00:00Z",
                  status: "completed",
                  weight: 30,
                  grade: "B+",
                },
                {
                  id: 1008,
                  title: "Eigenvalues & Eigenvectors Assignment",
                  dueDate: "2025-03-25T23:59:59Z",
                  status: "in-progress",
                  weight: 15,
                },
              ],
            },
          ],
        },
        {
          id: 2,
          title: "Fall 2025 Semester",
          description: "Computer Science - Senior Year, First Semester",
          academicTerm: "Fall 2025",
          startDate: "2025-08-25T00:00:00Z",
          endDate: "2025-12-15T00:00:00Z",
          courses: [],
        },
      ];
    },
  });

  // Forms
  const studyPlanForm = useForm<z.infer<typeof studyPlanSchema>>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      title: "",
      description: "",
      academicTerm: "",
      startDate: new Date(),
    },
  });

  const courseForm = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseCode: "",
      courseName: "",
      credits: 3,
      schedule: "",
      instructor: "",
      location: "",
      priority: 1,
      status: "planned",
      notes: "",
    },
  });

  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      weight: 10,
    },
  });

  // Mutations
  const createStudyPlanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof studyPlanSchema>) => {
      // Mock API call
      // return apiRequest("POST", "/api/university/study-plans", data);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/university/study-plans"] });
      toast({
        title: "Study Plan Created",
        description: "Your study plan has been created successfully.",
      });
      setIsAddingStudyPlan(false);
      studyPlanForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create study plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseSchema>) => {
      // Mock API call
      // return apiRequest("POST", `/api/university/study-plans/${selectedStudyPlan}/courses`, data);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/university/study-plans"] });
      toast({
        title: "Course Added",
        description: "The course has been added to your study plan.",
      });
      setIsAddingCourse(false);
      courseForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignmentSchema>) => {
      // Mock API call
      // return apiRequest("POST", `/api/university/courses/${selectedCourse}/assignments`, data);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/university/study-plans"] });
      toast({
        title: "Assignment Added",
        description: "The assignment has been added to the course.",
      });
      setIsAddingAssignment(false);
      assignmentForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onSubmitStudyPlan = (data: z.infer<typeof studyPlanSchema>) => {
    createStudyPlanMutation.mutate(data);
  };

  const onSubmitCourse = (data: z.infer<typeof courseSchema>) => {
    createCourseMutation.mutate(data);
  };

  const onSubmitAssignment = (data: z.infer<typeof assignmentSchema>) => {
    createAssignmentMutation.mutate(data);
  };

  // Get current plan and courses
  const currentPlan = selectedStudyPlan
    ? studyPlans?.find((plan) => plan.id === selectedStudyPlan)
    : studyPlans?.[0];

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "in-progress":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "pending":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  if (studyPlansLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!studyPlans || studyPlans.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Study Plans</h1>
          <Dialog open={isAddingStudyPlan} onOpenChange={setIsAddingStudyPlan}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Study Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Study Plan</DialogTitle>
                <DialogDescription>
                  Create a study plan to organize your courses and assignments for an academic term.
                </DialogDescription>
              </DialogHeader>
              <Form {...studyPlanForm}>
                <form onSubmit={studyPlanForm.handleSubmit(onSubmitStudyPlan)} className="space-y-4">
                  <FormField
                    control={studyPlanForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Spring 2025 Semester" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studyPlanForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of your study plan"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studyPlanForm.control}
                    name="academicTerm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Term</FormLabel>
                        <FormControl>
                          <Input placeholder="Spring 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={studyPlanForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined;
                                  field.onChange(date);
                                }}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={studyPlanForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined;
                                  field.onChange(date);
                                }}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingStudyPlan(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Study Plan</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Study Plans Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first study plan to organize your courses and assignments.
            </p>
            <Button onClick={() => setIsAddingStudyPlan(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Study Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Study Plans</h1>
          <p className="text-muted-foreground">
            Organize your courses, schedule, and assignments
          </p>
        </div>
        <Dialog open={isAddingStudyPlan} onOpenChange={setIsAddingStudyPlan}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Study Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Study Plan</DialogTitle>
              <DialogDescription>
                Create a study plan to organize your courses and assignments for an academic term.
              </DialogDescription>
            </DialogHeader>
            <Form {...studyPlanForm}>
              <form onSubmit={studyPlanForm.handleSubmit(onSubmitStudyPlan)} className="space-y-4">
                <FormField
                  control={studyPlanForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Spring 2025 Semester" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={studyPlanForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of your study plan"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={studyPlanForm.control}
                  name="academicTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Term</FormLabel>
                      <FormControl>
                        <Input placeholder="Spring 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={studyPlanForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                field.onChange(date);
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studyPlanForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                field.onChange(date);
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingStudyPlan(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Study Plan</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Study Plan Selection */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold">Current Plan:</h2>
          <Select
            value={currentPlan?.id.toString()}
            onValueChange={(value) => setSelectedStudyPlan(parseInt(value))}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a study plan" />
            </SelectTrigger>
            <SelectContent>
              {studyPlans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id.toString()}>
                  {plan.title} - {plan.academicTerm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Study Plan */}
      {currentPlan && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{currentPlan.title}</CardTitle>
                  <CardDescription>{currentPlan.description}</CardDescription>
                </div>
                <div className="flex flex-col items-end">
                  <Badge>{currentPlan.academicTerm}</Badge>
                  <span className="text-sm text-muted-foreground mt-2">
                    {format(new Date(currentPlan.startDate), "MMM d, yyyy")} -{" "}
                    {currentPlan.endDate && format(new Date(currentPlan.endDate), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Courses</h3>
                <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Course</DialogTitle>
                      <DialogDescription>
                        Add a course to your study plan.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...courseForm}>
                      <form onSubmit={courseForm.handleSubmit(onSubmitCourse)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={courseForm.control}
                            name="courseCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Course Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="CS-301" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={courseForm.control}
                            name="credits"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Credits</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} max={6} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={courseForm.control}
                          name="courseName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Algorithms and Data Structures" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={courseForm.control}
                            name="instructor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Instructor</FormLabel>
                                <FormControl>
                                  <Input placeholder="Dr. Example" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={courseForm.control}
                            name="schedule"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Schedule</FormLabel>
                                <FormControl>
                                  <Input placeholder="MWF 10:00-11:30" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={courseForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Building and Room Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={courseForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1">1 - Highest</SelectItem>
                                    <SelectItem value="2">2 - High</SelectItem>
                                    <SelectItem value="3">3 - Medium</SelectItem>
                                    <SelectItem value="4">4 - Low</SelectItem>
                                    <SelectItem value="5">5 - Lowest</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={courseForm.control}
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
                                    <SelectItem value="planned">Planned</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={courseForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any notes about this course"
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
                            onClick={() => setIsAddingCourse(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Add Course</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {currentPlan.courses.length === 0 ? (
                <div className="text-center p-6 border rounded-md bg-muted/50">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">No Courses Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add courses to your study plan to track your academic progress.
                  </p>
                  <Button variant="outline" onClick={() => setIsAddingCourse(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Course
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentPlan.courses.map((course) => (
                    <Card key={course.id} className="relative overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{course.courseName}</CardTitle>
                              <Badge variant="outline">{course.courseCode}</Badge>
                              <Badge className={getStatusColor(course.status)}>{course.status}</Badge>
                            </div>
                            <CardDescription>{course.credits} Credits</CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCourse(course.id);
                                  setIsAddingAssignment(true);
                                }}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Assignment
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Course
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{course.schedule || "No schedule set"}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{course.instructor || "No instructor set"}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{course.location || "No location set"}</span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between mb-1 text-sm">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                        {course.assignments && course.assignments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Assignments</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[300px]">Title</TableHead>
                                  <TableHead>Due Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Weight</TableHead>
                                  <TableHead>Grade</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {course.assignments.map((assignment) => (
                                  <TableRow key={assignment.id}>
                                    <TableCell className="font-medium">{assignment.title}</TableCell>
                                    <TableCell>
                                      {assignment.dueDate ? format(new Date(assignment.dueDate), "MMM d, yyyy") : "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={getStatusColor(assignment.status)}>
                                        {assignment.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{assignment.weight}%</TableCell>
                                    <TableCell>{assignment.grade || "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCourse(course.id);
                            setIsAddingAssignment(true);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Assignment
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Dialog */}
          <Dialog open={isAddingAssignment} onOpenChange={setIsAddingAssignment}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Assignment</DialogTitle>
                <DialogDescription>
                  Add an assignment or exam to your course.
                </DialogDescription>
              </DialogHeader>
              <Form {...assignmentForm}>
                <form onSubmit={assignmentForm.handleSubmit(onSubmitAssignment)} className="space-y-4">
                  <FormField
                    control={assignmentForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Assignment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description of the assignment"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={assignmentForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined;
                                  field.onChange(date);
                                }}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={assignmentForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={100} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={assignmentForm.control}
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingAssignment(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Assignment</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}