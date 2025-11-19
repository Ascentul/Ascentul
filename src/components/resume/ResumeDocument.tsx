/**
 * ResumeDocument Component
 *
 * SINGLE SOURCE OF TRUTH for resume layout and styling.
 *
 * This component is used for:
 * 1. In-app preview (renders as React/HTML)
 * 2. PDF export (structure mirrored in resume-pdf-generator.ts)
 *
 * Any layout or styling changes MUST be made here and reflected in the PDF generator
 * to ensure preview and export remain visually identical.
 *
 * Design principles:
 * - ATS-friendly: Single column, simple structure, no complex layouts
 * - Professional: Clean typography, comfortable spacing, minimal color
 * - Readable: Good contrast, clear hierarchy, proper line-height
 */

import React from 'react';

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startYear: string;
  endYear: string;
  gpa?: string;
  honors?: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  description: string;
  technologies: string;
  url?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
}

export interface ResumeData {
  contactInfo: ContactInfo;
  summary?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  achievements?: Achievement[];
}

interface ResumeDocumentProps {
  data: ResumeData;
  className?: string;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({ data, className = '' }) => {
  const { contactInfo, summary, skills, experience, education, projects, achievements } = data;

  // Helper to format date range
  const formatDateRange = (startDate: string, endDate: string, current: boolean) => {
    if (current) return `${startDate} - Present`;
    return `${startDate} - ${endDate}`;
  };

  // Helper to parse description into bullet points
  const parseDescription = (description: string): string[] => {
    if (!description) return [];

    // Split by newlines or bullet points
    const lines = description
      .split(/\n|•/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lines;
  };

  return (
    <div
      className={`resume-document bg-white ${className}`}
      style={{
        maxWidth: '8.5in',
        minHeight: '11in',
        margin: '0 auto',
        padding: '0.75in',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '10.5pt',
        lineHeight: '1.5',
        color: '#000000',
      }}
    >
      {/* Header - Contact Information */}
      <header className="mb-6">
        <h1
          className="text-center font-bold mb-2"
          style={{ fontSize: '24pt', letterSpacing: '0.5px' }}
        >
          {contactInfo.name}
        </h1>
        <div
          className="text-center text-gray-700"
          style={{ fontSize: '10pt' }}
        >
          {[
            contactInfo.location,
            contactInfo.phone,
            contactInfo.email,
            contactInfo.linkedin,
            contactInfo.website,
          ]
            .filter(Boolean)
            .join(' • ')}
        </div>
      </header>

      {/* Summary Section */}
      {summary && summary.trim() && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-wide mb-2 pb-1"
            style={{
              fontSize: '12pt',
              borderBottom: '1.5px solid #4B5563',
              color: '#1F2937'
            }}
          >
            Professional Summary
          </h2>
          <p className="text-justify" style={{ fontSize: '10.5pt' }}>
            {summary}
          </p>
        </section>
      )}

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-wide mb-2 pb-1"
            style={{
              fontSize: '12pt',
              borderBottom: '1.5px solid #4B5563',
              color: '#1F2937'
            }}
          >
            Skills
          </h2>
          <p style={{ fontSize: '10.5pt' }}>
            {skills.join(', ')}
          </p>
        </section>
      )}

