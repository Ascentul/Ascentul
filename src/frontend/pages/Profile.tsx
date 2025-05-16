import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/utils/schema";
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
  Calendar,
  Edit,
  Plus,
  Trash2,
  Download,
  Share
} from "lucide-react";

// This is a demo component to show what a profile page might look like
export default function Profile() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("about");
  const [isEditing, setIsEditing] = useState(false);
  
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
  
  // Handle UI interactions
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleConnect = () => {
    alert("Connection request sent!");
  };
  
  const handleAddExperience = () => {
    alert("Experience form would open here");
  };
  
  const handleAddEducation = () => {
    alert("Education form would open here");
  };
  
  const handleAddSkill = () => {
    alert("Skill form would open here");
  };
  
  const handleEditItem = (itemType: string, id: number) => {
    alert(`Editing ${itemType} with ID: ${id}`);
  };
  
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
          <Button variant="outline" size="sm" onClick={handleEditToggle}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button size="sm" onClick={handleConnect}>
            <Plus className="h-4 w-4 mr-2" />
            Connect
          </Button>
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
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
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
                <Button variant="outline" size="icon" onClick={() => window.open('mailto:user@example.com')}>
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open('https://linkedin.com', '_blank')}>
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open('https://github.com', '_blank')}>
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open('https://twitter.com', '_blank')}>
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open('https://example.com', '_blank')}>
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
                <Button variant="ghost" size="sm" onClick={handleAddExperience}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditItem("experience", 1)}>
                          <span className="sr-only">Edit</span>
                          <Edit className="h-4 w-4" />
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditItem("experience", 2)}>
                          <span className="sr-only">Edit</span>
                          <Edit className="h-4 w-4" />
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
                <Button variant="ghost" size="sm" onClick={handleAddEducation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditItem("education", 1)}>
                          <span className="sr-only">Edit</span>
                          <Edit className="h-4 w-4" />
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditItem("certification", 1)}>
                          <span className="sr-only">Edit</span>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Amazon Web Services</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Issued Jan 2022 · Expires Jan 2025</span>
                    </div>
                    <p className="mt-2 text-sm">
                      Professional certification for designing distributed systems on AWS platform.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Skills & Endorsements</span>
                <Button variant="ghost" size="sm" onClick={handleAddSkill}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Technical Skills</h3>
                  <div className="space-y-4">
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">JavaScript</span>
                        <span className="text-xs text-muted-foreground">32 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">React</span>
                        <span className="text-xs text-muted-foreground">28 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Node.js</span>
                        <span className="text-xs text-muted-foreground">24 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Soft Skills</h3>
                  <div className="space-y-4">
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Team Leadership</span>
                        <span className="text-xs text-muted-foreground">18 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Problem Solving</span>
                        <span className="text-xs text-muted-foreground">22 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '82%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Career Achievements</CardTitle>
              <CardDescription>
                Unlock achievements as you progress in your career journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Achievement Item */}
                <Card className="border-primary/10 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-primary/50"></div>
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Resume Master</h3>
                    <p className="text-sm text-muted-foreground">Created 5 different resumes tailored to specific job postings.</p>
                    <div className="mt-2 text-xs text-primary">+100 XP</div>
                    <Badge className="mt-4" variant="outline">Unlocked May 20, 2024</Badge>
                  </CardContent>
                </Card>
                
                {/* Achievement Item */}
                <Card className="border-primary/10 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-primary/50"></div>
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Goal Achiever</h3>
                    <p className="text-sm text-muted-foreground">Completed 10 career goals ahead of schedule.</p>
                    <div className="mt-2 text-xs text-primary">+150 XP</div>
                    <Badge className="mt-4" variant="outline">Unlocked Jun 12, 2024</Badge>
                  </CardContent>
                </Card>
                
                {/* Achievement Item - Locked */}
                <Card className="border-gray-200 overflow-hidden opacity-60">
                  <div className="h-2 bg-gray-200"></div>
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Award className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="font-medium">Interview Expert</h3>
                    <p className="text-sm text-muted-foreground">Complete 20 practice interviews with high confidence ratings.</p>
                    <div className="mt-2 text-xs text-gray-400">+200 XP</div>
                    <Badge className="mt-4" variant="outline">Locked</Badge>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8">
                <h3 className="font-medium mb-4">XP Progression</h3>
                <div className="h-2 bg-gray-100 rounded-full mb-2">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '68%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Level {user.level}</span>
                  <span>{user.xp} / 1000 XP</span>
                  <span>Level {user.level + 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Resume / Documents Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Your Documents</span>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </CardTitle>
          <CardDescription>Quick access to your resumes and cover letters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Software Developer Resume</CardTitle>
                <CardDescription>Last updated: March 15, 2024</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">Tailored for front-end development positions</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">ATS Optimized</Badge>
                  <Badge variant="outline" className="text-xs">Modern Template</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => alert("Downloading...")}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alert("Editing...")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tech Lead Cover Letter</CardTitle>
                <CardDescription>Last updated: February 8, 2024</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">Emphasizes leadership and architectural experience</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">Professional</Badge>
                  <Badge variant="outline" className="text-xs">Leadership Focus</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => alert("Downloading...")}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alert("Editing...")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}