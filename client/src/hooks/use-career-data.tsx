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
  return useQuery<CareerData>({
    queryKey: ['/api/career-data'],
    queryFn: getQueryFn(),
  });
}