      {/* Experience Section */}
      {experience && experience.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-wide mb-2 pb-1"
            style={{
              fontSize: '12pt',
              borderBottom: '1.5px solid #4B5563',
              color: '#1F2937'
            }}
          >
            Experience
          </h2>
          {experience.map((exp, index) => {
            const bullets = parseDescription(exp.description);

            return (
              <div key={exp.id} className={index > 0 ? 'mt-4' : ''}>
                {/* Company and Title */}
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="font-bold" style={{ fontSize: '11pt' }}>
                      {exp.company}
                    </span>
                    {exp.location && (
                      <span className="text-gray-600 ml-2" style={{ fontSize: '10pt' }}>
                        {exp.location}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600" style={{ fontSize: '10pt' }}>
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </div>
                </div>

                {/* Role */}
                <div className="italic mb-2" style={{ fontSize: '10.5pt', color: '#374151' }}>
                  {exp.title}
                </div>

                {/* Description Bullets */}
                {bullets.length > 0 && (
                  <ul className="list-disc ml-5 space-y-1">
                    {bullets.map((bullet, idx) => (
                      <li key={idx} style={{ fontSize: '10.5pt' }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Education Section */}
      {education && education.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-wide mb-2 pb-1"
            style={{
              fontSize: '12pt',
              borderBottom: '1.5px solid #4B5563',
              color: '#1F2937'
            }}
          >
            Education
          </h2>
          {education.map((edu, index) => (
            <div key={edu.id} className={index > 0 ? 'mt-3' : ''}>
              {/* School and Dates */}
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold" style={{ fontSize: '11pt' }}>
                  {edu.school}
                </span>
                <span className="text-gray-600" style={{ fontSize: '10pt' }}>
                  {edu.startYear && edu.endYear
                    ? `${edu.startYear} - ${edu.endYear}`
                    : edu.endYear || ''}
                </span>
              </div>

              {/* Degree and Field */}
              <div style={{ fontSize: '10.5pt' }}>
                {edu.degree && edu.field
                  ? `${edu.degree} in ${edu.field}`
                  : edu.degree || edu.field || ''}
              </div>

              {/* Location */}
              {edu.location && (
                <div className="text-gray-600" style={{ fontSize: '10pt' }}>
                  {edu.location}
                </div>
              )}

              {/* GPA and Honors */}
              {(edu.gpa || edu.honors) && (
                <div className="text-gray-700 mt-1" style={{ fontSize: '10pt' }}>
                  {[edu.gpa && `GPA: ${edu.gpa}`, edu.honors]
                    .filter(Boolean)
                    .join(' • ')}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-wide mb-2 pb-1"
            style={{
              fontSize: '12pt',
              borderBottom: '1.5px solid #4B5563',
              color: '#1F2937'
            }}
          >
            Projects
          </h2>
          {projects.map((project, index) => {
            const bullets = parseDescription(project.description);

            return (
              <div key={project.id} className={index > 0 ? 'mt-3' : ''}>
                {/* Project Name and Role */}
                <div className="mb-1">
                  <span className="font-bold" style={{ fontSize: '11pt' }}>
                    {project.name}
                  </span>
                  {project.role && (
                    <span className="italic ml-2 text-gray-700" style={{ fontSize: '10pt' }}>
                      {project.role}
                    </span>
                  )}
                </div>

                {/* Technologies */}
                {project.technologies && (
                  <div className="text-gray-600 mb-1" style={{ fontSize: '10pt' }}>
                    Technologies: {project.technologies}
                  </div>
                )}

                {/* URL */}
                {project.url && (
                  <div className="text-gray-600 mb-1" style={{ fontSize: '10pt' }}>
                    <a href={project.url} className="text-blue-600 hover:underline">
                      {project.url}
                    </a>
                  </div>
                )}

                {/* Description */}
                {bullets.length > 0 && (
                  <ul className="list-disc ml-5 space-y-1">
                    {bullets.map((bullet, idx) => (
                      <li key={idx} style={{ fontSize: '10.5pt' }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Achievements Section */}
      {achievements && achievements.length > 0 && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-wide mb-2 pb-1"
            style={{
              fontSize: '12pt',
              borderBottom: '1.5px solid #4B5563',
              color: '#1F2937'
            }}
          >
            Achievements
          </h2>
          <ul className="list-disc ml-5 space-y-2">
            {achievements.map((achievement) => (
              <li key={achievement.id} style={{ fontSize: '10.5pt' }}>
                <span className="font-semibold">{achievement.title}</span>
                {achievement.date && (
                  <span className="text-gray-600 ml-2" style={{ fontSize: '10pt' }}>
                    ({achievement.date})
                  </span>
                )}
                {achievement.description && (
                  <span className="block mt-1">{achievement.description}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
