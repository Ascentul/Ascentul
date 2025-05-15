import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/useUserData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building, GraduationCap, Trophy, Languages, BookOpen, MapPin, Users, Settings } from 'lucide-react';

export default function CareerProfile() {
  const { user } = useUser();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // Sample data - in a complete implementation, these would be fetched from the API
  const profileSections = [
    { id: 'work-history', title: 'Work History', icon: <Building className="h-5 w-5" />, completed: false },
    { id: 'education', title: 'Education', icon: <GraduationCap className="h-5 w-5" />, completed: false },
    { id: 'achievements', title: 'Achievements', icon: <Trophy className="h-5 w-5" />, completed: false },
    { id: 'skills', title: 'Skills', icon: <BookOpen className="h-5 w-5" />, completed: false },
    { id: 'languages', title: 'Languages', icon: <Languages className="h-5 w-5" />, completed: false },
    { id: 'summary', title: 'Career Summary', icon: <Users className="h-5 w-5" />, completed: false },
    { id: 'location', title: 'Location Preferences', icon: <MapPin className="h-5 w-5" />, completed: false },
  ];
  
  // Calculate completion percentage
  useEffect(() => {
    const completedSections = profileSections.filter(section => section.completed).length;
    const percentage = (completedSections / profileSections.length) * 100;
    setCompletionPercentage(percentage);
  }, [profileSections]);
  
  if (!user) return <div>Loading...</div>;
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Profile Completion Progress */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Profile Completion</h2>
          <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Career Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Work History Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Work History</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <CardDescription>
              Add your professional experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder content */}
            <div className="text-center py-6 text-muted-foreground">
              <p>No work history added yet</p>
              <p className="text-sm mt-2">Add your professional experience to showcase your career progression</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Education Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Education</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <CardDescription>
              Add your educational background
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder content */}
            <div className="text-center py-6 text-muted-foreground">
              <p>No education history added yet</p>
              <p className="text-sm mt-2">Add your degrees, certifications, and educational achievements</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Skills Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Skills</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <CardDescription>
              Add your professional skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder content */}
            <div className="text-center py-6 text-muted-foreground">
              <p>No skills added yet</p>
              <p className="text-sm mt-2">Add your technical, soft, and industry-specific skills</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Languages Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Languages className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Languages</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <CardDescription>
              Add languages you speak
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder content */}
            <div className="text-center py-6 text-muted-foreground">
              <p>No languages added yet</p>
              <p className="text-sm mt-2">Add languages you speak and your proficiency level</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Achievements Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Achievements</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <CardDescription>
              Add your professional achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder content */}
            <div className="text-center py-6 text-muted-foreground">
              <p>No achievements added yet</p>
              <p className="text-sm mt-2">Add awards, recognitions, and notable accomplishments</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Career Summary Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Career Summary</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
            <CardDescription>
              Define your professional summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder content */}
            <div className="text-center py-6 text-muted-foreground">
              <p>No career summary added yet</p>
              <p className="text-sm mt-2">Add a professional summary highlighting your expertise and career focus</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Location Preferences Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Location Preferences</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
            <CardDescription>
              Set your location preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder content */}
            <div className="text-center py-6 text-muted-foreground">
              <p>No location preferences set</p>
              <p className="text-sm mt-2">Specify your preferred locations and remote work preferences</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}