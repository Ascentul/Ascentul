import { JobSourceProvider, JobSearchParams, JobSearchResults, Job } from '../../../shared/jobs';
import { zipRecruiterProvider } from './ziprecruiter';
import { mockProvider } from './mock-provider';

// A registry of all available job source providers
class JobSourceRegistry {
  private providers: Map<string, JobSourceProvider> = new Map();

  constructor() {
    // Register the default providers
    this.registerProvider(zipRecruiterProvider);
    this.registerProvider(mockProvider);
  }

  // Register a new job source provider
  registerProvider(provider: JobSourceProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
    console.log(`Job source provider registered: ${provider.name}`);
  }

  // Unregister a job source provider
  unregisterProvider(providerName: string): void {
    if (this.providers.has(providerName.toLowerCase())) {
      this.providers.delete(providerName.toLowerCase());
      console.log(`Job source provider unregistered: ${providerName}`);
    }
  }

  // Get a specific provider by name
  getProvider(providerName: string): JobSourceProvider | undefined {
    return this.providers.get(providerName.toLowerCase());
  }

  // Get all registered providers
  getAllProviders(): JobSourceProvider[] {
    return Array.from(this.providers.values());
  }

  // Get all enabled providers
  getEnabledProviders(): JobSourceProvider[] {
    return Array.from(this.providers.values()).filter(provider => provider.enabled);
  }

  // Enable a provider
  enableProvider(providerName: string, enabled: boolean = true): void {
    const provider = this.getProvider(providerName.toLowerCase());
    if (provider) {
      provider.enabled = enabled;
      console.log(`Job source provider ${providerName} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Search jobs across all enabled providers
  async searchAllJobs(params: JobSearchParams): Promise<{ 
    results: JobSearchResults[], 
    combinedJobs: Job[],
    totalJobs: number
  }> {
    const enabledProviders = this.getEnabledProviders();
    
    // Execute searches in parallel
    const searchPromises = enabledProviders.map(provider => provider.searchJobs(params));
    const results = await Promise.all(searchPromises);
    
    // Combine and deduplicate jobs from all sources
    const jobMap = new Map<string, Job>();
    
    results.forEach(result => {
      result.jobs.forEach(job => {
        // Use the combined ID (provider-sourceid) as the key to avoid duplicates
        // In a real implementation, we would have more sophisticated deduplication logic
        if (!jobMap.has(job.id)) {
          jobMap.set(job.id, job);
        }
      });
    });
    
    const combinedJobs = Array.from(jobMap.values());
    
    // Sort combined jobs (by default, we'll sort by date if available)
    if (params.sortBy === 'date') {
      combinedJobs.sort((a, b) => {
        if (!a.datePosted) return 1;
        if (!b.datePosted) return -1;
        return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
      });
    }
    
    // Count total jobs
    const totalJobs = results.reduce((sum, result) => sum + result.totalJobs, 0);
    
    return {
      results,
      combinedJobs,
      totalJobs
    };
  }
}

// Create and export a singleton instance
export const jobSourceRegistry = new JobSourceRegistry();

// Export specific providers for direct use
export { zipRecruiterProvider, mockProvider };