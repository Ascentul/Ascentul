import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Trophy, Filter, Search, BarChart2, Award, BadgeCheck, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AchievementBadge from '@/components/AchievementBadge';
import { AchievementForm } from '@/components/achievement/AchievementForm';
import PersonalAchievementCard from '@/components/achievement/PersonalAchievementCard';
import { useUser } from '@/lib/useUserData';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserPersonalAchievement } from '@shared/schema';

// Component for Personal Achievements tab
function PersonalAchievementsTab() {
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
    if (!personalAchievements) return [];

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

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Handle achievement edit
  const handleEditClick = (achievement: UserPersonalAchievement) => {
    setSelectedAchievement(achievement);
    setEditDialogOpen(true);
  };

  return (
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
                
                {personalAchievements && personalAchievements.length > 0 && (
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
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add Personal Achievement</DialogTitle>
                    <DialogDescription>
                      Add details about your achievement to showcase your professional growth.
                    </DialogDescription>
                  </DialogHeader>
                  <AchievementForm closeDialog={() => document.querySelector('button[data-state="open"]')?.click()} />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Achievement Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
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
  );
}

export default function Achievements() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  
  // Fetch all achievements
  const { data: allAchievements, isLoading: isLoadingAll } = useQuery({
    queryKey: ['/api/achievements'],
  });
  
  // Fetch user's achievements
  const { data: userAchievements, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/achievements/user'],
  });
  
  // Fetch user's XP history
  const { data: xpHistory, isLoading: isLoadingXP } = useQuery({
    queryKey: ['/api/users/xp-history'],
  });
  
  const isLoading = isLoadingAll || isLoadingUser || isLoadingXP;
  
  // Calculate achievement stats
  const calculateStats = () => {
    if (!allAchievements || !userAchievements) {
      return {
        total: 0,
        unlocked: 0,
        percentage: 0,
        recentXP: 0,
      };
    }
    
    const total = allAchievements.length;
    const unlocked = userAchievements.length;
    const percentage = Math.round((unlocked / total) * 100) || 0;
    
    // Calculate XP from achievements in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentXP = xpHistory
      ? xpHistory
          .filter(entry => 
            entry.source === 'achievement_earned' && 
            new Date(entry.earnedAt) > thirtyDaysAgo
          )
          .reduce((sum, entry) => sum + entry.amount, 0)
      : 0;
    
    return {
      total,
      unlocked,
      percentage,
      recentXP,
    };
  };
  
  const stats = calculateStats();
  
  // Create a merged achievements list with unlock status
  const getMergedAchievements = () => {
    if (!allAchievements) return [];
    
    const unlockedIds = userAchievements ? userAchievements.map(a => a.id) : [];
    
    return allAchievements.map(achievement => {
      const unlockedAchievement = userAchievements?.find(a => a.id === achievement.id);
      return {
        ...achievement,
        unlocked: !!unlockedAchievement,
        earnedAt: unlockedAchievement?.earnedAt,
      };
    });
  };
  
  // Filter achievements based on search and status
  const getFilteredAchievements = () => {
    const merged = getMergedAchievements();
    
    return merged.filter(achievement => {
      // Apply status filter
      if (statusFilter === 'unlocked' && !achievement.unlocked) return false;
      if (statusFilter === 'locked' && achievement.unlocked) return false;
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          achievement.name.toLowerCase().includes(query) ||
          achievement.description.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Achievements</h1>
          <p className="text-neutral-500">Track your career milestones and progress</p>
        </div>
      </div>
      
      <Tabs defaultValue="personal">
        <TabsList className="mb-6">
          <TabsTrigger value="personal">Personal Achievements</TabsTrigger>
          <TabsTrigger value="badges">Achievement Badges</TabsTrigger>
          <TabsTrigger value="stats">Achievement Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
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
                <AchievementForm closeDialog={() => document.querySelector('button[data-state="open"]')?.click()} />
              </DialogContent>
            </Dialog>
          </div>

          <div>
            {/* Personal Achievements */}
            <PersonalAchievementsTab />
          </div>
        </TabsContent>
        
        <TabsContent value="badges">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Filter by Status</label>
                      <Select 
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as 'all' | 'unlocked' | 'locked')}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="All Achievements" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Achievements</SelectItem>
                          <SelectItem value="unlocked">Unlocked Only</SelectItem>
                          <SelectItem value="locked">Locked Only</SelectItem>
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
                    
                    <div className="pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Your Progress</h3>
                        <span className="text-sm font-semibold">{stats.percentage}%</span>
                      </div>
                      <Progress value={stats.percentage} className="h-2" />
                      
                      <div className="mt-4 flex justify-between text-sm text-neutral-500">
                        <span>Unlocked: {stats.unlocked}</span>
                        <span>Total: {stats.total}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : getFilteredAchievements().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredAchievements().map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      name={achievement.name}
                      description={achievement.description}
                      icon={achievement.icon}
                      xpReward={achievement.xpReward}
                      unlocked={achievement.unlocked}
                      earnedAt={achievement.earnedAt ? new Date(achievement.earnedAt) : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <Trophy className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Achievements Found</h3>
                  <p className="text-neutral-500 mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? "Try adjusting your filters or search terms"
                      : "Complete career activities to earn achievements"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <BadgeCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Achievement Progress</h3>
                    <p className="text-sm text-neutral-500">Your journey so far</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Overall Progress</span>
                      <span className="text-sm font-medium">{stats.percentage}%</span>
                    </div>
                    <Progress value={stats.percentage} className="h-2" />
                  </div>
                  
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Unlocked Achievements</span>
                      <span className="text-sm font-medium">{stats.unlocked} / {stats.total}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">XP from Achievements (30 days)</span>
                      <span className="text-sm font-medium">{stats.recentXP} XP</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Next Achievement</span>
                      <span className="text-sm font-medium">
                        {getFilteredAchievements().find(a => !a.unlocked)?.name || "All completed!"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#8bc34a]/10 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-[#8bc34a]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Recent Achievements</h3>
                    <p className="text-sm text-neutral-500">Your latest accomplishments</p>
                  </div>
                </div>
                
                {userAchievements && userAchievements.length > 0 ? (
                  <div className="space-y-3">
                    {[...userAchievements]
                      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                      .slice(0, 5)
                      .map(achievement => (
                        <div 
                          key={achievement.id}
                          className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border"
                        >
                          <div className="w-10 h-10 bg-[#8bc34a]/10 rounded-full flex items-center justify-center shrink-0">
                            {achievement.icon === 'rocket' && <Trophy className="h-5 w-5 text-[#8bc34a]" />}
                            {achievement.icon === 'bullseye' && <Award className="h-5 w-5 text-[#8bc34a]" />}
                            {achievement.icon === 'graduation-cap' && <BadgeCheck className="h-5 w-5 text-[#8bc34a]" />}
                            {!['rocket', 'bullseye', 'graduation-cap'].includes(achievement.icon) && (
                              <Award className="h-5 w-5 text-[#8bc34a]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{achievement.name}</p>
                            <p className="text-xs text-neutral-500">{achievement.description}</p>
                            <p className="text-xs text-[#8bc34a] mt-1">+{achievement.xpReward} XP</p>
                          </div>
                          <div className="text-xs text-neutral-400">
                            {new Date(achievement.earnedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
                    <p className="text-sm text-neutral-500">No achievements unlocked yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <BarChart2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Achievement Categories</h3>
                    <p className="text-sm text-neutral-500">Your progress by category</p>
                  </div>
                </div>
                
                {allAchievements && (
                  <div className="space-y-4">
                    {/* For demo purposes, using some mock categories */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Resume Building</span>
                        <span className="text-sm font-medium">
                          {userAchievements?.filter(a => a.requiredAction === 'resumes_created').length || 0} / 
                          {allAchievements.filter(a => a.requiredAction === 'resumes_created').length || 0}
                        </span>
                      </div>
                      <Progress 
                        value={
                          ((userAchievements?.filter(a => a.requiredAction === 'resumes_created').length || 0) / 
                          (allAchievements.filter(a => a.requiredAction === 'resumes_created').length || 1)) * 100
                        } 
                        className="h-2" 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Goal Setting</span>
                        <span className="text-sm font-medium">
                          {userAchievements?.filter(a => a.requiredAction.includes('goal')).length || 0} / 
                          {allAchievements.filter(a => a.requiredAction.includes('goal')).length || 0}
                        </span>
                      </div>
                      <Progress 
                        value={
                          ((userAchievements?.filter(a => a.requiredAction.includes('goal')).length || 0) / 
                          (allAchievements.filter(a => a.requiredAction.includes('goal')).length || 1)) * 100
                        } 
                        className="h-2" 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Skill Development</span>
                        <span className="text-sm font-medium">
                          {userAchievements?.filter(a => a.requiredAction.includes('skill')).length || 0} / 
                          {allAchievements.filter(a => a.requiredAction.includes('skill')).length || 0}
                        </span>
                      </div>
                      <Progress 
                        value={
                          ((userAchievements?.filter(a => a.requiredAction.includes('skill')).length || 0) / 
                          (allAchievements.filter(a => a.requiredAction.includes('skill')).length || 1)) * 100
                        } 
                        className="h-2" 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Job Applications</span>
                        <span className="text-sm font-medium">
                          {userAchievements?.filter(a => a.requiredAction.includes('job')).length || 0} / 
                          {allAchievements.filter(a => a.requiredAction.includes('job')).length || 0}
                        </span>
                      </div>
                      <Progress 
                        value={
                          ((userAchievements?.filter(a => a.requiredAction.includes('job')).length || 0) / 
                          (allAchievements.filter(a => a.requiredAction.includes('job')).length || 1)) * 100
                        } 
                        className="h-2" 
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
