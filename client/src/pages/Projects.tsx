
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@shared/schema';

export default function Projects() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Project Portfolio</h1>
      <div className="grid gap-6">
        {projects.map((project) => (
          <div key={project.id} className="border rounded-lg p-4 bg-card">
            <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
            <p className="text-muted-foreground mb-4">{project.description}</p>
            <div className="flex gap-2 flex-wrap">
              {project.skillsUsed?.map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
