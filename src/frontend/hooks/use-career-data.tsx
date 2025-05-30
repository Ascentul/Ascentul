import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

// Types for career data
export type WorkHistory = {
  id: number;
  position: string;
  company: string;
  startDate: Date;
  endDate: Date | null;
  currentJob: boolean;
  location: string | null;
  description: string | null;
  achievements: string[] | null;
  createdAt: Date;
};

export type Education = {
  id: number;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate: Date | null;
  current: boolean;
  location: string | null;
  description: string | null;
  achievements: string[] | null;
  gpa: string | null;
  createdAt: Date;
};

export type Skill = {
  id: number;
  name: string;
  proficiencyLevel: string | null;
  category: string | null;
  createdAt: Date;
};

export type Certification = {
  id: number;
  name: string;
  issuingOrganization: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  noExpiration: boolean;
  credentialID: string | null;
  credentialURL: string | null;
  createdAt: Date;
};

export type CareerData = {
  workHistory: WorkHistory[];
  educationHistory: Education[];
  skills: Skill[];
  certifications: Certification[];
  careerSummary: string | null;
  linkedInUrl: string | null;
};

export function useCareerData() {
  const { data: careerData, isLoading, error, refetch } = useQuery<CareerData, Error, CareerData, [string]>({
    queryKey: ['/api/career-data'],
    queryFn: async ({ queryKey }) => {
      try {
        // Only use a timestamp when explicitly requesting fresh data
        // This allows React Query's caching to work properly during navigation
        const url = queryKey[0];
        
        console.log(`Fetching career data from ${url}`);
        
        const response = await fetch(url, {
          credentials: "include",
        });
        
        if (!response.ok) {
          console.error(`Error fetching career data: ${response.status} ${response.statusText}`);
          throw new Error(`Error fetching career data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw career data from API:', data);
        
        // Log detailed counts for debugging
        console.log(`Career data received:
          - Work history: ${data.workHistory?.length || 0} items
          - Education: ${data.educationHistory?.length || 0} items
          - Skills: ${data.skills?.length || 0} items
          - Certifications: ${data.certifications?.length || 0} items
          - Career summary: ${data.careerSummary ? 'present' : 'not present'}
        `);
        
        // Detailed date logging for the first work history item if it exists
        if (data.workHistory && data.workHistory.length > 0) {
          const firstItem = data.workHistory[0];
          console.log('Sample work history item date inspection:');
          console.log(`- Item ID: ${firstItem.id}`);
          console.log(`- Company: ${firstItem.company}`);
          console.log(`- Position: ${firstItem.position}`);
          console.log(`- startDate: ${firstItem.startDate} (${typeof firstItem.startDate})`);
          console.log(`- endDate: ${firstItem.endDate} (${typeof firstItem.endDate})`);
          console.log(`- createdAt: ${firstItem.createdAt} (${typeof firstItem.createdAt})`);
        }

        // Process the data to ensure dates are properly parsed - with error handling
        // This prevents issues with date parsing in the UI components
        return {
          workHistory: Array.isArray(data.workHistory) ? data.workHistory.map((job: any) => {
            try {
              return {
                ...job,
                startDate: job.startDate ? new Date(job.startDate) : null,
                endDate: job.endDate ? new Date(job.endDate) : null,
                createdAt: job.createdAt ? new Date(job.createdAt) : new Date()
              };
            } catch (err) {
              console.error(`Error processing dates for work history item ${job.id}:`, err);
              return job; // Return original item on error
            }
          }) : [],
          educationHistory: Array.isArray(data.educationHistory) ? data.educationHistory.map((edu: any) => {
            try {
              return {
                ...edu,
                startDate: edu.startDate ? new Date(edu.startDate) : null,
                endDate: edu.endDate ? new Date(edu.endDate) : null,
                createdAt: edu.createdAt ? new Date(edu.createdAt) : new Date()
              };
            } catch (err) {
              console.error(`Error processing dates for education item ${edu.id}:`, err);
              return edu; // Return original item on error
            }
          }) : [],
          skills: Array.isArray(data.skills) ? data.skills.map((skill: any) => {
            try {
              console.log('Processing skill:', skill);
              // Ensure each skill has a name property
              if (!skill.name && typeof skill === 'string') {
                // Handle case where skill might be a string instead of an object
                return { id: Math.random(), name: skill, proficiencyLevel: null, category: null, createdAt: new Date() };
              }
              return {
                ...skill,
                // Ensure name exists
                name: skill.name || 'Unnamed Skill',
                createdAt: skill.createdAt ? new Date(skill.createdAt) : new Date()
              };
            } catch (err) {
              console.error(`Error processing skill:`, skill, err);
              // Provide a fallback with minimal valid data
              return { 
                id: skill.id || Math.random(), 
                name: typeof skill === 'string' ? skill : 'Error: Invalid Skill', 
                proficiencyLevel: null, 
                category: null, 
                createdAt: new Date() 
              };
            }
          }) : [],
          certifications: Array.isArray(data.certifications) ? data.certifications.map((cert: any) => {
            try {
              return {
                ...cert,
                issueDate: cert.issueDate ? new Date(cert.issueDate) : null,
                expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
                createdAt: cert.createdAt ? new Date(cert.createdAt) : new Date()
              };
            } catch (err) {
              console.error(`Error processing dates for certification item ${cert.id}:`, err);
              return cert; // Return original item on error
            }
          }) : [],
          careerSummary: data.careerSummary || null,
          linkedInUrl: data.linkedInUrl || null
        };
      } catch (error) {
        console.error('Error in useCareerData hook:', error);
        throw error;
      }
    },
    // Disable automatic refetching on window focus to prevent unwanted refreshes
    // while editing form data, but allow manual refreshes with refetch()
    refetchOnWindowFocus: false,
    // Optimize cache settings to reduce white flashes during navigation
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes - keep in cache for 10 minutes (renamed from cacheTime in v5)
    retry: 1 // Only retry once on failure to prevent excessive requests
  });

  return {
    careerData,
    isLoading,
    error,
    refetch
  };
}