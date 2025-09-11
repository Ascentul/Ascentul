// This is a temporary debugging file to help diagnose the issue with Work History data
// not appearing in the Import Career Data modal

/**
 * Makes a direct fetch to the career-data API and logs the results
 * This helps us identify if there are any issues with the API response
 */
export async function debugFetchCareerData() {
  try {

    const timestamp = new Date().getTime();
    const response = await fetch(`/api/career-data?t=${timestamp}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      console.error('🔍 DEBUG: API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Log detailed information about each section

    // Check for specific issues with work history
    if (data.workHistory && Array.isArray(data.workHistory)) {
      if (data.workHistory.length === 0) {

      } else {

        // Verify if dates are properly formatted for consumption by the client
        try {
          const item = data.workHistory[0];

          // Attempt to parse dates
          if (item.startDate) {
            const parsedStartDate = new Date(item.startDate);

          }
          
          if (item.endDate) {
            const parsedEndDate = new Date(item.endDate);

          }
          
          if (item.createdAt) {
            const parsedCreatedAt = new Date(item.createdAt);

          }
        } catch (err) {
          console.error('🔍 DEBUG: Error inspecting dates:', err);
        }
      }
    } else {
      console.error('🔍 DEBUG: Work History is not an array or is undefined:', data.workHistory);
    }

    return data;
  } catch (error) {
    console.error('🔍 DEBUG: Error fetching career data:', error);
    return null;
  }
}

/**
 * Makes a direct fetch to the work-history API and logs the results
 * This helps identify if there are any issues with the specific work history endpoint
 */
export async function debugFetchWorkHistory() {
  try {

    const timestamp = new Date().getTime();
    const response = await fetch(`/api/career-data/work-history?t=${timestamp}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      console.error('🔍 DEBUG: Work history API error:', response.status, response.statusText);
      
      // Try the legacy endpoint if the new one fails

      const legacyResponse = await fetch(`/api/work-history?t=${timestamp}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!legacyResponse.ok) {
        console.error('🔍 DEBUG: Legacy work history API error:', legacyResponse.status, legacyResponse.statusText);
        return null;
      }
      
      const legacyData = await legacyResponse.json();

      return legacyData;
    }

    const data = await response.json();

    // Log details about work history
    if (Array.isArray(data)) {

      if (data.length === 0) {

      } else {

        // Verify date formats
        try {
          const item = data[0];

        } catch (err) {
          console.error('🔍 DEBUG: Error inspecting dates:', err);
        }
      }
    } else {
      console.error('🔍 DEBUG: Work history is not an array:', data);
    }

    return data;
  } catch (error) {
    console.error('🔍 DEBUG: Error fetching work history:', error);
    return null;
  }
}

/**
 * Compares the data received from the two different API endpoints that might provide work history
 */
export async function debugCompareWorkHistorySources() {

  const careerData = await debugFetchCareerData();
  const workHistory = await debugFetchWorkHistory();

  // Log details about React Query cache

  try {
    // Note: This won't work in production mode, as window.__REACT_QUERY_DEVTOOLS__ is only available in dev
    if (window.__REACT_QUERY_DEVTOOLS__) {
      const queryCache = window.__REACT_QUERY_DEVTOOLS__.devtools.instance.queryCache;
      const queries = queryCache.getAll();

      // Look for career data queries
      const careerDataQueries = queries.filter(q => 
        q.queryKey && 
        (Array.isArray(q.queryKey) ? 
          q.queryKey.some(k => typeof k === 'string' && k.includes('career-data')) : 
          typeof q.queryKey === 'string' && q.queryKey.includes('career-data')
        )
      );

      if (careerDataQueries.length > 0) {
        careerDataQueries.forEach(q => {

        });
      }
    } else {

    }
  } catch (err) {

  }
  
  // Check if the arrays match in length
  if (careerData?.workHistory?.length !== workHistory?.length) {

  }
  
  // Check if the data structures match
  if (careerData?.workHistory?.[0] && workHistory?.[0]) {
    const keysFromCareerData = Object.keys(careerData.workHistory[0]).sort();
    const keysFromWorkHistory = Object.keys(workHistory[0]).sort();

    const propertiesMatch = JSON.stringify(keysFromCareerData) === JSON.stringify(keysFromWorkHistory);

    if (!propertiesMatch) {

    }
  }
  
  // Verify format in the ImportableItem transformation
  if (careerData?.workHistory?.[0]) {
    try {
      const job = careerData.workHistory[0];

      // Format startDate
      if (job.startDate) {
        try {
          const startDateStr = new Date(job.startDate);
          const formattedStartDate = startDateStr.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        } catch (err) {
          console.error('🔍 DEBUG: Error formatting startDate:', err);
        }
      }
      
      // Format endDate if it exists
      if (job.endDate) {
        try {
          const endDateStr = new Date(job.endDate);
          const formattedEndDate = endDateStr.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        } catch (err) {
          console.error('🔍 DEBUG: Error formatting endDate:', err);
        }
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error testing ImportableItem formatting:', error);
    }
  }

}