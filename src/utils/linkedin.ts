export type LinkedInSearchParams = {
  jobTitle: string;
  location?: string;
  remote?: boolean;
  jobType?: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience?: 'entry_level' | 'mid_level' | 'senior_level';
};

export function constructLinkedInSearchUrl(params: LinkedInSearchParams): string {
  const baseUrl = 'https://www.linkedin.com/jobs/search/';
  const queryParams = new URLSearchParams();

  if (params.jobTitle) {
    queryParams.append('keywords', params.jobTitle);
  }
  if (params.location) {
    queryParams.append('location', params.location);
  }
  if (params.remote) {
    queryParams.append('f_WT', '2'); // Remote filter
  }

  if (params.jobType) {
    switch (params.jobType) {
      case 'full_time':
        queryParams.append('f_JT', 'F');
        break;
      case 'part_time':
        queryParams.append('f_JT', 'P');
        break;
      case 'contract':
        queryParams.append('f_JT', 'C');
        break;
      case 'internship':
        queryParams.append('f_JT', 'I');
        break;
    }
  }

  if (params.experience) {
    switch (params.experience) {
      case 'entry_level':
        queryParams.append('f_E', '1');
        break;
      case 'mid_level':
        queryParams.append('f_E', '2');
        break;
      case 'senior_level':
        queryParams.append('f_E', '4');
        break;
    }
  }

  const qs = queryParams.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}
