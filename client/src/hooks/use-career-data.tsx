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
};

export function useCareerData() {
  const { data: careerData, isLoading, error, refetch } = useQuery<CareerData, Error, CareerData, [string]>({
    queryKey: ['/api/career-data'],
    queryFn: async ({ queryKey }) => {
      // Use cache-busting URL parameter to ensure we always get fresh data
      const timestamp = new Date().getTime();
      const url = `${queryKey[0]}?t=${timestamp}`;
      
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching career data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw career data from API:', data);

      // Process the data to ensure dates are properly parsed
      // This prevents issues with date parsing in the UI components
      return {
        workHistory: Array.isArray(data.workHistory) ? data.workHistory.map((job: any) => ({
          ...job,
          startDate: job.startDate ? new Date(job.startDate) : null,
          endDate: job.endDate ? new Date(job.endDate) : null,
          createdAt: job.createdAt ? new Date(job.createdAt) : new Date()
        })) : [],
        educationHistory: Array.isArray(data.educationHistory) ? data.educationHistory.map((edu: any) => ({
          ...edu,
          startDate: edu.startDate ? new Date(edu.startDate) : null,
          endDate: edu.endDate ? new Date(edu.endDate) : null,
          createdAt: edu.createdAt ? new Date(edu.createdAt) : new Date()
        })) : [],
        skills: Array.isArray(data.skills) ? data.skills.map((skill: any) => ({
          ...skill,
          createdAt: skill.createdAt ? new Date(skill.createdAt) : new Date()
        })) : [],
        certifications: Array.isArray(data.certifications) ? data.certifications.map((cert: any) => ({
          ...cert,
          issueDate: cert.issueDate ? new Date(cert.issueDate) : null,
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
          createdAt: cert.createdAt ? new Date(cert.createdAt) : new Date()
        })) : [],
        careerSummary: data.careerSummary || null
      };
    },
    // Disable automatic refetching on window focus to prevent unwanted refreshes
    // while editing form data, but allow manual refreshes with refetch()
    refetchOnWindowFocus: false,
    // Shorter stale time to ensure data freshness
    staleTime: 10 * 1000, // 10 seconds - reduced from 30s to keep data fresh
    gcTime: 5 * 60 * 1000 // 5 minutes - how long to keep data in cache (renamed from cacheTime in v5)
  });

  return {
    careerData,
    isLoading,
    error,
    refetch
  };
}