// This is a temporary debugging file to help diagnose the issue with Work History data
// not appearing in the Import Career Data modal

/**
 * Makes a direct fetch to the career-data API and logs the results
 * This helps us identify if there are any issues with the API response
 */
export async function debugFetchCareerData() {
  try {
    console.log('🔍 DEBUG: Directly fetching career data from API...');
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
    console.log('🔍 DEBUG: Career data API response:', data);
    
    // Log detailed information about each section
    console.log('🔍 DEBUG: Work History items:', data.workHistory?.length || 0);
    console.log('🔍 DEBUG: Education items:', data.educationHistory?.length || 0);
    console.log('🔍 DEBUG: Skills items:', data.skills?.length || 0);
    console.log('🔍 DEBUG: Certifications items:', data.certifications?.length || 0);
    console.log('🔍 DEBUG: Has Career Summary:', Boolean(data.careerSummary));

    // Check for specific issues with work history
    if (data.workHistory && Array.isArray(data.workHistory)) {
      if (data.workHistory.length === 0) {
        console.log('🔍 DEBUG: Work History array is empty');
      } else {
        console.log('🔍 DEBUG: First work history item:', data.workHistory[0]);
        
        // Verify if dates are properly formatted for consumption by the client
        try {
          const item = data.workHistory[0];
          console.log('🔍 DEBUG: startDate type:', typeof item.startDate);
          console.log('🔍 DEBUG: endDate type:', typeof item.endDate);
          console.log('🔍 DEBUG: createdAt type:', typeof item.createdAt);
          
          // Attempt to parse dates
          if (item.startDate) {
            const parsedStartDate = new Date(item.startDate);
            console.log('🔍 DEBUG: Parsed startDate:', parsedStartDate, 'Valid:', !isNaN(parsedStartDate.getTime()));
          }
          
          if (item.endDate) {
            const parsedEndDate = new Date(item.endDate);
            console.log('🔍 DEBUG: Parsed endDate:', parsedEndDate, 'Valid:', !isNaN(parsedEndDate.getTime()));
          }
          
          if (item.createdAt) {
            const parsedCreatedAt = new Date(item.createdAt);
            console.log('🔍 DEBUG: Parsed createdAt:', parsedCreatedAt, 'Valid:', !isNaN(parsedCreatedAt.getTime()));
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
    console.log('🔍 DEBUG: Directly fetching work history from API...');
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
      console.log('🔍 DEBUG: Trying legacy work history endpoint...');
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
      console.log('🔍 DEBUG: Legacy work history API response:', legacyData);
      return legacyData;
    }

    const data = await response.json();
    console.log('🔍 DEBUG: Work history API response:', data);
    
    // Log details about work history
    if (Array.isArray(data)) {
      console.log('🔍 DEBUG: Work history items from direct API:', data.length);
      
      if (data.length === 0) {
        console.log('🔍 DEBUG: Work history array is empty in direct API');
      } else {
        console.log('🔍 DEBUG: First work history item from direct API:', data[0]);
        
        // Verify date formats
        try {
          const item = data[0];
          console.log('🔍 DEBUG: startDate type:', typeof item.startDate);
          console.log('🔍 DEBUG: endDate type:', typeof item.endDate);
          console.log('🔍 DEBUG: createdAt type:', typeof item.createdAt);
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
  console.log('🔍 DEBUG: ====== START WORK HISTORY DEBUGGING ======');
  console.log('🔍 DEBUG: Current time:', new Date().toISOString());
  
  const careerData = await debugFetchCareerData();
  const workHistory = await debugFetchWorkHistory();
  
  console.log('🔍 DEBUG: Comparing work history sources...');
  console.log('🔍 DEBUG: Career data API work history count:', careerData?.workHistory?.length || 0);
  console.log('🔍 DEBUG: Direct work history API count:', workHistory?.length || 0);
  
  // Log details about React Query cache
  console.log('🔍 DEBUG: Checking for React Query cache issues...');
  try {
    // Note: This won't work in production mode, as window.__REACT_QUERY_DEVTOOLS__ is only available in dev
    if (window.__REACT_QUERY_DEVTOOLS__) {
      const queryCache = window.__REACT_QUERY_DEVTOOLS__.devtools.instance.queryCache;
      const queries = queryCache.getAll();
      
      console.log('🔍 DEBUG: Total queries in cache:', queries.length);
      
      // Look for career data queries
      const careerDataQueries = queries.filter(q => 
        q.queryKey && 
        (Array.isArray(q.queryKey) ? 
          q.queryKey.some(k => typeof k === 'string' && k.includes('career-data')) : 
          typeof q.queryKey === 'string' && q.queryKey.includes('career-data')
        )
      );
      
      console.log('🔍 DEBUG: Career data related queries:', careerDataQueries.length);
      
      if (careerDataQueries.length > 0) {
        careerDataQueries.forEach(q => {
          console.log('🔍 DEBUG: Query key:', q.queryKey);
          console.log('🔍 DEBUG: Query state:', q.state);
        });
      }
    } else {
      console.log('🔍 DEBUG: React Query DevTools not available');
    }
  } catch (err) {
    console.log('🔍 DEBUG: Error inspecting React Query cache:', err.message);
  }
  
  // Check if the arrays match in length
  if (careerData?.workHistory?.length !== workHistory?.length) {
    console.warn('🔍 DEBUG: ⚠️ Mismatch in work history item count between APIs!');
  }
  
  // Check if the data structures match
  if (careerData?.workHistory?.[0] && workHistory?.[0]) {
    const keysFromCareerData = Object.keys(careerData.workHistory[0]).sort();
    const keysFromWorkHistory = Object.keys(workHistory[0]).sort();
    
    console.log('🔍 DEBUG: Career data work history properties:', keysFromCareerData);
    console.log('🔍 DEBUG: Direct work history properties:', keysFromWorkHistory);
    
    const propertiesMatch = JSON.stringify(keysFromCareerData) === JSON.stringify(keysFromWorkHistory);
    console.log('🔍 DEBUG: Property structures match:', propertiesMatch);
    
    if (!propertiesMatch) {
      console.warn('🔍 DEBUG: ⚠️ Data structure mismatch between work history sources!');
    }
  }
  
  // Verify format in the ImportableItem transformation
  if (careerData?.workHistory?.[0]) {
    try {
      const job = careerData.workHistory[0];
      console.log('🔍 DEBUG: Attempting to format work history for display...');
      
      // Format startDate
      if (job.startDate) {
        try {
          const startDateStr = new Date(job.startDate);
          const formattedStartDate = startDateStr.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          console.log('🔍 DEBUG: Formatted startDate:', formattedStartDate);
        } catch (err) {
          console.error('🔍 DEBUG: Error formatting startDate:', err);
        }
      }
      
      // Format endDate if it exists
      if (job.endDate) {
        try {
          const endDateStr = new Date(job.endDate);
          const formattedEndDate = endDateStr.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          console.log('🔍 DEBUG: Formatted endDate:', formattedEndDate);
        } catch (err) {
          console.error('🔍 DEBUG: Error formatting endDate:', err);
        }
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error testing ImportableItem formatting:', error);
    }
  }
  
  console.log('🔍 DEBUG: ====== END WORK HISTORY DEBUGGING ======');
}