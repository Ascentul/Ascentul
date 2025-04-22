import { Job, JobSearchParams, JobSearchResults, JobSourceProvider } from '../../../shared/jobs';

// Sample mock jobs for testing
const mockJobs: Job[] = [
  {
    id: 'mock-1',
    source: 'MockProvider',
    sourceId: '1',
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    description: 'We are looking for a senior software engineer to join our team. Experience with React, Node.js, and TypeScript required.',
    fullDescription: 'Detailed description would go here...',
    applyUrl: 'https://example.com/apply/1',
    salary: '$120,000 - $150,000 per year',
    datePosted: '2023-04-15',
    jobType: 'Full-time',
    isRemote: true,
    logo: 'https://via.placeholder.com/100',
    tags: ['React', 'Node.js', 'TypeScript'],
    benefits: ['Health Insurance', '401k', 'Flexible Hours'],
    requirements: ['5+ years experience', 'Bachelor\'s degree in CS or related field']
  },
  {
    id: 'mock-2',
    source: 'MockProvider',
    sourceId: '2',
    title: 'Product Manager',
    company: 'ProductLabs',
    location: 'New York, NY',
    description: 'Experienced product manager needed to lead our product development process.',
    fullDescription: 'Detailed description would go here...',
    applyUrl: 'https://example.com/apply/2',
    salary: '$110,000 - $140,000 per year',
    datePosted: '2023-04-17',
    jobType: 'Full-time',
    isRemote: false,
    logo: 'https://via.placeholder.com/100',
    tags: ['Product Management', 'Agile', 'B2B'],
    benefits: ['Health Insurance', 'Unlimited PTO', 'Training Budget'],
    requirements: ['3+ years product management', 'Experience with B2B products']
  },
  {
    id: 'mock-3',
    source: 'MockProvider',
    sourceId: '3',
    title: 'UI/UX Designer',
    company: 'DesignStudio',
    location: 'Remote',
    description: 'Creative UI/UX designer needed for our growing design team.',
    fullDescription: 'Detailed description would go here...',
    applyUrl: 'https://example.com/apply/3',
    salary: '$90,000 - $120,000 per year',
    datePosted: '2023-04-18',
    jobType: 'Full-time',
    isRemote: true,
    logo: 'https://via.placeholder.com/100',
    tags: ['UI Design', 'UX Design', 'Figma'],
    benefits: ['Health Insurance', 'Remote Work', 'Design Conferences'],
    requirements: ['3+ years UI/UX design', 'Proficiency with Figma or Sketch']
  }
];

// Mock provider implementation for testing
export const mockProvider: JobSourceProvider = {
  name: 'MockProvider',
  icon: '/mock-provider-logo.png',
  enabled: false, // Disabled by default
  
  searchJobs: async (params: JobSearchParams): Promise<JobSearchResults> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter jobs based on search parameters
    let filteredJobs = [...mockJobs];
    
    // Filter by query (search in title and description)
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by location
    if (params.location) {
      const location = params.location.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(location)
      );
    }
    
    // Filter by remote
    if (params.isRemote) {
      filteredJobs = filteredJobs.filter(job => job.isRemote);
    }
    
    // Sort by date if requested
    if (params.sortBy === 'date') {
      filteredJobs.sort((a, b) => {
        if (!a.datePosted) return 1;
        if (!b.datePosted) return -1;
        return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
      });
    }
    
    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    
    return {
      jobs: paginatedJobs,
      totalJobs: filteredJobs.length,
      pageCount: Math.ceil(filteredJobs.length / pageSize),
      currentPage: page,
      source: 'MockProvider'
    };
  },
  
  getJobDetails: async (id: string): Promise<Job> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the job by ID
    const job = mockJobs.find(job => job.id === id);
    
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    return job;
  }
};