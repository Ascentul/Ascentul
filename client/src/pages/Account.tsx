import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';

// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  User, CreditCard, ShieldCheck, Edit, Building, GraduationCap, Trophy, 
  BookOpen, Award, Languages, MapPin, Settings, CheckCircle
} from 'lucide-react';
import { z } from 'zod';

export default function Account() {
  const { user } = useUser();
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Get the active tab from URL query parameter
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    return tabParam === 'career' || tabParam === 'subscription' || tabParam === 'security'
      ? tabParam
      : 'profile';
  });
  
  // Listen for URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    
    if (tabParam === 'career' || tabParam === 'subscription' || tabParam === 'security') {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // Handle section editing for career profile sections
  const handleEditSection = (sectionId: string) => {
    toast({
      title: "Edit Section",
      description: `Editing ${sectionId} section. This feature is coming soon.`,
      variant: "default",
    });
  };
  
  // Profile completion data
  const profileSections = [
    { id: 'basic-info', title: 'Basic Information', completed: true },
    { id: 'work-history', title: 'Work History', completed: false },
    { id: 'education', title: 'Education', completed: false },
    { id: 'skills', title: 'Skills', completed: false },
    { id: 'certifications', title: 'Certifications', completed: false },
    { id: 'languages', title: 'Languages', completed: false },
    { id: 'career-summary', title: 'Career Summary', completed: false },
    { id: 'location-preferences', title: 'Location Preferences', completed: false },
  ];
  
  const completionPercentage = (profileSections.filter(s => s.completed).length / profileSections.length) * 100;

  if (!user) return null;

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="career" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            Career
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                <p>{user.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                <p>{user.email}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Username</h3>
                <p>{user.username}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Account Created</h3>
                <p>March 15, 2025</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">User Type</h3>
                <p className="capitalize">{user.userType ? user.userType.replace('_', ' ') : 'Standard'}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Completion Tracker */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Complete your career profile to maximize your opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {Math.round(completionPercentage)}% Complete
                </span>
                <span className="text-sm text-muted-foreground">
                  {profileSections.filter(section => section.completed).length}/{profileSections.length} Sections
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2 mb-4" />
            </CardContent>
          </Card>
          
          {/* Work History Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Work History</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('work-history')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your professional experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No work history added yet</p>
                <p className="text-sm mt-2">Add your professional experience to showcase your career progression</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Education Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Education</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('education')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your educational background</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No education history added yet</p>
                <p className="text-sm mt-2">Add your degrees, certifications, and educational achievements</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Skills Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Skills</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('skills')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your professional skills and expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No skills added yet</p>
                <p className="text-sm mt-2">Add your technical and soft skills to showcase your expertise</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Certifications Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Certifications</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('certifications')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your professional certifications and credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No certifications added yet</p>
                <p className="text-sm mt-2">Add your professional certifications and credentials</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Languages Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Languages className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Languages</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('languages')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Languages you speak</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No languages added yet</p>
                <p className="text-sm mt-2">Add languages you speak and your proficiency level</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Career Summary Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Career Summary</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('career-summary')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>A brief overview of your professional experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No career summary added yet</p>
                <p className="text-sm mt-2">Add a brief overview of your career and professional aspirations</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Location Preferences Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Location Preferences</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('location-preferences')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your geographical preferences for work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No location preferences added yet</p>
                <p className="text-sm mt-2">Add your preferred work locations and remote work preferences</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your subscription plan details</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This section is coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="career" className="space-y-6">
          {/* Profile Completion Tracker */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Career Profile</CardTitle>
              <CardDescription>Complete your career profile to maximize your opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {Math.round(completionPercentage)}% Complete
                </span>
                <span className="text-sm text-muted-foreground">
                  {profileSections.filter(section => section.completed).length}/{profileSections.length} Sections
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2 mb-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {profileSections.map((section) => (
                  <Card key={section.id} className={`border ${section.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        {section.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleEditSection(section.id)}>
                            <Edit className="h-4 w-4 mr-1" /> Add
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This section is coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}