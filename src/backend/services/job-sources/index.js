/**
 * Job Provider Interface
 * This defines the standard interface for job source providers
 */
import { zipRecruiterProvider } from './ziprecruiter';
import { mockProvider } from './mock-provider';
// Initialize and export job providers
export const jobProviders = {
    ziprecruiter: zipRecruiterProvider,
    mock: mockProvider,
};
// Log registered providers
Object.values(jobProviders).forEach(provider => {

});
