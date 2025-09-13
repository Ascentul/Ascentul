/**
 * Mock Job Provider
 * This provider generates mock job data for testing and development
 */

import { Job } from '@shared/jobs';
import { JobProvider, JobSearchParams } from './index';

// Mock job data
const mockJobs: Job[] = [
  {
    id: 'mock_1',
    source: 'MockProvider',
    sourceId: '1',
    title: 'Full Stack Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    description: 'Exciting opportunity for a Full Stack Developer to join our team and work on cutting-edge web applications.',
    fullDescription: `
      # Full Stack Developer Position
      
      ## About the Role
      We're looking for a talented Full Stack Developer to join our team and help build the next generation of web applications.
      
      ## Responsibilities
      - Develop and maintain front-end and back-end code
      - Work closely with product managers and designers
      - Optimize applications for maximum speed and scalability
      - Collaborate with cross-functional teams
      
      ## Requirements
      - 3+ years experience with React, Node.js, and TypeScript
      - Experience with modern frameworks and libraries
      - Strong understanding of web fundamentals
      - Bachelor's degree in Computer Science or equivalent experience
    `,
    applyUrl: 'https://example.com/jobs/1',
    salary: '$120,000 - $150,000 per year',
    datePosted: new Date().toISOString(),
    jobType: 'full-time',
    isRemote: true,
    logo: 'https://via.placeholder.com/150',
    tags: ['React', 'Node.js', 'TypeScript'],
    benefits: ['Health Insurance', '401k', 'Flexible Hours'],
    requirements: ['3+ years experience', 'Bachelor\'s degree'],
    isSaved: false,
    isApplied: false,
  },
  {
    id: 'mock_2',
    source: 'MockProvider',
    sourceId: '2',
    title: 'UX/UI Designer',
    company: 'DesignHub',
    location: 'New York, NY',
    description: 'Join our creative team as a UX/UI Designer and help shape beautiful, user-friendly digital experiences.',
    fullDescription: `
      # UX/UI Designer
      
      ## About the Role
      We're seeking a talented UX/UI Designer to create amazing user experiences for our clients.
      
      ## Responsibilities
      - Create wireframes, prototypes and high-fidelity mockups
      - Conduct user research and usability testing
      - Collaborate with developers to implement designs
      - Stay current with design trends and best practices
      
      ## Requirements
      - 2+ years experience in UX/UI design
      - Strong portfolio showcasing your work
      - Proficiency in Figma, Sketch, and Adobe Creative Suite
      - Understanding of design principles and user-centered design processes
    `,
    applyUrl: 'https://example.com/jobs/2',
    salary: '$90,000 - $120,000 per year',
    datePosted: new Date().toISOString(),
    jobType: 'full-time',
    isRemote: false,
    logo: 'https://via.placeholder.com/150',
    tags: ['UX', 'UI', 'Figma'],
    benefits: ['Health Insurance', 'Unlimited PTO', 'Gym Membership'],
    requirements: ['2+ years experience', 'Strong portfolio'],
    isSaved: false,
    isApplied: false,
  },
  {
    id: 'mock_3',
    source: 'MockProvider',
    sourceId: '3',
    title: 'Data Scientist',
    company: 'DataCo',
    location: 'Remote',
    description: 'Looking for a skilled Data Scientist to analyze complex datasets and derive actionable insights to drive business decisions.',
    fullDescription: `
      # Data Scientist
      
      ## About the Role
      Join our data team to help solve complex problems through data analysis and machine learning.
      
      ## Responsibilities
      - Develop and implement machine learning models
      - Clean and preprocess large datasets
      - Communicate findings to stakeholders
      - Collaborate with engineering and product teams
      
      ## Requirements
      - Advanced degree in a quantitative field
      - 3+ years experience with Python, R, or similar
      - Experience with machine learning frameworks
      - Strong statistical background
    `,
    applyUrl: 'https://example.com/jobs/3',
    salary: '$130,000 - $160,000 per year',
    datePosted: new Date().toISOString(),
    jobType: 'full-time',
    isRemote: true,
    logo: 'https://via.placeholder.com/150',
    tags: ['Python', 'Machine Learning', 'SQL'],
    benefits: ['Health Insurance', 'Stock Options', 'Remote Work'],
    requirements: ['Advanced degree', 'Python experience'],
    isSaved: false,
    isApplied: false,
  },
  {
    id: 'mock_4',
    source: 'MockProvider',
    sourceId: '4',
    title: 'Marketing Coordinator',
    company: 'BrandBoost',
    location: 'Chicago, IL',
    description: 'Looking for a passionate Marketing Coordinator to join our team and help drive brand awareness and growth.',
    fullDescription: `
      # Marketing Coordinator
      
      ## About the Role
      Help us grow our brand and reach new audiences through creative marketing campaigns.
      
      ## Responsibilities
      - Assist in developing marketing campaigns
      - Manage social media accounts
      - Track campaign performance metrics
      - Coordinate with external vendors and partners
      
      ## Requirements
      - Bachelor's degree in Marketing or related field
      - 1-2 years experience in marketing
      - Strong communication skills
      - Familiarity with social media platforms
    `,
    applyUrl: 'https://example.com/jobs/4',
    salary: '$50,000 - $65,000 per year',
    datePosted: new Date().toISOString(),
    jobType: 'full-time',
    isRemote: false,
    logo: 'https://via.placeholder.com/150',
    tags: ['Marketing', 'Social Media', 'Content'],
    benefits: ['Health Insurance', 'Professional Development', 'Casual Dress Code'],
    requirements: ['Bachelor\'s degree', 'Marketing experience'],
    isSaved: false,
    isApplied: false,
  },
  {
    id: 'mock_5',
    source: 'MockProvider',
    sourceId: '5',
    title: 'Product Manager',
    company: 'ProductLabs',
    location: 'Austin, TX',
    description: 'Join our team as a Product Manager to lead the development of innovative products that solve real customer problems.',
    fullDescription: `
      # Product Manager
      
      ## About the Role
      Lead the development of our product roadmap and bring innovative solutions to market.
      
      ## Responsibilities
      - Define product strategy and roadmap
      - Gather and analyze customer feedback
      - Work closely with engineering, design, and marketing teams
      - Monitor product performance and metrics
      
      ## Requirements
      - 4+ years experience in product management
      - Strong analytical and problem-solving skills
      - Experience with agile development methodologies
      - Excellent communication and leadership skills
    `,
    applyUrl: 'https://example.com/jobs/5',
    salary: '$110,000 - $140,000 per year',
    datePosted: new Date().toISOString(),
    jobType: 'full-time',
    isRemote: false,
    logo: 'https://via.placeholder.com/150',
    tags: ['Product Management', 'Agile', 'B2B'],
    benefits: ['Health Insurance', 'Stock Options', 'Flexible Hours'],
    requirements: ['4+ years experience', 'Agile experience'],
    isSaved: false,
    isApplied: false,
  },
  {
    id: 'mock_6',
    source: 'MockProvider',
    sourceId: '6',
    title: 'Frontend Developer (Contract)',
    company: 'WebWorks',
    location: 'Remote',
    description: 'Short-term contract opportunity for a Frontend Developer to help build and enhance our web applications.',
    fullDescription: `
      # Frontend Developer (Contract)
      
      ## About the Role
      Join us for a 6-month contract to help enhance our web application interfaces.
      
      ## Responsibilities
      - Develop responsive user interfaces
      - Implement new features and functionality
      - Fix bugs and improve performance
      - Write clean, maintainable code
      
      ## Requirements
      - 2+ years experience with HTML, CSS, and JavaScript
      - Experience with React or Vue.js
      - Understanding of web performance optimization
      - Portfolio of previous work
    `,
    applyUrl: 'https://example.com/jobs/6',
    salary: '$60-75 per hour',
    datePosted: new Date().toISOString(),
    jobType: 'contract',
    isRemote: true,
    logo: 'https://via.placeholder.com/150',
    tags: ['React', 'JavaScript', 'CSS'],
    benefits: ['Flexible Schedule', 'Remote Work'],
    requirements: ['2+ years experience', 'React or Vue.js experience'],
    isSaved: false,
    isApplied: false,
  },
  {
    id: 'mock_7',
    source: 'MockProvider',
    sourceId: '7',
    title: 'DevOps Engineer',
    company: 'CloudSystems',
    location: 'Seattle, WA',
    description: 'Looking for a skilled DevOps Engineer to help automate our infrastructure and improve our deployment processes.',
    fullDescription: `
      # DevOps Engineer
      
      ## About the Role
      Help us build and maintain our cloud infrastructure and CI/CD pipelines.
      
      ## Responsibilities
      - Design and implement CI/CD pipelines
      - Manage cloud infrastructure (AWS/Azure)
      - Automate deployment and configuration processes
      - Monitor system performance and reliability
      
      ## Requirements
      - 3+ years experience in DevOps or similar role
      - Experience with AWS or Azure
      - Knowledge of containerization (Docker, Kubernetes)
      - Experience with infrastructure as code (Terraform, CloudFormation)
    `,
    applyUrl: 'https://example.com/jobs/7',
    salary: '$120,000 - $150,000 per year',
    datePosted: new Date().toISOString(),
    jobType: 'full-time',
    isRemote: true,
    logo: 'https://via.placeholder.com/150',
    tags: ['DevOps', 'AWS', 'Kubernetes'],
    benefits: ['Health Insurance', 'Stock Options', 'Remote Work'],
    requirements: ['3+ years experience', 'AWS/Azure experience'],
    isSaved: false,
    isApplied: false,
  }
];

// Mock Job Provider Implementation
export const mockProvider: JobProvider = {
  id: 'mock',
  name: 'MockProvider',
  
  // Search for jobs
  searchJobs: async (params: JobSearchParams): Promise<Job[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter jobs based on search params
    let filteredJobs = [...mockJobs];
    
    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) || 
        job.description.toLowerCase().includes(query)
      );
    }
    
    if (params.location) {
      const location = params.location.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(location)
      );
    }
    
    if (params.jobType) {
      filteredJobs = filteredJobs.filter(job => 
        job.jobType === params.jobType
      );
    }
    
    if (params.isRemote) {
      filteredJobs = filteredJobs.filter(job => job.isRemote);
    }
    
    // Return paginated results
    return filteredJobs;
  },
  
  // Get job details
  getJob: async (id: string): Promise<Job | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find job by ID
    const job = mockJobs.find(job => job.sourceId === id);
    return job || null;
  }
};