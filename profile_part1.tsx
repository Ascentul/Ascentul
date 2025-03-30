import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useUser } from "@/lib/useUserData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User as UserIcon, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Globe, 
  Mail, 
  Github, 
  Linkedin,
  Twitter,
  MapPin,
  Building,
  Star,
  Clock,
  Calendar
} from "lucide-react";

// This is a demo component to show what a profile page might look like
export default function Profile() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("about");
  
  // Placeholder for user statistics
  const { data: statistics } = useQuery({ 
    queryKey: ['/api/users/statistics'],
    enabled: !!user
  });
  
  // Placeholder for XP history
  const { data: xpHistory } = useQuery({ 
    queryKey: ['/api/users/xp-history'],
    enabled: !!user
  });
  
  // Placeholder for achievements
  const { data: achievements } = useQuery({ 
    queryKey: ['/api/achievements/user'],
    enabled: !!user
  });
  
  // Placeholder for work history
  const { data: workHistory } = useQuery({ 
    queryKey: ['/api/work-history'],
    enabled: !!user
  });
  
  // Placeholder profile completeness
  const profileCompleteness = 85;
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p>Please log in to view your profile</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Cover Photo & Profile Header */}
      <div className="relative mb-24">
        <div className="h-48 w-full bg-gradient-to-r from-primary/30 to-primary rounded-t-lg"></div>
        <div className="absolute -bottom-16 left-8 flex gap-4 items-end">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarFallback className="text-4xl bg-primary/20">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="mb-4">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">Senior Software Engineer</p>
          </div>
        </div>
        <div className="absolute bottom-4 right-8 flex gap-2">
          <Button variant="outline" size="sm">Edit Profile</Button>
          <Button size="sm">Connect</Button>
        </div>
      </div>
      
      {/* Profile Meta Information */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Seattle, WA</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>Technology</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>5+ years experience</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">
            Open to Work
          </Badge>
          <Badge className="bg-primary/20 hover:bg-primary/30 text-primary">
            Level {user.level}
          </Badge>
          <Badge variant="outline">
            {user.rank}
          </Badge>
        </div>
      </div>
      
      {/* Profile Completion */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Profile Completeness</p>
            <span className="text-sm font-medium">{profileCompleteness}%</span>
          </div>
          <Progress value={profileCompleteness} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Complete your profile to attract more opportunities
          </p>
        </CardContent>
      </Card>
      
      {/* Main Tabs */}
      <Tabs defaultValue="about" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="about">
            <UserIcon className="mr-2 h-4 w-4" />
            About
          </TabsTrigger>
          <TabsTrigger value="experience">
            <Briefcase className="mr-2 h-4 w-4" />
            Experience
          </TabsTrigger>
          <TabsTrigger value="education">
            <GraduationCap className="mr-2 h-4 w-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Star className="mr-2 h-4 w-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="mr-2 h-4 w-4" />
            Achievements
          </TabsTrigger>
        </TabsList>
        
        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>About Me</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Full-stack developer with 5+ years of experience building scalable web applications.
                Passionate about clean code, user experience, and continuous learning. Currently focused
                on React, Node.js, and cloud infrastructure.
              </p>
              
              <h3 className="text-sm font-medium mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline">English (Native)</Badge>
                <Badge variant="outline">Spanish (Intermediate)</Badge>
                <Badge variant="outline">Japanese (Beginner)</Badge>
              </div>
              
              <h3 className="text-sm font-medium mb-2">Top Skills</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge>JavaScript</Badge>
                <Badge>React</Badge>
                <Badge>Node.js</Badge>
                <Badge>TypeScript</Badge>
                <Badge>CSS/SCSS</Badge>
              </div>
              
              <h3 className="text-sm font-medium mb-2">Connect</h3>
              <div className="flex gap-3">
                <Button variant="outline" size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Globe className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Experience Tab */}
        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Work Experience</span>
                <Button variant="ghost" size="sm">Add Experience</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Work History Item */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">Senior Software Engineer</h3>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <span className="sr-only">Edit</span>
                          <pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Tech Company Inc.</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Jan 2021 - Present</span>
                      <Badge variant="outline" className="text-xs">Current</Badge>
                    </div>
                    <p className="mt-2 text-sm">
                      Led development of the company's flagship product, managing a team of 5 developers.
                      Implemented new features that increased user engagement by 45%.
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">React</Badge>
                      <Badge variant="outline" className="text-xs">Node.js</Badge>
                      <Badge variant="outline" className="text-xs">AWS</Badge>
                      <Badge variant="outline" className="text-xs">Team Leadership</Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Work History Item */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">Software Developer</h3>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <span className="sr-only">Edit</span>
                          <pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Startup XYZ</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Jun 2018 - Dec 2020</span>
                    </div>
                    <p className="mt-2 text-sm">
                      Built and maintained the company's web application. Improved application performance
                      by 60% through code optimization and architecture improvements.
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">JavaScript</Badge>
                      <Badge variant="outline" className="text-xs">Vue.js</Badge>
                      <Badge variant="outline" className="text-xs">Express</Badge>
                      <Badge variant="outline" className="text-xs">MongoDB</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Education Tab */}
        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Education</span>
                <Button variant="ghost" size="sm">Add Education</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Education Item */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">Bachelor of Science in Computer Science</h3>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <span className="sr-only">Edit</span>
                          <pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">University of Washington</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>2014 - 2018</span>
                    </div>
                    <p className="mt-2 text-sm">
                      Graduated with honors. Focused on software engineering and artificial intelligence.
                      Senior project: Developed a machine learning model for predicting traffic patterns.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Certification Item */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">AWS Certified Solutions Architect</h3>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <span className="sr-only">Edit</span>
                          <pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Amazon Web Services</p>
