// Types for LinkedIn job search functionality
// Helper function to construct LinkedIn search URLs
export function constructLinkedInSearchUrl(params) {
    const baseUrl = 'https://www.linkedin.com/jobs/search/';
    const queryParams = new URLSearchParams();
    // Required parameters
    if (params.jobTitle) {
        queryParams.append('keywords', params.jobTitle);
    }
    if (params.location) {
        queryParams.append('location', params.location);
    }
    // Optional parameters
    if (params.remote) {
        queryParams.append('f_WT', '2'); // Remote filter
    }
    if (params.jobType) {
        // Map job type to LinkedIn parameters
        switch (params.jobType) {
            case 'full_time':
                queryParams.append('f_JT', 'F'); // Full-time
                break;
            case 'part_time':
                queryParams.append('f_JT', 'P'); // Part-time
                break;
            case 'contract':
                queryParams.append('f_JT', 'C'); // Contract
                break;
            case 'internship':
                queryParams.append('f_JT', 'I'); // Internship
                break;
        }
    }
    if (params.experience) {
        // Map experience level to LinkedIn parameters
        switch (params.experience) {
            case 'entry_level':
                queryParams.append('f_E', '1'); // Entry level
                break;
            case 'mid_level':
                queryParams.append('f_E', '2'); // Mid-Senior level
                break;
            case 'senior_level':
                queryParams.append('f_E', '4'); // Director
                break;
        }
    }
    return `${baseUrl}?${queryParams.toString()}`;
}
