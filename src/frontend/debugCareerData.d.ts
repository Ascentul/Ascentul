// Type definitions for debugCareerData.js
// This file is needed to satisfy TypeScript when importing from this module

declare module '../debugCareerData' {
  /**
   * Makes a direct fetch to the career-data API and logs the results
   */
  export function debugFetchCareerData(): Promise<any | null>;
  
  /**
   * Makes a direct fetch to the work-history API and logs the results
   */
  export function debugFetchWorkHistory(): Promise<any | null>;
  
  /**
   * Compares the data received from the two different API endpoints that might provide work history
   */
  export function debugCompareWorkHistorySources(): Promise<void>;
}