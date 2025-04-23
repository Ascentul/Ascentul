// Types for LinkedIn job search functionality

export interface LinkedInSearchParams {
  jobTitle: string;
  location: string;
  remote?: boolean;
  experience?: string; // e.g. 'entry_level', 'mid_level', 'senior_level'
  jobType?: string; // e.g. 'full_time', 'part_time', 'contract', 'internship'
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  companyName: string;
  jobLocation?: string;
  jobUrl: string; // URL to the job listing
  dateApplied: Date;
  status: 'Not Started' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  notes?: string;
  jobDescription?: string;
  resumeId?: number;
  coverLetterId?: number;
}

// Helper function to construct LinkedIn search URLs
export function constructLinkedInSearchUrl(params: LinkedInSearchParams): string {
  const baseUrl = 'https://www.linkedin.com/jobs/search/';
  const queryParams = new URLSearchParams();
  
  // Required parameters
  if (params.jobTitle) {
    queryParams.append('keywords', params.jobTitle);
  }
  
  if (params.location) {
    queryParams.append('location', params.location);
  }
  
  // Optional parameters
  if (params.remote) {
    queryParams.append('f_WT', '2'); // Remote filter
  }
  
  if (params.jobType) {
    // Map job type to LinkedIn parameters
    switch (params.jobType) {
      case 'full_time':
        queryParams.append('f_JT', 'F'); // Full-time
        break;
      case 'part_time':
        queryParams.append('f_JT', 'P'); // Part-time
        break;
      case 'contract':
        queryParams.append('f_JT', 'C'); // Contract
        break;
      case 'internship':
        queryParams.append('f_JT', 'I'); // Internship
        break;
    }
  }
  
  if (params.experience) {
    // Map experience level to LinkedIn parameters
    switch (params.experience) {
      case 'entry_level':
        queryParams.append('f_E', '1'); // Entry level
        break;
      case 'mid_level':
        queryParams.append('f_E', '2'); // Mid-Senior level
        break;
      case 'senior_level':
        queryParams.append('f_E', '4'); // Director
        break;
    }
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
}