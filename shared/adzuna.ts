export interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  created: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
    area: string[];
  };
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: boolean;
  contract_time?: string;
  category: {
    tag: string;
    label: string;
  };
}

export interface AdzunaSearchResponse {
  results: AdzunaJob[];
  count: number;
  mean: number;
  __CLASS__: string;
}

export interface JobSearchParams {
  keywords: string;
  location: string;
  remoteOnly: boolean;
}