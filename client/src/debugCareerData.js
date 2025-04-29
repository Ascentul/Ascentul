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
    const response = await fetch(`/api/work-history?t=${timestamp}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      console.error('🔍 DEBUG: Work history API error:', response.status, response.statusText);
      return null;
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
  
  console.log('🔍 DEBUG: Comparing work history sources...');
  console.log('🔍 DEBUG: Career data API work history count:', careerData?.workHistory?.length || 0);
  console.log('🔍 DEBUG: Direct work history API count:', workHistory?.length || 0);
  
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
}