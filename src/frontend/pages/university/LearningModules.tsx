import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Book,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Search,
  ArrowUpRight,
  Star,
  StarHalf,
  Filter,
  Users,
  BarChart,
  BookText,
  PlayCircle,
  FileText,
  ClipboardEdit,
  CheckCircle,
  Video,
  PanelLeft,
  Sparkles,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

// Categories UI
const categories = [
  { id: "all", label: "All Categories", icon: <BookOpen className="h-4 w-4" /> },
  { id: "career", label: "Career Development", icon: <GraduationCap className="h-4 w-4" /> },
  { id: "interview", label: "Interview Skills", icon: <Users className="h-4 w-4" /> },
  { id: "resume", label: "Resume Building", icon: <FileText className="h-4 w-4" /> },
  { id: "networking", label: "Networking", icon: <Users className="h-4 w-4" /> },
  { id: "job-search", label: "Job Search", icon: <Search className="h-4 w-4" /> },
];

export default function LearningModules() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModule, setActiveModule] = useState<number | null>(null);

  // Fetch all learning modules
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/university/learning-modules/all"],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          title: "Career Planning Fundamentals",
          description: "Learn the essentials of planning your career path and setting professional goals.",
          category: "career",
          level: "beginner",
          estimatedHours: 4,
          published: true,
          enrollments: 1243,
          rating: 4.7,
          instructor: "Dr. Sarah Johnson",
          thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNhcmVlcnxlbnwwfHwwfHx8MA%3D%3D",
          progress: 0,
          units: [
            {
              id: 101,
              title: "Introduction to Career Planning",
              description: "Understand why career planning is important and how to approach it strategically.",
              orderIndex: 0,
              estimatedMinutes: 30,
              type: "video",
              completed: false,
            },
            {
              id: 102,
              title: "Self-Assessment Techniques",
              description: "Tools and methods to evaluate your skills, interests, and values.",
              orderIndex: 1,
              estimatedMinutes: 45,
              type: "interactive",
              completed: false,
            },
            {
              id: 103,
              title: "Setting SMART Career Goals",
              description: "Learn to create Specific, Measurable, Achievable, Relevant, and Time-bound career goals.",
              orderIndex: 2,
              estimatedMinutes: 60,
              type: "article",
              completed: false,
            },
            {
              id: 104,
              title: "Creating Your 5-Year Plan",
              description: "Step-by-step guide to mapping out your career trajectory.",
              orderIndex: 3,
              estimatedMinutes: 90,
              type: "exercise",
              completed: false,
            },
          ],
        },
        {
          id: 2,
          title: "Mastering Technical Interviews",
          description: "Comprehensive preparation for technical interviews in STEM fields.",
          category: "interview",
          level: "intermediate",
          estimatedHours: 8,
          published: true,
          enrollments: 876,
          rating: 4.9,
          instructor: "Prof. Alan Turing",
          thumbnail: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8am9iJTIwaW50ZXJ2aWV3fGVufDB8fDB8fHww",
          progress: 35,
          units: [
            {
              id: 201,
              title: "Understanding Technical Interviews",
              description: "Overview of what to expect in technical interviews across different industries.",
              orderIndex: 0,
              estimatedMinutes: 45,
              type: "video",
              completed: true,
            },
            {
              id: 202,
              title: "Problem-Solving Strategies",
              description: "Effective approaches to tackle technical problems under pressure.",
              orderIndex: 1,
              estimatedMinutes: 90,
              type: "interactive",
              completed: true,
            },
            {
              id: 203,
              title: "Data Structures & Algorithms Review",
              description: "Quick review of essential concepts frequently tested in technical interviews.",
              orderIndex: 2,
              estimatedMinutes: 120,
              type: "article",
              completed: false,
            },
            {
              id: 204,
              title: "Mock Interview Practice",
              description: "Realistic interview simulations with feedback.",
              orderIndex: 3,
              estimatedMinutes: 120,
              type: "exercise",
              completed: false,
            },
            {
              id: 205,
              title: "System Design Interview Basics",
              description: "Introduction to system design concepts and interview approaches.",
              orderIndex: 4,
              estimatedMinutes: 105,
              type: "video",
              completed: false,
            },
          ],
        },
        {
          id: 3,
          title: "Strategic Resume Building",
          description: "Create compelling resumes that showcase your skills and experience effectively.",
          category: "resume",
          level: "beginner",
          estimatedHours: 3,
          published: true,
          enrollments: 1576,
          rating: 4.8,
          instructor: "Dr. Emily Parker",
          thumbnail: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cmVzdW1lfGVufDB8fDB8fHww",
          progress: 100,
          units: [
            {
              id: 301,
              title: "Resume Fundamentals",
              description: "Understanding the purpose and structure of an effective resume.",
              orderIndex: 0,
              estimatedMinutes: 40,
              type: "video",
              completed: true,
            },
            {
              id: 302,
              title: "Tailoring Your Resume",
              description: "How to customize your resume for specific job applications.",
              orderIndex: 1,
              estimatedMinutes: 55,
              type: "article",
              completed: true,
            },
            {
              id: 303,
              title: "Showcasing Achievements",
              description: "Techniques to highlight your accomplishments with impact statements.",
              orderIndex: 2,
              estimatedMinutes: 50,
              type: "interactive",
              completed: true,
            },
            {
              id: 304,
              title: "Resume Workshop",
              description: "Hands-on exercise to build or improve your current resume.",
              orderIndex: 3,
              estimatedMinutes: 90,
              type: "exercise",
              completed: true,
            },
          ],
        },
        {
          id: 4,
          title: "Networking for Career Success",
          description: "Build and leverage professional relationships to advance your career.",
          category: "networking",
          level: "intermediate",
          estimatedHours: 5,
          published: true,
          enrollments: 932,
          rating: 4.6,
          instructor: "Prof. Natalie Lin",
          thumbnail: "https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmV0d29ya2luZ3xlbnwwfHwwfHx8MA%3D%3D",
          progress: 60,
          units: [
            {
              id: 401,
              title: "The Power of Professional Networks",
              description: "Understanding the importance of networking for career development.",
              orderIndex: 0,
              estimatedMinutes: 35,
              type: "video",
              completed: true,
            },
            {
              id: 402,
              title: "Building Your Network",
              description: "Strategies for creating meaningful professional connections.",
              orderIndex: 1,
              estimatedMinutes: 65,
              type: "article",
              completed: true,
            },
            {
              id: 403,
              title: "Digital Networking Tools",
              description: "Leveraging LinkedIn and other platforms for professional growth.",
              orderIndex: 2,
              estimatedMinutes: 70,
              type: "interactive",
              completed: true,
            },
            {
              id: 404,
              title: "Networking Events Strategy",
              description: "How to approach and make the most of professional gatherings.",
              orderIndex: 3,
              estimatedMinutes: 50,
              type: "video",
              completed: false,
            },
            {
              id: 405,
              title: "Maintaining Professional Relationships",
              description: "Long-term strategies for nurturing your network.",
              orderIndex: 4,
              estimatedMinutes: 45,
              type: "article",
              completed: false,
            },
            {
              id: 406,
              title: "Networking Plan Development",
              description: "Create your personalized networking strategy.",
              orderIndex: 5,
              estimatedMinutes: 75,
              type: "exercise",
              completed: false,
            },
          ],
        },
        {
          id: 5,
          title: "Effective Job Search Strategies",
          description: "Navigate the job market with proven techniques to find and secure opportunities.",
          category: "job-search",
          level: "beginner",
          estimatedHours: 6,
          published: true,
          enrollments: 1129,
          rating: 4.5,
          instructor: "Dr. Marcus Chen",
          thumbnail: "https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8am9iJTIwc2VhcmNofGVufDB8fDB8fHww",
          progress: 0,
          units: [
            {
              id: 501,
              title: "Job Market Research Techniques",
              description: "How to research industries, companies, and positions effectively.",
              orderIndex: 0,
              estimatedMinutes: 60,
              type: "video",
              completed: false,
            },
            {
              id: 502,
              title: "Optimizing Your Job Search",
              description: "Tools and platforms to streamline your search process.",
              orderIndex: 1,
              estimatedMinutes: 45,
              type: "article",
              completed: false,
            },
            {
              id: 503,
              title: "Application Tracking Systems",
              description: "Understanding and navigating ATS to improve application success.",
              orderIndex: 2,
              estimatedMinutes: 50,
              type: "interactive",
              completed: false,
            },
            {
              id: 504,
              title: "Hidden Job Market Access",
              description: "Strategies to uncover unadvertised job opportunities.",
              orderIndex: 3,
              estimatedMinutes: 55,
              type: "article",
              completed: false,
            },
            {
              id: 505,
              title: "Job Search Organization",
              description: "Systems to track and manage your job search process.",
              orderIndex: 4,
              estimatedMinutes: 40,
              type: "interactive",
              completed: false,
            },
            {
              id: 506,
              title: "Creating Your Job Search Plan",
              description: "Develop a comprehensive strategy for your current job search.",
              orderIndex: 5,
              estimatedMinutes: 80,
              type: "exercise",
              completed: false,
            },
          ],
        },
      ];
    },
  });

  // Fetch user's enrolled modules
  const { data: enrolledModules, isLoading: enrolledLoading } = useQuery({
    queryKey: ["/api/university/learning-modules/enrolled"],
    queryFn: async () => {
      // Mock data for now - in real implementation, this would fetch only user's enrolled modules
      // For demo, we'll mark some as enrolled
      return [2, 3, 4]; // These are IDs of enrolled modules
    },
  });

  // Helper function for rendering stars based on rating
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return <div className="flex">{stars}</div>;
  };

  // Get unit type icon
  const getUnitTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "interactive":
        return <Sparkles className="h-4 w-4" />;
      case "article":
        return <FileText className="h-4 w-4" />;
      case "exercise":
        return <ClipboardEdit className="h-4 w-4" />;
      default:
        return <BookText className="h-4 w-4" />;
    }
  };

  // Filter modules based on category and search query
  const filteredModules = modules?.filter((module) => {
    const matchesCategory = selectedCategory === "all" || module.category === selectedCategory;
    const matchesSearch = 
      searchQuery === "" || 
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get active module details
  const currentModule = modules?.find((m) => m.id === activeModule);

  // Loading state
  if (modulesLoading || enrolledLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Learning Library</h1>
          <p className="text-muted-foreground">
            Browse and enroll in career development modules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">My Learning</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {}}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  In Progress ({
                    modules?.filter(m => enrolledModules?.includes(m.id) && m.progress > 0 && m.progress < 100).length || 0
                  })
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {}}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed ({
                    modules?.filter(m => enrolledModules?.includes(m.id) && m.progress === 100).length || 0
                  })
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {}}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Bookmarked
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div>
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search modules..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Module view or grid */}
          <div>
            {activeModule ? (
              // Active module view
              <Card className="mb-6">
                <CardHeader>
                  <Button 
                    variant="ghost" 
                    className="w-fit -ml-2 mb-2" 
                    onClick={() => setActiveModule(null)}
                  >
                    <PanelLeft className="mr-2 h-4 w-4" />
                    Back to modules
                  </Button>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{currentModule?.title}</CardTitle>
                    <CardDescription>{currentModule?.description}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">
                      <BookOpen className="mr-1 h-3 w-3" />
                      {currentModule?.category ? (currentModule.category.charAt(0).toUpperCase() + currentModule.category.slice(1)) : ''}
                    </Badge>
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {currentModule?.level ? (currentModule.level.charAt(0).toUpperCase() + currentModule.level.slice(1)) : ''}
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      {currentModule?.estimatedHours} hours
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
                    <div className="space-y-4">
                      <div className="relative w-full rounded-md overflow-hidden aspect-video bg-muted">
                        {currentModule?.thumbnail && (
                          <img 
                            src={currentModule.thumbnail} 
                            alt={currentModule.title}
                            className="object-cover w-full h-full"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Button size="lg" className="rounded-full w-16 h-16">
                            <PlayCircle className="h-10 w-10" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-medium">Module Content</h3>
                        <div className="space-y-2">
                          {currentModule?.units?.map((unit) => (
                            <Card key={unit.id} className={`${unit.completed ? 'bg-muted/50' : ''}`}>
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-md ${unit.completed ? 'bg-green-100' : 'bg-muted'}`}>
                                    {unit.completed ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                      getUnitTypeIcon(unit.type)
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{unit.title}</h4>
                                    <p className="text-sm text-muted-foreground">{unit.description}</p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                      <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {unit.estimatedMinutes} min
                                      </span>
                                      <span className="flex items-center capitalize">
                                        {getUnitTypeIcon(unit.type)}
                                        <span className="ml-1">{unit.type}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon">
                                  <ChevronRight className="h-5 w-5" />
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">About This Module</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Instructor</h4>
                            <p className="text-sm">{currentModule?.instructor}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Rating</h4>
                            <div className="flex items-center gap-2">
                              {renderRating(currentModule?.rating || 0)}
                              <span className="text-sm">({currentModule?.rating})</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Enrolled Students</h4>
                            <p className="text-sm">{currentModule?.enrollments?.toLocaleString() || 0}</p>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="text-sm font-medium mb-3">Your Progress</h4>
                            <div className="mb-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Completion</span>
                                <span>{currentModule?.progress}%</span>
                              </div>
                              <Progress value={currentModule?.progress} className="h-2" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {currentModule?.units?.filter(u => u.completed).length || 0} of {currentModule?.units?.length || 0} units completed
                            </p>
                          </div>

                          {currentModule?.progress === 0 ? (
                            <Button className="w-full">Start Learning</Button>
                          ) : currentModule?.progress === 100 ? (
                            <Button className="w-full" variant="outline">Review Again</Button>
                          ) : (
                            <Button className="w-full">Continue Learning</Button>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Module grid
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredModules?.map((module) => (
                    <Card 
                      key={module.id} 
                      className="overflow-hidden flex flex-col"
                      onClick={() => setActiveModule(module.id)}
                    >
                      <div className="relative w-full aspect-video bg-muted">
                        {module.thumbnail && (
                          <img 
                            src={module.thumbnail} 
                            alt={module.title}
                            className="object-cover w-full h-full"
                          />
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <Badge variant="secondary" className="bg-white/80 hover:bg-white/80">
                            {module.level?.charAt(0).toUpperCase() + module.level?.slice(1)}
                          </Badge>
                          {enrolledModules?.includes(module.id) && (
                            <Badge variant="secondary" className="bg-primary/80 text-white hover:bg-primary/80">
                              Enrolled
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {module.category?.charAt(0).toUpperCase() + module.category?.slice(1).replace('-', ' ')}
                          </Badge>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{module.estimatedHours} hours</span>
                          </div>
                        </div>
                        <CardTitle className="line-clamp-1 mt-2">{module.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{module.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {renderRating(module.rating)}
                            <span className="text-xs ml-1">({module.rating})</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {module.enrollments?.toLocaleString() || 0} students
                          </div>
                        </div>
                        {enrolledModules?.includes(module.id) && module.progress > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{module.progress}%</span>
                            </div>
                            <Progress value={module.progress} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0">
                        {enrolledModules?.includes(module.id) ? (
                          module.progress === 0 ? (
                            <Button className="w-full">Start Learning</Button>
                          ) : module.progress === 100 ? (
                            <Button variant="outline" className="w-full">Completed</Button>
                          ) : (
                            <Button className="w-full">Continue Learning</Button>
                          )
                        ) : (
                          <Button variant="outline" className="w-full">Enroll Now</Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {/* No results message */}
                {filteredModules?.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No modules found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}