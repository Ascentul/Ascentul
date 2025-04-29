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
  return useQuery<CareerData, Error, CareerData, [string]>({
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
      
      return response.json() as Promise<CareerData>;
    },
    // Disable automatic refetching on window focus to prevent unwanted refreshes
    // while editing form data, but allow manual refreshes with refetch()
    refetchOnWindowFocus: false,
    // Shorter stale time to ensure data freshness
    staleTime: 30 * 1000, // 30 seconds
  });
}