import React from 'react';
import { cn } from '@/lib/utils';

// Define template types
export type ResumeTemplateStyle = 'modern' | 'classic' | 'minimal' | 'professional';

interface ResumeTemplateProps {
  resume: any; 
  style: ResumeTemplateStyle;
  scale?: number;  // For zoom functionality
}

export default function ResumeTemplate({ resume, style, scale = 1 }: ResumeTemplateProps) {
  if (!resume || !resume.content) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500">No resume data available to preview</p>
      </div>
    );
  }

  // Apply scaling to the template container
  const containerStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    width: scale === 1 ? '100%' : `${100/scale}%`,
    maxWidth: '860px',
  };

  // Get template-specific classes based on selected style
  const templateClasses = getTemplateClasses(style);
  
  return (
    <div 
      className={cn(
        "resume-template bg-white shadow-md mx-auto transition-all duration-200",
        style === 'modern' ? 'p-6 border-t-4 border-primary' :
        style === 'classic' ? 'p-8 border' :
        style === 'minimal' ? 'p-6' :
        style === 'professional' ? 'p-6 border-l-4 border-primary' : 'p-6'
      )}
      style={containerStyle}
    >
      {/* Header Section */}
      <div className={cn("mb-6", templateClasses.header)}>
        <h1 className={cn("font-bold", templateClasses.name)}>
          {resume.content.personalInfo.fullName || 'Full Name'}
        </h1>
        
        <div className={cn("flex flex-wrap gap-2 mt-2", templateClasses.contactInfo)}>
          {resume.content.personalInfo.location && (
            <span className={templateClasses.contactItem}>
              {resume.content.personalInfo.location}
            </span>
          )}
          {resume.content.personalInfo.email && (
            <span className={templateClasses.contactItem}>
              {resume.content.personalInfo.location ? ' | ' : ''}{resume.content.personalInfo.email}
            </span>
          )}
          {resume.content.personalInfo.phone && (
            <span className={templateClasses.contactItem}>
              {(resume.content.personalInfo.location || resume.content.personalInfo.email) ? ' | ' : ''}
              {resume.content.personalInfo.phone}
            </span>
          )}
        </div>
        
        <div className={cn("flex flex-wrap gap-3 mt-1", templateClasses.links)}>
          {resume.content.personalInfo.linkedIn && (
            <a 
              href={resume.content.personalInfo.linkedIn} 
              target="_blank" 
              rel="noopener noreferrer"
              className={templateClasses.link}
            >
              LinkedIn
            </a>
          )}
          {resume.content.personalInfo.portfolio && (
            <span>
              {resume.content.personalInfo.linkedIn ? ' | ' : ''}
              <a 
                href={resume.content.personalInfo.portfolio} 
                target="_blank" 
                rel="noopener noreferrer"
                className={templateClasses.link}
              >
                Portfolio
              </a>
            </span>
          )}
        </div>
      </div>
      
      {/* Summary Section */}
      {resume.content.summary && (
        <div className={cn("mb-6", templateClasses.section)}>
          <h2 className={cn(templateClasses.sectionTitle)}>Professional Summary</h2>
          <p className={templateClasses.summary}>{resume.content.summary}</p>
        </div>
      )}
      
      {/* Skills Section */}
      {resume.content.skills && resume.content.skills.length > 0 && (
        <div className={cn("mb-6", templateClasses.section)}>
          <h2 className={cn(templateClasses.sectionTitle)}>Skills</h2>
          <div className={cn("flex flex-wrap gap-2", templateClasses.skillsContainer)}>
            {resume.content.skills.map((skill: string, index: number) => (
              <span 
                key={index} 
                className={cn(templateClasses.skill)}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Experience Section */}
      {resume.content.experience && resume.content.experience.length > 0 && (
        <div className={cn("mb-6", templateClasses.section)}>
          <h2 className={cn(templateClasses.sectionTitle)}>Experience</h2>
          <div className={cn("space-y-4", templateClasses.experienceContainer)}>
            {resume.content.experience.map((exp: any, index: number) => (
              <div key={index} className={templateClasses.experienceItem}>
                <div className={cn("flex justify-between flex-wrap", templateClasses.expHeader)}>
                  <h3 className={templateClasses.jobTitle}>{exp.position}</h3>
                  <div className={templateClasses.dates}>
                    {exp.startDate} - {exp.currentJob ? 'Present' : exp.endDate}
                  </div>
                </div>
                <div className={templateClasses.company}>{exp.company}</div>
                {exp.description && <p className={templateClasses.description}>{exp.description}</p>}
                
                {/* Achievements (if present) */}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className={cn("list-disc pl-5 mt-1 space-y-1", templateClasses.achievementsList)}>
                    {exp.achievements.map((achievement: string, i: number) => (
                      <li key={i} className={templateClasses.achievementItem}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Education Section */}
      {resume.content.education && resume.content.education.length > 0 && (
        <div className={cn("mb-6", templateClasses.section)}>
          <h2 className={cn(templateClasses.sectionTitle)}>Education</h2>
          <div className={cn("space-y-4", templateClasses.educationContainer)}>
            {resume.content.education.map((edu: any, index: number) => (
              <div key={index} className={templateClasses.educationItem}>
                <div className={cn("flex justify-between flex-wrap", templateClasses.eduHeader)}>
                  <h3 className={templateClasses.degree}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </h3>
                  <div className={templateClasses.dates}>
                    {edu.startDate} - {edu.endDate || 'Present'}
                  </div>
                </div>
                <div className={templateClasses.institution}>{edu.institution}</div>
                {edu.description && <p className={templateClasses.description}>{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Projects Section */}
      {resume.content.projects && resume.content.projects.length > 0 && (
        <div className={cn("mb-6", templateClasses.section)}>
          <h2 className={cn(templateClasses.sectionTitle)}>Projects</h2>
          <div className={cn("space-y-4", templateClasses.projectsContainer)}>
            {resume.content.projects.map((project: any, index: number) => (
              <div key={index} className={templateClasses.projectItem}>
                <h3 className={templateClasses.projectTitle}>
                  {project.name}
                  {project.url && (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={cn("ml-2", templateClasses.projectLink)}
                    >
                      (Link)
                    </a>
                  )}
                </h3>
                {project.description && <p className={templateClasses.description}>{project.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get template-specific classes
function getTemplateClasses(style: ResumeTemplateStyle) {
  const baseClasses = {
    header: "border-b pb-3",
    name: "text-2xl",
    contactInfo: "text-sm text-neutral-600",
    contactItem: "",
    links: "text-sm",
    link: "text-primary hover:underline",
    section: "",
    sectionTitle: "text-lg font-semibold border-b pb-1 mb-2",
    summary: "text-sm",
    skillsContainer: "",
    skill: "bg-primary/10 text-primary px-2 py-1 rounded text-sm",
    experienceContainer: "",
    experienceItem: "",
    expHeader: "",
    jobTitle: "font-medium",
    company: "text-sm font-medium text-primary",
    dates: "text-sm text-neutral-600",
    description: "text-sm mt-1",
    achievementsList: "",
    achievementItem: "text-sm",
    educationContainer: "",
    educationItem: "",
    eduHeader: "",
    degree: "font-medium",
    institution: "text-sm font-medium text-primary",
    projectsContainer: "",
    projectItem: "",
    projectTitle: "font-medium",
    projectLink: "text-sm text-primary hover:underline",
  };

  // Customize based on template style
  switch(style) {
    case 'modern':
      return {
        ...baseClasses,
        header: "border-b-0 pb-5 text-center",
        name: "text-3xl font-bold text-primary",
        sectionTitle: "text-lg font-bold text-primary border-b-0 uppercase tracking-wide mb-3 pb-0",
        skill: "bg-primary/5 text-neutral-700 border border-primary/20 px-3 py-1 rounded-full text-sm",
        company: "text-sm font-medium text-primary/90",
        jobTitle: "font-semibold text-neutral-800",
        dates: "text-xs text-neutral-500 font-medium bg-neutral-100 px-2 py-1 rounded",
      };
    
    case 'classic':
      return {
        ...baseClasses,
        header: "border-b-2 border-neutral-800 pb-4",
        name: "text-3xl text-neutral-800",
        sectionTitle: "text-lg font-semibold text-neutral-800 border-b-2 border-neutral-300 pb-1 mb-3",
        skill: "bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-sm border border-neutral-200",
        description: "text-sm mt-2 leading-relaxed",
      };
    
    case 'minimal':
      return {
        ...baseClasses,
        header: "border-b-0 pb-6",
        name: "text-2xl font-light",
        contactInfo: "text-sm text-neutral-500",
        sectionTitle: "text-md uppercase tracking-wider font-medium text-neutral-400 border-b-0 pb-1 mb-2",
        skill: "bg-neutral-100 text-neutral-600 px-2 py-1 rounded-sm text-sm",
        jobTitle: "font-medium text-neutral-700",
        company: "text-sm text-neutral-500",
        dates: "text-sm text-neutral-400",
        description: "text-sm mt-2 text-neutral-600 leading-relaxed",
      };
    
    case 'professional':
      return {
        ...baseClasses,
        header: "border-b border-neutral-300 pb-4",
        name: "text-2xl font-bold text-neutral-800",
        sectionTitle: "text-lg font-semibold text-primary border-b border-neutral-200 pb-1 mb-3",
        skill: "bg-neutral-50 text-neutral-700 border border-neutral-200 px-2 py-1 rounded text-sm",
        jobTitle: "font-semibold",
        company: "text-sm font-medium text-primary/90",
        description: "text-sm mt-2 leading-normal",
      };
    
    default:
      return baseClasses;
  }
}