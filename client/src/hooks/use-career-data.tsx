import { useQuery } from '@tanstack/react-query';
import { WorkHistory, EducationHistory, Skill } from '@shared/schema';

export interface CareerData {
  workHistory: WorkHistory[];
  educationHistory: EducationHistory[];
  skills: Skill[];
}

/**
 * A hook that fetches all career data (work history, education, skills)
 * for use in the Resume Studio Editor
 */
export function useCareerData() {
  const {
    data: careerData,
    isLoading,
    error,
    refetch
  } = useQuery<CareerData>({
    queryKey: ['/api/career-data'],
    // Uses the default query function set up for the app which handles errors and authentication
  });

  return {
    careerData,
    isLoading,
    error,
    refetch,
    
    // Convenience getters for individual data types
    workHistory: careerData?.workHistory || [],
    educationHistory: careerData?.educationHistory || [],
    skills: careerData?.skills || []
  };
}