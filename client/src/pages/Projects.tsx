
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project } from '@shared/schema';
import { 
  Plus, 
  FolderGit2,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ProjectForm from '@/components/ProjectForm';

export default function Projects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
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

  const formatDateRange = (startDate: string, endDate?: string | null) => {
    const start = format(new Date(startDate), 'MMM yyyy');
    if (!endDate) return `${start} - Present`;
    return `${start} - ${format(new Date(endDate), 'MMM yyyy')}`;
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Project Portfolio</h1>
          <p className="text-neutral-500">Showcase your professional and personal projects</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={handleAddNew}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-6">
          {projects.map((project) => (
            <Card key={project.id} className="p-6 relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <FolderGit2 className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{project.title}</h2>
                    <div className="flex items-center space-x-2 mt-1 md:mt-0">
                      <Badge variant="outline">{project.projectType}</Badge>
                      <div className="text-sm text-neutral-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateRange(project.startDate, project.endDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-primary font-medium mb-4">
                    <span>{project.clientOrCompany}</span>
                    {project.projectUrl && (
                      <>
                        <span className="mx-2">•</span>
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-neutral-500 hover:text-primary"
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          View Project
                        </a>
                      </>
                    )}
                  </div>

                  {project.description && (
                    <div className="mb-4">
                      <p className="text-neutral-700">{project.description}</p>
                    </div>
                  )}

                  {project.skillsUsed && project.skillsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.skillsUsed.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <FolderGit2 className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Projects Added</h3>
          <p className="text-neutral-500 mb-4">
            Showcase your work by adding your first project
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
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
            project={editingProject} 
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
                
                if (!response.ok) throw new Error('Failed to save project');
                
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                setIsDialogOpen(false);
                toast({
                  title: `Project ${editingProject ? 'Updated' : 'Added'}`,
                  description: `Your project has been ${editingProject ? 'updated' : 'added'} successfully`,
                });
              } catch (error) {
                toast({
                  title: 'Error',
                  description: `Failed to ${editingProject ? 'update' : 'add'} project: ${error.message}`,
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
