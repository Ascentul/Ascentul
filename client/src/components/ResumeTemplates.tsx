import React from 'react';
import { cn } from '@/lib/utils';

// Define Template Types
export type TemplateType = 'modern' | 'classic' | 'minimal' | 'professional';

// Define Resume Content Structure
export interface ResumeContent {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    portfolio?: string;
  };
  summary?: string;
  skills: string[];
  experience: {
    position: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    currentJob?: boolean;
    description?: string;
    achievements?: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    currentEducation?: boolean;
    description?: string;
  }[];
  projects: {
    name: string;
    description?: string;
    url?: string;
    technologies?: string[];
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }[];
}

interface ResumeTemplateProps {
  content: ResumeContent;
  templateType: TemplateType;
  scale?: number; // For zoom control
  className?: string;
}

// Shared component for skills section used across templates
const SkillsSection: React.FC<{ skills: string[]; className?: string }> = ({ skills, className }) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {skills.map((skill, index) => (
        <span 
          key={index}
          className="bg-primary/10 text-primary px-2 py-1 rounded text-sm"
        >
          {skill}
        </span>
      ))}
    </div>
  );
};

// Modern Template
export const ModernTemplate: React.FC<{
  content: ResumeContent;
  className?: string;
}> = ({ content, className }) => {
  return (
    <div className={cn("bg-white p-8 max-w-[50rem] mx-auto shadow-sm resume-template modern-template", className)}>
      {/* Header */}
      <header className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-center mb-2">
          {content.personalInfo.fullName || 'Full Name'}
        </h1>
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-sm text-neutral-600">
          {content.personalInfo.email && <span>{content.personalInfo.email}</span>}
          {content.personalInfo.phone && <span>• {content.personalInfo.phone}</span>}
          {content.personalInfo.location && <span>• {content.personalInfo.location}</span>}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm text-primary">
          {content.personalInfo.linkedIn && (
            <a href={content.personalInfo.linkedIn} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          {content.personalInfo.portfolio && (
            <a href={content.personalInfo.portfolio} target="_blank" rel="noopener noreferrer">
              Portfolio
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {content.summary && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-3">Professional Summary</h2>
          <p className="text-sm leading-relaxed">{content.summary}</p>
        </section>
      )}

      {/* Skills */}
      {content.skills && content.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-3">Skills</h2>
          <SkillsSection skills={content.skills} />
        </section>
      )}

      {/* Experience */}
      {content.experience && content.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-3">Experience</h2>
          <div className="space-y-5">
            {content.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg">{exp.position}</h3>
                  <span className="text-sm text-neutral-600">
                    {exp.startDate} - {exp.currentJob ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="text-sm font-medium text-primary">{exp.company}</div>
                {exp.location && <div className="text-xs text-neutral-500">{exp.location}</div>}
                {exp.description && <p className="text-sm mt-2 leading-relaxed">{exp.description}</p>}
                
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {content.education && content.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-3">Education</h2>
          <div className="space-y-4">
            {content.education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </h3>
                  <span className="text-sm text-neutral-600">
                    {edu.startDate} - {edu.currentEducation ? 'Present' : edu.endDate}
                  </span>
                </div>
                <div className="text-sm font-medium text-primary">{edu.institution}</div>
                {edu.location && <div className="text-xs text-neutral-500">{edu.location}</div>}
                {edu.description && <p className="text-sm mt-2">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {content.projects && content.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-3">Projects</h2>
          <div className="space-y-4">
            {content.projects.map((project, index) => (
              <div key={index}>
                <h3 className="font-medium flex items-center">
                  {project.name}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary ml-2 hover:underline"
                    >
                      (Link)
                    </a>
                  )}
                </h3>
                {project.description && <p className="text-sm mt-1">{project.description}</p>}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="text-xs bg-primary/5 text-primary px-1.5 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {content.certifications && content.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-3">Certifications</h2>
          <div className="space-y-3">
            {content.certifications.map((cert, index) => (
              <div key={index}>
                <h3 className="font-medium">{cert.name}</h3>
                <div className="text-sm">
                  {cert.issuer}, {cert.date}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-primary hover:underline"
                    >
                      (Verify)
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Classic Template
export const ClassicTemplate: React.FC<{
  content: ResumeContent;
  className?: string;
}> = ({ content, className }) => {
  return (
    <div className={cn("bg-white p-8 max-w-[50rem] mx-auto shadow-sm resume-template classic-template", className)}>
      {/* Header - Classic has a more traditional look */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-2 uppercase tracking-wide">
          {content.personalInfo.fullName || 'Full Name'}
        </h1>
        <div className="border-t border-b border-neutral-300 py-2 flex flex-wrap justify-center gap-3 text-sm text-neutral-700">
          {content.personalInfo.email && <span>{content.personalInfo.email}</span>}
          {content.personalInfo.phone && <span>• {content.personalInfo.phone}</span>}
          {content.personalInfo.location && <span>• {content.personalInfo.location}</span>}
          {content.personalInfo.linkedIn && (
            <span>
              • <a href={content.personalInfo.linkedIn} className="text-primary hover:underline">LinkedIn</a>
            </span>
          )}
          {content.personalInfo.portfolio && (
            <span>
              • <a href={content.personalInfo.portfolio} className="text-primary hover:underline">Portfolio</a>
            </span>
          )}
        </div>
      </header>

      {/* Summary */}
      {content.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wide mb-2">Professional Summary</h2>
          <p className="text-sm">{content.summary}</p>
        </section>
      )}

      {/* Experience - Classic format emphasizes timeline/chronology */}
      {content.experience && content.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wide mb-3">Professional Experience</h2>
          <div className="space-y-4">
            {content.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <h3 className="font-bold">{exp.company}</h3>
                  <span className="text-sm">
                    {exp.startDate} - {exp.currentJob ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium italic">{exp.position}</div>
                  {exp.location && <div className="text-xs text-neutral-500">{exp.location}</div>}
                </div>
                {exp.description && <p className="text-sm mb-2">{exp.description}</p>}
                
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {content.education && content.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wide mb-3">Education</h2>
          <div className="space-y-4">
            {content.education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <h3 className="font-bold">{edu.institution}</h3>
                  <span className="text-sm">
                    {edu.startDate} - {edu.currentEducation ? 'Present' : edu.endDate}
                  </span>
                </div>
                <div className="font-medium italic">
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                </div>
                {edu.location && <div className="text-xs text-neutral-500">{edu.location}</div>}
                {edu.description && <p className="text-sm mt-1">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {content.skills && content.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wide mb-2">Skills</h2>
          <div className="border-t border-b border-neutral-200 py-3">
            <p className="text-sm">
              {content.skills.join(' • ')}
            </p>
          </div>
        </section>
      )}

      {/* Projects */}
      {content.projects && content.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wide mb-3">Projects</h2>
          <div className="space-y-4">
            {content.projects.map((project, index) => (
              <div key={index}>
                <h3 className="font-bold">
                  {project.name}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary ml-2 normal-case"
                    >
                      (View Project)
                    </a>
                  )}
                </h3>
                {project.description && <p className="text-sm mt-1">{project.description}</p>}
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-sm mt-1 italic">
                    Technologies: {project.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Minimal Template
export const MinimalTemplate: React.FC<{
  content: ResumeContent;
  className?: string;
}> = ({ content, className }) => {
  return (
    <div className={cn("bg-white p-8 max-w-[50rem] mx-auto shadow-sm resume-template minimal-template", className)}>
      {/* Header - Minimal and clean header with no border */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-medium mb-1 tracking-wide">
          {content.personalInfo.fullName || 'Full Name'}
        </h1>
        <div className="text-sm text-neutral-600 flex flex-wrap justify-center gap-3">
          {content.personalInfo.email && <span>{content.personalInfo.email}</span>}
          {content.personalInfo.phone && <span>{content.personalInfo.phone}</span>}
          {content.personalInfo.location && <span>{content.personalInfo.location}</span>}
        </div>
        <div className="text-sm text-primary mt-1 flex flex-wrap justify-center gap-3">
          {content.personalInfo.linkedIn && (
            <a href={content.personalInfo.linkedIn} className="hover:underline">LinkedIn</a>
          )}
          {content.personalInfo.portfolio && (
            <a href={content.personalInfo.portfolio} className="hover:underline">Portfolio</a>
          )}
        </div>
      </header>

      {/* Summary - Minimalistic with no borders */}
      {content.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-2">Summary</h2>
          <p className="text-sm text-neutral-700">{content.summary}</p>
        </section>
      )}

      {/* Experience - Clean and minimal */}
      {content.experience && content.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Experience</h2>
          <div className="space-y-4">
            {content.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium">{exp.position}</h3>
                  <span className="text-xs text-neutral-500">
                    {exp.startDate} - {exp.currentJob ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="text-sm text-neutral-700">{exp.company}</div>
                {exp.location && <div className="text-xs text-neutral-500">{exp.location}</div>}
                {exp.description && <p className="text-sm mt-2 text-neutral-600">{exp.description}</p>}
                
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc list-outside text-sm mt-2 space-y-1 ml-4 text-neutral-600">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education - Simple and clean */}
      {content.education && content.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Education</h2>
          <div className="space-y-3">
            {content.education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </h3>
                  <span className="text-xs text-neutral-500">
                    {edu.startDate} - {edu.currentEducation ? 'Present' : edu.endDate}
                  </span>
                </div>
                <div className="text-sm text-neutral-700">{edu.institution}</div>
                {edu.location && <div className="text-xs text-neutral-500">{edu.location}</div>}
                {edu.description && <p className="text-sm mt-1 text-neutral-600">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills - Clean, no borders */}
      {content.skills && content.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-2">Skills</h2>
          <div className="flex flex-wrap gap-1">
            {content.skills.map((skill, index) => (
              <span 
                key={index}
                className="bg-neutral-100 px-2 py-0.5 rounded text-sm text-neutral-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects - Simple and clean */}
      {content.projects && content.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Projects</h2>
          <div className="space-y-3">
            {content.projects.map((project, index) => (
              <div key={index}>
                <h3 className="font-medium">
                  {project.name}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary ml-2"
                    >
                      Link
                    </a>
                  )}
                </h3>
                {project.description && <p className="text-sm mt-1 text-neutral-600">{project.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Professional Template
export const ProfessionalTemplate: React.FC<{
  content: ResumeContent;
  className?: string;
}> = ({ content, className }) => {
  return (
    <div className={cn("bg-white p-8 max-w-[50rem] mx-auto shadow-sm resume-template professional-template grid grid-cols-3 gap-6", className)}>
      {/* Left Column - Contact Info, Skills, etc. */}
      <div className="col-span-1 pr-4 border-r border-neutral-200">
        {/* Photo placeholder/circle with initials if desired */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold mb-3">
            {content.personalInfo.fullName 
              ? content.personalInfo.fullName.split(' ').map(n => n[0]).join('')
              : 'AB'}
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-3">Contact</h2>
          <div className="text-sm space-y-2">
            {content.personalInfo.email && (
              <div>
                <span className="font-medium">Email:</span> {content.personalInfo.email}
              </div>
            )}
            {content.personalInfo.phone && (
              <div>
                <span className="font-medium">Phone:</span> {content.personalInfo.phone}
              </div>
            )}
            {content.personalInfo.location && (
              <div>
                <span className="font-medium">Location:</span> {content.personalInfo.location}
              </div>
            )}
            {content.personalInfo.linkedIn && (
              <div>
                <span className="font-medium">LinkedIn:</span>{' '}
                <a href={content.personalInfo.linkedIn} className="text-primary hover:underline">Profile</a>
              </div>
            )}
            {content.personalInfo.portfolio && (
              <div>
                <span className="font-medium">Portfolio:</span>{' '}
                <a href={content.personalInfo.portfolio} className="text-primary hover:underline">Website</a>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {content.skills && content.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-3">Skills</h2>
            <div className="space-y-1">
              {content.skills.map((skill, index) => (
                <div key={index} className="text-sm py-1">
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {content.education && content.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-3">Education</h2>
            <div className="space-y-3">
              {content.education.map((edu, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </div>
                  <div>{edu.institution}</div>
                  <div className="text-xs text-neutral-500">
                    {edu.startDate} - {edu.currentEducation ? 'Present' : edu.endDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {content.certifications && content.certifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500 mb-3">Certifications</h2>
            <div className="space-y-2">
              {content.certifications.map((cert, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium">{cert.name}</div>
                  <div className="text-xs">
                    {cert.issuer}, {cert.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Name, Summary, Experience, Projects */}
      <div className="col-span-2">
        {/* Name */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-wide text-neutral-800">
            {content.personalInfo.fullName || 'Full Name'}
          </h1>
          {content.summary && (
            <div className="mt-3">
              <p className="text-sm leading-relaxed text-neutral-600">{content.summary}</p>
            </div>
          )}
        </header>

        {/* Experience */}
        {content.experience && content.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wide text-neutral-700 mb-4 pb-1 border-b border-neutral-200">
              Professional Experience
            </h2>
            <div className="space-y-5">
              {content.experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-neutral-800">{exp.position}</h3>
                    <span className="text-xs text-neutral-500">
                      {exp.startDate} - {exp.currentJob ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-primary">{exp.company}</div>
                  {exp.location && <div className="text-xs text-neutral-500 mb-2">{exp.location}</div>}
                  {exp.description && <p className="text-sm text-neutral-700 mb-2">{exp.description}</p>}
                  
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc list-outside text-sm space-y-1 ml-5 text-neutral-700">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {content.projects && content.projects.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wide text-neutral-700 mb-4 pb-1 border-b border-neutral-200">
              Projects
            </h2>
            <div className="space-y-4">
              {content.projects.map((project, index) => (
                <div key={index}>
                  <h3 className="font-bold text-neutral-800 flex items-center">
                    {project.name}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary ml-2"
                      >
                        View
                      </a>
                    )}
                  </h3>
                  {project.description && <p className="text-sm text-neutral-700 mt-1">{project.description}</p>}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-2 text-xs">
                      <span className="font-medium">Technologies:</span> {project.technologies.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Main resume template selector component
export const ResumeTemplate: React.FC<ResumeTemplateProps> = ({
  content,
  templateType,
  scale = 1,
  className
}) => {
  const templateStyles = {
    transform: `scale(${scale})`,
    transformOrigin: 'top center'
  };

  return (
    <div className={cn("resume-template-container", className)} style={templateStyles}>
      {templateType === 'modern' && <ModernTemplate content={content} />}
      {templateType === 'classic' && <ClassicTemplate content={content} />}
      {templateType === 'minimal' && <MinimalTemplate content={content} />}
      {templateType === 'professional' && <ProfessionalTemplate content={content} />}
    </div>
  );
};

export default ResumeTemplate;