declare module './debugCareerData' {
  export function debugFetchCareerData(): Promise<any | null>;
  export function debugFetchWorkHistory(): Promise<any | null>;
  export function debugCompareWorkHistorySources(): Promise<void>;
}