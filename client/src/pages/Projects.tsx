
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project } from '@shared/schema';
import { 
  Plus, 
  FolderGit2,
  FolderKanban,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isEqual, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ProjectForm from '@/components/ProjectForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Projects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});

  const { data: projects = [], isLoading, refetch } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      return data;
    },
  });

  // Sort projects based on start date
  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project Deleted',
        description: 'The project has been deleted successfully',
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const toggleDescriptionExpand = (projectId: number) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const formatDateRange = (startDate: string, endDate?: string | null) => {
    try {
      const start = new Date(startDate);
      const startMonth = format(start, 'MMMM yyyy');

      if (!endDate) return `${startMonth} - Present`;

      const end = new Date(endDate);
      const endMonth = format(end, 'MMMM yyyy');

      // If same month and year, just display once
      if (format(start, 'MMMM yyyy') === format(end, 'MMMM yyyy')) {
        return startMonth;
      }

      return `${startMonth} - ${endMonth}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const getBadgeVariant = (projectType: string) => {
    const type = projectType.toLowerCase();
    switch (type) {
      case 'personal':
        return 'secondary';
      case 'professional':
        return 'default';
      default:
        return 'outline';
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Project Portfolio</h1>
          <p className="text-neutral-500">Showcase your professional and personal projects</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOrder('newest')}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
                Oldest First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : sortedProjects && sortedProjects.length > 0 ? (
        <div className="projects-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {sortedProjects.map((project) => (
            <Card 
              key={project.id} 
              className="flex flex-col overflow-hidden group project-card cursor-pointer animate-fadeIn opacity-0"
            >
              {/* Project Image Section */}
              <div className="relative w-full h-[200px]">
                {project.imageUrl ? (
                  <img 
                    src={project.imageUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#f4f4f4] border-b border-[#eaeaea] flex flex-col items-center justify-center">
                    <Image className="h-16 w-16 text-gray-200" />
                    <p className="text-xs text-[#888] mt-2">No image uploaded yet</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex space-x-1 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-white/90 shadow-sm backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 bg-white/90 shadow-sm backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Project Content Section */}
              <div className="flex-1 p-5">
                <h2 className="text-xl font-semibold mb-2 line-clamp-1">{project.title}</h2>
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={getBadgeVariant(project.projectType)}>
                    {capitalizeFirstLetter(project.projectType)}
                  </Badge>
                  <div className="text-sm text-neutral-500 flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span>{formatDateRange(
                      typeof project.startDate === 'string' ? project.startDate : project.startDate.toString(), 
                      project.endDate ? (typeof project.endDate === 'string' ? project.endDate : project.endDate.toString()) : null
                    )}</span>
                  </div>
                </div>

                {project.clientOrCompany && (
                  <div className="text-primary font-medium text-sm mb-3">
                    {project.clientOrCompany}
                    {project.projectUrl && (
                      <>
                        <span className="mx-2">•</span>
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-neutral-500 hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <LinkIcon className="h-3.5 w-3.5 mr-1" />
                          View Project
                        </a>
                      </>
                    )}
                  </div>
                )}

                {project.description && (
                  <div className="mb-4">
                    {project.description.length > 160 ? (
                      <>
                        <p className={`project-description text-neutral-700 text-sm leading-relaxed ${!expandedDescriptions[project.id] ? 'line-clamp-3' : ''}`}
                           style={{maxHeight: expandedDescriptions[project.id] ? '1000px' : '4.5rem'}}>
                          {project.description}
                        </p>
                        <Button
                          variant="link"
                          className="px-0 h-auto text-xs font-medium text-primary mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDescriptionExpand(project.id);
                          }}
                        >
                          {expandedDescriptions[project.id] ? (
                            <span className="flex items-center">
                              Show less <ChevronUp className="ml-1 h-3 w-3" />
                            </span>
                          ) : (
                            <span className="flex items-center">
                              Read more <ChevronDown className="ml-1 h-3 w-3" />
                            </span>
                          )}
                        </Button>
                      </>
                    ) : (
                      <p className="text-neutral-700 text-sm leading-relaxed">{project.description}</p>
                    )}
                  </div>
                )}

                {project.skillsUsed && project.skillsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.skillsUsed.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                        {skill}
                      </Badge>
                    ))}
                    {project.skillsUsed.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        +{project.skillsUsed.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="bg-[#f4f4f4] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderGit2 className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="text-2xl font-medium mb-3">You haven't added any projects yet</h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            Click below to get started showcasing your professional work, personal projects, and achievements!
          </p>
          <Button onClick={handleAddNew} size="lg" className="shadow-sm hover:shadow-md transition-all">
            <Plus className="mr-2 h-5 w-5" />
            Add First Project
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
          </DialogHeader>
          <ProjectForm 
            initialData={editingProject || undefined}
            onSubmit={async (data) => {
              try {
                const response = await fetch(
                  editingProject ? `/api/projects/${editingProject.id}` : '/api/projects',
                  {
                    method: editingProject ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  }
                );
                
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to save project');
                }
                
                const result = await response.json();
                await queryClient.invalidateQueries({ queryKey: ['projects'] });
                await refetch();
                setIsDialogOpen(false);
                
                toast({
                  title: `Project ${editingProject ? 'Updated' : 'Added'}`,
                  description: `Your project has been ${editingProject ? 'updated' : 'added'} successfully`,
                });
              } catch (error) {
                const errorMessage = error instanceof Error 
                  ? error.message 
                  : 'Unknown error occurred';
                
                toast({
                  title: 'Error',
                  description: `Failed to ${editingProject ? 'update' : 'add'} project: ${errorMessage}`,
                  variant: 'destructive',
                });
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
