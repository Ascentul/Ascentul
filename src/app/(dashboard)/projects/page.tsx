'use client'

<<<<<<< HEAD
import React, { useState, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ExternalLink, Github, Loader2, Calendar, Building } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
=======
import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, ExternalLink, Github, Calendar, User } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

interface Project {
  _id: string
  title: string
<<<<<<< HEAD
=======
  description?: string
  technologies: string[]
  url?: string
  github_url?: string
  image_url?: string
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
  role?: string
  start_date?: number
  end_date?: number
  company?: string
<<<<<<< HEAD
  url?: string
  description?: string
  type: string
  image_url?: string
  technologies: string[]
  created_at: number
  updated_at: number
}

interface ProjectFormData {
  title: string
  role: string
  start_date: string
  end_date: string
  company: string
  url: string
  description: string
  technologies: string
  image_url: string
}

const initialFormData: ProjectFormData = {
  title: '',
  role: '',
  start_date: '',
  end_date: '',
  company: '',
  url: '',
  description: '',
  technologies: '',
  image_url: '',
}

export default function ProjectsPage() {
  const { user } = useUser()
  const clerkId = user?.id
  const { toast } = useToast()

  const [showDialog, setShowDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [saving, setSaving] = useState(false)

  const projects = useQuery(
    api.projects.getUserProjects,
    clerkId ? { clerkId } : 'skip'
  ) as Project[] | undefined

  const createProject = useMutation(api.projects.createProject)
  const updateProject = useMutation(api.projects.updateProject)
  const deleteProject = useMutation(api.projects.deleteProject)

  const loading = !projects && !!clerkId

  const sorted = useMemo(() => {
    return (projects ?? []).slice().sort((a, b) => b.updated_at - a.updated_at)
  }, [projects])

  const openDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setFormData({
        title: project.title || '',
        role: project.role || '',
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
        company: project.company || '',
        url: project.url || '',
        description: project.description || '',
        technologies: project.technologies.join(', '),
        image_url: project.image_url || '',
      })
    } else {
      setEditingProject(null)
      setFormData(initialFormData)
    }
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingProject(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async () => {
    if (!clerkId || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const projectData = {
        title: formData.title.trim(),
        role: formData.role.trim() || undefined,
        company: formData.company.trim() || undefined,
        url: formData.url.trim() || undefined,
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        technologies: formData.technologies
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0),
        start_date: formData.start_date ? new Date(formData.start_date).getTime() : undefined,
        end_date: formData.end_date ? new Date(formData.end_date).getTime() : undefined,
      }

      if (editingProject) {
        await updateProject({
          clerkId,
          projectId: editingProject._id as any,
          updates: projectData,
        })
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
          variant: "success",
        })
      } else {
        await createProject({
          clerkId,
          ...projectData,
          type: 'personal',
        })
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
          variant: "success",
        })
      }

      closeDialog()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (project: Project) => {
    if (!clerkId) return
    try {
      await deleteProject({
        clerkId,
        projectId: project._id as any,
      })
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete project. Please try again.",
        variant: "destructive",
=======
}

export default function ProjectsPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()
  const { toast } = useToast()

  const projects = useQuery(api.projects.getUserProjects, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    github_url: '',
    live_url: '',
    role: '',
    company: '',
    start_date: '',
    end_date: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser?.id) return

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean)
        })
      })

      if (response.ok) {
        toast({
          title: 'Project created',
          description: 'Your project has been added successfully.'
        })
        setShowCreateForm(false)
        setFormData({
          title: '',
          description: '',
          technologies: '',
          github_url: '',
          live_url: '',
          role: '',
          company: '',
          start_date: '',
          end_date: ''
        })
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive'
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
      })
    }
  }

<<<<<<< HEAD
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
=======
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to the Projects page.</p>
          </CardContent>
        </Card>
      </div>
    )
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
<<<<<<< HEAD
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Portfolio</h1>
          <p className="text-muted-foreground">Showcase your projects and achievements</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
              <DialogDescription>
                {editingProject ? 'Update your project details' : 'Add a new project to your portfolio'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
=======
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Portfolio</h1>
          <p className="text-muted-foreground">Showcase your projects and technical work.</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
<<<<<<< HEAD
                    placeholder="E-commerce Platform"
=======
                    placeholder="My Awesome Project"
                    required
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
                  />
                </div>
                <div>
                  <Label htmlFor="role">Your Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Full Stack Developer"
                  />
                </div>
              </div>

<<<<<<< HEAD
              <div className="grid grid-cols-2 gap-4">
=======
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your project, technologies used, and your contributions..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="technologies">Technologies</Label>
                  <Input
                    id="technologies"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
<<<<<<< HEAD
                    placeholder="TechCorp Inc."
                  />
                </div>
                <div>
                  <Label htmlFor="url">Project URL</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://project-demo.com"
=======
                    placeholder="Personal Project"
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
                  />
                </div>
              </div>

<<<<<<< HEAD
              <div className="grid grid-cols-2 gap-4">
=======
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    placeholder="https://github.com/username/project"
                  />
                </div>
                <div>
                  <Label htmlFor="live_url">Live Demo URL</Label>
                  <Input
                    id="live_url"
                    type="url"
                    value={formData.live_url}
                    onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                    placeholder="https://myproject.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

<<<<<<< HEAD
              <div>
                <Label htmlFor="technologies">Technologies</Label>
                <Input
                  id="technologies"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  placeholder="React, Node.js, PostgreSQL, AWS"
                />
              </div>

              <div>
                <Label htmlFor="image_url">Project Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/project-screenshot.png"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your project, what you built, challenges you solved..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingProject ? 'Update Project' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (sorted?.length ?? 0) === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start building your portfolio by adding your first project.
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sorted!.map((project) => (
            <Card key={project._id} className="flex flex-col">
              {project.image_url && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    {project.role && (
                      <p className="text-sm text-muted-foreground">{project.role}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(project)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {project.company && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {project.company}
                    </div>
                  )}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : 'Present'}
                    </div>
                  )}
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
=======
              <div className="flex gap-2">
                <Button type="submit">Create Project</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {projects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <Card key={project._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    {project.role && (
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <User className="h-3 w-3 mr-1" />
                        {project.role}
                      </p>
                    )}
                    {project.company && (
                      <p className="text-sm text-muted-foreground">{project.company}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
                    {project.description}
                  </p>
                )}

                {project.technologies.length > 0 && (
<<<<<<< HEAD
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.technologies.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {project.url && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full"
                    >
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View Project
                      </a>
                    </Button>
                  </div>
                )}
=======
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {project.url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Live Demo
                      </a>
                    </Button>
                  )}
                  {project.github_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-3 w-3 mr-1" />
                        Code
                      </a>
                    </Button>
                  )}
                </div>
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
              </CardContent>
            </Card>
          ))}
        </div>
<<<<<<< HEAD
      )}
    </div>
  )
}
=======
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-sm mb-4">Start building your portfolio by adding your first project.</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
