import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Search, Award, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AchievementForm } from '@/components/achievement/AchievementForm';
import PersonalAchievementCard from '@/components/achievement/PersonalAchievementCard';
import { useUser } from '@/lib/useUserData';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserPersonalAchievement } from '@shared/schema';

export default function Achievements() {
  const { user } = useUser();
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<UserPersonalAchievement | null>(null);
  
  // Fetch personal achievements
  const { data: personalAchievements, isLoading } = useQuery({
    queryKey: ['/api/personal-achievements'],
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/personal-achievements/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      // Refresh achievements list
      queryClient.invalidateQueries({ queryKey: ['/api/personal-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
      
      toast({
        title: "Achievement deleted",
        description: "Your achievement has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting achievement:", error);
      toast({
        title: "Error",
        description: "Failed to delete the achievement. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle category filter
  const filteredAchievements = React.useMemo(() => {
    if (!personalAchievements || !Array.isArray(personalAchievements)) return [];

    return personalAchievements.filter((achievement: UserPersonalAchievement) => {
      // Apply category filter
      if (categoryFilter !== 'all' && achievement.category !== categoryFilter) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          achievement.title.toLowerCase().includes(query) ||
          (achievement.description && achievement.description.toLowerCase().includes(query)) ||
          (achievement.issuingOrganization && achievement.issuingOrganization.toLowerCase().includes(query)) ||
          (achievement.skills && achievement.skills.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [personalAchievements, categoryFilter, searchQuery]);

  // Handle achievement deletion with confirmation
  const handleDeleteClick = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Refs for dialog close buttons
  const addDialogCloseRef = useRef<HTMLButtonElement>(null);
  const emptyStateDialogCloseRef = useRef<HTMLButtonElement>(null);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Handle achievement edit
  const handleEditClick = (achievement: UserPersonalAchievement) => {
    setSelectedAchievement(achievement);
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Achievements</h1>
          <p className="text-neutral-500">Track your career milestones and progress</p>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Personal Achievements</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Achievement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Personal Achievement</DialogTitle>
                <DialogDescription>
                  Add details about your achievement to showcase your professional growth.
                </DialogDescription>
              </DialogHeader>
              <AchievementForm 
                closeDialog={() => {
                  const closeButton = document.querySelector('[data-state="open"]') as HTMLButtonElement;
                  if (closeButton) closeButton.click();
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Filter by Category</label>
                      <Select 
                        value={categoryFilter}
                        onValueChange={setCategoryFilter}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="certification">Certification</SelectItem>
                          <SelectItem value="award">Award</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Search Achievements</label>
                      <div className="relative mt-1">
                        <Input
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      </div>
                    </div>
                    
                    {personalAchievements && Array.isArray(personalAchievements) && personalAchievements.length > 0 && (
                      <div className="pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium">Total Achievements</h3>
                          <span className="text-sm font-semibold">{personalAchievements.length}</span>
                        </div>
                        
                        <div className="pt-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Professional</span>
                            <span>{personalAchievements.filter((a: UserPersonalAchievement) => a.category === 'professional').length}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-neutral-500">Academic</span>
                            <span>{personalAchievements.filter((a: UserPersonalAchievement) => a.category === 'academic').length}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-neutral-500">Personal</span>
                            <span>{personalAchievements.filter((a: UserPersonalAchievement) => a.category === 'personal').length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredAchievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAchievements.map((achievement: UserPersonalAchievement) => (
                    <PersonalAchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <Award className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Personal Achievements Found</h3>
                  <p className="text-neutral-500 mb-6">
                    {searchQuery || categoryFilter !== 'all'
                      ? "Try adjusting your filters or search terms"
                      : "Add your first achievement to track your career milestones"}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Your First Achievement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[650px] md:max-w-[700px]">
                      <DialogHeader>
                        <DialogTitle>Add Personal Achievement</DialogTitle>
                        <DialogDescription>
                          Add details about your achievement to showcase your professional growth.
                        </DialogDescription>
                      </DialogHeader>
                      <AchievementForm 
                        closeDialog={() => {
                          const closeButton = document.querySelector('[data-state="open"]') as HTMLButtonElement;
                          if (closeButton) closeButton.click();
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
          
          {/* Edit Achievement Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[650px] md:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Edit Personal Achievement</DialogTitle>
                <DialogDescription>
                  Update the details of your achievement.
                </DialogDescription>
              </DialogHeader>
              {selectedAchievement && (
                <AchievementForm 
                  achievementId={selectedAchievement.id}
                  defaultValues={selectedAchievement}
                  closeDialog={() => setEditDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}